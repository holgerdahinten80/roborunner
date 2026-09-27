(function () {
  "use strict";

  var VIEW_W = 960;
  var VIEW_H = 540;
  var GROUND_Y = 444;

  var GRAVITY = 3050;
  var HOLD_GRAVITY = 2400;
  var JUMP_VELOCITY = 745;
  var DOUBLE_JUMP_VELOCITY = 645;
  var JUMP_CUT_VELOCITY = 380;
  var MAX_FALL = 1900;

  var COYOTE_TIME = 0.1;
  var JUMP_BUFFER_TIME = 0.13;

  var ROBOT_X = 168;
  var ROBOT_W = 48;
  var ROBOT_H = 60;

  var START_SPEED = 330;
  var MAX_SPEED = 940;
  var SPEED_RAMP = 0.022;

  var START_LIVES = 3;
  var FUEL_MAX = 100;
  var FUEL_PER_PIXEL = 100 / 4600;
  var FUEL_PER_CAN = 25;
  var FUEL_LOW = 25;
  var RESPAWN_FUEL = 45;
  var INVULN_TIME = 1.5;
  var CAN_W = 26;
  var CAN_H = 30;
  var LEVEL_CLEAR_TIME = 2.6;
  var SPAWN_STOP_MARGIN = 900;

  var HIGHSCORE_KEY = "roborunner.highscore";
  var SOUND_KEY = "roborunner.sound";
  var VOLUME_KEY = "roborunner.volume";
  var VOLUME_STEP = 0.1;
  var WARN_FUEL = 12;

  var canvas = document.getElementById("game");
  var ctx = canvas.getContext("2d");

  var viewScale = 1;
  var viewOffsetX = 0;
  var viewOffsetY = 0;

  var CRUSHER_TRAVEL = 200;
  var TOWER_H = 132;
  var TOWER_W = 34;
  var SPARE_W = 30;
  var SPARE_H = 30;
  var SPARE_LIFT = 220;
  var SPARE_CHANCE = 0.5;
  var LAVA_W = 32;
  var LAVA_H = 34;
  var LAVA_BOTTOM = 30;
  var LAVA_TOP = 170;
  var LAVA_CHANCE = 0.4;

  var TYPES = [
    { id: "crate", w: 46, h: 46, color: "#b0763c" },
    { id: "crate", w: 46, h: 46, color: "#a56c34" },
    { id: "pylon", w: 36, h: 68, color: "#d9b13b" },
    { id: "block", w: 76, h: 36, color: "#7d8b9c" },
    { id: "barrel", w: 42, h: 56, color: "#4f8a72" },
    { id: "cone", w: 40, h: 46, color: "#f08a3c" }
  ];

  var game = {
    state: "ready",
    time: 0,
    speed: START_SPEED,
    scroll: 0,
    level: 1,
    levelLength: 5200,
    levelBaseSpeed: START_SPEED,
    levelBonus: 0,
    levelClear: 0,
    distance: 0,
    score: 0,
    highscore: readHighscore(),
    lives: START_LIVES,
    fuel: FUEL_MAX,
    invuln: 0,
    notice: "",
    noticeTime: 0,
    gateX: VIEW_W,
    spawnTime: 0.9,
    canAt: 180,
    obstacles: [],
    pits: [],
    cans: [],
    spares: [],
    spareAt: -1,
    spareSpawned: false,
    labels: [],
    particles: [],
    shake: 0,
    flash: 0,
    bestThisRun: false,
    deathCause: "hit",
    jumpBuffer: 0,
    coyote: 0,
    lowFuelWarned: false,
    warnTimer: 0
  };

  var robot = {
    x: ROBOT_X,
    y: GROUND_Y,
    vy: 0,
    onGround: true,
    jumps: 0,
    wheel: 0,
    blink: 1.6,
    blinking: 0,
    tilt: 0
  };

  function readHighscore() {
    try {
      var raw = window.localStorage.getItem(HIGHSCORE_KEY);
      var value = parseInt(raw, 10);
      return isFinite(value) && value > 0 ? value : 0;
    } catch (e) {
      return 0;
    }
  }

  function writeHighscore(value) {
    try {
      window.localStorage.setItem(HIGHSCORE_KEY, String(value));
    } catch (e) {
      /* storage nicht verfuegbar */
    }
  }

  var audio = {
    ctx: null,
    master: null,
    enabled: readSound(),
    volume: readVolume(),
    combo: 0,
    comboTimer: 0
  };

  function readSound() {
    try {
      var raw = window.localStorage.getItem(SOUND_KEY);
      return raw === null ? true : raw !== "off";
    } catch (e) {
      return true;
    }
  }

  function writeSound(on) {
    try {
      window.localStorage.setItem(SOUND_KEY, on ? "on" : "off");
    } catch (e) {
      /* storage nicht verfuegbar */
    }
  }

  function readVolume() {
    try {
      var raw = parseFloat(window.localStorage.getItem(VOLUME_KEY));
      return isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.6;
    } catch (e) {
      return 0.6;
    }
  }

  function writeVolume(value) {
    try {
      window.localStorage.setItem(VOLUME_KEY, String(value));
    } catch (e) {
      /* storage nicht verfuegbar */
    }
  }

  function audioInit() {
    if (audio.ctx) {
      if (audio.ctx.state === "suspended") {
        audio.ctx.resume();
      }
      return;
    }
    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) {
      return;
    }
    try {
      audio.ctx = new Ctor();
      audio.master = audio.ctx.createGain();
      audio.master.gain.value = audio.volume * 0.7;
      audio.master.connect(audio.ctx.destination);
    } catch (e) {
      audio.ctx = null;
      audio.master = null;
    }
  }

  function audioSetVolume(value) {
    audio.volume = clamp(value, 0, 1);
    if (audio.master) {
      audio.master.gain.value = audio.volume * 0.7;
    }
    writeVolume(audio.volume);
  }

  function audioReady() {
    return audio.ctx !== null && audio.enabled;
  }

  function tone(opts) {
    if (!audioReady()) {
      return;
    }
    var c = audio.ctx;
    var t0 = c.currentTime + (opts.delay || 0);
    var dur = opts.duration || 0.12;
    var peak = Math.max(0.0002, (opts.gain === undefined ? 0.2 : opts.gain));
    var attack = opts.attack === undefined ? 0.008 : opts.attack;

    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = opts.type || "triangle";
    osc.frequency.setValueAtTime(Math.max(20, opts.freq), t0);
    if (opts.freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freqEnd), t0 + dur);
    }
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(audio.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  }

  function noise(dur, peak, cutoff) {
    if (!audioReady()) {
      return;
    }
    var c = audio.ctx;
    var len = Math.max(1, Math.floor(c.sampleRate * dur));
    var buffer = c.createBuffer(1, len, c.sampleRate);
    var data = buffer.getChannelData(0);
    for (var i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    }
    var src = c.createBufferSource();
    src.buffer = buffer;
    var filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff || 1200;
    var gain = c.createGain();
    gain.gain.value = peak;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(audio.master);
    src.start();
  }

  function audioToggle() {
    audio.enabled = !audio.enabled;
    writeSound(audio.enabled);
    if (audio.enabled) {
      audioInit();
      tone({ freq: 880, freqEnd: 1320, duration: 0.12, type: "triangle", gain: 0.18 });
      game.notice = "TON AN";
    } else {
      game.notice = "TON AUS";
    }
    game.noticeTime = 1.2;
  }

  function audioVolumeStep(dir) {
    if (!audio.enabled) {
      audio.enabled = true;
      writeSound(true);
      audioInit();
    }
    audioSetVolume(audio.volume + dir * VOLUME_STEP);
    game.notice = "LAUTSTAERKE " + Math.round(audio.volume * 100) + "%";
    game.noticeTime = 1.2;
    tone({ freq: 760, duration: 0.06, type: "triangle", gain: 0.12 });
  }

  function sfxJump() {
    tone({ freq: 380, freqEnd: 720, duration: 0.13, type: "triangle", gain: 0.18 });
  }

  function sfxDoubleJump() {
    tone({ freq: 560, freqEnd: 940, duration: 0.12, type: "square", gain: 0.12 });
    tone({ freq: 900, freqEnd: 1380, duration: 0.14, type: "triangle", gain: 0.14, delay: 0.06 });
  }

  function sfxPickup() {
    audio.combo = Math.min(audio.combo + 1, 9);
    audio.comboTimer = 1.4;
    var f = 760 + audio.combo * 55;
    tone({ freq: f, freqEnd: f * 1.5, duration: 0.11, type: "triangle", gain: 0.16 });
    tone({ freq: f * 2, duration: 0.05, type: "sine", gain: 0.07, delay: 0.02 });
  }

  function sfxCrash() {
    noise(0.3, 0.5, 900);
    tone({ freq: 190, freqEnd: 65, duration: 0.3, type: "square", gain: 0.18 });
  }

  function sfxLava() {
    noise(0.32, 0.42, 700);
    tone({ freq: 150, freqEnd: 60, duration: 0.34, type: "sawtooth", gain: 0.16 });
  }

  function sfxPit() {
    noise(0.2, 0.28, 480);
    tone({ freq: 620, freqEnd: 80, duration: 0.55, type: "sawtooth", gain: 0.16 });
  }

  function sfxFuelEmpty() {
    tone({ freq: 260, freqEnd: 210, duration: 0.18, type: "square", gain: 0.14 });
    tone({ freq: 200, freqEnd: 150, duration: 0.24, type: "square", gain: 0.14, delay: 0.22 });
  }

  function sfxWarning() {
    tone({ freq: 1150, duration: 0.07, type: "square", gain: 0.08 });
  }

  function sfxExtraLife() {
    var notes = [659, 880, 1046, 1318];
    for (var i = 0; i < notes.length; i++) {
      tone({ freq: notes[i], duration: 0.2, type: "triangle", gain: 0.16, delay: i * 0.09 });
    }
  }

  function sfxLevelClear() {
    var notes = [523, 659, 784, 1046];
    for (var i = 0; i < notes.length; i++) {
      tone({ freq: notes[i], duration: 0.22, type: "triangle", gain: 0.16, delay: i * 0.1 });
    }
    noise(0.16, 0.12, 3200);
  }

  function sfxGameOver() {
    var notes = [420, 320, 240, 150];
    for (var i = 0; i < notes.length; i++) {
      tone({ freq: notes[i], duration: 0.28, type: "square", gain: 0.14, delay: i * 0.16 });
    }
  }

  function rr(c, x, y, w, h, r) {
    var rad = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + rad, y);
    c.arcTo(x + w, y, x + w, y + h, rad);
    c.arcTo(x + w, y + h, x, y + h, rad);
    c.arcTo(x, y + h, x, y, rad);
    c.arcTo(x, y, x + w, y, rad);
    c.closePath();
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  function rand(lo, hi) {
    return lo + Math.random() * (hi - lo);
  }

  function difficulty() {
    var speedPart = clamp((game.speed - START_SPEED) / (MAX_SPEED - START_SPEED), 0, 1);
    var levelPart = clamp((game.level - 1) * 0.12, 0, 0.5);
    return clamp(speedPart + levelPart, 0, 1);
  }

  function resetRobot() {
    robot.x = ROBOT_X;
    robot.y = GROUND_Y;
    robot.vy = 0;
    robot.onGround = true;
    robot.jumps = 0;
    robot.tilt = 0;
  }

  function startLevel(n) {
    game.level = n;
    game.levelLength = 15600 + (n - 1) * 4200;
    game.levelBaseSpeed = Math.min(MAX_SPEED - 140, START_SPEED + (n - 1) * 45);
    game.speed = game.levelBaseSpeed;
    game.distance = 0;
    game.fuel = FUEL_MAX;
    game.invuln = INVULN_TIME;
    game.spawnTime = 1.2;
    game.canAt = 180;
    game.levelClear = 0;
    game.levelBonus = 0;
    game.obstacles.length = 0;
    game.pits.length = 0;
    game.cans.length = 0;
    game.spares.length = 0;
    game.labels.length = 0;
    game.particles.length = 0;
    game.spareSpawned = false;
    game.spareAt = game.lives < START_LIVES && Math.random() < SPARE_CHANCE
      ? game.levelLength * rand(0.35, 0.75)
      : -1;
    game.notice = "LEVEL " + n;
    game.noticeTime = 1.6;
    game.gateX = robot.x + game.levelLength;
    game.lowFuelWarned = false;
    game.warnTimer = 0;
    audio.combo = 0;

    resetRobot();
    game.state = "playing";
  }

  function startGame() {
    game.time = 0;
    game.scroll = 0;
    game.score = 0;
    game.lives = START_LIVES;
    game.shake = 0;
    game.flash = 0;
    game.bestThisRun = false;
    game.deathCause = "hit";
    game.jumpBuffer = 0;
    game.coyote = COYOTE_TIME;
    startLevel(1);
  }

  function completeLevel() {
    game.levelBonus = Math.round(game.fuel) * 2;
    game.score += game.levelBonus;
    game.state = "levelclear";
    game.levelClear = LEVEL_CLEAR_TIME;
    game.flash = 0.2;
    game.jumpHeld = false;
    resetRobot();
    sfxLevelClear();
    burst(robot.x + ROBOT_W / 2, robot.y - ROBOT_H, 30, ["#ffd166", "#46e0c0", "#9fe8ff"]);
    if (game.score > game.highscore) {
      game.highscore = Math.floor(game.score);
      game.bestThisRun = true;
      writeHighscore(game.highscore);
    }
  }

  function saveHighscore() {
    if (game.score > game.highscore) {
      game.highscore = Math.floor(game.score);
      game.bestThisRun = true;
      writeHighscore(game.highscore);
    }
  }

  function clearAhead() {
    var from = robot.x - 140;
    var to = robot.x + 470;
    for (var i = game.obstacles.length - 1; i >= 0; i--) {
      var o = game.obstacles[i];
      if (o.x + o.w > from && o.x < to) {
        game.obstacles.splice(i, 1);
      }
    }
    for (var j = game.pits.length - 1; j >= 0; j--) {
      var p = game.pits[j];
      if (p.x + p.w > from && p.x < to) {
        game.pits.splice(j, 1);
      }
    }
  }

  function loseLife(cause) {
    game.lives -= 1;
    game.shake = 15;
    game.flash = 0.4;
    robot.onGround = false;

    if (cause === "fuel") {
      burst(robot.x + ROBOT_W / 2, robot.y - ROBOT_H / 2, 14, ["#8fa3b8", "#e8ecf1"]);
      sfxFuelEmpty();
    } else if (cause === "pit") {
      burst(robot.x + ROBOT_W / 2, robot.y - ROBOT_H / 2, 22, ["#ffd166", "#ff7b54", "#e8ecf1"]);
      sfxPit();
    } else if (cause === "lava") {
      burst(robot.x + ROBOT_W / 2, robot.y - ROBOT_H / 2, 26, ["#ffd166", "#ff7b30", "#c0290f"]);
      sfxLava();
    } else {
      burst(robot.x + ROBOT_W / 2, robot.y - ROBOT_H / 2, 22, ["#ffd166", "#ff7b54", "#e8ecf1"]);
      sfxCrash();
    }

    if (game.lives <= 0) {
      game.lives = 0;
      game.deathCause = cause;
      game.state = "over";
      robot.vy = cause === "pit" ? 340 : -560;
      sfxGameOver();
      saveHighscore();
      return;
    }

    game.deathCause = cause;
    game.fuel = Math.max(game.fuel, RESPAWN_FUEL);
    game.invuln = INVULN_TIME;
    game.notice = cause === "fuel" ? "TANK LEER - 1 LEBEN WEG"
      : cause === "pit" ? "GRABEN - 1 LEBEN WEG"
      : cause === "lava" ? "LAVA - 1 LEBEN WEG"
      : "CRASH - 1 LEBEN WEG";
    game.noticeTime = 1.6;
    game.jumpBuffer = 0;
    resetRobot();
    clearAhead();
  }

  function burst(x, y, count, colors) {
    for (var i = 0; i < count; i++) {
      var a = Math.random() * Math.PI * 2;
      var s = rand(60, 420);
      game.particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 120,
        life: rand(0.35, 1.05),
        max: 1.05,
        size: rand(2, 6),
        color: colors[(Math.random() * colors.length) | 0]
      });
    }
  }

  function makeObstacle(x, t) {
    return {
      type: t.id,
      x: x,
      w: t.w,
      h: t.h,
      color: t.color,
      scored: false,
      y0: GROUND_Y - t.h,
      y1: GROUND_Y,
      travel: 0,
      phase: 0,
      rate: 0,
      seed: Math.random() * 10
    };
  }

  function makeCrusher(x) {
    var o = makeObstacle(x, { id: "crusher", w: 46, h: 46, color: "#5c6b80" });
    o.travel = CRUSHER_TRAVEL;
    o.phase = rand(0, Math.PI * 2);
    o.rate = rand(2.4, 3.3);
    return o;
  }

  function spawnObstacle() {
    var d = difficulty();

    if (d > 0.2 && rightmostEdge() < VIEW_W - 320 && Math.random() < 0.18) {
      var tower = makeObstacle(VIEW_W + 40, { id: "tower", w: TOWER_W, h: TOWER_H, color: "#6b7a8f" });
      game.obstacles.push(tower);
      liftCans(tower.x, tower.x + tower.w, tower.y0);
      game.spawnTime = rand(1.8, 2.3) - d * 0.4;
      if (game.spawnTime < 1.2) {
        game.spawnTime = 1.2;
      }
      return;
    }

    if (d > 0.12 && Math.random() < 0.2 + d * 0.2) {
      var crusher = makeCrusher(VIEW_W + 40);
      game.obstacles.push(crusher);
      dropCans(crusher.x, crusher.x + crusher.w);
      game.spawnTime = rand(1.5, 2.0) - d * 0.45;
      if (game.spawnTime < 0.85) {
        game.spawnTime = 0.85;
      }
      return;
    }

    var t = TYPES[(Math.random() * TYPES.length) | 0];
    var first = makeObstacle(VIEW_W + 40, t);
    game.obstacles.push(first);
    liftCans(first.x, first.x + first.w, first.y0);

    if (d > 0.45 && Math.random() < 0.3) {
      var t2 = TYPES[(Math.random() * TYPES.length) | 0];
      var second = makeObstacle(VIEW_W + 40 + t.w + rand(10, 22), t2);
      game.obstacles.push(second);
      liftCans(second.x, second.x + second.w, second.y0);
    }
    game.spawnTime = rand(1.45, 1.95) - d * 0.62;
    if (game.spawnTime < 0.74) {
      game.spawnTime = 0.74;
    }
  }

  function spawnPit() {
    var d = difficulty();
    var w = game.speed * (0.22 + d * 0.2 + rand(0, 0.06));
    w = clamp(w, 92, 358);
    var pit = {
      x: VIEW_W + 30,
      w: w,
      scored: false,
      seed: Math.random() * 10,
      lava: Math.random() < LAVA_CHANCE + d * 0.2,
      dropPhase: 0,
      dropRate: 0,
      dropY: GROUND_Y + LAVA_BOTTOM
    };

    if (pit.lava) {
      pit.dropPhase = rand(0, Math.PI * 2);
      pit.dropRate = rand(2.2, 2.8);
      pit.dropY = pitDropTop(pit.dropPhase);
    }

    game.pits.push(pit);
    liftCans(pit.x, pit.x + pit.w, GROUND_Y - 40);
    game.spawnTime = rand(1.25, 1.7) - d * 0.42;
    if (game.spawnTime < 0.86) {
      game.spawnTime = 0.86;
    }
  }

  function spawnNext() {
    var d = difficulty();
    if (Math.random() < 0.28 + 0.26 * d) {
      spawnPit();
    } else {
      spawnObstacle();
    }
  }

  function pitDropTop(phase) {
    var low = GROUND_Y + LAVA_BOTTOM;
    var high = GROUND_Y - LAVA_TOP;
    return low + (high - low) * (0.5 + 0.5 * Math.sin(phase));
  }

  function pitDropX(pit) {
    return pit.x + pit.w / 2 - LAVA_W / 2;
  }

  function hitsLavaDrop() {
    var rx1 = robot.x + 6;
    var rx2 = robot.x + ROBOT_W - 6;
    var ry1 = robot.y - ROBOT_H + 6;
    var ry2 = robot.y - 3;

    for (var i = 0; i < game.pits.length; i++) {
      var pit = game.pits[i];
      if (!pit.lava) {
        continue;
      }
      var dx = pitDropX(pit) + 3;
      var dw = LAVA_W - 6;
      var dy = pit.dropY + 3;
      var dh = LAVA_H - 6;
      if (dx < rx2 && dx + dw > rx1 && dy < ry2 && dy + dh > ry1) {
        return true;
      }
    }
    return false;
  }

  function rightmostEdge() {
    var r = 0;
    for (var i = 0; i < game.obstacles.length; i++) {
      r = Math.max(r, game.obstacles[i].x + game.obstacles[i].w);
    }
    for (var j = 0; j < game.pits.length; j++) {
      r = Math.max(r, game.pits[j].x + game.pits[j].w);
    }
    return r;
  }

  function overlapsCrusher(x, w) {
    for (var i = 0; i < game.obstacles.length; i++) {
      var o = game.obstacles[i];
      if (o.travel > 0 && o.x < x + w && o.x + o.w > x) {
        return true;
      }
    }
    return false;
  }

  function liftCans(fromX, toX, topY) {
    for (var i = 0; i < game.cans.length; i++) {
      var c = game.cans[i];
      if (c.x + c.w > fromX && c.x < toX) {
        c.y = Math.min(c.y, topY - 36);
      }
    }
  }

  function dropCans(fromX, toX) {
    for (var i = game.cans.length - 1; i >= 0; i--) {
      var c = game.cans[i];
      if (c.x + c.w > fromX && c.x < toX) {
        game.cans.splice(i, 1);
      }
    }
  }

  function canSpacing() {
    var base = Math.max(900, 1300 - (game.level - 1) * 25);
    return base * rand(0.94, 1.06);
  }

  function canElevatedChance() {
    return clamp(0.7 + (game.level - 1) * 0.03, 0, 0.85);
  }

  function pushCan(x, y) {
    if (overlapsCrusher(x, CAN_W)) {
      return;
    }

    for (var i = 0; i < game.obstacles.length; i++) {
      var o = game.obstacles[i];
      if (o.x < x + CAN_W && o.x + o.w > x) {
        y = Math.min(y, o.y0 - 36);
      }
    }
    for (var j = 0; j < game.pits.length; j++) {
      var p = game.pits[j];
      if (p.x < x + CAN_W && p.x + p.w > x) {
        y = Math.min(y, GROUND_Y - 76);
      }
    }

    game.cans.push({
      x: x,
      y: clamp(y, 150, GROUND_Y - 34),
      w: CAN_W,
      h: CAN_H,
      seed: Math.random() * 10
    });
  }

  function spawnCan() {
    var elevated = Math.random() < canElevatedChance();
    var y = elevated ? GROUND_Y - rand(110, 150) : GROUND_Y - rand(40, 52);

    pushCan(VIEW_W + 20, y);

    if (elevated && Math.random() < 0.35) {
      pushCan(VIEW_W - 16, y - 12);
    }
  }

  function spawnSpare() {
    var x = VIEW_W + 20;
    var from = x - 90;
    var to = x + 200;

    for (var i = 0; i < game.obstacles.length; i++) {
      var o = game.obstacles[i];
      if (o.x < to && o.x + o.w > from) {
        return false;
      }
    }
    for (var j = 0; j < game.pits.length; j++) {
      var p = game.pits[j];
      if (p.x < to && p.x + p.w > from) {
        return false;
      }
    }

    game.spares.push({
      x: x,
      y: GROUND_Y - SPARE_LIFT,
      w: SPARE_W,
      h: SPARE_H,
      seed: Math.random() * 10
    });
    return true;
  }

  function collectSpares() {
    var rx1 = robot.x - 6;
    var rx2 = robot.x + ROBOT_W + 6;
    var ry1 = robot.y - ROBOT_H - 10;
    var ry2 = robot.y + 6;

    for (var i = game.spares.length - 1; i >= 0; i--) {
      var s = game.spares[i];
      if (s.x < rx2 && s.x + s.w > rx1 && s.y < ry2 && s.y + s.h > ry1) {
        game.spares.splice(i, 1);
        game.lives = Math.min(START_LIVES, game.lives + 1);
        game.score += 100;
        game.notice = "ERSATZ-ROBOTER!";
        game.noticeTime = 1.6;
        addLabel(s.x + s.w / 2, s.y - 6, "+1 LEBEN", "#ffd166");
        burst(s.x + s.w / 2, s.y + s.h / 2, 24, ["#ffd166", "#46e0c0", "#e8ecf1"]);
        sfxExtraLife();
      }
    }
  }

  function addLabel(x, y, text, color) {
    game.labels.push({
      x: x,
      y: y,
      text: text,
      color: color,
      life: 0.9,
      max: 0.9
    });
  }

  function collectCans() {
    var rx1 = robot.x - 6;
    var rx2 = robot.x + ROBOT_W + 6;
    var ry1 = robot.y - ROBOT_H - 10;
    var ry2 = robot.y + 6;

    for (var i = game.cans.length - 1; i >= 0; i--) {
      var c = game.cans[i];
      if (c.x < rx2 && c.x + c.w > rx1 && c.y < ry2 && c.y + c.h > ry1) {
        game.cans.splice(i, 1);
        game.fuel = Math.min(FUEL_MAX, game.fuel + FUEL_PER_CAN);
        game.score += 15;
        addLabel(c.x + c.w / 2, c.y - 4, "+" + FUEL_PER_CAN, "#7fe6ff");
        burst(c.x + c.w / 2, c.y + c.h / 2, 10, ["#7fe6ff", "#46e0c0", "#e8ecf1"]);
        sfxPickup();
      }
    }
  }

  function update(dt) {
    game.time += dt;

    if (game.state === "levelclear") {
      game.levelClear -= dt;
      game.flash = Math.max(0, game.flash - dt * 1.6);
      game.shake = Math.max(0, game.shake - dt * 42);
      updateFx(dt);
      if (game.levelClear <= 0) {
        startLevel(game.level + 1);
      }
      return;
    }

    if (game.state === "playing") {
      game.speed = Math.min(MAX_SPEED, game.levelBaseSpeed + game.distance * SPEED_RAMP);
    }

    var worldSpeed = 0;
    if (game.state === "playing") {
      worldSpeed = game.speed;
    } else if (game.state === "ready") {
      worldSpeed = 150;
    }

    game.scroll += worldSpeed * dt;

    if (game.state === "playing") {
      var step = game.speed * dt;
      game.distance += step;
      game.score += step / 10;
      game.fuel -= step * FUEL_PER_PIXEL;
      if (game.fuel <= 0) {
        game.fuel = 0;
        loseLife("fuel");
      } else {
        if (game.fuel <= FUEL_LOW && !game.lowFuelWarned) {
          game.lowFuelWarned = true;
          sfxWarning();
        }
        if (game.fuel > FUEL_LOW + 6) {
          game.lowFuelWarned = false;
        }
        game.warnTimer -= dt;
        if (game.fuel <= WARN_FUEL && game.warnTimer <= 0) {
          game.warnTimer = 0.55;
          sfxWarning();
        }
      }
      game.gateX = robot.x + (game.levelLength - game.distance);

      audio.comboTimer -= dt;
      if (audio.comboTimer <= 0) {
        audio.combo = 0;
      }
    }

    game.invuln = Math.max(0, game.invuln - dt);
    game.noticeTime = Math.max(0, game.noticeTime - dt);

    robot.blink -= dt;
    if (robot.blink <= 0) {
      robot.blinking = 0.12;
      robot.blink = rand(1.8, 5.2);
    }
    robot.blinking -= dt;

    var cx = robot.x + ROBOT_W / 2;
    var supported = hasGroundSupport(cx);

    game.jumpBuffer -= dt;

    if (game.state === "playing" && game.jumpBuffer > 0) {
      if (robot.jumps === 0 && (robot.onGround || game.coyote > 0)) {
        doJump(1, JUMP_VELOCITY);
      } else if (robot.jumps === 1 && robot.y <= GROUND_Y + 20) {
        doJump(2, DOUBLE_JUMP_VELOCITY);
      }
    }

    var holdJump = game.jumpHeld && robot.vy < 0 && game.state === "playing";
    robot.vy += (holdJump ? HOLD_GRAVITY : GRAVITY) * dt;
    if (robot.vy > MAX_FALL) {
      robot.vy = MAX_FALL;
    }
    robot.y += robot.vy * dt;

    if (supported && robot.y >= GROUND_Y && robot.y < GROUND_Y + 40 && robot.vy >= 0) {
      if (!robot.onGround && game.state === "playing") {
        dust(cx, GROUND_Y, robot.jumps > 1 ? 12 : 8);
      }
      robot.y = GROUND_Y;
      robot.vy = 0;
      robot.onGround = true;
      robot.jumps = 0;
      game.coyote = COYOTE_TIME;
    } else {
      robot.onGround = false;
      game.coyote -= dt;
      if (game.coyote <= 0 && robot.jumps === 0) {
        robot.jumps = 1;
      }
      if (robot.y > VIEW_H + 160) {
        robot.y = VIEW_H + 160;
        robot.vy = 0;
      }
    }

    robot.tilt += ((robot.onGround ? 0 : clamp(robot.vy / 4200, -0.1, 0.16)) - robot.tilt) * Math.min(1, dt * 12);
    robot.wheel += (worldSpeed / 17) * dt;

    if (game.state === "playing") {
      var remaining = game.levelLength - game.distance;

      if (remaining > SPAWN_STOP_MARGIN) {
        game.spawnTime -= dt;
        if (game.spawnTime <= 0 && rightmostEdge() < VIEW_W - 60) {
          spawnNext();
        }
      }

      if (remaining > 320 && game.distance >= game.canAt) {
        spawnCan();
        game.canAt = game.distance + canSpacing();
      }

      if (game.spareAt > 0 && !game.spareSpawned && game.distance >= game.spareAt) {
        game.spareSpawned = spawnSpare();
      }
    }

    for (var i = game.obstacles.length - 1; i >= 0; i--) {
      var o = game.obstacles[i];
      if (game.state === "playing") {
        o.x -= game.speed * dt;
        if (o.travel > 0) {
          o.phase += o.rate * dt;
          o.y0 = GROUND_Y - o.h - o.travel * (0.5 + 0.5 * Math.sin(o.phase));
          o.y1 = o.y0 + o.h;
        }
      }
      if (!o.scored && o.x + o.w < robot.x) {
        o.scored = true;
        if (game.state === "playing") {
          game.score += 5;
        }
      }
      if (o.x + o.w < -80) {
        game.obstacles.splice(i, 1);
      }
    }

    for (var q = game.pits.length - 1; q >= 0; q--) {
      var pit = game.pits[q];
      if (game.state === "playing") {
        pit.x -= game.speed * dt;
      }
      if (pit.lava && game.state === "playing") {
        pit.dropPhase += pit.dropRate * dt;
        pit.dropY = pitDropTop(pit.dropPhase);
      }
      if (!pit.scored && pit.x + pit.w < robot.x) {
        pit.scored = true;
        if (game.state === "playing") {
          game.score += 5;
        }
      }
      if (pit.x + pit.w < -80) {
        game.pits.splice(q, 1);
      }
    }

    for (var ci = game.cans.length - 1; ci >= 0; ci--) {
      var can = game.cans[ci];
      if (game.state === "playing") {
        can.x -= game.speed * dt;
      }
      if (can.x + can.w < -80) {
        game.cans.splice(ci, 1);
      }
    }

    for (var si = game.spares.length - 1; si >= 0; si--) {
      var spare = game.spares[si];
      if (game.state === "playing") {
        spare.x -= game.speed * dt;
      }
      if (spare.x + spare.w < -80) {
        game.spares.splice(si, 1);
      }
    }

    if (game.state === "playing") {
      collectCans();
      collectSpares();
      if (game.invuln <= 0) {
        if (hitsObstacle()) {
          loseLife("hit");
        } else if (hitsLavaDrop()) {
          loseLife("lava");
        } else if (robot.y > GROUND_Y + 60) {
          loseLife("pit");
        }
      } else if (robot.y > GROUND_Y + 60) {
        resetRobot();
      }
    }

    if (game.state === "playing" && game.distance >= game.levelLength) {
      completeLevel();
    }

    updateFx(dt);
  }

  function updateFx(dt) {
    for (var p = game.particles.length - 1; p >= 0; p--) {
      var pt = game.particles[p];
      pt.life -= dt;
      if (pt.life <= 0) {
        game.particles.splice(p, 1);
        continue;
      }
      pt.vy += 1500 * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.y > GROUND_Y) {
        if (isOverPit(pt.x)) {
          continue;
        }
        pt.y = GROUND_Y;
        pt.vy *= -0.35;
        pt.vx *= 0.7;
      }
    }

    for (var i = game.labels.length - 1; i >= 0; i--) {
      var l = game.labels[i];
      l.life -= dt;
      l.y -= 42 * dt;
      if (l.life <= 0) {
        game.labels.splice(i, 1);
      }
    }

    game.shake = Math.max(0, game.shake - dt * 42);
    game.flash = Math.max(0, game.flash - dt * 1.6);
  }

  function doJump(next, velocity) {
    robot.vy = -velocity;
    robot.onGround = false;
    robot.jumps = next;
    game.jumpBuffer = 0;
    game.coyote = 0;
    if (next === 2) {
      ring(robot.x + ROBOT_W / 2, robot.y - 8);
      sfxDoubleJump();
    } else {
      dust(robot.x + ROBOT_W / 2, robot.y, 6);
      sfxJump();
    }
  }

  function ring(x, y) {
    for (var i = 0; i < 14; i++) {
      var a = (i / 14) * Math.PI * 2;
      game.particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * 200,
        vy: Math.sin(a) * 110 - 60,
        life: 0.36,
        max: 0.36,
        size: 4,
        color: "#7fe6ff"
      });
    }
  }

  function isOverPit(px) {
    for (var i = 0; i < game.pits.length; i++) {
      var p = game.pits[i];
      if (px > p.x && px < p.x + p.w) {
        return true;
      }
    }
    return false;
  }

  function hasGroundSupport(cx) {
    return !isOverPit(cx - 13) || !isOverPit(cx + 13);
  }

  function dust(x, y, count) {
    for (var i = 0; i < count; i++) {
      game.particles.push({
        x: x + rand(-14, 14),
        y: y - rand(0, 8),
        vx: rand(-120, -30),
        vy: rand(-260, -70),
        life: rand(0.25, 0.6),
        max: 0.6,
        size: rand(2, 5),
        color: "#8fa3b8"
      });
    }
  }

  function hitsObstacle() {
    var inset = 6;
    var rx1 = robot.x + inset;
    var rx2 = robot.x + ROBOT_W - inset;
    var ry1 = robot.y - ROBOT_H + 6;
    var ry2 = robot.y - 3;
    for (var i = 0; i < game.obstacles.length; i++) {
      var o = game.obstacles[i];
      if (o.x < rx2 && o.x + o.w > rx1 && o.y0 < ry2 && o.y1 > ry1) {
        return true;
      }
    }
    return false;
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "#080a11";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.setTransform(viewScale, 0, 0, viewScale, viewOffsetX, viewOffsetY);
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, VIEW_W, VIEW_H);
    ctx.clip();

    ctx.save();
    if (game.shake > 0.2) {
      ctx.translate(rand(-game.shake, game.shake) * 0.4, rand(-game.shake, game.shake) * 0.4);
    }

    drawSky();
    drawHills();
    drawPits();
    drawGround();
    drawGate();
    drawCans();
    drawSpares();
    drawObstacles();
    drawParticles();
    drawLabels();
    drawRobot();
    ctx.restore();

    drawHud();
    drawOverlay();

    if (game.flash > 0) {
      ctx.fillStyle = "rgba(255, 120, 90, " + (game.flash * 0.55) + ")";
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    var v = ctx.createRadialGradient(VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.45)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.restore();
  }

  function drawSky() {
    var g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, "#141d3d");
    g.addColorStop(0.45, "#33406f");
    g.addColorStop(0.78, "#8c5a76");
    g.addColorStop(1, "#d98a5a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

    var sunY = 300;
    var glow = ctx.createRadialGradient(700, sunY, 8, 700, sunY, 150);
    glow.addColorStop(0, "rgba(255, 214, 150, 0.95)");
    glow.addColorStop(0.35, "rgba(255, 160, 96, 0.35)");
    glow.addColorStop(1, "rgba(255, 130, 80, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(700, sunY, 150, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffd9a0";
    ctx.beginPath();
    ctx.arc(700, sunY, 46, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.55)";
    var stars = 26;
    for (var i = 0; i < stars; i++) {
      var sx = (i * 137.5) % VIEW_W;
      var sy = (i * 53.7) % 170;
      var a = 0.15 + 0.5 * Math.abs(Math.sin(game.time * 1.4 + i));
      ctx.globalAlpha = a * (1 - sy / 220);
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawHills() {
    hills(game.scroll * 0.08, 380, 150, "#3a2f5c", 900);
    hills(game.scroll * 0.16, 412, 96, "#2b2447", 620);
  }

  function hills(offset, baseY, amp, color, period) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, VIEW_H);
    ctx.lineTo(0, baseY);
    var step = 30;
    for (var x = 0; x <= VIEW_W + step; x += step) {
      var worldX = x + offset;
      var y = baseY - amp * (0.5 + 0.5 * Math.sin(worldX / period * Math.PI * 2)) * (0.6 + 0.4 * Math.sin(worldX / (period * 0.37)));
      y = clamp(y, baseY - amp * 1.5, baseY);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.closePath();
    ctx.fill();
  }

  function groundSegments() {
    var segs = [];
    var cursor = 0;
    for (var i = 0; i < game.pits.length; i++) {
      var p = game.pits[i];
      var left = Math.max(0, p.x);
      var right = Math.min(VIEW_W, p.x + p.w);
      if (right <= 0 || left >= VIEW_W) {
        continue;
      }
      if (left > cursor) {
        segs.push([cursor, left]);
      }
      if (right > cursor) {
        cursor = right;
      }
    }
    if (cursor < VIEW_W) {
      segs.push([cursor, VIEW_W]);
    }
    return segs;
  }

  function drawPits() {
    for (var i = 0; i < game.pits.length; i++) {
      var p = game.pits[i];
      if (p.x > VIEW_W || p.x + p.w < 0) {
        continue;
      }
      var x0 = p.x;
      var w = p.w;

      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, GROUND_Y - 4, w, VIEW_H - GROUND_Y + 4);
      ctx.clip();

      var g = ctx.createLinearGradient(0, GROUND_Y, 0, VIEW_H);
      g.addColorStop(0, "#04060b");
      g.addColorStop(0.45, "#0a1220");
      g.addColorStop(1, "#17253d");
      ctx.fillStyle = g;
      ctx.fillRect(x0, GROUND_Y - 4, w, VIEW_H - GROUND_Y + 4);

      var leftGlow = ctx.createLinearGradient(x0, 0, x0 + 30, 0);
      leftGlow.addColorStop(0, "rgba(130, 165, 200, 0.4)");
      leftGlow.addColorStop(1, "rgba(130, 165, 200, 0)");
      ctx.fillStyle = leftGlow;
      ctx.fillRect(x0, GROUND_Y, 30, VIEW_H - GROUND_Y);

      var rightGlow = ctx.createLinearGradient(x0 + w - 30, 0, x0 + w, 0);
      rightGlow.addColorStop(0, "rgba(130, 165, 200, 0)");
      rightGlow.addColorStop(1, "rgba(130, 165, 200, 0.4)");
      ctx.fillStyle = rightGlow;
      ctx.fillRect(x0 + w - 30, GROUND_Y, 30, VIEW_H - GROUND_Y);

      if (p.lava) {
        drawLavaFill(p, x0, w);
      } else {
        ctx.fillStyle = "rgba(255, 145, 70, 0.8)";
        for (var s = 0; s < w - 12; s += 18) {
          ctx.fillRect(x0 + s + 5, GROUND_Y + 5, 9, 5);
        }
      }
      ctx.restore();

      ctx.fillStyle = p.lava ? "rgba(255, 120, 50, 0.95)" : "rgba(255, 165, 95, 0.95)";
      ctx.fillRect(x0 - 2, GROUND_Y - 4, 4, 9);
      ctx.fillRect(x0 + w - 2, GROUND_Y - 4, 4, 9);
    }

    for (var k = 0; k < game.pits.length; k++) {
      if (game.pits[k].lava) {
        drawLavaDrop(game.pits[k]);
      }
    }
  }

  function drawLavaFill(p, x0, w) {
    var wob = Math.sin(game.time * 2.4 + p.seed) * 3;
    var surface = GROUND_Y + 30 + wob;

    var g = ctx.createLinearGradient(0, surface, 0, VIEW_H);
    g.addColorStop(0, "#ffe08a");
    g.addColorStop(0.18, "#ff9a3c");
    g.addColorStop(0.6, "#c0290f");
    g.addColorStop(1, "#5e0c04");
    ctx.fillStyle = g;
    ctx.fillRect(x0, surface, w, VIEW_H - surface);

    ctx.fillStyle = "rgba(255, 240, 190, 0.85)";
    ctx.fillRect(x0, surface - 3, w, 3);

    for (var i = 0; i < 5; i++) {
      var bx = x0 + 10 + ((i * 89 + game.time * 46 + p.seed * 40) % Math.max(1, w - 20));
      var by = surface + 8 + ((i * 47 + game.time * 74) % 40);
      var r = 1.8 + (i % 3);
      ctx.fillStyle = "rgba(255, 235, 165, " + (0.3 + 0.35 * Math.abs(Math.sin(game.time * 3 + i))) + ")";
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.fill();
    }

    var glow = ctx.createLinearGradient(0, GROUND_Y - 46, 0, GROUND_Y + 26);
    glow.addColorStop(0, "rgba(255, 130, 50, 0)");
    glow.addColorStop(1, "rgba(255, 130, 50, 0.4)");
    ctx.fillStyle = glow;
    ctx.fillRect(x0 - 12, GROUND_Y - 46, w + 24, 72);
  }

  function drawLavaDrop(p) {
    var cx = pitDropX(p) + LAVA_W / 2;
    var cy = p.dropY + LAVA_H / 2;
    var wob = Math.sin(game.time * 9 + p.seed) * 2;

    var glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 48);
    glow.addColorStop(0, "rgba(255, 175, 70, 0.5)");
    glow.addColorStop(0.45, "rgba(255, 110, 40, 0.22)");
    glow.addColorStop(1, "rgba(255, 90, 30, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 48, cy - 48, 96, 96);

    ctx.fillStyle = "rgba(255, 130, 50, 0.28)";
    ctx.beginPath();
    ctx.ellipse(cx, cy - 20, 7, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    var body = ctx.createRadialGradient(cx - 5, cy - 7, 2, cx, cy, 19);
    body.addColorStop(0, "#fffce0");
    body.addColorStop(0.3, "#ffd166");
    body.addColorStop(0.65, "#ff7b30");
    body.addColorStop(1, "#9c2c14");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(cx, cy, 15 + wob * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 9, cy + 7, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 9, cy + 6, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(120, 30, 12, 0.45)";
    ctx.beginPath();
    ctx.arc(cx + 5, cy - 6, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx - 4, cy + 7, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawGround() {
    var segs = groundSegments();
    for (var i = 0; i < segs.length; i++) {
      var x0 = segs[i][0];
      var x1 = segs[i][1];
      if (x1 - x0 < 1) {
        continue;
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, GROUND_Y - 6, x1 - x0, VIEW_H - GROUND_Y + 6);
      ctx.clip();
      drawGroundSlice();
      ctx.restore();
    }
  }

  function drawGroundSlice() {
    ctx.fillStyle = "#1a1f2e";
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);

    var g = ctx.createLinearGradient(0, GROUND_Y, 0, VIEW_H);
    g.addColorStop(0, "rgba(255,255,255,0.07)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);

    ctx.fillStyle = "#46e0c0";
    ctx.fillRect(0, GROUND_Y - 2, VIEW_W, 3);
    ctx.fillStyle = "rgba(70, 224, 192, 0.18)";
    ctx.fillRect(0, GROUND_Y + 3, VIEW_W, 8);

    ctx.strokeStyle = "rgba(120, 150, 180, 0.35)";
    ctx.lineWidth = 2;
    var spacing = 90;
    var off = game.scroll % spacing;
    ctx.beginPath();
    for (var x = -spacing + off; x < VIEW_W + spacing; x += spacing) {
      ctx.moveTo(x, GROUND_Y + 26);
      ctx.lineTo(x + 34, GROUND_Y + 26);
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(120, 150, 180, 0.18)";
    var off2 = (game.scroll * 1.25) % spacing;
    for (var x2 = -spacing + off2; x2 < VIEW_W + spacing; x2 += spacing) {
      ctx.fillRect(x2, GROUND_Y + 52, 52, 3);
    }

    ctx.fillStyle = "rgba(90, 190, 170, 0.10)";
    ctx.fillRect(0, GROUND_Y + 4, VIEW_W, 1);
  }

  function drawGate() {
    var x = game.gateX;
    var w = 66;
    if (x > VIEW_W + w + 40 || x + w < -40) {
      return;
    }
    var top = GROUND_Y - 224;

    var pg = ctx.createLinearGradient(x, 0, x + w, 0);
    pg.addColorStop(0, "#5c6b80");
    pg.addColorStop(0.5, "#8b97a8");
    pg.addColorStop(1, "#2a3444");
    ctx.fillStyle = pg;
    ctx.fillRect(x, top, 7, GROUND_Y - top);
    ctx.fillRect(x + w - 7, top, 7, GROUND_Y - top);

    var cell = 8;
    var cols = 8;
    for (var r = 0; r < 3; r++) {
      for (var c = 0; c < cols; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? "rgba(240,246,252,0.92)" : "rgba(22,28,40,0.92)";
        ctx.fillRect(x + 4 + c * cell, top + r * cell, cell, cell);
      }
    }
    ctx.strokeStyle = "rgba(12,18,28,0.65)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 4, top, cols * cell, 24);

    var glow = 0.22 + 0.22 * Math.abs(Math.sin(game.time * 3));
    ctx.fillStyle = "rgba(70, 224, 192, " + glow + ")";
    ctx.fillRect(x - 6, GROUND_Y - 4, w + 12, 9);

    ctx.font = "700 15px Consolas, 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(10,16,26,0.85)";
    rr(ctx, x + w / 2 - 24, top + 34, 48, 22, 6);
    ctx.fill();
    ctx.fillStyle = "#46e0c0";
    ctx.fillText("ZIEL", x + w / 2, top + 46);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  function drawCans() {
    for (var i = 0; i < game.cans.length; i++) {
      var c = game.cans[i];
      var x = c.x;
      var y = c.y + Math.sin(game.time * 4 + c.seed) * 3;
      var cx = x + c.w / 2;

      ctx.fillStyle = "rgba(0,0,0,0.22)";
      ctx.beginPath();
      ctx.ellipse(cx, GROUND_Y + 4, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      var glow = ctx.createRadialGradient(cx, y + c.h / 2, 2, cx, y + c.h / 2, 34);
      glow.addColorStop(0, "rgba(127, 230, 255, 0.3)");
      glow.addColorStop(1, "rgba(127, 230, 255, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 36, y - 24, 72, c.h + 48);

      var g = ctx.createLinearGradient(x, 0, x + c.w, 0);
      g.addColorStop(0, "#cbd7e6");
      g.addColorStop(0.45, "#f4f8fc");
      g.addColorStop(1, "#9fb0c4");
      ctx.fillStyle = g;
      rr(ctx, x, y, c.w, c.h, 5);
      ctx.fill();
      ctx.strokeStyle = "rgba(30, 40, 55, 0.75)";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = "#1f6f5c";
      rr(ctx, x + 3, y + 7, c.w - 6, c.h - 14, 3);
      ctx.fill();

      ctx.fillStyle = "#7fe6ff";
      ctx.fillRect(x + 6, y + 12, c.w - 12, 3);
      ctx.fillRect(x + 6, y + c.h - 16, c.w - 12, 3);

      ctx.fillStyle = "#4a5568";
      rr(ctx, x + 8, y - 6, c.w - 16, 7, 3);
      ctx.fill();
    }
  }

  function drawLabels() {
    if (game.labels.length === 0) {
      return;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 17px Consolas, 'Courier New', monospace";
    for (var i = 0; i < game.labels.length; i++) {
      var l = game.labels[i];
      ctx.globalAlpha = clamp(l.life / l.max, 0, 1);
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, l.x, l.y);
    }
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  function drawObstacles() {
    for (var i = 0; i < game.obstacles.length; i++) {
      var o = game.obstacles[i];
      if (o.travel > 0) {
        drawCrusher(o);
        continue;
      }

      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, GROUND_Y + 4, o.w * 0.55, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      if (o.type === "crate") {
        drawCrate(o);
      } else if (o.type === "tower") {
        drawTower(o);
      } else if (o.type === "pylon") {
        drawPylon(o);
      } else if (o.type === "barrel") {
        drawBarrel(o);
      } else if (o.type === "cone") {
        drawCone(o);
      } else {
        drawBlock(o);
      }
    }
  }

  function drawCrate(o) {
    var x = o.x;
    var y = o.y0;
    var w = o.w;
    var h = o.h;

    var grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, "#c98a48");
    grad.addColorStop(0.5, o.color);
    grad.addColorStop(1, shade(o.color, -0.28));
    ctx.fillStyle = grad;
    rr(ctx, x, y, w, h, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(60, 34, 12, 0.75)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = "rgba(90, 55, 22, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 4, y + h * 0.33);
    ctx.lineTo(x + w - 4, y + h * 0.33);
    ctx.moveTo(x + 4, y + h * 0.66);
    ctx.lineTo(x + w - 4, y + h * 0.66);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 240, 200, 0.28)";
    ctx.fillRect(x + 5, y + 4, w - 10, 3);

    var bolts = [[x + 9, y + 9], [x + w - 9, y + 9], [x + 9, y + h - 9], [x + w - 9, y + h - 9]];
    ctx.fillStyle = "#8a5a25";
    for (var i = 0; i < bolts.length; i++) {
      ctx.beginPath();
      ctx.arc(bolts[i][0], bolts[i][1], 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTower(o) {
    var x = o.x;
    var y = o.y0;
    var w = o.w;
    var h = o.h;

    var grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, "#46536a");
    grad.addColorStop(0.35, "#96a6bb");
    grad.addColorStop(1, "#39424f");
    ctx.fillStyle = grad;
    rr(ctx, x, y, w, h, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(14, 20, 30, 0.85)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    rr(ctx, x + 3, y + 3, w - 6, h - 6, 4);
    ctx.clip();
    ctx.strokeStyle = "rgba(20, 28, 40, 0.45)";
    ctx.lineWidth = 2;
    var seg = (h - 20) / 4;
    ctx.beginPath();
    for (var i = 0; i < 4; i++) {
      var yy = y + 10 + i * seg;
      ctx.moveTo(x + 4, yy);
      ctx.lineTo(x + w - 4, yy + seg);
      ctx.moveTo(x + w - 4, yy);
      ctx.lineTo(x + 4, yy + seg);
    }
    ctx.stroke();

    ctx.fillStyle = "#e8c23c";
    ctx.fillRect(x, y + h - 14, w, 14);
    ctx.fillStyle = "#2b2f38";
    for (var s = -1; s < 4; s++) {
      ctx.beginPath();
      ctx.moveTo(x + s * 12, y + h);
      ctx.lineTo(x + s * 12 + 6, y + h);
      ctx.lineTo(x + s * 12 + 12, y + h - 14);
      ctx.lineTo(x + s * 12 + 6, y + h - 14);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(x + 5, y + 4, w - 10, 3);

    var pulse = 0.35 + 0.65 * Math.abs(Math.sin(game.time * 5 + o.seed));
    ctx.fillStyle = "rgba(255, 170, 60, " + pulse + ")";
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 9, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb45c";
    ctx.beginPath();
    ctx.arc(x + w / 2, y - 9, 3.2, 0, Math.PI * 2);
    ctx.fill();

    var cue = 0.4 + 0.6 * Math.abs(Math.sin(game.time * 3.4));
    ctx.strokeStyle = "rgba(70, 224, 192, " + cue + ")";
    ctx.lineWidth = 3;
    for (var c = 0; c < 2; c++) {
      var cy = y - 22 - c * 12;
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 9, cy + 6);
      ctx.lineTo(x + w / 2, cy - 2);
      ctx.lineTo(x + w / 2 + 9, cy + 6);
      ctx.stroke();
    }
  }

  function drawSpares() {
    for (var i = 0; i < game.spares.length; i++) {
      var s = game.spares[i];
      var y = s.y + Math.sin(game.time * 3.4 + s.seed) * 4;
      var cx = s.x + s.w / 2;
      var cy = y + s.h / 2;

      var ring = 0.25 + 0.35 * Math.abs(Math.sin(game.time * 3 + s.seed));
      ctx.strokeStyle = "rgba(255, 209, 102, " + ring + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 22 + (1 - ring) * 6, 0, Math.PI * 2);
      ctx.stroke();

      var glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 40);
      glow.addColorStop(0, "rgba(255, 209, 102, 0.35)");
      glow.addColorStop(1, "rgba(255, 209, 102, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - 40, cy - 40, 80, 80);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1.5, 1.5);

      ctx.strokeStyle = "#5b6b80";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(1, -14);
      ctx.lineTo(-1, -20);
      ctx.stroke();
      ctx.fillStyle = "#ff5d5d";
      ctx.beginPath();
      ctx.arc(-1, -21, 2.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#dbe6f2";
      rr(ctx, -10, -14, 20, 15, 5);
      ctx.fill();
      ctx.strokeStyle = "#5b6b80";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#1b2430";
      rr(ctx, -7, -10, 14, 6, 3);
      ctx.fill();
      ctx.fillStyle = "#46e0c0";
      ctx.beginPath();
      ctx.arc(3, -7, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#232b3a";
      rr(ctx, -9, 1, 18, 5, 2.5);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawPylon(o) {
    var x = o.x;
    var y = o.y0;
    var w = o.w;
    var h = o.h;

    var grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, "#6d7686");
    grad.addColorStop(0.35, "#9aa5b6");
    grad.addColorStop(1, "#525c6b");
    ctx.fillStyle = grad;
    rr(ctx, x, y, w, h, 5);
    ctx.fill();
    ctx.strokeStyle = "rgba(20, 26, 36, 0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    rr(ctx, x + 3, y + h * 0.42, w - 6, h * 0.5, 3);
    ctx.clip();
    ctx.fillStyle = "#e8c23c";
    ctx.fillRect(x, y + h * 0.42, w, h * 0.5);
    ctx.fillStyle = "#2b2f38";
    for (var i = -1; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 16, y + h);
      ctx.lineTo(x + i * 16 + 7, y + h);
      ctx.lineTo(x + i * 16 + 17, y + h * 0.42);
      ctx.lineTo(x + i * 16 + 10, y + h * 0.42);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(x + 5, y + 4, w - 10, 3);

    var pulse = 0.45 + 0.55 * Math.abs(Math.sin(game.time * 3.2 + o.seed));
    ctx.fillStyle = "rgba(255, 90, 90, " + pulse * 0.35 + ")";
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.2, 9 + pulse * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ff5d5d";
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h * 0.2, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawBlock(o) {
    var x = o.x;
    var y = o.y0;
    var w = o.w;
    var h = o.h;

    var grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, "#98a5b5");
    grad.addColorStop(0.4, o.color);
    grad.addColorStop(1, "#5b6674");
    ctx.fillStyle = grad;
    rr(ctx, x, y, w, h, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(30, 38, 50, 0.7)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(x + 5, y + 4, w - 10, 3);

    ctx.strokeStyle = "rgba(40, 50, 64, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + 6);
    ctx.lineTo(x + w * 0.36, y + h * 0.5);
    ctx.lineTo(x + w * 0.28, y + h - 6);
    ctx.moveTo(x + w * 0.62, y + h - 6);
    ctx.lineTo(x + w * 0.68, y + h * 0.55);
    ctx.stroke();

    ctx.fillStyle = "rgba(20, 26, 36, 0.3)";
    ctx.fillRect(x + 6, y + h - 6, w - 12, 3);
  }

  function drawBarrel(o) {
    var x = o.x;
    var y = o.y0;
    var w = o.w;
    var h = o.h;

    var grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, shade(o.color, -0.45));
    grad.addColorStop(0.38, o.color);
    grad.addColorStop(0.62, shade(o.color, 0.12));
    grad.addColorStop(1, shade(o.color, -0.5));
    ctx.fillStyle = grad;
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(12, 30, 24, 0.75)";
    ctx.lineWidth = 3;
    ctx.stroke();

    var rims = [0.18, 0.5, 0.82];
    for (var i = 0; i < rims.length; i++) {
      ctx.fillStyle = "rgba(235, 250, 245, 0.26)";
      ctx.fillRect(x + 2, y + h * rims[i] - 3, w - 4, 4);
      ctx.fillStyle = "rgba(8, 18, 14, 0.3)";
      ctx.fillRect(x + 2, y + h * rims[i] + 1, w - 4, 3);
    }

    var glow = 0.3 + 0.35 * Math.abs(Math.sin(game.time * 2.4 + o.seed));
    ctx.fillStyle = "rgba(120, 255, 190, " + glow + ")";
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h * 0.32);
    ctx.lineTo(x + w / 2 + 8, y + h * 0.56);
    ctx.lineTo(x + w / 2 - 8, y + h * 0.56);
    ctx.closePath();
    ctx.fill();
  }

  function drawCone(o) {
    var x = o.x;
    var y = o.y0;
    var w = o.w;
    var h = o.h;
    var cx = x + w / 2;

    var grad = ctx.createLinearGradient(x, 0, x + w, 0);
    grad.addColorStop(0, shade(o.color, -0.32));
    grad.addColorStop(0.45, o.color);
    grad.addColorStop(1, shade(o.color, -0.42));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - 4, y + 6);
    ctx.lineTo(cx + 4, y + 6);
    ctx.lineTo(x + w - 3, y + h - 11);
    ctx.lineTo(x + 3, y + h - 11);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(120, 50, 10, 0.6)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.moveTo(cx - 9, y + h * 0.42);
    ctx.lineTo(cx + 9, y + h * 0.42);
    ctx.lineTo(cx + 12, y + h * 0.58);
    ctx.lineTo(cx - 12, y + h * 0.58);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#d9762e";
    rr(ctx, x, y + h - 11, w, 11, 3);
    ctx.fill();
    ctx.strokeStyle = "rgba(90, 40, 10, 0.6)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(x + 5, y + h - 10, w - 10, 2);
  }

  function drawCrusher(o) {
    var x = o.x;
    var y = o.y0;
    var w = o.w;
    var h = o.h;
    var cx = x + w / 2;
    var raise = clamp((GROUND_Y - h - y) / o.travel, 0, 1);

    ctx.fillStyle = "rgba(150, 175, 205, 0.2)";
    ctx.fillRect(cx - 3, 0, 6, Math.max(0, y));
    ctx.fillStyle = "rgba(150, 175, 205, 0.09)";
    for (var ry = 8; ry < y; ry += 26) {
      ctx.fillRect(cx - 8, ry, 16, 3);
    }

    ctx.fillStyle = "rgba(0,0,0," + (0.3 - raise * 0.18) + ")";
    ctx.beginPath();
    ctx.ellipse(cx, GROUND_Y + 4, w * 0.55 * (1 - raise * 0.4), 6 * (1 - raise * 0.4), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 150, 80, " + (0.2 + raise * 0.4) + ")";
    for (var m = 0; m < 3; m++) {
      ctx.beginPath();
      ctx.moveTo(cx - 18 + m * 13, GROUND_Y - 9);
      ctx.lineTo(cx - 11 + m * 13, GROUND_Y - 20);
      ctx.lineTo(cx - 4 + m * 13, GROUND_Y - 9);
      ctx.lineTo(cx - 11 + m * 13, GROUND_Y - 1);
      ctx.closePath();
      ctx.fill();
    }

    var grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, "#8b97a8");
    grad.addColorStop(0.45, o.color);
    grad.addColorStop(1, "#39424f");
    ctx.fillStyle = grad;
    rr(ctx, x, y, w, h, 7);
    ctx.fill();
    ctx.strokeStyle = "rgba(18, 24, 33, 0.85)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    rr(ctx, x + 3, y + h * 0.5, w - 6, h * 0.44, 4);
    ctx.clip();
    ctx.fillStyle = "#e8c23c";
    ctx.fillRect(x, y + h * 0.5, w, h * 0.44);
    ctx.fillStyle = "#2b2f38";
    for (var i = -1; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(x + i * 14, y + h);
      ctx.lineTo(x + i * 14 + 7, y + h);
      ctx.lineTo(x + i * 14 + 15, y + h * 0.5);
      ctx.lineTo(x + i * 14 + 8, y + h * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    if (y + h + 9 <= GROUND_Y + 2) {
      ctx.fillStyle = "#20262f";
      for (var s = 0; s < 3; s++) {
        ctx.beginPath();
        ctx.moveTo(x + 8 + s * 14, y + h);
        ctx.lineTo(x + 17 + s * 14, y + h);
        ctx.lineTo(x + 12.5 + s * 14, y + h + 9);
        ctx.closePath();
        ctx.fill();
      }
    }

    ctx.fillStyle = "rgba(255,255,255,0.28)";
    ctx.fillRect(x + 5, y + 4, w - 10, 3);

    var blink = 0.35 + 0.65 * Math.abs(Math.sin(game.time * 6 + o.seed));
    ctx.fillStyle = "rgba(255, 90, 90, " + blink + ")";
    ctx.beginPath();
    ctx.arc(cx, y - 8, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 90, 90, " + blink * 0.35 + ")";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, y - 8, 9, 0, Math.PI * 2);
    ctx.stroke();
  }

  function shade(hex, amount) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255;
    var g = (n >> 8) & 255;
    var b = n & 255;
    var f = function (c) {
      return clamp(Math.round(c + 255 * amount), 0, 255);
    };
    return "rgb(" + f(r) + "," + f(g) + "," + f(b) + ")";
  }

  function drawParticles() {
    for (var i = 0; i < game.particles.length; i++) {
      var p = game.particles[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function drawRobot() {
    var bob = robot.onGround && game.state !== "over" ? Math.sin(game.time * 22) * 1.6 : 0;

    ctx.save();
    if (game.invuln > 0 && Math.floor(game.time * 18) % 2 === 0) {
      ctx.globalAlpha = 0.3;
    }
    ctx.translate(robot.x + ROBOT_W / 2, robot.y + bob);
    ctx.rotate(robot.tilt);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 2, 30, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#232b3a";
    rr(ctx, -28, -21, 56, 21, 10);
    ctx.fill();
    ctx.strokeStyle = "#3d4a5e";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#141a26";
    rr(ctx, -24, -17, 48, 13, 6);
    ctx.fill();

    var wheels = [-15, 0, 15];
    for (var i = 0; i < wheels.length; i++) {
      ctx.save();
      ctx.translate(wheels[i], -10.5);
      ctx.rotate(robot.wheel);
      ctx.fillStyle = "#7f8fa3";
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#c6d3e2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, 0);
      ctx.lineTo(4, 0);
      ctx.moveTo(0, -4);
      ctx.lineTo(0, 4);
      ctx.stroke();
      ctx.restore();
    }

    ctx.save();
    ctx.translate(-24, -34);
    ctx.rotate(Math.sin(game.time * 22) * 0.5 - 0.2);
    ctx.fillStyle = "#93a4b8";
    rr(ctx, -12, -4, 14, 8, 4);
    ctx.fill();
    ctx.restore();

    var bodyGrad = ctx.createLinearGradient(0, -52, 0, -20);
    bodyGrad.addColorStop(0, "#e6edf6");
    bodyGrad.addColorStop(1, "#9aabc0");
    ctx.fillStyle = bodyGrad;
    rr(ctx, -21, -52, 42, 33, 9);
    ctx.fill();
    ctx.strokeStyle = "#5b6b80";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "rgba(70, 224, 192, 0.9)";
    ctx.beginPath();
    ctx.arc(0, -38, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(70, 224, 192, 0.35)";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = "#5b6b80";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-9, -52);
    ctx.lineTo(-13, -66);
    ctx.stroke();
    ctx.fillStyle = robot.blinking > 0 ? "#8fa0b5" : "#ff5d5d";
    ctx.beginPath();
    ctx.arc(-13, -68, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dbe6f2";
    rr(ctx, -14, -63, 28, 17, 7);
    ctx.fill();
    ctx.strokeStyle = "#5b6b80";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#1b2430";
    rr(ctx, -10, -56, 20, 7, 3.5);
    ctx.fill();

    if (robot.blinking <= 0) {
      ctx.fillStyle = "#46e0c0";
      ctx.beginPath();
      ctx.arc(3, -52.5, 2.6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = "#46e0c0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -52.5);
      ctx.lineTo(8, -52.5);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawHud() {
    ctx.textBaseline = "top";

    ctx.textAlign = "left";
    ctx.font = "700 24px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText("PUNKTE", 34, 28);
    ctx.fillStyle = "#eef4fb";
    ctx.fillText(pad(Math.floor(game.score)), 34, 54);

    for (var i = 0; i < START_LIVES; i++) {
      drawLifeIcon(36 + i * 27, 92, i < game.lives);
    }

    ctx.textAlign = "right";
    ctx.font = "700 24px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.fillText("REKORD", VIEW_W - 34, 28);
    ctx.fillStyle = "#46e0c0";
    ctx.fillText(pad(game.highscore), VIEW_W - 34, 54);

    drawFuelGauge(VIEW_W - 34, 98);

    var barW = 300;
    var barX = VIEW_W / 2 - barW / 2;
    var barY = 40;
    var progress = clamp(game.distance / game.levelLength, 0, 1);

    ctx.textAlign = "center";
    ctx.font = "700 15px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillText("LEVEL " + game.level, VIEW_W / 2, 16);

    ctx.fillStyle = "rgba(255,255,255,0.13)";
    rr(ctx, barX, barY, barW, 10, 5);
    ctx.fill();

    var pg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    pg.addColorStop(0, "#46e0c0");
    pg.addColorStop(1, "#ffb45c");
    ctx.fillStyle = pg;
    rr(ctx, barX, barY, Math.max(4, barW * progress), 10, 5);
    ctx.fill();

    var markX = barX + barW - 3;
    ctx.fillStyle = "#f4f8fc";
    rr(ctx, markX, barY - 3, 5, 16, 2);
    ctx.fill();

    ctx.font = "600 12px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText(Math.floor(progress * 100) + "%", VIEW_W / 2, barY + 16);

    drawSoundIcon();

    if (game.noticeTime > 0 && game.state !== "paused") {
      var a = clamp(game.noticeTime / 0.5, 0, 1);
      ctx.globalAlpha = a;
      ctx.font = "700 20px Consolas, 'Courier New', monospace";
      ctx.fillStyle = "#ffd166";
      ctx.textAlign = "center";
      ctx.fillText(game.notice, VIEW_W / 2, 78);
      ctx.globalAlpha = 1;
    }

    ctx.textAlign = "left";

    if (game.state === "paused") {
      panel("PAUSE", "Leertaste oder P zum Weiterspielen");
    }
  }

  function drawSoundIcon() {
    var x = VIEW_W - 74;
    var y = 136;
    var col = audio.enabled ? "#46e0c0" : "#8fa3b8";

    ctx.save();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x + 5, y + 5);
    ctx.lineTo(x + 11, y);
    ctx.lineTo(x + 11, y + 16);
    ctx.lineTo(x + 5, y + 11);
    ctx.lineTo(x, y + 11);
    ctx.closePath();
    ctx.fill();

    if (audio.enabled) {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 12, y + 8, 5, -0.9, 0.9);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#ff7b54";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x + 13, y + 1);
      ctx.lineTo(x + 22, y + 15);
      ctx.moveTo(x + 22, y + 1);
      ctx.lineTo(x + 13, y + 15);
      ctx.stroke();
    }

    ctx.font = "600 11px Consolas, 'Courier New', monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillText("M", VIEW_W - 34, y + 3);
    ctx.textAlign = "left";
    ctx.restore();
  }

  function drawLifeIcon(x, y, active) {
    ctx.save();
    ctx.globalAlpha = active ? 1 : 0.22;

    ctx.strokeStyle = "#5b6b80";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 1);
    ctx.lineTo(x + 4, y - 6);
    ctx.stroke();
    ctx.fillStyle = active ? "#ff5d5d" : "#5b6b80";
    ctx.beginPath();
    ctx.arc(x + 4, y - 7, 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = active ? "#dbe6f2" : "#5b6b80";
    rr(ctx, x, y, 21, 15, 5);
    ctx.fill();
    ctx.strokeStyle = "#5b6b80";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#1b2430";
    rr(ctx, x + 3, y + 4, 15, 6, 3);
    ctx.fill();

    if (active) {
      ctx.fillStyle = "#46e0c0";
      ctx.beginPath();
      ctx.arc(x + 13, y + 7, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#232b3a";
    rr(ctx, x + 2, y + 15, 17, 5, 2.5);
    ctx.fill();
    ctx.restore();
  }

  function drawFuelGauge(rightX, y) {
    var w = 148;
    var h = 13;
    var x = rightX - w;
    var ratio = clamp(game.fuel / FUEL_MAX, 0, 1);
    var low = ratio < FUEL_LOW / FUEL_MAX;

    ctx.textAlign = "right";
    ctx.font = "700 12px Consolas, 'Courier New', monospace";
    ctx.fillStyle = low ? "#ff8a6a" : "rgba(255,255,255,0.45)";
    ctx.fillText("BENZIN " + Math.round(game.fuel) + "%", rightX, y - 15);

    ctx.fillStyle = "rgba(255,255,255,0.13)";
    rr(ctx, x, y, w, h, 6);
    ctx.fill();

    var g = ctx.createLinearGradient(x, 0, x + w, 0);
    if (low) {
      g.addColorStop(0, "#ff5d5d");
      g.addColorStop(1, "#ffa04a");
    } else {
      g.addColorStop(0, "#3fbf9c");
      g.addColorStop(1, "#a6e86a");
    }
    ctx.fillStyle = g;
    rr(ctx, x, y, Math.max(4, w * ratio), h, 6);
    ctx.fill();

    var canX = x - 30;
    ctx.fillStyle = low ? "#ff8a6a" : "#a6e86a";
    rr(ctx, canX, y - 2, 21, 18, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(10,14,22,0.8)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "rgba(10,14,22,0.75)";
    rr(ctx, canX + 6, y - 7, 9, 6, 2);
    ctx.fill();
    ctx.fillRect(canX + 5, y + 4, 11, 3);

    if (low) {
      var pulse = 0.35 + 0.65 * Math.abs(Math.sin(game.time * 5));
      ctx.strokeStyle = "rgba(255, 110, 90, " + pulse + ")";
      ctx.lineWidth = 2.5;
      rr(ctx, x - 2, y - 2, w + 4, h + 4, 8);
      ctx.stroke();
    }
    ctx.textAlign = "left";
  }

  function drawOverlay() {
    if (game.state === "ready") {
      panel("ROBO RUNNER", [
        "Leertaste / Tippen = Springen, in der Luft nochmal = Doppelsprung",
        "Benzin kommt nur aus Kanistern - viele hängen hoch",
        "Hohe Türme schaffst du nur mit Doppelsprung",
        "Lavagräben spucken Tropfen - im richtigen Moment springen",
        "Leben bleiben über die Level, selten gibt es Ersatz",
        "Ton: M = an/aus, -/+ = Lautstärke"
      ], "LEERTASTE ODER KLICK ZUM STARTEN");
    } else if (game.state === "levelclear") {
      panel("LEVEL " + game.level + " GESCHAFFT", [
        "Benzin-Bonus: +" + game.levelBonus + " Punkte",
        "Weiter mit Level " + (game.level + 1) + " - Tank wird voll gefüllt"
      ], "LEERTASTE ODER KLICK = SOFORT WEITER");
    } else if (game.state === "over") {
      var title = game.bestThisRun ? "NEUER REKORD!" : "GAME OVER";
      var reason = game.deathCause === "pit" ? "In einen Graben gefallen"
        : game.deathCause === "lava" ? "Von einem Lavatropfen getroffen"
        : game.deathCause === "fuel" ? "Tank leer gelaufen"
        : "An einem Hindernis zerschellt";
      panel(title, [
        reason + " - Level " + game.level,
        "Punkte: " + Math.floor(game.score) + "   ·   Rekord: " + game.highscore,
        "Leben: " + game.lives + "   ·   Benzin: " + Math.round(game.fuel) + "%"
      ], "LEERTASTE / KLICK = NOCHMAL (R)");
    }
  }

  function panel(title, sub, hint) {
    var lines = sub instanceof Array ? sub : [sub];
    var w = 660;
    var h = 58 + lines.length * 28 + (hint ? 50 : 16);
    var x = VIEW_W / 2 - w / 2;
    var y = VIEW_H / 2 - h / 2 - 16;

    ctx.fillStyle = "rgba(8, 12, 22, 0.84)";
    rr(ctx, x, y, w, h, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(70, 224, 192, 0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = title.indexOf("REKORD") >= 0 ? "#ffd166" : "#eef4fb";
    ctx.font = "800 40px Consolas, 'Courier New', monospace";
    ctx.fillText(title, VIEW_W / 2, y + 42);

    for (var i = 0; i < lines.length; i++) {
      ctx.font = "500 18px Consolas, 'Courier New', monospace";
      ctx.fillStyle = i === 0 ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.5)";
      ctx.fillText(lines[i], VIEW_W / 2, y + 82 + i * 28);
    }

    if (hint) {
      var pulse = 0.45 + 0.55 * Math.abs(Math.sin(game.time * 2.6));
      ctx.fillStyle = "rgba(70, 224, 192, " + pulse + ")";
      ctx.font = "700 18px Consolas, 'Courier New', monospace";
      ctx.fillText(hint, VIEW_W / 2, y + h - 28);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  function pad(n) {
    var s = String(n);
    while (s.length < 6) {
      s = "0" + s;
    }
    return s;
  }

  function onJumpDown() {
    if (game.state === "ready" || game.state === "over") {
      startGame();
      return;
    }
    if (game.state === "levelclear") {
      startLevel(game.level + 1);
      return;
    }
    if (game.state === "paused") {
      game.state = "playing";
      return;
    }
    if (game.state === "playing") {
      game.jumpBuffer = JUMP_BUFFER_TIME;
      game.jumpHeld = true;
    }
  }

  function releaseJump() {
    game.jumpHeld = false;
    if (robot.jumps === 1 && robot.vy < -JUMP_CUT_VELOCITY) {
      robot.vy = -JUMP_CUT_VELOCITY;
    }
  }

  window.addEventListener("keydown", function (e) {
    if (e.repeat) {
      return;
    }
    audioInit();
    var code = e.code;
    if (code === "KeyM") {
      e.preventDefault();
      audioToggle();
      return;
    }
    if (code === "Minus" || code === "NumpadSubtract") {
      e.preventDefault();
      audioVolumeStep(-1);
      return;
    }
    if (code === "Equal" || code === "NumpadAdd") {
      e.preventDefault();
      audioVolumeStep(1);
      return;
    }
    if (code === "Space" || code === "ArrowUp" || code === "KeyW") {
      e.preventDefault();
      onJumpDown();
      return;
    }
    if (code === "KeyP" || code === "Escape") {
      e.preventDefault();
      if (game.state === "playing") {
        game.state = "paused";
      } else if (game.state === "paused") {
        game.state = "playing";
      }
      return;
    }
    if (code === "KeyR") {
      e.preventDefault();
      startGame();
    }
  });

  window.addEventListener("keyup", function (e) {
    var code = e.code;
    if (code === "Space" || code === "ArrowUp" || code === "KeyW") {
      releaseJump();
    }
  });

  window.addEventListener("pointerdown", function (e) {
    e.preventDefault();
    audioInit();
    onJumpDown();
  });

  window.addEventListener("pointerup", function () {
    releaseJump();
  });

  window.addEventListener("blur", function () {
    if (game.state === "playing") {
      game.state = "paused";
      game.jumpHeld = false;
    }
    if (audio.ctx && audio.ctx.state === "running") {
      audio.ctx.suspend();
    }
  });

  window.addEventListener("focus", function () {
    audioInit();
  });

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = window.innerWidth;
    var ch = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(cw * dpr));
    canvas.height = Math.max(1, Math.floor(ch * dpr));
    canvas.style.width = cw + "px";
    canvas.style.height = ch + "px";

    var scale = Math.min(cw / VIEW_W, ch / VIEW_H) * dpr;
    viewScale = scale;
    viewOffsetX = (cw * dpr - VIEW_W * scale) / 2;
    viewOffsetY = (ch * dpr - VIEW_H * scale) / 2;
  }

  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", resize);

  var last = 0;
  function frame(now) {
    if (!last) {
      last = now;
    }
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.05) {
      dt = 0.05;
    }
    update(dt);
    render();
    window.requestAnimationFrame(frame);
  }

  resize();
  window.requestAnimationFrame(frame);
})();
