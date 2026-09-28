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
  var MAX_SPEED = 820;
  var SPEED_RAMP = 0.008;
  var SPEED_PER_LEVEL = 40;
  var TOUCH_SPEED_FACTOR = 0.85;

  var START_LIVES = 3;
  var FUEL_MAX = 100;
  var FUEL_PER_PIXEL = 100 / 5600;
  var FUEL_PER_CAN = 25;
  var FUEL_LOW = 25;
  var RESPAWN_FUEL = 45;
  var INVULN_TIME = 1.5;
  var CAN_W = 26;
  var CAN_H = 30;
  var CAN_KINDS = ["mid", "ground", "high"];
  var SPAWN_STOP_MARGIN = 900;

  var HIGHSCORE_KEY = "roborunner.highscore";
  var SOUND_KEY = "roborunner.sound";
  var VOLUME_KEY = "roborunner.volume";
  var MUSIC_KEY = "roborunner.music";
  var VOLUME_STEP = 0.1;
  var WARN_FUEL = 12;

  var touchMode = ("ontouchstart" in window)
    || (typeof navigator !== "undefined" && navigator.maxTouchPoints > 0);
  var FIRE_BTN = { x: VIEW_W - 76, y: VIEW_H - 68, r: 40 };
  var PAUSE_BTN = { x: 52, y: VIEW_H - 48 };
  var fullscreenTried = false;

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
  var LAVA_CHANCE = 0.3;
  var TRIPLE_JUMP_VELOCITY = 560;
  var SHOP_LOCK_TIME = 0.9;
  var BULLET_SPEED = 230;
  var SHOT_SPEED = 900;
  var SHOT_COOLDOWN = 0.26;
  var SHOT_SCORE = 25;

  var BIOMES = [
    {
      name: "DAEMMERUNG",
      sky: ["#141d3d", "#33406f", "#8c5a76", "#d98a5a"],
      stars: { count: 26, alpha: 0.55, tilt: 0.1 },
      orb: {
        x: 700, y: 300, r: 48,
        lit: "#fff3d2", base: "#ff9a4a", dark: "#4e2a55",
        glow: ["rgba(255,216,150,0.95)", "rgba(255,140,110,0.35)", "rgba(255,120,90,0)"],
        bands: ["rgba(255,238,186,0.34)", "rgba(168,86,150,0.3)", "rgba(255,172,112,0.24)"],
        ring: null
      },
      layers: [
        { kind: "hill", baseY: 380, amp: 150, color: "#3a2f5c", period: 900, speed: 0.08 },
        { kind: "hill", baseY: 412, amp: 96, color: "#2b2447", period: 620, speed: 0.16 }
      ],
      ground: { fill: "#1c1a2d", edge: "#ffb45c", dash: "rgba(180,160,215,0.32)" },
      ambient: null
    },
    {
      name: "WUESTE",
      sky: ["#2b1f45", "#7d4a5e", "#d9844a", "#f2cd84"],
      stars: { count: 12, alpha: 0.3, tilt: 0.08 },
      orb: {
        x: 250, y: 210, r: 62,
        lit: "#fff8dd", base: "#ffc46a", dark: "#6d3f26",
        glow: ["rgba(255,242,200,0.9)", "rgba(230,164,96,0.32)", "rgba(255,150,70,0)"],
        bands: ["rgba(255,244,206,0.4)", "rgba(206,132,74,0.32)", "rgba(255,222,164,0.26)"],
        ring: { tilt: 0.34, w: 1, color: "rgba(255,238,196,0.6)", color2: "rgba(228,166,104,0.34)" }
      },
      layers: [
        { kind: "dune", baseY: 392, amp: 92, color: "#6b4630", period: 1200, speed: 0.07 },
        { kind: "dune", baseY: 420, amp: 62, color: "#4a3021", period: 820, speed: 0.14 }
      ],
      ground: { fill: "#31251a", edge: "#ffcf7a", dash: "rgba(220,185,135,0.35)" },
      ambient: null
    },
    {
      name: "NACHTSTADT",
      sky: ["#04060d", "#0a1124", "#152146", "#283a63"],
      stars: { count: 64, alpha: 0.85, tilt: 0.12 },
      orb: {
        x: 770, y: 132, r: 40,
        lit: "#eaf6ff", base: "#4f7fd0", dark: "#0e1836",
        glow: ["rgba(206,230,255,0.8)", "rgba(120,170,255,0.28)", "rgba(120,160,255,0)"],
        bands: ["rgba(196,224,255,0.3)", "rgba(96,184,220,0.28)", "rgba(146,124,224,0.26)"],
        ring: null
      },
      layers: [
        { kind: "city", baseY: 400, amp: 120, color: "#131b30", period: 260, speed: 0.09 },
        { kind: "city", baseY: 428, amp: 88, color: "#0b1120", period: 210, speed: 0.18 }
      ],
      ground: { fill: "#111a30", edge: "#8fc0ff", dash: "rgba(150,180,230,0.32)" },
      ambient: null
    },
    {
      name: "EISFELD",
      sky: ["#0c2237", "#215173", "#6aa3c6", "#cfeaf7"],
      stars: { count: 22, alpha: 0.45, tilt: 0.1 },
      orb: {
        x: 180, y: 152, r: 44,
        lit: "#ffffff", base: "#9fd8f0", dark: "#2c5a7c",
        glow: ["rgba(232,250,255,0.85)", "rgba(178,216,246,0.3)", "rgba(150,200,255,0)"],
        bands: ["rgba(232,250,255,0.42)", "rgba(146,208,238,0.32)", "rgba(200,236,255,0.28)"],
        ring: { tilt: 0.5, w: 0.8, color: "rgba(236,252,255,0.5)", color2: "rgba(160,212,242,0.3)" }
      },
      layers: [
        { kind: "peak", baseY: 386, amp: 168, color: "#5b7f9c", period: 460, speed: 0.08 },
        { kind: "peak", baseY: 416, amp: 112, color: "#3d5f7c", period: 330, speed: 0.17 }
      ],
      ground: { fill: "#182635", edge: "#cdefff", dash: "rgba(205,235,250,0.4)" },
      ambient: "snow"
    },
    {
      name: "VULKAN",
      sky: ["#080409", "#26090f", "#5e1a12", "#ab3a18"],
      stars: { count: 30, alpha: 0.6, tilt: 0.1 },
      orb: {
        x: 520, y: 330, r: 58,
        lit: "#ffe0a8", base: "#e84a20", dark: "#380c0a",
        glow: ["rgba(255,166,84,0.9)", "rgba(255,84,36,0.32)", "rgba(200,50,20,0)"],
        bands: ["rgba(255,186,96,0.36)", "rgba(118,18,14,0.42)", "rgba(255,124,52,0.26)"],
        ring: null
      },
      layers: [
        { kind: "volcano", baseY: 392, amp: 160, color: "#2a1418", period: 700, speed: 0.07 },
        { kind: "peak", baseY: 420, amp: 104, color: "#180c10", period: 300, speed: 0.16 }
      ],
      ground: { fill: "#201215", edge: "#ff7b30", dash: "rgba(215,145,115,0.35)" },
      ambient: "embers"
    }
  ];

  var MUSIC_TRACKS = [
    {
      bpm: 104,
      root: 45,
      scale: [0, 3, 5, 7, 10],
      prog: [0, 0, -4, 3],
      bassWave: "triangle",
      leadWave: "triangle",
      bassGain: 0.12,
      leadGain: 0.05,
      kick: "1000000010000000",
      snare: "0000100000001000",
      hat: "0010001000100010",
      melody: [0, -1, 4, -1, 2, -1, 3, -1, 0, -1, 4, 2, 3, -1, 1, -1]
    },
    {
      bpm: 112,
      root: 50,
      scale: [0, 1, 4, 5, 7, 8, 10],
      prog: [0, 0, 5, 3],
      bassWave: "square",
      leadWave: "triangle",
      bassGain: 0.1,
      leadGain: 0.05,
      kick: "1000000010010000",
      snare: "0000100000001000",
      hat: "0010001000100010",
      melody: [0, 2, 4, 5, 4, 2, 4, 6, 5, -1, 4, 2, 1, 2, 4, -1]
    },
    {
      bpm: 124,
      root: 42,
      scale: [0, 3, 5, 7, 10],
      prog: [0, 8, 3, 5],
      bassWave: "sawtooth",
      leadWave: "square",
      bassGain: 0.1,
      leadGain: 0.045,
      kick: "1000001010000010",
      snare: "0000100000001000",
      hat: "0010101000101011",
      melody: [0, 4, 7, 4, 2, 4, 7, 9, 0, 4, 7, 4, 5, 4, 2, 1]
    },
    {
      bpm: 100,
      root: 48,
      scale: [0, 2, 3, 5, 7, 10],
      prog: [0, -2, -4, -5],
      bassWave: "sine",
      leadWave: "sine",
      bassGain: 0.13,
      leadGain: 0.055,
      kick: "1000000000100000",
      snare: "0000000000001000",
      hat: "0001000100010001",
      melody: [0, -1, 5, -1, 3, -1, 5, -1, 4, -1, 3, -1, 2, -1, 0, -1]
    },
    {
      bpm: 134,
      root: 40,
      scale: [0, 3, 5, 6, 7, 10],
      prog: [0, 0, 1, 3],
      bassWave: "sawtooth",
      leadWave: "sawtooth",
      bassGain: 0.11,
      leadGain: 0.04,
      kick: "1000100010001000",
      snare: "0000100000001000",
      hat: "1011101110111011",
      melody: [0, 4, 2, 4, 5, 4, 2, 0, 0, 4, 2, 4, 6, 5, 4, 2]
    }
  ];

  var ENEMY_TYPES = [
    { id: "crawler", w: 46, h: 38, weight: 42 },
    { id: "drone", w: 42, h: 28, weight: 34 },
    { id: "turret", w: 46, h: 52, weight: 24 }
  ];

  var SCRAP_TYPES = [
    { id: "bolt", name: "Schraube", value: 1, color: "#b9c4d2", w: 16, h: 16, weight: 34, tier: 0 },
    { id: "spring", name: "Feder", value: 2, color: "#c9a86a", w: 20, h: 16, weight: 24, tier: 0 },
    { id: "gear", name: "Zahnrad", value: 3, color: "#9fb0c4", w: 22, h: 22, weight: 18, tier: 1 },
    { id: "pipe", name: "Rohr", value: 4, color: "#8fa3b8", w: 24, h: 22, weight: 14, tier: 1 },
    { id: "plate", name: "Blech", value: 6, color: "#a8b6c6", w: 24, h: 18, weight: 7, tier: 2 },
    { id: "chip", name: "Platine", value: 9, color: "#5fbf7f", w: 24, h: 20, weight: 3, tier: 2 }
  ];

  var SCRAP_TIER_GLOW = [
    { r: 18, alpha: 0.2, ring: false },
    { r: 23, alpha: 0.3, ring: false },
    { r: 29, alpha: 0.4, ring: true }
  ];

  var SHOP_ITEMS = [
    { id: "life", label: "Ersatz-Leben", cost: 30, hint: "+1 Roboter (max 3)" },
    { id: "tank", label: "Tank-Erweiterung", cost: 20, hint: "+25% Tankvolumen" },
    { id: "shield", label: "Schutzschild", cost: 12, hint: "faengt den naechsten Treffer" },
    { id: "jump", label: "Zusatz-Sprung", cost: 45, hint: "3. Sprung in der Luft" }
  ];

  var TYPES = [
    { id: "crate", w: 46, h: 46, color: "#b0763c" },
    { id: "crate", w: 46, h: 46, color: "#a56c34" },
    { id: "pylon", w: 36, h: 68, color: "#d9b13b" },
    { id: "block", w: 76, h: 36, color: "#7d8b9c" },
    { id: "barrel", w: 42, h: 56, color: "#4f8a72" },
    { id: "cone", w: 40, h: 46, color: "#f08a3c" }
  ];

  var game = {
    state: "menu",
    time: 0,
    speed: START_SPEED,
    scroll: 0,
    level: 1,
    levelLength: 5200,
    levelBaseSpeed: START_SPEED,
    levelBonus: 0,
    distance: 0,
    score: 0,
    highscore: readHighscore(),
    lives: START_LIVES,
    fuel: FUEL_MAX,
    invuln: 0,
    notice: "",
    noticeTime: 0,
    portalX: VIEW_W,
    spawnTime: 0.9,
    canAt: 180,
    canCount: 0,
    dead: false,
    deadTimer: 0,
    blasts: [],
    scrap: 0,
    scrapAt: 300,
    canCount: 0,
    scrapCombo: 1,
    scrapComboTimer: 0,
    scrapItems: [],
    fireHeld: false,
    uiButtons: [],
    settingsRow: 0,
    fuelMax: FUEL_MAX,
    shield: 0,
    maxJumps: 2,
    shopLock: 0,
    shopMessage: "",
    shopMessageTime: 0,
    shopRows: [],
    enemies: [],
    bullets: [],
    shots: [],
    shotCooldown: 0,
    muzzle: 0,
    enemyTime: 1.6,
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
    destroyed: false,
    hidden: false,
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
      audioKeepMusic();
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

  function audioKeepMusic() {
    musicApplyVolume();
    if (audio.enabled && !music.playing && game.state !== "over") {
      musicStart();
    }
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

    function noiseType(dur, peak, cutoff, type, delay) {
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
      filter.type = type || "lowpass";
      filter.frequency.value = cutoff || 1200;
      var gain = c.createGain();
      gain.gain.value = peak;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(audio.master);
      src.start(c.currentTime + (delay || 0));
    }

    function noise(dur, peak, cutoff) {
      noiseType(dur, peak, cutoff, "lowpass");
    }

  function audioToggle() {
    audio.enabled = !audio.enabled;
    writeSound(audio.enabled);
    audioKeepMusic();
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
      var p = 1 + (Math.random() - 0.5) * 0.06;
      tone({ freq: 185 * p, freqEnd: 300 * p, duration: 0.17, type: "sine", gain: 0.1, attack: 0.022 });
      tone({ freq: 92 * p, freqEnd: 150 * p, duration: 0.19, type: "triangle", gain: 0.06, attack: 0.022 });
      noiseType(0.09, 0.045, 900, "lowpass");
    }

    function sfxDoubleJump() {
      var p = 1 + (Math.random() - 0.5) * 0.06;
      tone({ freq: 250 * p, freqEnd: 410 * p, duration: 0.15, type: "sine", gain: 0.09, attack: 0.018 });
      tone({ freq: 125 * p, freqEnd: 205 * p, duration: 0.16, type: "triangle", gain: 0.055, attack: 0.018 });
      noiseType(0.11, 0.05, 1400, "bandpass");
    }

  function sfxPickup() {
    audio.combo = Math.min(audio.combo + 1, 9);
    audio.comboTimer = 1.4;
    var f = 760 + audio.combo * 55;
    tone({ freq: f, freqEnd: f * 1.5, duration: 0.11, type: "triangle", gain: 0.16 });
    tone({ freq: f * 2, duration: 0.05, type: "sine", gain: 0.07, delay: 0.02 });
  }

    function sfxPlayerShot() {
      var p = 1 + (Math.random() - 0.5) * 0.05;
      tone({ freq: 720 * p, freqEnd: 190 * p, duration: 0.12, type: "triangle", gain: 0.062, attack: 0.006 });
      tone({ freq: 360 * p, freqEnd: 115 * p, duration: 0.14, type: "sine", gain: 0.045, attack: 0.006 });
      noiseType(0.045, 0.035, 2600, "highpass");
    }

    function sfxEnemyDown() {
      var p = 1 + (Math.random() - 0.5) * 0.06;

      noiseType(0.09, 0.2, 2600, "highpass");
      tone({ freq: 150 * p, freqEnd: 58 * p, duration: 0.22, type: "sine", gain: 0.19, attack: 0.004 });

      tone({ freq: 520 * p, freqEnd: 96 * p, duration: 0.34, type: "triangle", gain: 0.11, attack: 0.005 });
      tone({ freq: 260 * p, freqEnd: 70 * p, duration: 0.3, type: "sine", gain: 0.07, delay: 0.03 });

      tone({ freq: 1450 * p, duration: 0.05, type: "triangle", gain: 0.05, delay: 0.02 });
      tone({ freq: 2050 * p, duration: 0.06, type: "triangle", gain: 0.045, delay: 0.09 });
      noiseType(0.28, 0.08, 1800, "bandpass", 0.06);

      tone({ freq: 1046, duration: 0.13, type: "triangle", gain: 0.055, delay: 0.13 });
    }

  function sfxShot() {
    tone({ freq: 900, freqEnd: 260, duration: 0.12, type: "square", gain: 0.1 });
    noise(0.1, 0.18, 2400);
  }

    function sfxExplosion() {
      var p = 1 + (Math.random() - 0.5) * 0.05;
      tone({ freq: 98 * p, freqEnd: 34 * p, duration: 0.42, type: "sine", gain: 0.22, attack: 0.005 });
      tone({ freq: 58 * p, freqEnd: 27 * p, duration: 0.62, type: "sine", gain: 0.16, attack: 0.01, delay: 0.05 });
      noiseType(0.3, 0.24, 1500, "lowpass");
      tone({ freq: 420 * p, freqEnd: 165 * p, duration: 0.15, type: "triangle", gain: 0.06, delay: 0.03 });
      noiseType(0.55, 0.1, 700, "lowpass", 0.14);
    }

  var music = {
    playing: false,
    gain: null,
    noise: null,
    timer: null,
    track: 0,
    step: 0,
    bar: 0,
    nextTime: 0,
    stepDur: 0.144,
    volume: readMusicVolume()
  };

  function readMusicVolume() {
    try {
      var raw = parseFloat(window.localStorage.getItem(MUSIC_KEY));
      return isFinite(raw) && raw >= 0 && raw <= 1 ? raw : 0.5;
    } catch (e) {
      return 0.5;
    }
  }

  function writeMusicVolume(value) {
    try {
      window.localStorage.setItem(MUSIC_KEY, String(value));
    } catch (e) {
      /* storage nicht verfuegbar */
    }
  }

  function musicVolumeStep(dir) {
    music.volume = clamp(music.volume + dir * 0.1, 0, 1);
    writeMusicVolume(music.volume);
    musicApplyVolume();
    game.notice = "MUSIK " + Math.round(music.volume * 100) + "%";
    game.noticeTime = 1.2;
    tone({ freq: 660, duration: 0.06, type: "triangle", gain: 0.1 });
  }

  function musicNoteFreq(semitone) {
    return 440 * Math.pow(2, (semitone - 69) / 12);
  }

  function musicTrack() {
    return MUSIC_TRACKS[music.track % MUSIC_TRACKS.length];
  }

  function musicVoice(wave, freq, at, dur, peak) {
    var c = audio.ctx;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(freq, at);
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), at + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(gain);
    gain.connect(music.gain);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  function musicNoise(at, dur, peak, cutoff, type) {
    var c = audio.ctx;
    if (!music.noise) {
      var len = Math.floor(c.sampleRate * 0.3);
      var buffer = c.createBuffer(1, len, c.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < len; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      music.noise = buffer;
    }
    var src = c.createBufferSource();
    src.buffer = music.noise;
    var filter = c.createBiquadFilter();
    filter.type = type || "highpass";
    filter.frequency.value = cutoff || 6000;
    var gain = c.createGain();
    gain.gain.setValueAtTime(Math.max(0.0002, peak), at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(music.gain);
    src.start(at);
    src.stop(at + dur + 0.02);
  }

  function musicKick(at, peak) {
    var c = audio.ctx;
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, at);
    osc.frequency.exponentialRampToValueAtTime(46, at + 0.13);
    gain.gain.setValueAtTime(Math.max(0.0002, peak), at);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.2);
    osc.connect(gain);
    gain.connect(music.gain);
    osc.start(at);
    osc.stop(at + 0.22);
  }

  function musicScheduleStep(step, at) {
    var track = musicTrack();
    var chord = track.prog[music.bar % track.prog.length];

    if (step % 4 === 0 || step % 8 === 6) {
      var bassNote = track.root + chord + (step % 8 === 6 ? 7 : 0);
      musicVoice(track.bassWave, musicNoteFreq(bassNote), at, 0.28, track.bassGain);
    }

    var leadIdx = track.melody[step % track.melody.length];
    if (leadIdx >= 0) {
      var deg = track.scale[leadIdx % track.scale.length];
      musicVoice(track.leadWave, musicNoteFreq(track.root + 24 + chord + deg), at, 0.16, track.leadGain);
    }

    if (track.kick.charAt(step % 16) === "1") {
      musicKick(at, 0.16);
    }
    if (track.snare.charAt(step % 16) === "1") {
      musicNoise(at, 0.16, 0.09, 1800, "bandpass");
    }
    if (track.hat.charAt(step % 16) === "1") {
      musicNoise(at, 0.045, 0.04, 8000, "highpass");
    }
  }

  function musicTick() {
    if (!audio.ctx || !music.gain) {
      return;
    }
    var c = audio.ctx;
    if (music.nextTime < c.currentTime) {
      music.nextTime = c.currentTime + 0.05;
    }
    while (music.nextTime < c.currentTime + 0.25) {
      musicScheduleStep(music.step, music.nextTime);
      music.nextTime += music.stepDur;
      music.step += 1;
      if (music.step >= 16) {
        music.step = 0;
        music.bar += 1;
      }
    }
  }

  function musicApplyVolume() {
    if (!music.gain || !audio.ctx) {
      return;
    }
    music.gain.gain.value = audio.enabled ? music.volume : 0;
  }

  function musicStart() {
    if (music.playing || !audio.ctx || !audio.master) {
      return;
    }
    if (typeof setInterval !== "function") {
      return;
    }
    try {
      music.gain = audio.ctx.createGain();
      music.gain.gain.value = audio.enabled ? music.volume : 0;
      music.gain.connect(audio.master);
      music.playing = true;
      music.nextTime = audio.ctx.currentTime + 0.1;
      music.timer = setInterval(musicTick, 40);
      musicTick();
    } catch (e) {
      music.playing = false;
      music.gain = null;
    }
  }

  function musicStop() {
    if (music.timer && typeof clearInterval === "function") {
      clearInterval(music.timer);
    }
    music.timer = null;
    music.playing = false;
    if (music.gain) {
      try {
        music.gain.disconnect();
      } catch (e) {
        /* egal */
      }
    }
    music.gain = null;
    music.step = 0;
    music.bar = 0;
  }

  function musicSetLevel(level) {
    music.track = (level - 1) % MUSIC_TRACKS.length;
    music.stepDur = 60 / musicTrack().bpm / 4;
    if (!music.playing) {
      musicStart();
    }
  }

  function sfxScrap(value) {
    var f = 620 + Math.min(value, 6) * 110;
    tone({ freq: f, freqEnd: f * 1.35, duration: 0.08, type: "square", gain: 0.08 });
  }

  function sfxBuy() {
    tone({ freq: 740, duration: 0.1, type: "triangle", gain: 0.16 });
    tone({ freq: 1108, duration: 0.16, type: "triangle", gain: 0.16, delay: 0.09 });
  }

  function sfxDenied() {
    tone({ freq: 220, freqEnd: 150, duration: 0.18, type: "square", gain: 0.12 });
  }

  function sfxShield() {
    tone({ freq: 1400, freqEnd: 520, duration: 0.26, type: "sine", gain: 0.16 });
    noise(0.2, 0.2, 1800);
  }

    function sfxLava() {
      var p = 1 + (Math.random() - 0.5) * 0.05;
      tone({ freq: 128 * p, freqEnd: 44 * p, duration: 0.5, type: "triangle", gain: 0.15, attack: 0.008 });
      noiseType(0.4, 0.26, 900, "lowpass");
      noiseType(0.55, 0.09, 2200, "highpass", 0.1);
    }

    function sfxPit() {
      var p = 1 + (Math.random() - 0.5) * 0.05;
      tone({ freq: 520 * p, freqEnd: 68 * p, duration: 0.65, type: "triangle", gain: 0.13, attack: 0.012 });
      tone({ freq: 250 * p, freqEnd: 40 * p, duration: 0.72, type: "sine", gain: 0.09, attack: 0.02, delay: 0.06 });
      noiseType(0.5, 0.14, 1200, "lowpass");
    }

    function sfxFuelEmpty() {
      var p = 1 + (Math.random() - 0.5) * 0.06;
      tone({ freq: 215 * p, freqEnd: 152 * p, duration: 0.2, type: "triangle", gain: 0.1, attack: 0.015 });
      tone({ freq: 182 * p, freqEnd: 108 * p, duration: 0.28, type: "triangle", gain: 0.1, attack: 0.02, delay: 0.26 });
      noiseType(0.14, 0.04, 700, "lowpass", 0.22);
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

  function sfxPortal() {
    tone({ freq: 420, freqEnd: 1500, duration: 0.35, type: "sine", gain: 0.16 });
    tone({ freq: 1200, freqEnd: 400, duration: 0.3, type: "triangle", gain: 0.12, delay: 0.12 });
    noise(0.4, 0.22, 3200);
  }

  function sfxLevelClear() {
    var notes = [523, 659, 784, 1046];
    for (var i = 0; i < notes.length; i++) {
      tone({ freq: notes[i], duration: 0.22, type: "triangle", gain: 0.16, delay: i * 0.1 });
    }
    noise(0.16, 0.12, 3200);
  }

    function sfxGameOver() {
      var notes = [392, 330, 262, 196];
      for (var i = 0; i < notes.length; i++) {
        tone({ freq: notes[i], duration: 0.36, type: "triangle", gain: 0.13, attack: 0.02, delay: i * 0.19 });
        tone({ freq: notes[i] / 2, duration: 0.4, type: "sine", gain: 0.06, attack: 0.02, delay: i * 0.19 });
      }
      tone({ freq: 98, freqEnd: 62, duration: 1.2, type: "sine", gain: 0.11, attack: 0.04, delay: 0.64 });
      noiseType(0.6, 0.07, 520, "lowpass", 0.62);
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

  function spawnGap() {
    return Math.max(0.85, 2.2 * Math.pow(0.82, game.level - 1));
  }

  function enemyGap() {
    return Math.max(1.15, 2.6 * Math.pow(0.85, game.level - 1));
  }

  function pitChance() {
    return clamp(0.22 + (game.level - 1) * 0.05, 0, 0.45);
  }

  function pitWidth() {
    var factor = 0.2 + Math.min(0.24, (game.level - 1) * 0.06) + rand(0, 0.05);
    return clamp(game.speed * factor, 92, 358);
  }

  function levelUnlocks() {
    return game.level >= 2;
  }

  function speedFactor() {
    return touchMode ? TOUCH_SPEED_FACTOR : 1;
  }

  function resetRobot() {
    robot.x = ROBOT_X;
    robot.y = GROUND_Y;
    robot.vy = 0;
    robot.onGround = true;
    robot.destroyed = false;
    robot.hidden = false;
    robot.jumps = 0;
    robot.tilt = 0;
  }

  function explodeRobot(x, y, cause) {
    var scale = cause === "pit" ? 0.6 : cause === "lava" ? 1.15 : 1;
    var i;

    game.blasts.push({ x: x, y: y, life: 0.3, max: 0.3, r0: 8, r1: 60 * scale, color: "#fff6c8", ring: false });
    game.blasts.push({ x: x, y: y, life: 0.6, max: 0.6, r0: 14, r1: 122 * scale, color: "#ff9a3c", ring: false });
    game.blasts.push({ x: x, y: y, life: 0.44, max: 0.44, r0: 16, r1: 196 * scale, color: "#ffd166", ring: true });

    var debrisColors = ["#e6edf6", "#9aabc0", "#5b6b80", "#232b3a", "#7f8fa3", "#ff5d5d", "#46e0c0"];
    var debris = Math.round(15 * scale);
    for (i = 0; i < debris; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = rand(130, 540) * scale;
      game.particles.push({
        x: x,
        y: y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - rand(60, 280),
        life: rand(0.7, 1.5),
        max: 1.5,
        size: rand(4, 10),
        color: debrisColors[(Math.random() * debrisColors.length) | 0],
        grav: 1500,
        shape: "debris",
        angle: Math.random() * Math.PI * 2,
        spin: rand(-15, 15)
      });
    }

    var smoke = Math.round(11 * scale);
    for (i = 0; i < smoke; i++) {
      game.particles.push({
        x: x + rand(-16, 16),
        y: y + rand(-16, 16),
        vx: rand(-70, 70),
        vy: rand(-140, -30),
        life: rand(0.8, 1.6),
        max: 1.6,
        size: rand(9, 18),
        color: "rgba(74, 82, 96, 0.55)",
        grav: -240,
        grow: 30,
        shape: "smoke"
      });
    }

    var sparks = Math.round(28 * scale);
    for (i = 0; i < sparks; i++) {
      var sa = Math.random() * Math.PI * 2;
      var ss = rand(220, 760) * scale;
      game.particles.push({
        x: x,
        y: y,
        vx: Math.cos(sa) * ss,
        vy: Math.sin(sa) * ss - 90,
        life: rand(0.18, 0.55),
        max: 0.55,
        size: rand(2, 4.5),
        color: "#ffe9a8",
        grav: 900,
        shape: "square"
      });
    }
  }

  function finishDeath() {
    game.dead = false;

    if (game.lives <= 0) {
      game.state = "over";
      musicStop();
      sfxGameOver();
      saveHighscore();
      return;
    }

    game.fuel = Math.max(game.fuel, RESPAWN_FUEL);
    game.invuln = INVULN_TIME;
    game.jumpBuffer = 0;
    resetRobot();
    clearAhead();
  }

  function startLevel(n) {
    game.level = n;
    game.levelLength = 12600 + (n - 1) * 3600;
    game.levelBaseSpeed = Math.min(MAX_SPEED - 160, START_SPEED + (n - 1) * SPEED_PER_LEVEL);
    game.speed = game.levelBaseSpeed * speedFactor();
    game.distance = 0;
    game.fuel = game.fuelMax;
    game.invuln = INVULN_TIME;
    game.shopLock = SHOP_LOCK_TIME;
    game.shopMessage = "";
    game.shopMessageTime = 0;
    game.scrapAt = 300;
    game.scrapItems.length = 0;
    game.scrapCombo = 1;
    game.scrapComboTimer = 0;
    game.enemies.length = 0;
    game.bullets.length = 0;
    game.shots.length = 0;
    game.shotCooldown = 0;
    game.muzzle = 0;
    game.fireHeld = false;
    game.enemyTime = rand(2.2, 3.2);
    game.spawnTime = 2.4;
    game.canAt = 180;
    game.canCount = 0;
    game.levelBonus = 0;
    game.obstacles.length = 0;
    game.pits.length = 0;
    game.cans.length = 0;
    game.spares.length = 0;
    game.labels.length = 0;
    game.particles.length = 0;
    game.blasts.length = 0;
    game.dead = false;
    game.deadTimer = 0;
    game.spareSpawned = false;
    game.spareAt = game.lives < START_LIVES && Math.random() < SPARE_CHANCE
      ? game.levelLength * rand(0.35, 0.75)
      : -1;
    game.notice = "LEVEL " + n;
    game.noticeTime = 1.6;
    game.portalX = robot.x + game.levelLength;
    game.lowFuelWarned = false;
    game.warnTimer = 0;
    audio.combo = 0;
    musicSetLevel(n);

    resetRobot();
    game.state = "playing";
  }

  function startGame() {
    game.time = 0;
    game.scroll = 0;
    game.score = 0;
    game.lives = START_LIVES;
    game.dead = false;
    game.deadTimer = 0;
    game.blasts.length = 0;
    game.scrap = 0;
    game.fuelMax = FUEL_MAX;
    game.shield = 0;
    game.maxJumps = 2;
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
    game.state = "shop";
    game.shopLock = SHOP_LOCK_TIME;
    game.shopMessage = "SCHROTT: " + game.scrap;
    game.shopMessageTime = 2;
    game.flash = 0.45;
    game.jumpHeld = false;
    resetRobot();

    var px = game.portalX + 42;
    var py = GROUND_Y - 108;
    game.blasts.push({ x: px, y: py, life: 0.45, max: 0.45, r0: 18, r1: 150, color: "#ffffff", ring: false });
    game.blasts.push({ x: px, y: py, life: 0.6, max: 0.6, r0: 26, r1: 240, color: "#7fe6ff", ring: true });
    game.blasts.push({ x: px, y: py, life: 0.35, max: 0.35, r0: 10, r1: 90, color: "#46e0c0", ring: false });
    robot.hidden = true;
    sfxPortal();
    sfxLevelClear();
    burst(px, py, 30, ["#ffd166", "#46e0c0", "#9fe8ff"]);
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

  function useShield(cause) {
    game.shield = 0;
    game.invuln = INVULN_TIME;
    game.shake = 10;
    game.flash = 0.25;
    game.notice = "SCHILD ZERSTOERT";
    game.noticeTime = 1.5;
    burst(robot.x + ROBOT_W / 2, robot.y - ROBOT_H / 2, 20, ["#7fe6ff", "#46e0c0", "#e8ecf1"]);
    sfxShield();

    if (cause === "pit" || robot.y > GROUND_Y + 40) {
      game.jumpBuffer = 0;
      resetRobot();
      clearAhead();
    }
  }

  function loseLife(cause) {
    game.lives -= 1;
    game.deathCause = cause;
    robot.onGround = false;
    robot.vy = 0;

    var cx = robot.x + ROBOT_W / 2;
    var cy = robot.y - ROBOT_H / 2;

    if (cause === "fuel") {
      game.shake = 12;
      game.flash = 0.3;
      robot.destroyed = false;
      burst(cx, cy, 14, ["#8fa3b8", "#e8ecf1"]);
      sfxFuelEmpty();
    } else {
      game.shake = 22;
      game.flash = 0.62;
      robot.destroyed = true;
      explodeRobot(cx, cy, cause);
      if (cause === "pit") {
        sfxPit();
      } else if (cause === "lava") {
        sfxLava();
      } else {
        sfxExplosion();
      }
    }

    if (game.lives <= 0) {
      game.lives = 0;
    }

    game.dead = true;
    game.deadTimer = cause === "fuel" ? 0.55 : 0.85;
    game.notice = cause === "fuel" ? "TANK LEER - 1 LEBEN WEG"
      : cause === "pit" ? "GRABEN - 1 LEBEN WEG"
      : cause === "lava" ? "LAVA - 1 LEBEN WEG"
      : cause === "enemy" ? "GEGNER - 1 LEBEN WEG"
      : "CRASH - 1 LEBEN WEG";
    game.noticeTime = 1.8;
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
    if (levelUnlocks() && rightmostEdge() < VIEW_W - 320
      && Math.random() < Math.min(0.3, 0.12 + (game.level - 2) * 0.04)) {
      var tower = makeObstacle(VIEW_W + 40, { id: "tower", w: TOWER_W, h: TOWER_H, color: "#6b7a8f" });
      game.obstacles.push(tower);
      liftCans(tower.x, tower.x + tower.w, tower.y0);
      game.spawnTime = spawnGap() * rand(1.25, 1.55);
      return;
    }

    if (levelUnlocks() && Math.random() < Math.min(0.35, 0.14 + (game.level - 2) * 0.05)) {
      var crusher = makeCrusher(VIEW_W + 40);
      game.obstacles.push(crusher);
      dropPickups(crusher.x, crusher.x + crusher.w);
      game.spawnTime = spawnGap() * rand(1.1, 1.4);
      return;
    }

    var t = TYPES[(Math.random() * TYPES.length) | 0];
    var first = makeObstacle(VIEW_W + 40, t);
    game.obstacles.push(first);
    liftCans(first.x, first.x + first.w, first.y0);

    if (levelUnlocks() && Math.random() < Math.min(0.32, 0.1 + (game.level - 2) * 0.05)) {
      var t2 = TYPES[(Math.random() * TYPES.length) | 0];
      var second = makeObstacle(VIEW_W + 40 + t.w + rand(10, 22), t2);
      game.obstacles.push(second);
      liftCans(second.x, second.x + second.w, second.y0);
    }
    game.spawnTime = spawnGap() * rand(0.92, 1.12);
  }

  function spawnPit() {
    var w = pitWidth();
    var pit = {
      x: VIEW_W + 30,
      w: w,
      scored: false,
      seed: Math.random() * 10,
      lava: levelUnlocks() && Math.random() < Math.min(0.65, LAVA_CHANCE + (game.level - 2) * 0.1),
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
    game.spawnTime = spawnGap() * rand(1.15, 1.45);
  }

  function spawnNext() {
    if (Math.random() < pitChance()) {
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

  function dropPickups(fromX, toX) {
    for (var i = game.cans.length - 1; i >= 0; i--) {
      var c = game.cans[i];
      if (c.x + c.w > fromX && c.x < toX) {
        game.cans.splice(i, 1);
      }
    }
    for (var j = game.scrapItems.length - 1; j >= 0; j--) {
      var s = game.scrapItems[j];
      if (s.x + s.w > fromX && s.x < toX) {
        game.scrapItems.splice(j, 1);
      }
    }
  }

  function canSpacing() {
    var base = Math.max(700, 1040 - (game.level - 1) * 18);
    var wave = 0.88 + 0.24 * Math.abs(Math.sin(game.canCount * 1.7));
    return base * wave * rand(0.96, 1.04);
  }

  function canHeight(kind) {
    if (kind === "ground") {
      return GROUND_Y - rand(40, 52);
    }
    if (kind === "high") {
      return GROUND_Y - rand(140, 158);
    }
    return GROUND_Y - rand(112, 132);
  }

  function pushCan(x, y) {
    if (overlapsCrusher(x, CAN_W)) {
      return false;
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
    return true;
  }

  function spawnCan() {
    var kind = CAN_KINDS[game.canCount % CAN_KINDS.length];
    if (!pushCan(VIEW_W + 20, canHeight(kind))) {
      return false;
    }
    game.canCount += 1;
    return true;
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

  function pickScrapType() {
    var total = 0;
    var i;
    for (i = 0; i < SCRAP_TYPES.length; i++) {
      total += SCRAP_TYPES[i].weight;
    }
    var roll = Math.random() * total;
    for (i = 0; i < SCRAP_TYPES.length; i++) {
      roll -= SCRAP_TYPES[i].weight;
      if (roll <= 0) {
        return SCRAP_TYPES[i];
      }
    }
    return SCRAP_TYPES[0];
  }

  function scrapSpacing() {
    return rand(240, 430);
  }

  function spawnScrap() {
    var t = pickScrapType();
    var x = VIEW_W + 20;
    var high = Math.random() < 0.35;
    var y = high ? GROUND_Y - rand(96, 146) : GROUND_Y - rand(28, 44);
    var from = x - 40;
    var to = x + t.w + 40;

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

    game.scrapItems.push({
      type: t.id,
      value: t.value,
      tier: t.tier,
      color: t.color,
      x: x,
      y: clamp(y, 190, GROUND_Y - 24),
      w: t.w,
      h: t.h,
      rot: (Math.random() - 0.5) * 0.5,
      seed: Math.random() * 10
    });
    return true;
  }

  function collectScrap() {
    var rx1 = robot.x - 6;
    var rx2 = robot.x + ROBOT_W + 6;
    var ry1 = robot.y - ROBOT_H - 10;
    var ry2 = robot.y + 6;

    for (var i = game.scrapItems.length - 1; i >= 0; i--) {
      var s = game.scrapItems[i];
      if (s.x < rx2 && s.x + s.w > rx1 && s.y < ry2 && s.y + s.h > ry1) {
        game.scrapItems.splice(i, 1);

        var mult = game.scrapComboTimer > 0
          ? Math.min(game.scrapCombo + 0.25, 2)
          : 1;
        game.scrapCombo = mult;
        game.scrapComboTimer = 2.2;

        var gain = Math.round(s.value * mult);
        game.scrap += gain;
        game.score += gain * 4;
        addLabel(s.x + s.w / 2, s.y - 6,
          "+" + gain + (mult > 1 ? "  x" + mult : ""),
          mult >= 1.75 ? "#ffd166" : "#7fe6ff");
        burst(s.x + s.w / 2, s.y + s.h / 2, 6 + (s.tier || 0) * 6,
          [s.color, "#e8ecf1", "#ffd166"]);
        sfxScrap(s.value);
      }
    }
  }

  function shopItemState(item) {
    if (item.id === "life") {
      return game.lives >= START_LIVES ? "voll" : (game.scrap >= item.cost ? "ok" : "teuer");
    }
    if (item.id === "tank") {
      return game.fuelMax >= FUEL_MAX + 100 ? "voll" : (game.scrap >= item.cost ? "ok" : "teuer");
    }
    if (item.id === "shield") {
      return game.shield > 0 ? "voll" : (game.scrap >= item.cost ? "ok" : "teuer");
    }
    return game.maxJumps >= 3 ? "voll" : (game.scrap >= item.cost ? "ok" : "teuer");
  }

  function buyShopItem(index) {
    if (index < 0 || index >= SHOP_ITEMS.length) {
      return;
    }
    var item = SHOP_ITEMS[index];
    var state = shopItemState(item);

    if (state === "voll") {
      game.shopMessage = item.label + " ist schon voll";
      game.shopMessageTime = 1.6;
      sfxDenied();
      return;
    }
    if (state === "teuer") {
      game.shopMessage = "Zu wenig Schrott fuer " + item.label;
      game.shopMessageTime = 1.6;
      sfxDenied();
      return;
    }

    game.scrap -= item.cost;

    if (item.id === "life") {
      game.lives = Math.min(START_LIVES, game.lives + 1);
    } else if (item.id === "tank") {
      game.fuelMax += 25;
      game.fuel = Math.min(game.fuelMax, game.fuel + 25);
    } else if (item.id === "shield") {
      game.shield = 1;
    } else {
      game.maxJumps = 3;
    }

    game.shopMessage = item.label + " gekauft";
    game.shopMessageTime = 1.8;
    sfxBuy();
  }

  function pickEnemyType() {
    var pool = levelUnlocks() ? ENEMY_TYPES : [ENEMY_TYPES[0]];
    var total = 0;
    var i;
    for (i = 0; i < pool.length; i++) {
      total += pool[i].weight;
    }
    var roll = Math.random() * total;
    for (i = 0; i < pool.length; i++) {
      roll -= pool[i].weight;
      if (roll <= 0) {
        return pool[i];
      }
    }
    return pool[0];
  }

  function spawnEnemy() {
    var t = pickEnemyType();
    var x = VIEW_W + 40;
    var e = {
      type: t.id,
      x: x,
      w: t.w,
      h: t.h,
      y: GROUND_Y - t.h,
      vy: 0,
      hoverY: GROUND_Y - t.h,
      chase: 0,
      state: "hover",
      timer: 0,
      flash: 0,
      legPhase: 0,
      seed: Math.random() * 10
    };

    if (e.type === "crawler") {
      e.chase = Math.min(160, 70 + game.level * 9);
      e.timer = 0;
    } else if (e.type === "drone") {
      e.hoverY = GROUND_Y - 168 + rand(-22, 22);
      e.y = e.hoverY;
      e.timer = rand(0.7, 1.6);
    } else {
      e.timer = rand(0.32, 0.6);
    }

    game.enemies.push(e);
  }

  function updateEnemies(dt) {
    for (var i = game.enemies.length - 1; i >= 0; i--) {
      var e = game.enemies[i];
      e.flash = Math.max(0, e.flash - dt);
      e.legPhase += dt * 12;

      if (e.type === "crawler") {
        e.x -= (game.speed + e.chase) * dt;
      } else if (e.type === "drone") {
        e.x -= game.speed * dt;
        if (e.state === "hover") {
          e.timer -= dt;
          e.y = e.hoverY + Math.sin(game.time * 3 + e.seed) * 6;
          if (e.timer <= 0 && e.x < 580) {
            e.state = "dive";
            e.vy = 330;
            e.flash = 0.4;
          }
        } else if (e.state === "dive") {
          e.y += e.vy * dt;
          if (e.y >= GROUND_Y - e.h - 4) {
            e.y = GROUND_Y - e.h - 4;
            e.state = "rise";
          }
        } else {
          e.y -= 300 * dt;
          if (e.y <= e.hoverY) {
            e.y = e.hoverY;
            e.state = "hover";
            e.timer = rand(1.3, 2.4);
          }
        }
      } else {
        e.x -= game.speed * dt;
        if (e.x < 780 && e.x > robot.x + 40) {
          e.timer -= dt;
        }
        if (e.timer <= 0 && e.x < 780 && e.x > robot.x + 40) {
          e.timer = rand(1.2, 1.8);
          e.flash = 0.14;
          game.bullets.push({
            x: e.x - 4,
            y: GROUND_Y - 48,
            w: 18,
            h: 13,
            seed: Math.random() * 10
          });
          sfxShot();
        }
      }

      if (e.x + e.w < -80) {
        game.enemies.splice(i, 1);
      }
    }

    for (var b = game.bullets.length - 1; b >= 0; b--) {
      var bullet = game.bullets[b];
      bullet.x -= (game.speed + BULLET_SPEED) * dt;
      if (bullet.x + bullet.w < -40) {
        game.bullets.splice(b, 1);
      }
    }
  }

  function requestFullscreen() {
    if (!touchMode || fullscreenTried) {
      return;
    }
    fullscreenTried = true;
    try {
      var el = document.documentElement;
      if (!el) {
        return;
      }
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
      }
    } catch (e) {
      /* iOS kennt die Fullscreen-API nicht - dort greift der Startbildschirm-Modus */
    }
  }

  function fireShot() {
    if (game.state !== "playing" || game.dead || game.shotCooldown > 0) {
      return;
    }
    game.shotCooldown = SHOT_COOLDOWN;
    game.muzzle = 0.1;
    game.shots.push({
      x: robot.x + ROBOT_W - 4,
      y: robot.y - 42,
      w: 24,
      h: 9,
      seed: Math.random() * 10
    });
    sfxPlayerShot();
  }

  function killEnemy(e) {
    var cx = e.x + e.w / 2;
    var cy = e.y + e.h / 2;
    var i;

    game.blasts.push({ x: cx, y: cy, life: 0.24, max: 0.24, r0: 5, r1: 42, color: "#fff6c8", ring: false });
    game.blasts.push({ x: cx, y: cy, life: 0.34, max: 0.34, r0: 9, r1: 76, color: "#7fe6ff", ring: true });

    for (i = 0; i < 14; i++) {
      var a = Math.random() * Math.PI * 2;
      var sp = rand(120, 430);
      game.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - rand(40, 180),
        life: rand(0.4, 1.0),
        max: 1.0,
        size: rand(3, 8),
        color: ["#5c6b80", "#39424f", "#8b97a8", "#ff8a6a"][(Math.random() * 4) | 0],
        grav: 1500,
        shape: "debris",
        angle: Math.random() * Math.PI * 2,
        spin: rand(-13, 13)
      });
    }

    for (i = 0; i < 6; i++) {
      game.particles.push({
        x: cx + rand(-12, 12),
        y: cy + rand(-12, 12),
        vx: rand(-60, 60),
        vy: rand(-130, -30),
        life: rand(0.5, 1.1),
        max: 1.1,
        size: rand(7, 14),
        color: "rgba(74, 82, 96, 0.5)",
        grav: -220,
        grow: 24,
        shape: "smoke"
      });
    }

    game.score += SHOT_SCORE;
    game.scrap += 1;
    addLabel(cx, cy - 10, "+" + SHOT_SCORE, "#7fe6ff");
    sfxEnemyDown();
  }

  function updateShots(dt) {
    game.shotCooldown = Math.max(0, game.shotCooldown - dt);

    for (var i = game.shots.length - 1; i >= 0; i--) {
      var shot = game.shots[i];
      shot.x += SHOT_SPEED * dt;

      if (shot.x > VIEW_W + 40) {
        game.shots.splice(i, 1);
        continue;
      }

      var consumed = false;

      for (var b = game.bullets.length - 1; b >= 0; b--) {
        var bullet = game.bullets[b];
        if (shot.x < bullet.x + bullet.w && shot.x + shot.w > bullet.x
          && shot.y < bullet.y + bullet.h && shot.y + shot.h > bullet.y) {
          game.bullets.splice(b, 1);
          burst(bullet.x + bullet.w / 2, bullet.y + bullet.h / 2, 8, ["#ffd166", "#7fe6ff", "#e8ecf1"]);
          game.score += 10;
          consumed = true;
          break;
        }
      }

      if (!consumed) {
        for (var e = game.enemies.length - 1; e >= 0; e--) {
          var enemy = game.enemies[e];
          if (shot.x + shot.w - 4 > enemy.x && shot.x + 4 < enemy.x + enemy.w
            && shot.y + shot.h > enemy.y && shot.y < enemy.y + enemy.h) {
            killEnemy(enemy);
            game.enemies.splice(e, 1);
            consumed = true;
            break;
          }
        }
      }

      if (consumed) {
        game.shots.splice(i, 1);
      }
    }
  }

  function hitsEnemy() {
    var rx1 = robot.x + 6;
    var rx2 = robot.x + ROBOT_W - 6;
    var ry1 = robot.y - ROBOT_H + 6;
    var ry2 = robot.y - 3;

    for (var i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];
      if (e.x + 4 < rx2 && e.x + e.w - 4 > rx1 && e.y + 4 < ry2 && e.y + e.h - 4 > ry1) {
        return true;
      }
    }
    for (var b = 0; b < game.bullets.length; b++) {
      var bullet = game.bullets[b];
      if (bullet.x + 2 < rx2 && bullet.x + bullet.w - 2 > rx1
        && bullet.y + 2 < ry2 && bullet.y + bullet.h - 2 > ry1) {
        return true;
      }
    }
    return false;
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
        game.fuel = Math.min(game.fuelMax, game.fuel + FUEL_PER_CAN);
        game.score += 15;
        addLabel(c.x + c.w / 2, c.y - 4, "+" + FUEL_PER_CAN, "#7fe6ff");
        burst(c.x + c.w / 2, c.y + c.h / 2, 10, ["#7fe6ff", "#46e0c0", "#e8ecf1"]);
        sfxPickup();
      }
    }
  }

  function update(dt) {
    game.time += dt;

    if (game.state === "shop") {
      game.shopLock = Math.max(0, game.shopLock - dt);
      game.shopMessageTime = Math.max(0, game.shopMessageTime - dt);
      game.flash = Math.max(0, game.flash - dt * 1.6);
      game.shake = Math.max(0, game.shake - dt * 42);
      updateFx(dt);
      return;
    }

    if (game.dead) {
      game.deadTimer -= dt;
      game.flash = Math.max(0, game.flash - dt * 1.6);
      game.shake = Math.max(0, game.shake - dt * 42);
      updateFx(dt);
      if (game.deadTimer <= 0) {
        finishDeath();
      }
      return;
    }

    if (game.state === "playing") {
      game.speed = Math.min(MAX_SPEED, game.levelBaseSpeed + game.distance * SPEED_RAMP) * speedFactor();
    }

    var worldSpeed = 0;
    if (game.state === "playing") {
      worldSpeed = game.speed;
    } else if (game.state === "menu" || game.state === "settings") {
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
      game.portalX = robot.x + (game.levelLength - game.distance);

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
      } else if (robot.jumps >= 1 && robot.jumps < game.maxJumps && robot.y <= GROUND_Y + 20) {
        doJump(robot.jumps + 1, robot.jumps === 1 ? DOUBLE_JUMP_VELOCITY : TRIPLE_JUMP_VELOCITY);
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

      if (remaining > 320 && game.distance >= game.canAt && spawnCan()) {
        game.canAt = game.distance + canSpacing();
      }

      if (game.spareAt > 0 && !game.spareSpawned && game.distance >= game.spareAt) {
        game.spareSpawned = spawnSpare();
      }

      if (remaining > 260 && game.distance >= game.scrapAt && spawnScrap()) {
        game.scrapAt = game.distance + scrapSpacing();
      }

      game.scrapComboTimer = Math.max(0, game.scrapComboTimer - dt);

      game.enemyTime -= dt;
      if (game.enemyTime <= 0) {
        var enemiesAllowed = remaining > SPAWN_STOP_MARGIN
          && rightmostEdge() < VIEW_W - 340
          && (levelUnlocks() || game.distance > game.levelLength * 0.5);
        if (enemiesAllowed) {
          spawnEnemy();
        }
        game.enemyTime = enemyGap() * rand(0.9, 1.1);
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

    for (var qi = game.scrapItems.length - 1; qi >= 0; qi--) {
      var item = game.scrapItems[qi];
      if (game.state === "playing") {
        item.x -= game.speed * dt;
      }
      if (item.x + item.w < -80) {
        game.scrapItems.splice(qi, 1);
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
      if (game.fireHeld) {
        fireShot();
      }
      updateEnemies(dt);
      updateShots(dt);
      collectCans();
      collectSpares();
      collectScrap();
      if (game.invuln <= 0) {
        var hitCause = null;
        if (hitsObstacle()) {
          hitCause = "hit";
        } else if (hitsLavaDrop()) {
          hitCause = "lava";
        } else if (hitsEnemy()) {
          hitCause = "enemy";
        } else if (robot.y > GROUND_Y + 60) {
          hitCause = "pit";
        }
        if (hitCause) {
          if (game.shield > 0) {
            useShield(hitCause);
          } else {
            loseLife(hitCause);
          }
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
      pt.vy += (pt.grav === undefined ? 1500 : pt.grav) * dt;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      if (pt.spin) {
        pt.angle += pt.spin * dt;
      }
      if (pt.grow) {
        pt.size += pt.grow * dt;
      }
      if (pt.y > GROUND_Y) {
        if (pt.shape === "smoke" || isOverPit(pt.x)) {
          continue;
        }
        pt.y = GROUND_Y;
        pt.vy *= -0.35;
        pt.vx *= 0.7;
      }
    }

    for (var b = game.blasts.length - 1; b >= 0; b--) {
      game.blasts[b].life -= dt;
      if (game.blasts[b].life <= 0) {
        game.blasts.splice(b, 1);
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

    game.muzzle = Math.max(0, game.muzzle - dt);
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
    drawAmbient();
    drawPits();
    drawGround();
    drawPortal();
    drawCans();
    drawSpares();
    drawScrapItems();
    drawObstacles();
    drawEnemies();
    drawBullets();
    drawShots();
    drawParticles();
    drawBlasts();
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

  function biome() {
    return BIOMES[(game.level - 1) % BIOMES.length];
  }

  function hash01(n) {
    var v = Math.sin(n * 12.9898) * 43758.5453;
    return v - Math.floor(v);
  }

  function drawSky() {
    var b = biome();
    var g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, b.sky[0]);
    g.addColorStop(0.45, b.sky[1]);
    g.addColorStop(0.78, b.sky[2]);
    g.addColorStop(1, b.sky[3]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, GROUND_Y);

    drawPlanet(b.orb);

    ctx.fillStyle = "rgba(255,255,255," + b.stars.alpha + ")";
    for (var i = 0; i < b.stars.count; i++) {
      var sx = (i * 137.5) % VIEW_W;
      var sy = (i * 53.7) % (180 + b.stars.tilt * 300);
      var a = 0.15 + 0.5 * Math.abs(Math.sin(game.time * 1.4 + i));
      ctx.globalAlpha = a * (1 - sy / 240) * b.stars.alpha;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlanet(orb) {
    var cx = orb.x;
    var cy = orb.y;
    var r = orb.r;
    var i;

    var haloR = r * 3.1;
    var halo = ctx.createRadialGradient(cx, cy, 6, cx, cy, haloR);
    halo.addColorStop(0, orb.glow[0]);
    halo.addColorStop(0.35, orb.glow[1]);
    halo.addColorStop(1, orb.glow[2]);
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, haloR, 0, Math.PI * 2);
    ctx.fill();

    if (orb.ring) {
      drawPlanetRing(orb, true);
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    var body = ctx.createRadialGradient(cx - r * 0.36, cy - r * 0.4, r * 0.1, cx, cy, r * 1.15);
    body.addColorStop(0, orb.lit);
    body.addColorStop(0.42, orb.base);
    body.addColorStop(0.78, orb.dark);
    body.addColorStop(1, orb.dark);
    ctx.fillStyle = body;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    var bandY = [-0.44, 0.06, 0.5];
    var bandH = [0.15, 0.19, 0.12];
    for (i = 0; i < orb.bands.length; i++) {
      ctx.fillStyle = orb.bands[i];
      ctx.beginPath();
      ctx.ellipse(cx, cy + r * bandY[i], r * 1.06, r * bandH[i], 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = orb.bands[1];
    ctx.beginPath();
    ctx.ellipse(cx - r * 0.42, cy + r * 0.28, r * 0.2, r * 0.14, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = orb.bands[2];
    ctx.beginPath();
    ctx.ellipse(cx + r * 0.32, cy - r * 0.44, r * 0.15, r * 0.11, -0.4, 0, Math.PI * 2);
    ctx.fill();

    var rim = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r);
    rim.addColorStop(0, "rgba(255,255,255,0)");
    rim.addColorStop(0.85, "rgba(255,255,255,0)");
    rim.addColorStop(1, "rgba(255,255,255,0.32)");
    ctx.fillStyle = rim;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

    ctx.restore();

    if (orb.ring) {
      drawPlanetRing(orb, false);
    }
  }

  function drawPlanetRing(orb, behind) {
    var ring = orb.ring;
    var r = orb.r;

    ctx.save();
    ctx.beginPath();
    if (behind) {
      ctx.rect(orb.x - r * 3.2, orb.y - r * 3.2, r * 6.4, r * 3.2);
    } else {
      ctx.rect(orb.x - r * 3.2, orb.y, r * 6.4, r * 3.2);
    }
    ctx.clip();

    for (var i = 0; i < 2; i++) {
      var radius = r * (1.65 + i * 0.34);
      ctx.strokeStyle = i === 0 ? ring.color : ring.color2;
      ctx.lineWidth = r * (i === 0 ? 0.13 : 0.08) * ring.w;
      ctx.beginPath();
      ctx.ellipse(orb.x, orb.y, radius, radius * ring.tilt, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawHills() {
    var b = biome();
    for (var i = 0; i < b.layers.length; i++) {
      drawBackdropLayer(b.layers[i], game.scroll * b.layers[i].speed);
    }
  }

  function drawBackdropLayer(layer, offset) {
    ctx.fillStyle = layer.color;

    if (layer.kind === "city") {
      var step = 46;
      var startIndex = Math.floor(offset / step) - 1;
      ctx.beginPath();
      ctx.moveTo(0, VIEW_H);
      for (var i = 0; i <= VIEW_W / step + 2; i++) {
        var idx = startIndex + i;
        var bx = idx * step - offset;
        var h = layer.amp * (0.25 + hash01(idx * 1.7) * 0.75);
        ctx.lineTo(bx, layer.baseY - h);
        ctx.lineTo(bx + step - 6, layer.baseY - h);
      }
      ctx.lineTo(VIEW_W, VIEW_H);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(255, 220, 150, 0.5)";
      for (var k = 0; k <= VIEW_W / step + 2; k++) {
        var idx2 = startIndex + k;
        var bx2 = idx2 * step - offset;
        var h2 = layer.amp * (0.25 + hash01(idx2 * 1.7) * 0.75);
        for (var wy = 0; wy < 3; wy++) {
          for (var wx = 0; wx < 2; wx++) {
            if (hash01(idx2 * 7.3 + wy * 3.1 + wx) > 0.55) {
              ctx.fillRect(bx2 + 10 + wx * 16, layer.baseY - h2 + 14 + wy * 22, 7, 9);
            }
          }
        }
      }
      return;
    }

    ctx.beginPath();
    ctx.moveTo(0, VIEW_H);
    ctx.lineTo(0, layer.baseY);
    var step2 = 26;
    for (var x = 0; x <= VIEW_W + step2; x += step2) {
      var worldX = x + offset;
      var y;
      if (layer.kind === "dune") {
        y = layer.baseY - layer.amp * (0.5 + 0.5 * Math.sin(worldX / layer.period * Math.PI * 2));
      } else if (layer.kind === "peak") {
        var t = (worldX / layer.period) % 1;
        if (t < 0) { t += 1; }
        y = layer.baseY - layer.amp * (1 - Math.abs(t * 2 - 1));
      } else if (layer.kind === "volcano") {
        var t2 = (worldX / layer.period) % 1;
        if (t2 < 0) { t2 += 1; }
        var cone = 1 - Math.abs(t2 * 2 - 1);
        y = layer.baseY - layer.amp * cone;
        if (cone > 0.86) {
          y = layer.baseY - layer.amp * 0.86;
        }
      } else {
        y = layer.baseY - layer.amp * (0.5 + 0.5 * Math.sin(worldX / layer.period * Math.PI * 2))
          * (0.6 + 0.4 * Math.sin(worldX / (layer.period * 0.37)));
        y = clamp(y, layer.baseY - layer.amp * 1.5, layer.baseY);
      }
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VIEW_W, VIEW_H);
    ctx.closePath();
    ctx.fill();

    if (layer.kind === "volcano") {
      ctx.fillStyle = "rgba(255, 120, 50, 0.55)";
      for (var v = 0; v <= VIEW_W + step2; v += step2) {
        var worldV = v + offset;
        var tv = (worldV / layer.period) % 1;
        if (tv < 0) { tv += 1; }
        if (Math.abs(tv * 2 - 1) > 0.86) {
          ctx.fillRect(v - 4, layer.baseY - layer.amp * 0.9, 12, 6);
        }
      }
    }
  }

  function drawAmbient() {
    var amb = biome().ambient;
    if (!amb) {
      return;
    }

    if (amb === "snow") {
      ctx.fillStyle = "rgba(240, 250, 255, 0.75)";
      for (var i = 0; i < 60; i++) {
        var sx = (hash01(i) * VIEW_W - game.time * (30 + hash01(i + 11) * 40)) % VIEW_W;
        if (sx < 0) { sx += VIEW_W; }
        var sy = (hash01(i + 5) * VIEW_H + game.time * (46 + hash01(i + 23) * 70)) % VIEW_H;
        ctx.globalAlpha = 0.35 + hash01(i + 31) * 0.5;
        ctx.fillRect(sx, sy, 3, 3);
      }
      ctx.globalAlpha = 1;
    } else if (amb === "embers") {
      for (var e = 0; e < 42; e++) {
        var ex = (hash01(e + 60) * VIEW_W - game.time * (16 + hash01(e + 71) * 30)) % VIEW_W;
        if (ex < 0) { ex += VIEW_W; }
        var ey = VIEW_H - ((hash01(e + 83) * VIEW_H + game.time * (26 + hash01(e + 97) * 46)) % VIEW_H);
        var flick = 0.4 + 0.6 * Math.abs(Math.sin(game.time * 5 + e));
        ctx.fillStyle = "rgba(255, " + Math.round(120 + hash01(e) * 80) + ", 60, " + flick * 0.75 + ")";
        ctx.fillRect(ex, ey, 2.5, 2.5);
      }
    }
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

      var wall = Math.max(16, Math.min(38, w * 0.3));

      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, GROUND_Y - 6, w, VIEW_H - GROUND_Y + 6);
      ctx.clip();

      var b = biome();
      var lit = b.orb.lit;
      var dark = b.orb.dark;

      ctx.fillStyle = "rgba(3, 5, 10, 0.97)";
      ctx.fillRect(x0, GROUND_Y - 6, w, VIEW_H - GROUND_Y + 6);

      var g = ctx.createLinearGradient(0, GROUND_Y, 0, VIEW_H);
      g.addColorStop(0, rgbaFromHex(b.ground.fill, 0.1));
      g.addColorStop(0.5, rgbaFromHex(b.ground.fill, 0.3));
      g.addColorStop(1, rgbaFromHex(b.ground.fill, 0.45));
      ctx.fillStyle = g;
      ctx.fillRect(x0, GROUND_Y - 6, w, VIEW_H - GROUND_Y + 6);

      var lip = ctx.createLinearGradient(0, GROUND_Y - 2, 0, GROUND_Y + 14);
      lip.addColorStop(0, rgbaFromHex(lit, 0.2));
      lip.addColorStop(1, rgbaFromHex(lit, 0));
      ctx.fillStyle = lip;
      ctx.fillRect(x0, GROUND_Y - 2, w, 16);

      var leftWall = ctx.createLinearGradient(x0, 0, x0 + wall, 0);
      leftWall.addColorStop(0, rgbaFromHex(lit, 0.34));
      leftWall.addColorStop(0.45, rgbaFromHex(lit, 0.11));
      leftWall.addColorStop(1, rgbaFromHex(lit, 0));
      ctx.fillStyle = leftWall;
      ctx.fillRect(x0, GROUND_Y, wall, VIEW_H - GROUND_Y);

      var rightWall = ctx.createLinearGradient(x0 + w - wall, 0, x0 + w, 0);
      rightWall.addColorStop(0, rgbaFromHex(dark, 0));
      rightWall.addColorStop(1, rgbaFromHex(dark, 0.55));
      ctx.fillStyle = rightWall;
      ctx.fillRect(x0 + w - wall, GROUND_Y, wall, VIEW_H - GROUND_Y);

      var floor = ctx.createLinearGradient(0, VIEW_H - 46, 0, VIEW_H);
      floor.addColorStop(0, "rgba(4, 7, 12, 0)");
      floor.addColorStop(1, "rgba(4, 7, 12, 0.9)");
      ctx.fillStyle = floor;
      ctx.fillRect(x0, VIEW_H - 46, w, 46);

      if (p.lava) {
        drawLavaFill(p, x0, w);
      }
      ctx.restore();
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
    var g0 = biome().ground;

    ctx.fillStyle = g0.fill;
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);

    var g = ctx.createLinearGradient(0, GROUND_Y, 0, VIEW_H);
    g.addColorStop(0, "rgba(255,255,255,0.07)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y);

    var top = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 22);
    top.addColorStop(0, "rgba(255,255,255,0.14)");
    top.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = top;
    ctx.fillRect(0, GROUND_Y, VIEW_W, 22);

    ctx.globalAlpha = 0.2;
    ctx.fillStyle = g0.edge;
    ctx.fillRect(0, GROUND_Y - 1, VIEW_W, 2);
    ctx.globalAlpha = 1;

    ctx.strokeStyle = g0.dash;
    ctx.lineWidth = 2;
    var spacing = 90;
    var off = game.scroll % spacing;
    ctx.beginPath();
    for (var x = -spacing + off; x < VIEW_W + spacing; x += spacing) {
      ctx.moveTo(x, GROUND_Y + 26);
      ctx.lineTo(x + 34, GROUND_Y + 26);
    }
    ctx.stroke();

    ctx.fillStyle = g0.dash;
    ctx.globalAlpha = 0.5;
    var off2 = (game.scroll * 1.25) % spacing;
    for (var x2 = -spacing + off2; x2 < VIEW_W + spacing; x2 += spacing) {
      ctx.fillRect(x2, GROUND_Y + 52, 52, 3);
    }
    ctx.globalAlpha = 1;
  }

  function drawPortal() {
    var x = game.portalX;
    var w = 84;
    if (x > VIEW_W + w + 60 || x + w < -60) {
      return;
    }
    var cx = x + w / 2;
    var cy = GROUND_Y - 116;
    var pulse = 0.5 + 0.5 * Math.abs(Math.sin(game.time * 2.6));

    var pad = ctx.createRadialGradient(cx, GROUND_Y + 2, 4, cx, GROUND_Y + 2, 58);
    pad.addColorStop(0, "rgba(230, 255, 255, " + (0.35 + pulse * 0.3) + ")");
    pad.addColorStop(1, "rgba(70, 224, 192, 0)");
    ctx.fillStyle = pad;
    ctx.fillRect(cx - 58, GROUND_Y - 26, 116, 52);

    var glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, 96);
    glow.addColorStop(0, "rgba(240, 255, 255, 0.95)");
    glow.addColorStop(0.3, "rgba(70, 224, 192, 0.5)");
    glow.addColorStop(1, "rgba(70, 224, 192, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 96, cy - 96, 192, 192);

    for (var r = 0; r < 4; r++) {
      var rad = 26 + r * 16 + Math.sin(game.time * 2 + r) * 2.5;
      var dir = r % 2 === 0 ? 1 : -1;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(game.time * (0.9 + r * 0.4) * dir);
      ctx.scale(1, 0.4);
      ctx.strokeStyle = "rgba(127, 230, 255, " + (0.55 - r * 0.1) + ")";
      ctx.lineWidth = 3 - r * 0.5;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.fillStyle = "#eaffff";
    ctx.beginPath();
    ctx.arc(cx, cy, 13 + Math.sin(game.time * 5) * 3, 0, Math.PI * 2);
    ctx.fill();

    for (var i = 0; i < 11; i++) {
      var a = game.time * 2.4 + i * (Math.PI * 2 / 11);
      var sr = 42 + Math.sin(game.time * 3 + i * 1.7) * 8;
      ctx.fillStyle = "rgba(210, 250, 255, 0.8)";
      ctx.beginPath();
      ctx.arc(cx + Math.cos(a) * sr, cy + Math.sin(a) * sr * 0.42, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.font = "700 15px Consolas, 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(10,16,26,0.85)";
    rr(ctx, cx - 38, cy - 118, 76, 22, 6);
    ctx.fill();
    ctx.fillStyle = "#7fe6ff";
    ctx.fillText("PORTAL", cx, cy - 107);
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

  function drawScrapItems() {
    for (var i = 0; i < game.scrapItems.length; i++) {
      var s = game.scrapItems[i];
      var cy = s.y + s.h / 2 + Math.sin(game.time * 3 + s.seed) * 2;
      var cx = s.x + s.w / 2;
      var tier = SCRAP_TIER_GLOW[s.tier || 0];

      var glow = ctx.createRadialGradient(cx, cy, 1, cx, cy, tier.r);
      glow.addColorStop(0, "rgba(255, 209, 102, " + tier.alpha + ")");
      glow.addColorStop(1, "rgba(255, 209, 102, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(cx - tier.r, cy - tier.r, tier.r * 2, tier.r * 2);

      if (tier.ring) {
        var pulse = 0.25 + 0.3 * Math.abs(Math.sin(game.time * 2.4 + s.seed));
        ctx.strokeStyle = "rgba(255, 226, 150, " + pulse + ")";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 13 + (1 - pulse) * 8, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((s.rot || 0) + Math.sin(game.time * 1.6 + s.seed) * 0.12);

      if (s.type === "bolt") {
        drawScrapBolt(s);
      } else if (s.type === "spring") {
        drawScrapSpring(s);
      } else if (s.type === "gear") {
        drawScrapGear(s);
      } else if (s.type === "pipe") {
        drawScrapPipe(s);
      } else if (s.type === "plate") {
        drawScrapPlate(s);
      } else {
        drawScrapChip(s);
      }
      ctx.restore();
    }
  }

  function scrapSteel(cx, cy, r, base, light, dark) {
    var g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
    g.addColorStop(0, light);
    g.addColorStop(0.55, base);
    g.addColorStop(1, dark);
    return g;
  }

  function drawScrapBolt(s) {
    ctx.fillStyle = "#93a3b6";
    rr(ctx, -2.5, -2, 5, 13, 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(-1.6, -1, 1.4, 11);

    ctx.fillStyle = scrapSteel(-2, -7, 8.5, s.color, "#eef4fb", "#6b7a8f");
    ctx.beginPath();
    ctx.arc(0, -6, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(40, 50, 64, 0.7)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(35, 45, 60, 0.8)";
    ctx.beginPath();
    ctx.moveTo(-3, -6);
    ctx.lineTo(3, -6);
    ctx.moveTo(0, -9);
    ctx.lineTo(0, -3);
    ctx.stroke();

    var glint = 0.3 + 0.5 * Math.abs(Math.sin(game.time * 4 + s.seed));
    ctx.fillStyle = "rgba(255,255,255," + glint + ")";
    ctx.beginPath();
    ctx.arc(-2.5, -8.5, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawScrapSpring(s) {
    var squeeze = 1 + Math.sin(game.time * 5 + s.seed) * 0.14;
    ctx.lineCap = "round";
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2.2;
    for (var k = 0; k < 5; k++) {
      var y = -7 + k * 3.4 * squeeze;
      ctx.beginPath();
      ctx.moveTo(-6, y);
      ctx.lineTo(6, y + 1.8);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-6, -7);
    ctx.lineTo(6.5, -5.2);
    ctx.stroke();
    ctx.fillStyle = "#8fa3b8";
    rr(ctx, -7.5, -10, 15, 3, 1.5);
    ctx.fill();
    rr(ctx, -7.5, 7, 15, 3, 1.5);
    ctx.fill();
  }

  function drawScrapGear(s) {
    var teeth = 8;
    var r1 = 7.5;
    var r2 = 11.5;
    var half = Math.PI / teeth * 0.45;
    ctx.rotate(game.time * 1.3 + s.seed);

    ctx.fillStyle = s.color;
    for (var t = 0; t < teeth; t++) {
      var a = (t / teeth) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - half) * r1, Math.sin(a - half) * r1);
      ctx.lineTo(Math.cos(a - half * 0.6) * r2, Math.sin(a - half * 0.6) * r2);
      ctx.lineTo(Math.cos(a + half * 0.6) * r2, Math.sin(a + half * 0.6) * r2);
      ctx.lineTo(Math.cos(a + half) * r1, Math.sin(a + half) * r1);
      ctx.closePath();
      ctx.fill();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 8.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath();
    ctx.arc(-2.5, -3, 3.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(28, 36, 48, 0.9)";
    ctx.beginPath();
    ctx.arc(0, 0, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(28, 36, 48, 0.9)";
    ctx.fillRect(-1, -9.5, 2, 3);
  }

  function drawScrapPipe(s) {
    ctx.lineCap = "round";
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 5.4;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(-8, -1);
    ctx.arc(0, -1, 8, Math.PI, 0, false);
    ctx.lineTo(8, 8);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-10, 8);
    ctx.lineTo(-10, -1);
    ctx.arc(0, -1, 10, Math.PI, 0, false);
    ctx.lineTo(10, 8);
    ctx.stroke();

    ctx.fillStyle = "#6b7a8f";
    rr(ctx, -11, 5, 6, 5, 1.5);
    ctx.fill();
    rr(ctx, 5, 5, 6, 5, 1.5);
    ctx.fill();
  }

  function drawScrapPlate(s) {
    var bend = Math.sin(game.time * 2.2 + s.seed) * 1.2;
    ctx.beginPath();
    ctx.moveTo(-11, -6);
    ctx.lineTo(0, -8 - bend);
    ctx.lineTo(11, -6);
    ctx.lineTo(11, 6);
    ctx.lineTo(0, 8 - bend);
    ctx.lineTo(-11, 6);
    ctx.closePath();
    var g = ctx.createLinearGradient(-11, -8, 11, 8);
    g.addColorStop(0, "#e2eaf3");
    g.addColorStop(0.5, s.color);
    g.addColorStop(1, "#71829a");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "rgba(40, 50, 64, 0.65)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.3)";
    ctx.lineWidth = 1;
    for (var i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-8, -4 + i * 4);
      ctx.lineTo(8, -5 + i * 4);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(30, 38, 50, 0.5)";
    ctx.beginPath();
    ctx.arc(-6, 2, 1.8, 0, Math.PI * 2);
    ctx.arc(6, -2, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawScrapChip(s) {
    ctx.fillStyle = "#2f6b45";
    rr(ctx, -10, -8, 20, 16, 3);
    ctx.fill();
    ctx.strokeStyle = "rgba(20, 40, 28, 0.8)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#e8c23c";
    for (var p = 0; p < 4; p++) {
      ctx.fillRect(-8 + p * 5, -11, 3, 3.5);
      ctx.fillRect(-8 + p * 5, 7.5, 3, 3.5);
    }

    var g = ctx.createLinearGradient(0, -4, 0, 4);
    g.addColorStop(0, "#4a5568");
    g.addColorStop(1, "#20262f");
    ctx.fillStyle = g;
    rr(ctx, -4.5, -3.5, 9, 7, 1.5);
    ctx.fill();

    var blink = 0.35 + 0.65 * Math.abs(Math.sin(game.time * 6 + s.seed));
    ctx.fillStyle = "rgba(120, 255, 170, " + blink + ")";
    ctx.beginPath();
    ctx.arc(-7.5, -5.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 190, 90, " + (1 - blink) + ")";
    ctx.beginPath();
    ctx.arc(7.5, 5.5, 1.6, 0, Math.PI * 2);
    ctx.fill();
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

  function rgbaFromHex(hex, alpha) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + ((n >> 16) & 255) + ", " + ((n >> 8) & 255) + ", " + (n & 255) + ", " + alpha + ")";
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

  function drawEnemies() {
    for (var i = 0; i < game.enemies.length; i++) {
      var e = game.enemies[i];

      ctx.fillStyle = "rgba(0,0,0,0.28)";
      ctx.beginPath();
      ctx.ellipse(e.x + e.w / 2, GROUND_Y + 4, e.w * 0.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      if (e.type === "crawler") {
        drawCrawler(e);
      } else if (e.type === "drone") {
        drawDrone(e);
      } else {
        drawTurret(e);
      }
    }
  }

  function drawCrawler(e) {
    var x = e.x;
    var y = e.y;
    var w = e.w;
    var h = e.h;
    var cx = x + w / 2;

    ctx.strokeStyle = "#3d4a5e";
    ctx.lineWidth = 3;
    for (var leg = 0; leg < 3; leg++) {
      var lx = x + 8 + leg * 15;
      var swing = Math.sin(e.legPhase + leg * 1.6) * 5;
      ctx.beginPath();
      ctx.moveTo(lx, y + h - 10);
      ctx.lineTo(lx + swing, y + h + 4);
      ctx.stroke();
    }

    var body = ctx.createLinearGradient(0, y, 0, y + h);
    body.addColorStop(0, "#6b7a8f");
    body.addColorStop(0.5, "#46536a");
    body.addColorStop(1, "#2a3444");
    ctx.fillStyle = body;
    rr(ctx, x, y + 6, w, h - 12, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(14, 20, 30, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#39424f";
    for (var spike = 0; spike < 3; spike++) {
      ctx.beginPath();
      ctx.moveTo(x + 10 + spike * 12, y + 6);
      ctx.lineTo(x + 15 + spike * 12, y - 5);
      ctx.lineTo(x + 20 + spike * 12, y + 6);
      ctx.closePath();
      ctx.fill();
    }

    var eye = 0.55 + 0.45 * Math.abs(Math.sin(game.time * 6 + e.seed));
    ctx.fillStyle = "rgba(255, 90, 90, " + eye + ")";
    rr(ctx, cx - 12, y + 14, 22, 7, 3.5);
    ctx.fill();
    ctx.fillStyle = "#1b2430";
    ctx.fillRect(x + 6, y + h - 14, w - 12, 3);
  }

  function drawDrone(e) {
    var x = e.x;
    var y = e.y;
    var w = e.w;
    var h = e.h;
    var cx = x + w / 2;
    var cy = y + h / 2;
    var diving = e.state === "dive";

    var glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);
    glow.addColorStop(0, diving ? "rgba(255, 110, 70, 0.4)" : "rgba(120, 200, 255, 0.25)");
    glow.addColorStop(1, "rgba(120, 200, 255, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(cx - 34, cy - 34, 68, 68);

    ctx.strokeStyle = "rgba(160, 190, 220, 0.55)";
    ctx.lineWidth = 2;
    var spin = Math.sin(game.time * 26 + e.seed) * 14;
    ctx.beginPath();
    ctx.moveTo(cx - 24, y - 4);
    ctx.lineTo(cx + 24, y - 4);
    ctx.moveTo(cx - spin, y - 4);
    ctx.lineTo(cx + spin, y - 4);
    ctx.stroke();

    var body = ctx.createLinearGradient(0, y, 0, y + h);
    body.addColorStop(0, diving ? "#b8552f" : "#7f8fa3");
    body.addColorStop(1, diving ? "#6d2a16" : "#39424f");
    ctx.fillStyle = body;
    rr(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(14, 20, 30, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    var eye = 0.5 + 0.5 * Math.abs(Math.sin(game.time * 7 + e.seed));
    ctx.fillStyle = diving ? "rgba(255, 210, 120, " + eye + ")" : "rgba(255, 90, 90, " + eye + ")";
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1b2430";
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawTurret(e) {
    var x = e.x;
    var y = e.y;
    var w = e.w;
    var h = e.h;
    var cx = x + w / 2;

    var base = ctx.createLinearGradient(0, y, 0, y + h);
    base.addColorStop(0, "#8b97a8");
    base.addColorStop(0.45, "#5c6b80");
    base.addColorStop(1, "#2a3444");
    ctx.fillStyle = base;
    rr(ctx, x, y + 12, w, h - 12, 8);
    ctx.fill();
    ctx.strokeStyle = "rgba(14, 20, 30, 0.85)";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = "#46536a";
    rr(ctx, x + 8, y, w - 16, 18, 7);
    ctx.fill();
    ctx.strokeStyle = "rgba(14, 20, 30, 0.8)";
    ctx.stroke();

    var aim = Math.sin(game.time * 2.2 + e.seed) * 3;
    ctx.fillStyle = "#39424f";
    rr(ctx, x - 16, y + 6 + aim, 22, 11, 4);
    ctx.fill();
    ctx.strokeStyle = "rgba(14, 20, 30, 0.8)";
    ctx.stroke();

    if (e.flash > 0) {
      ctx.fillStyle = "rgba(255, 220, 140, " + Math.min(1, e.flash * 7) + ")";
      ctx.beginPath();
      ctx.arc(x - 16, y + 11 + aim, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    var eye = 0.5 + 0.5 * Math.abs(Math.sin(game.time * 5 + e.seed));
    ctx.fillStyle = "rgba(255, 90, 90, " + eye + ")";
    ctx.beginPath();
    ctx.arc(cx, y + 26, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e8c23c";
    for (var stripe = 0; stripe < 3; stripe++) {
      ctx.fillRect(x + 5 + stripe * 13, y + h - 12, 9, 5);
    }
  }

  function drawBullets() {
    for (var i = 0; i < game.bullets.length; i++) {
      var b = game.bullets[i];
      var cx = b.x + b.w / 2;
      var cy = b.y + b.h / 2;

      ctx.fillStyle = "rgba(255, 140, 60, 0.35)";
      ctx.beginPath();
      ctx.ellipse(cx + 12, cy, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      var g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 12);
      g.addColorStop(0, "#fff6d0");
      g.addColorStop(0.45, "#ffb45c");
      g.addColorStop(1, "rgba(200, 60, 20, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 11, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff1c0";
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawShots() {
    for (var i = 0; i < game.shots.length; i++) {
      var s = game.shots[i];
      var cy = s.y + s.h / 2;
      var cx = s.x + s.w / 2;

      ctx.fillStyle = "rgba(127, 230, 255, 0.3)";
      ctx.beginPath();
      ctx.ellipse(cx - 14, cy, 20, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      var g = ctx.createRadialGradient(cx, cy, 1, cx, cy, 13);
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.35, "#c9f4ff");
      g.addColorStop(0.7, "#46e0c0");
      g.addColorStop(1, "rgba(70, 224, 192, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#eaffff";
      rr(ctx, s.x + 4, s.y + 2, s.w - 8, s.h - 4, 3);
      ctx.fill();
    }
  }

  function drawParticles() {
    for (var i = 0; i < game.particles.length; i++) {
      var p = game.particles[i];
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1) * (p.shape === "smoke" ? 0.7 : 1);
      ctx.fillStyle = p.color;

      if (p.shape === "debris") {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle || 0);
        ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        ctx.restore();
      } else if (p.shape === "smoke") {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.size / 2), 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawBlasts() {
    for (var i = 0; i < game.blasts.length; i++) {
      var b = game.blasts[i];
      var t = 1 - b.life / b.max;
      var r = b.r0 + (b.r1 - b.r0) * t;
      var alpha = (1 - t) * (1 - t);
      ctx.globalAlpha = alpha;

      if (b.ring) {
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 3 + 6 * (1 - t);
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        var g = ctx.createRadialGradient(b.x, b.y, r * 0.1, b.x, b.y, Math.max(r, 1));
        g.addColorStop(0, "#fffce8");
        g.addColorStop(0.45, b.color);
        g.addColorStop(1, "rgba(150, 30, 8, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawRobot() {
    if (robot.destroyed || robot.hidden) {
      return;
    }
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

    if (game.muzzle > 0) {
      var flash = clamp(game.muzzle / 0.1, 0, 1);
      ctx.fillStyle = "rgba(200, 250, 255, " + flash + ")";
      ctx.beginPath();
      ctx.arc(24, -40, 9 * flash + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(16, -43, 16 * flash, 6);
    }

    if (game.shield > 0) {
      var bubble = 0.3 + 0.35 * Math.abs(Math.sin(game.time * 4));
      ctx.fillStyle = "rgba(127, 230, 255, " + bubble * 0.25 + ")";
      ctx.beginPath();
      ctx.arc(0, -32, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(127, 230, 255, " + bubble + ")";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -32, 40, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawHud() {
    game.uiButtons.length = 0;
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

    drawGearIcon(40, 126);
    ctx.textAlign = "left";
    ctx.font = "700 18px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "#ffd166";
    ctx.fillText(String(game.scrap), 56, 119);

    if (game.shield > 0) {
      var sb = 0.5 + 0.5 * Math.abs(Math.sin(game.time * 3.4));
      ctx.strokeStyle = "rgba(127, 230, 255, " + sb + ")";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(40, 139);
      ctx.lineTo(47, 143);
      ctx.lineTo(47, 149);
      ctx.lineTo(40, 154);
      ctx.lineTo(33, 149);
      ctx.lineTo(33, 143);
      ctx.closePath();
      ctx.stroke();
      ctx.font = "700 12px Consolas, 'Courier New', monospace";
      ctx.fillStyle = "#7fe6ff";
      ctx.fillText("SCHILD", 56, 141);
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
    ctx.fillText("LEVEL " + game.level + " · " + biome().name, VIEW_W / 2, 16);

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

    if (touchMode && game.state === "playing" && !game.dead) {
      game.uiButtons.push({
        x: PAUSE_BTN.x - 26,
        y: PAUSE_BTN.y - 26,
        w: 52,
        h: 52,
        id: "pause"
      });
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "rgba(10, 16, 26, 0.55)";
      ctx.beginPath();
      ctx.arc(PAUSE_BTN.x, PAUSE_BTN.y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(200, 220, 240, 0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#cfe0f0";
      ctx.fillRect(PAUSE_BTN.x - 7, PAUSE_BTN.y - 9, 5, 18);
      ctx.fillRect(PAUSE_BTN.x + 2, PAUSE_BTN.y - 9, 5, 18);
      ctx.restore();
    }

    if (touchMode) {
      var readyToFire = game.shotCooldown <= 0 && game.state === "playing" && !game.dead;
      ctx.save();
      ctx.globalAlpha = readyToFire ? 0.9 : 0.4;
      ctx.fillStyle = "rgba(10, 16, 26, 0.55)";
      ctx.beginPath();
      ctx.arc(FIRE_BTN.x, FIRE_BTN.y, FIRE_BTN.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7fe6ff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(FIRE_BTN.x, FIRE_BTN.y, FIRE_BTN.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#eaffff";
      ctx.beginPath();
      ctx.moveTo(FIRE_BTN.x + 4, FIRE_BTN.y - 18);
      ctx.lineTo(FIRE_BTN.x - 9, FIRE_BTN.y + 2);
      ctx.lineTo(FIRE_BTN.x - 1, FIRE_BTN.y + 2);
      ctx.lineTo(FIRE_BTN.x - 5, FIRE_BTN.y + 18);
      ctx.lineTo(FIRE_BTN.x + 10, FIRE_BTN.y - 3);
      ctx.lineTo(FIRE_BTN.x + 2, FIRE_BTN.y - 3);
      ctx.closePath();
      ctx.fill();
      ctx.font = "700 12px Consolas, 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("FEUER", FIRE_BTN.x, FIRE_BTN.y + FIRE_BTN.r + 13);
      ctx.textAlign = "left";
      ctx.restore();
    }

    if (game.state === "paused") {
      panel("PAUSE", "P oder Leertaste = weiter   ·   Esc = Hauptmenü", null);
      uiButton(VIEW_W / 2 - 230, 322, 210, 50, "resume", "WEITER", "Leertaste");
      uiButton(VIEW_W / 2 + 20, 322, 210, 50, "menu", "HAUPTMENÜ", "Esc");
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

  function drawGearIcon(x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#9fb0c4";
    for (var i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-2, -9, 4, 4.5);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1b2430";
    ctx.beginPath();
    ctx.arc(0, 0, 2.6, 0, Math.PI * 2);
    ctx.fill();
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
    var ratio = clamp(game.fuel / game.fuelMax, 0, 1);
    var low = ratio < FUEL_LOW / FUEL_MAX;

    ctx.textAlign = "right";
    ctx.font = "700 12px Consolas, 'Courier New', monospace";
    ctx.fillStyle = low ? "#ff8a6a" : "rgba(255,255,255,0.45)";
    ctx.fillText(game.fuelMax > FUEL_MAX
      ? "BENZIN " + Math.round(game.fuel) + "% · TANK " + game.fuelMax
      : "BENZIN " + Math.round(game.fuel) + "%", rightX, y - 15);

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
    if (game.state === "menu") {
      drawMainMenu();
    } else if (game.state === "settings") {
      drawSettings();
    } else if (game.state === "shop") {
      drawShop();
    } else if (game.state === "over") {
      var title = game.bestThisRun ? "NEUER REKORD!" : "GAME OVER";
      var reason = game.deathCause === "pit" ? "In einen Graben gefallen"
        : game.deathCause === "lava" ? "Von einem Lavatropfen getroffen"
        : game.deathCause === "enemy" ? "Von einem Gegner erwischt"
        : game.deathCause === "fuel" ? "Tank leer gelaufen"
        : "An einem Hindernis zerschellt";
      panel(title, [
        reason + " - Level " + game.level,
        "Punkte: " + Math.floor(game.score) + "   ·   Rekord: " + game.highscore,
        "Leben: " + game.lives + "   ·   Schrott: " + game.scrap + "   ·   Benzin: " + Math.round(game.fuel) + "%"
      ], null);
      uiButton(VIEW_W / 2 - 230, 348, 210, 50, "retry", "NOCHMAL", "Leertaste");
      uiButton(VIEW_W / 2 + 20, 348, 210, 50, "menu", "HAUPTMENÜ", "Esc");
    }
  }

  function drawShop() {
    var rows = SHOP_ITEMS.length;
    var w = 660;
    var h = 100 + rows * 44 + 60;
    var x = VIEW_W / 2 - w / 2;
    var y = VIEW_H / 2 - h / 2 - 8;

    ctx.fillStyle = "rgba(8, 12, 22, 0.9)";
    rr(ctx, x, y, w, h, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(70, 224, 192, 0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#eef4fb";
    ctx.font = "800 32px Consolas, 'Courier New', monospace";
    ctx.fillText("LEVEL " + game.level + " GESCHAFFT", VIEW_W / 2, y + 36);

    ctx.font = "600 16px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    ctx.fillText("Benzin-Bonus: +" + game.levelBonus + "   ·   Schrott: " + game.scrap
      + "   ·   Level " + (game.level + 1) + " wartet", VIEW_W / 2, y + 66);

    game.shopRows = [];
    for (var i = 0; i < rows; i++) {
      var item = SHOP_ITEMS[i];
      var st = shopItemState(item);
      var rx = x + 26;
      var ry = y + 94 + i * 44;
      var rw = w - 52;
      var rh = 38;
      game.shopRows.push({ x: rx, y: ry, w: rw, h: rh, index: i });

      ctx.fillStyle = st === "ok" ? "rgba(70, 224, 192, 0.16)" : "rgba(255,255,255,0.05)";
      rr(ctx, rx, ry, rw, rh, 8);
      ctx.fill();
      ctx.strokeStyle = st === "ok" ? "rgba(70, 224, 192, 0.5)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.font = "700 17px Consolas, 'Courier New', monospace";
      ctx.fillStyle = st === "ok" ? "#eef4fb" : "rgba(255,255,255,0.4)";
      ctx.fillText("[" + (i + 1) + "] " + item.label, rx + 14, ry + 15);

      ctx.font = "500 13px Consolas, 'Courier New', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.fillText(item.hint, rx + 14, ry + 29);

      ctx.textAlign = "right";
      ctx.font = "700 17px Consolas, 'Courier New', monospace";
      ctx.fillStyle = st === "voll" ? "#46e0c0" : st === "teuer" ? "#ff8a6a" : "#ffd166";
      ctx.fillText(st === "voll" ? "MAX" : item.cost + " Schrott", rx + rw - 14, ry + 19);
    }

    if (game.shopMessageTime > 0) {
      ctx.textAlign = "center";
      ctx.font = "700 15px Consolas, 'Courier New', monospace";
      ctx.fillStyle = "#ffd166";
      ctx.fillText(game.shopMessage, VIEW_W / 2, y + 94 + rows * 44 + 4);
    }

    var pulse = 0.45 + 0.55 * Math.abs(Math.sin(game.time * 2.6));
    ctx.textAlign = "center";
    ctx.font = "700 16px Consolas, 'Courier New', monospace";
    ctx.fillStyle = game.shopLock > 0 ? "rgba(255,255,255,0.3)" : "rgba(70, 224, 192, " + pulse + ")";
    ctx.fillText("1-4 = KAUFEN   ·   LEERTASTE / KLICK = WEITER", VIEW_W / 2, y + h - 26);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  function pointerToView(e) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    return {
      x: (e.clientX * dpr - viewOffsetX) / viewScale,
      y: (e.clientY * dpr - viewOffsetY) / viewScale
    };
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

  function uiButton(x, y, w, h, id, label, sub, hot) {
    game.uiButtons.push({ x: x, y: y, w: w, h: h, id: id });

    ctx.fillStyle = hot ? "rgba(70, 224, 192, 0.22)" : "rgba(255,255,255,0.07)";
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = hot ? "rgba(70, 224, 192, 0.8)" : "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "700 20px Consolas, 'Courier New', monospace";
    ctx.fillStyle = hot ? "#eaffff" : "#dfe8f2";
    ctx.fillText(label, x + w / 2, y + h / 2 - (sub ? 8 : 0));
    if (sub) {
      ctx.font = "500 12px Consolas, 'Courier New', monospace";
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillText(sub, x + w / 2, y + h / 2 + 12);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  function clickUi(viewX, viewY) {
    for (var i = game.uiButtons.length - 1; i >= 0; i--) {
      var b = game.uiButtons[i];
      if (viewX >= b.x && viewX <= b.x + b.w && viewY >= b.y && viewY <= b.y + b.h) {
        uiAction(b.id);
        return true;
      }
    }
    return false;
  }

  function goToMenu() {
    startGame();
    game.state = "menu";
  }

  function uiAction(id) {
    if (id === "play" || id === "retry") {
      startGame();
    } else if (id === "settings") {
      game.settingsRow = 0;
      game.state = "settings";
    } else if (id === "back" || id === "menu") {
      goToMenu();
    } else if (id === "resume") {
      if (game.state === "paused") {
        game.state = "playing";
      }
    } else if (id === "pause") {
      if (game.state === "playing" && !game.dead) {
        game.state = "paused";
        game.jumpHeld = false;
        game.fireHeld = false;
      }
    } else if (id === "volume-" || id === "volume+") {
      audioVolumeStep(id === "volume+" ? 1 : -1);
    } else if (id === "music-" || id === "music+") {
      musicVolumeStep(id === "music+" ? 1 : -1);
    }
  }

  function drawMainMenu() {
    var cx = VIEW_W / 2;

    ctx.fillStyle = "rgba(8, 12, 22, 0.55)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 62px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "#eef4fb";
    ctx.fillText("ROBO RUNNER", cx, 106);
    ctx.font = "600 15px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.fillText("REKORD " + pad(game.highscore), cx, 150);

    uiButton(cx - 150, 190, 300, 58, "play", "SPIELEN", "Leertaste / Klick");
    uiButton(cx - 150, 260, 300, 58, "settings", "EINSTELLUNGEN", "Taste E");

    ctx.textAlign = "center";
    ctx.font = "500 14px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    var lines = [
      "Springen: Leertaste/Klick - in der Luft nochmal für Doppelsprung",
      "Schießen: Enter - Pause: P/Esc - Ton: M, Lautstärke: - / +",
      "Benzin und Schrott sammeln, am Levelende durchs Portal"
    ];
    if (touchMode) {
      lines[1] = "Schießen: Feuer-Knopf unten rechts - Handy quer halten";
      lines.push("Vollbild: \"Zum Home-Bildschirm\" hinzufügen");
    }
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], cx, 366 + i * 24);
    }
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  function drawSettings() {
    var cx = VIEW_W / 2;
    var w = 560;
    var h = 306;
    var x = cx - w / 2;
    var y = 92;

    ctx.fillStyle = "rgba(8, 12, 22, 0.9)";
    rr(ctx, x, y, w, h, 20);
    ctx.fill();
    ctx.strokeStyle = "rgba(70, 224, 192, 0.55)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "800 30px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "#eef4fb";
    ctx.fillText("EINSTELLUNGEN", cx, y + 44);

    var rows = [
      { id: "volume", label: "Lautstärke", value: Math.round(audio.volume * 100) + "%", warn: !audio.enabled },
      { id: "music", label: "Musik", value: Math.round(music.volume * 100) + "%", warn: music.volume <= 0 }
    ];

    for (var i = 0; i < rows.length; i++) {
      var ry = y + 88 + i * 62;
      var hot = game.settingsRow === i;
      if (hot) {
        ctx.strokeStyle = "rgba(70, 224, 192, 0.45)";
        ctx.lineWidth = 2;
        rr(ctx, x + 14, ry - 8, w - 28, 60, 12);
        ctx.stroke();
      }

      ctx.textAlign = "left";
      ctx.font = "700 20px Consolas, 'Courier New', monospace";
      ctx.fillStyle = hot ? "#eaffff" : "#cfd9e6";
      ctx.fillText(rows[i].label, x + 32, ry + 22);

      uiButton(x + w - 208, ry, 44, 44, rows[i].id + "-", "-");
      ctx.textAlign = "center";
      ctx.font = "700 18px Consolas, 'Courier New', monospace";
      ctx.fillStyle = rows[i].warn ? "#ff8a6a" : "#ffd166";
      ctx.fillText(rows[i].value, x + w - 148, ry + 22);
      uiButton(x + w - 88, ry, 44, 44, rows[i].id + "+", "+");
    }

    ctx.textAlign = "center";
    ctx.font = "500 13px Consolas, 'Courier New', monospace";
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.fillText("Pfeiltasten: auswählen und ändern", cx, y + h - 78);

    uiButton(cx - 110, y + h - 62, 220, 46, "back", "ZURÜCK", "Esc");
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
  }

  function onJumpDown() {
    if (game.state === "shop") {
      if (game.shopLock <= 0) {
        startLevel(game.level + 1);
      }
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
    var isFire = code === "Enter" || code === "NumpadEnter";
    var isJump = code === "Space" || code === "ArrowUp" || code === "KeyW";
    var isUp = code === "ArrowUp" || code === "KeyW";
    var isDown = code === "ArrowDown" || code === "KeyS";
    var isLeft = code === "ArrowLeft" || code === "KeyA";
    var isRight = code === "ArrowRight" || code === "KeyD";

    if (code === "KeyM") {
      e.preventDefault();
      audioToggle();
      return;
    }
    if (code === "Minus" || code === "NumpadSubtract") {
      e.preventDefault();
      if (game.state === "settings" && game.settingsRow === 1) {
        musicVolumeStep(-1);
      } else {
        audioVolumeStep(-1);
      }
      return;
    }
    if (code === "Equal" || code === "NumpadAdd") {
      e.preventDefault();
      if (game.state === "settings" && game.settingsRow === 1) {
        musicVolumeStep(1);
      } else {
        audioVolumeStep(1);
      }
      return;
    }
    if (code === "KeyR") {
      e.preventDefault();
      startGame();
      return;
    }

    if (game.state === "settings") {
      e.preventDefault();
      if (isUp) {
        game.settingsRow = (game.settingsRow + 2) % 3;
      } else if (isDown) {
        game.settingsRow = (game.settingsRow + 1) % 3;
      } else if (isLeft) {
        if (game.settingsRow === 0) { audioVolumeStep(-1); }
        else if (game.settingsRow === 1) { musicVolumeStep(-1); }
      } else if (isRight) {
        if (game.settingsRow === 0) { audioVolumeStep(1); }
        else if (game.settingsRow === 1) { musicVolumeStep(1); }
      } else {
        goToMenu();
      }
      return;
    }

    if (game.state === "menu") {
      e.preventDefault();
      if (isJump || isFire) {
        startGame();
      } else if (code === "KeyE") {
        game.settingsRow = 0;
        game.state = "settings";
      }
      return;
    }

    if (game.state === "over") {
      e.preventDefault();
      if (code === "Escape") {
        goToMenu();
      } else if (isJump || isFire) {
        startGame();
      }
      return;
    }

    if (game.state === "paused") {
      e.preventDefault();
      if (code === "Escape") {
        goToMenu();
      } else if (code === "KeyP" || isJump || isFire) {
        game.state = "playing";
      }
      return;
    }

    if (game.state === "shop") {
      if (isJump || isFire) {
        e.preventDefault();
        onJumpDown();
        return;
      }
      if (game.shopLock <= 0) {
        var n = -1;
        if (code === "Digit1" || code === "Numpad1") { n = 0; }
        else if (code === "Digit2" || code === "Numpad2") { n = 1; }
        else if (code === "Digit3" || code === "Numpad3") { n = 2; }
        else if (code === "Digit4" || code === "Numpad4") { n = 3; }
        if (n >= 0) {
          e.preventDefault();
          buyShopItem(n);
        }
      }
      return;
    }

    if (game.state === "playing") {
      if (isJump) {
        e.preventDefault();
        onJumpDown();
        return;
      }
      if (isFire) {
        e.preventDefault();
        fireShot();
        return;
      }
      if (code === "KeyP" || code === "Escape") {
        e.preventDefault();
        game.state = "paused";
        game.jumpHeld = false;
        game.fireHeld = false;
      }
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
    requestFullscreen();

    var p = pointerToView(e);

    if (touchMode && game.state === "playing" && !game.dead) {
      var ddx = p.x - FIRE_BTN.x;
      var ddy = p.y - FIRE_BTN.y;
      if (ddx * ddx + ddy * ddy <= FIRE_BTN.r * FIRE_BTN.r) {
        game.fireHeld = true;
        fireShot();
        return;
      }
    }

    if (game.state === "shop" && game.shopLock <= 0) {
      for (var i = 0; i < game.shopRows.length; i++) {
        var r = game.shopRows[i];
        if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) {
          buyShopItem(r.index);
          return;
        }
      }
    }

    if (clickUi(p.x, p.y)) {
      return;
    }

    if (game.state === "menu" || game.state === "settings") {
      return;
    }

    onJumpDown();
  });

  window.addEventListener("pointerup", function () {
    game.fireHeld = false;
    releaseJump();
  });

  window.addEventListener("pointercancel", function () {
    game.fireHeld = false;
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

  startGame();
  game.state = "menu";

  resize();
  window.requestAnimationFrame(frame);
})();
