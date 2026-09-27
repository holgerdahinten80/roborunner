# Robo Runner – Projektstand

Browser-Spiel (HTML5 Canvas, Vanilla JavaScript, keine Bibliotheken, kein Build).
Diese Datei ist der vollständige Übergabestand: alles, was zum nahtlosen Weiterarbeiten nötig ist.

Stand: Level-System, Benzin-Währung, Leben, Shop, Schrott als Spielwährung, Gegner mit Angriffen,
Spieler-Schuss mit `Enter`, Explosionen, Lavagräben, Sound, Pause, Hochscore – in dieser Reihenfolge entstanden.

---

## 1. Starten

`index.html` doppelklicken oder im Browser öffnen (danach F5 zum Neuladen).
Kein Server, kein Build, kein Node nötig – alles läuft über `file://`.

Getestet auf Windows/Chrome. Läuft prinzipiell auch mobil (Touch ist verdrahtet),
offene Punkte dafür stehen in Abschnitt 9.

---

## 2. Dateien

| Datei | Inhalt |
|---|---|
| `index.html` | Nur Canvas + Script-Tag, ~14 Zeilen |
| `style.css` | Vollbild, kein Scroll, `touch-action: none` |
| `game.js` | **Das ganze Spiel**, eine IIFE mit `"use strict"`, ~3.200 Zeilen |
| `kilo.json` | Tool-Config: erlaubt `cscript`-Bash-Befehle ohne Rückfrage |
| `SPIEL.md` | Diese Datei |

Es gibt **keine** Assets: Grafik ist komplett Canvas-Zeichnung, Sound komplett synthetisch (Web Audio).
Neue Gegner/Hindernisse brauchen also nur Code, keine Dateien.

---

## 3. Steuerung

| Taste / Geste | Wirkung |
|---|---|
| `Leertaste`, `↑`, `W`, Tippen/Klick | Springen (im Level: auch Wert im Shop bestätigen) |
| In der Luft nochmal | Doppelsprung (mit Shop-Upgrade ein dritter Sprung) |
| `Enter` / `NumpadEnter` | **Schießen** (nur im laufenden Level); im Shop/Titel/Game-Over = weiter |
| `1` `2` `3` `4` | Im Shop Artikel kaufen (Klick auf die Zeile geht auch) |
| `P` / `Esc` | Pause an/aus |
| `R` | Lauf sofort neu starten |
| `M` | Ton an/aus (gespeichert) |
| `-` / `+` | Lautstärke in 10-%-Schritten (gespeichert) |
| Klick neben die Shop-Zeilen | Weiter zum nächsten Level |

Sprung ist **variabel**: kurz tippen = niedrig (Jump-Cut), halten = maximal hoch.
Zusätzlich: Input-Buffer 0,13 s und Coyote-Time 0,1 s am Grabenrand.

---

## 4. Spielablauf

Endlos-Runner: der Roboter steht bei `x = 168` fest, die Welt scrollt von rechts nach links.
Ein Level endet an einem Ziel-Gate; dort öffnet sich der Shop, dann folgt das nächste Level.

### Level-Parameter

| Größe | Formel / Wert |
|---|---|
| Länge | `15600 + (level-1) * 4200` px (Level 1 dauert ca. 32 s, Länge wächst pro Level) |
| Starttempo | `min(940 - 140, 330 + (level-1) * 45)` px/s |
| Tempo im Level | `min(940, startTempo + distance * 0.022)` |
| Schwierigkeit `d` | `clamp((speed-330)/610 + min((level-1)*0.12, 0.5), 0, 1)` – steigt mit Tempo **und** Level |

### Punktestand

`score` wächst kontinuierlich (`distance/10`), plus +5 pro passiertem Hindernis/Graben,
+15 pro Benzinkanister, +`value*4` pro Schrottteil, +25 pro abgeschossenem Gegner,
+10 pro abgefangener Gegnerkugel, +100 pro Ersatz-Roboter, +100 pro Level, am Levelende
`+2 * Restbenzin` als Bonus. Rekord liegt in `localStorage`.

### Benzin (Fortschrittsgrenze)

| Größe | Wert |
|---|---|
| Verbrauch | `100 / 4600` pro px → **ein voller Tank reicht 4600 px** (rein streckenbasiert, nicht zeitbasiert) |
| Kanister | +25 %, Deckel bei `fuelMax` |
| Start | Tank voll bei jedem Levelstart (`fuel = fuelMax`) |
| Tank-Upgrade | `fuelMax` startet 100, +25 pro Shop-Kauf |
| Leer | kostet **ein Leben**, Respawn mit mindestens 45 % |
| Warnung | Ton bei Unterschreiten von 25 %, Wiederholung alle 0,55 s unter 12 % |
| Kanister-Dichte | alle `max(900, 1300-(level-1)*25)` px, ±6 % Streuung |

Kanister hängen **überwiegend in der Luft** (70 %, Höhe 110–150 px über dem Boden – nur per Sprung
erreichbar, absichtlich kein „im Vorbeifahren einsammeln“), 30 % liegen am Boden.
35 % der Luftkanister kommen als Doppelpack im Bogen (36 px versetzt).
Liegt ein Kanister über Hindernis/Graben, wird er automatisch angehoben; eine Presse löscht ihn.

### Schrott (Spielwährung) und Shop

Schrottteile liegen alle 240–430 px, 35 % in der Luft (96–146 px hoch). Werte und Häufigkeit:

| Typ | Wert | Gewicht |
|---|---|---|
| Schraube | 1 | 34 |
| Feder | 2 | 26 |
| Zahnrad | 3 | 20 |
| Blech | 4 | 13 |
| Spule | 6 | 7 |

Schrott gilt pro Lauf (wird bei Spielstart auf 0 gesetzt) und bleibt über die Level erhalten.
Spawn wird verworfen, wenn Hindernis oder Graben im Weg ist (wird im nächsten Frame erneut versucht).

Shop zwischen den Leveln (Tasten `1`–`4`, Klick auf die Zeile, 0,9 s Eingabesperre beim Öffnen):

| # | Artikel | Kosten | Wirkung | Grenze |
|---|---|---|---|---|
| 1 | Ersatz-Leben | 30 | +1 Leben | max 3 |
| 2 | Tank-Erweiterung | 20 | `fuelMax` +25 | max 200 |
| 3 | Schutzschild | 12 | fängt den nächsten Treffer ab | max 1 |
| 4 | Zusatz-Sprung | 45 | 3. Sprung in der Luft (schwächer, 560 px/s) | einmalig |

Nicht kaufbare Artikel zeigen `MAX` bzw. roten Preis und geben eine Meldung.

### Leben

- **3 Roboter. Kein Refill beim Levelwechsel** – Leben laufen durch den ganzen Lauf.
- Seltener Ersatz-Roboter: pro Level mit 50 % Chance, aber **nur wenn Leben < 3**; schwebt
  220 px hoch (nur mit Doppelsprung erreichbar) und gibt +1 Leben, +100 Punkte.
- Verlust kostet 1 Leben: Hindernis, Graben, Lava, Gegner oder leerer Tank.
- Bei noch vorhandenen Leben: Explosion, 0,85 s Freeze (bei leerem Tank 0,55 s, ohne Explosion),
  dann Respawn an Ort und Stelle, 1,5 s unverwundbar, Tank min. 45 %,
  Hindernisse/Gräben im Bereich `x-140 … x+470` werden geräumt (kein Kettenunfall).
- Bei 0 Leben: „GAME OVER" mit Ursache (Graben / Lavatropfen / Gegner / Tank leer / Hindernis),
  Punkte, Rekord, Level, Schrott, Benzin.

### Hindernisse

| Typ | Größe | Verhalten |
|---|---|---|
| `crate` | 46×46 | Holz, statisch |
| `pylon` | 36×68 | Warnstreifen, Blinkleuchte |
| `block` | 76×36 | Beton |
| `barrel` | 42×56 | Fass mit Ringen |
| `cone` | 40×46 | Verkehrskegel |
| `tower` | 34×132 | **nur mit Doppelsprung** überwindbar (Einzelsprung schafft 109 px, Krone liegt 20 px darüber) |
| `crusher` | 46×46 | hängt an Deckenschiene, fährt 200 px auf/ab (`rate` 2,4–3,3) – oben durchlaufen, unten überspringen, mittig nur per Doppelsprung |

Spawn-Takte (alle Werte werden mit der Schwierigkeit kürzer, Untergrenzen in Klammern):
Hindernisse `rand(1.45,1.95) - d*0.62` (0.74 s) · Gräben `rand(1.25,1.7) - d*0.42` (0.86 s) ·
Presse `rand(1.5,2.0) - d*0.45` (0.85 s, Chance `0.2+d*0.2` ab `d>0.12`) ·
Turm `rand(1.8,2.3) - d*0.4` (1.2 s, Chance 18 % ab `d>0.2`, braucht 320 px freie Anlaufzone).

### Gräben und Lava

- Grabenbreite `speed * (0.22 + d*0.2 + rand(0,0.06))`, geklemmt auf 92–358 px.
  Weil die Breite mit dem Tempo skaliert, ist die nötige Flugzeit konstant (~0,3–0,42 s von 0,49–0,62 s Sprungzeit).
- 40 % + `d*0.2` der Gräben sind **Lavagräben** (glühende Füllung, Blasen, Lichtschein).
- Jeder Lavagraben spuckt einen **Lavatropfen** (32×34), der sinusförmig zwischen 30 px **unter** und
  170 px **über** dem Boden pendelt (`rate` 2,2–2,8).
  Dadurch gibt es drei Fälle: Tropfen tief → einfacher Sprung; Tropfen auf Flughöhe → nur Doppelsprung;
  Tropfen hoch → einfacher Sprung (Doppelsprung würde treffen). Verifiziert: alle Tropfenpositionen lösbar.
- Kein Spawn von Hindernissen/Gräben/Gegnern in den letzten 900 px vor dem Ziel,
  keine Kanister in den letzten 320 px, kein Schrott in den letzten 260 px.

### Gegner (greifen aktiv an)

Kontakt kostet ein Leben („GEGNER - 1 LEBEN WEG"), Schild fängt es ab. Spawn nur in freien Lücken
(`rightmostEdge() < VIEW_W - 340`) und nicht im Zielbereich, eigener Takt `1.0–2.4 s - d*0.4`.

| Typ | Größe | Angriff | Konter |
|---|---|---|---|
| Krabbler | 46×38 | läuft dem Roboter entgegen (`70 + level*9`, max 160 px/s) | einfacher Sprung oder Schuss |
| Drohne | 42×28 | schwebt 168±22 px hoch, **Sturzangriff** (330 px/s) sobald unter 580 px, steigt mit 300 px/s wieder auf | oben: durchlaufen, tief: überspringen oder Schuss |
| Geschützturm | 46×52 | **schießt** im Bereich 208–780 px alle 1,2–1,8 s (erstmalig nach 0,32–0,6 s) | Turm und Kugel überspringen oder Kugel abschießen |

Gegnerkugel: 18×13 auf Höhe `GROUND_Y-48`, Fluggeschwindigkeit `Welt + 230 px/s` (kommt also schneller als der Scroll).
Mischungsverhältnis: Krabbler 42 %, Drohne 34 %, Turm 24 %.

### Schießen

- `Enter`, Cooldown 0,26 s. Schuss ist 24×9 groß, startet an der Roboterbrust (`robot.y - 42`)
  und fliegt mit 900 px/s nach rechts.
- **Die Schusshöhe ist die Abschusshöhe** – hoch schwebende Drohnen trifft man nur, wenn man im
  Sprung feuert. Das ist das „gezielte" Element.
- Trifft Gegner (sofort zerstört: Explosion, +25 Punkte, +1 Schrott, Schrott-Label) und
  Gegnerkugeln (abgefangen, +10 Punkte). **Hindernisse/Gräben werden nicht zerstört** –
  die Level-Herausforderung bleibt bestehen.

### Explosionen

Bei jedem Treffer (außer leerer Tank) zerlegt es den Roboter: 2 Feuerbälle (weiß/glühend + orange),
expandierender Schockwellen-Ring, 15 rotierende Trümmerteile, 11 Rauchschwaden (steigen auf,
`grav < 0`), 28 Funken, Screenshake 22, roter Blitz, plus 0,85 s eingefrorene Welt.
Während des Freeze wird der Roboter nicht gezeichnet (`robot.destroyed`).

---

## 5. Architektur (`game.js`)

Eine IIFE, alles in Closure-Scope. Reihenfolge im File: Konstanten → `game`/`robot`-Objekte →
Persistenz + Audio + SFX → Helfer (`rr`, `clamp`, `rand`) → Level-/Lebens-Logik → Spawn-Funktionen →
`update` → Zeichenfunktionen → HUD/Overlays → Eingabe → Resize → RAF-Schleife.

### Zustände (`game.state`)

| Zustand | Bedeutung |
|---|---|
| `ready` | Titel, Welt scrollt langsam, Roboter läuft ohne Hindernisse |
| `playing` | normales Spiel; Unterzustand `game.dead = true` während der Explosionspause |
| `paused` | Pause (Blur pausiert automatisch, Ton wird suspendiert) |
| `shop` | Level geschafft, Shop wartet auf Eingabe (kein Auto-Weiter) |
| `over` | Game Over, Roboter bleibt zerstört (wird nicht gezeichnet) |

### Update-Reihenfolge pro Frame

`game.time += dt` → Shop-Zweig (Timer, FX, return) → Dead-Zweig (Freeze, FX, `finishDeath`, return) →
Tempo/Distanz/Score/Benzin + Levelabschluss-Prüfung → Invuln/Notice-Timer → Roboter-Physik →
Spawning → Bewegung von Hindernissen/Gräben/Kanistern/Schrott/Spare → Gegner + Schüsse → Aufsammeln →
Kollisionen (Hindernis → Lava → Gegner → Graben, Schild fängt ab) → Partikel/Blasts/Shake/Flash.

Eingabe wird über `game.jumpBuffer` (Springen), `game.shotCooldown` (Schießen) und
`game.shopLock` (Shop) entkoppelt – nie direkt aus dem Event heraus Physik ändern.

### Render-Reihenfolge (Welt-Layer)

Himmel → Hügel → Gräben inkl. Lava+Tropfen → Boden (segmentiert, damit Gräben echte Lücken sind) →
Ziel-Gate → Kanister → Ersatz-Roboter → Schrott → Hindernisse → Gegner → Gegnerkugeln → Spielerschüsse →
Partikel → Blasts → Labels → Roboter → HUD → Overlays → Vignette.

### Koordinaten

Virtuelle Auflösung **960×540**, `GROUND_Y = 444`. Letterbox-Skalierung auf Fenstergröße mit
`devicePixelRatio` (max 2), dann `ctx.setTransform(viewScale,0,0,viewScale,viewOffsetX,viewOffsetY)`.
Für Klick-Hit-Tests: `pointerToView(e)` rechnet Client- in virtuelle Koordinaten um.

### Kollisionsboxen (großzügig, damit es fair wirkt)

Roboter 48×60 bei `x=168`; Trefferbox mit Einschüben: oben +6, unten −3, seitlich ±6.
Hindernisse ±6 seitlich; Gegner ±4; Lavatropfen ±3; Aufsammelobjekte (Kanister/Schrott/Spare)
werden mit +6/+10 Bonus geprüft (leichter einzusammeln als zu treffen).

### Wichtige Konstanten (alle am File-Anfang)

```
GRAVITY 3050 · HOLD_GRAVITY 2400 · JUMP 745 · DOUBLE_JUMP 645 · TRIPLE_JUMP 560 · JUMP_CUT 380
COYOTE 0.1 · JUMP_BUFFER 0.13 · MAX_SPEED 940 · SPEED_RAMP 0.022
START_LIVES 3 · FUEL_MAX 100 · FUEL_PER_PIXEL 100/4600 · FUEL_PER_CAN 25 · RESPAWN_FUEL 45
INVULN_TIME 1.5 · SPARE_CHANCE 0.5 · SPARE_LIFT 220 · LAVA_CHANCE 0.4
SHOT_SPEED 900 · SHOT_COOLDOWN 0.26 · SHOT_SCORE 25 · BULLET_SPEED 230 · SHOP_LOCK_TIME 0.9
```

Gemessene Sprunghöhen (Roboterfuß): Einzelsprung 109 px, Doppelsprung 188 px, Zusatz-Sprung 218 px.
Daraus folgen die Hindernishöhen: alles bis 100 px ist einfach, `tower` (132 px) nur doppelt.

### Persistenz (`localStorage`)

| Key | Inhalt |
|---|---|
| `roborunner.highscore` | bester Punktestand |
| `roborunner.sound` | `"on"` / `"off"` |
| `roborunner.volume` | 0 … 1 (Default 0,6) |

Schrott und Upgrades sind **bewusst nicht** dauerhaft (Meta-Progression wurde abgelehnt).

### Audio

Web Audio, komplett synthetisch (`tone()` mit Oszillator + Hüllkurve, `noise()` mit Lowpass-Rauschen).
Der `AudioContext` wird erst beim ersten Tastendruck/Klick erzeugt (Autoplay-Sperre), bei Blur
suspendiert. Sounds: Sprung, Doppelsprung, Kanister (Tonhöhe steigt mit Combo), Schrott,
Spielerschuss, Gegnerschuss, Gegnerabschuss, Crash-Explosion, Grabensturz, Lava, Schild, Tank leer,
Warnpiepen, Kauf, abgelehnter Kauf, Level-Fanfare, Extra-Leben, Game Over.

---

## 6. Test-Vorgehen (wichtigste Info für die Fortsetzung)

Node ist auf diesem Rechner **nicht installiert**. Getestet wird headless über den
Windows-JScript-Interpreter `cscript`, der `game.js` mit gestubbten Browser-APIs lädt:

```powershell
& cscript.exe //nologo //E:JScript "C:\Users\holge\AppData\Local\Temp\kilo\<test>.js" 2>&1 | Out-String
```

`kilo.json` erlaubt `cscript`-Aufrufe ohne Rückfrage.

### Rezept

1. Testdatei unter `C:\Users\holge\AppData\Local\Temp\kilo\` anlegen (nicht im Projekt, sonst im Repo).
2. `game.js` per `FSO.OpenTextFile` einlesen und `eval(src)` ausführen.
3. Stubs bereitstellen: `document.getElementById` → Canvas-Stub, `canvas.getContext("2d")` → Objekt mit
   allen benutzten Methoden (`fillRect`, `arc`, `ellipse`, `arcTo`, `clip`, `translate`, `rotate`,
   `scale`, `setTransform`, `save`, `restore`, `fillText`, `createLinearGradient`,
   `createRadialGradient`, Gradient-Stub mit `addColorStop`), `window.addEventListener` (Handler in
   einem Objekt sammeln), `window.requestAnimationFrame` (Callback merken und manuell takten),
   `window.localStorage` (einfaches Objekt).
4. `window.innerWidth/innerHeight/devicePixelRatio` setzen (z. B. 1280×720/1).
5. `saveDepth` in den `save`/`restore`-Stubs mitzählen → prüft, dass alle Zeichenpfade balanciert sind
   (max. Tiefe ist derzeit 4).
6. Frames manuell takten: `rafCallback(t); t += 16.7;` – so laufen Tests deterministisch.
7. Zufall steuern: `Math.random` überschreiben; **den echten Zufall vorher merken**, sonst überschreibt
   man sich selbst. Fester Wert (z. B. `0.5`) macht auch die Hindernis-/Gegnerwahl deterministisch.
8. Eingaben über die gesammelten Key-Handler mit `{ code: "Space", repeat: false, preventDefault(){} }`
   senden; Klicks mit `{ clientX, clientY }` (Umrechnung: `client * dpr / viewScale`).
9. Für Zustandseinblicke temporär am Ende der IIFE einen Debug-Hook einbauen:
   ```js
   window.__roboDebug = function () { return { state: game.state, g: game, obstacles: game.obstacles, /* ... */ }; };
   ```
   **Nach den Tests wieder entfernen** (im Projekt ist er nie dauerhaft drin).
10. Aufräumen: Testdateien am Ende löschen, sonst liegen sie im Temp-Ordner herum.

### Fallstricke (schon mehrfach passiert)

- **JScript ist ES3**: kein `JSON`, keine Typed Arrays, keine `const/let`, kein Template-Literal.
  `Float32Array` im Audio-Stub durch ein normales Array ersetzen.
- `ctx.scale` im Stub nicht vergessen (der Roboter-/Schrott-Zeichencode nutzt es).
- Signatur von Test-Helfern nicht verwechseln: `run(label, count, action)` – ein Aufruf ohne Label
  lief 0 Frames und erzeugte scheinbare Spielfehler.
- `indexOf` ist case-sensitiv: Hinweise heißen z. B. `"GRABEN - 1 LEBEN WEG"`, nicht `"Graben"`.
- Bei Fairness-Tests immer ein **Timing-Sweep** (mehrere Sprungzeitpunkte) statt eines festen
  „Vorlaufs“ – ein zu früher Sprung lässt niedrige Hindernisse unüberwindbar erscheinen.
- Todeszeitpunkte verschieben sich durch die 0,85 s Explosionspause; Text-Marker statt Framezahlen prüfen.

---

## 7. Verifikationsstand

Alles unten ist per Headless-Test nachgewiesen (Tests danach wieder gelöscht):

- Steuerung/HUD: Titel, HUD ohne Tempo- und Sprunganzeige, Level- und Benzinanzeige, alle Regeln im Titel
- Physik: Sprunghöhen (109/188/218 px), Graben-Sprungfenster 6 von 21 Timings, 7 von 11 für Krabbler/Turm/Drohne/Schuss
- Benzin: Verbrauch exakt 4600 px pro Tank, Kanister +25 %, Deckel greift, Tank leer kostet ein Leben,
  Kanister-Verteilung ~80 % in der Luft, Kanister über Gräben werden angehoben
- Schrott/Shop: 5 Typen mit unterschiedlichen Werten, alle vier Käufe inkl. Preisabbuchung,
  Ablehnung bei „voll“/zu wenig, Klick-Kauf, Übernahme ins nächste Level, Tankdeckel
- Gegner: alle drei Typen spawnen, Drohne stürzt ab und steigt auf, Turm schießt, Gegnertreffer kostet
  ein Leben (Ursache `enemy`), Schild fängt ab
- Explosion: 3 Feuerball-/Ring-Effekte, 15 Trümmer, 11 Rauch, Welt eingefroren, Respawn nach ~51 Frames,
  kein Feuerball bei leerem Tank, Game Over ohne Roboter
- Schießen: Enter feuert (Cooldown wirkt), Gegner zerstört (+32 Punkte inkl. Distanz, +1 Schrott),
  Kugel abgefangen, fliegt durch Hindernisse, hoch schwebende Drohne per Sprung+Schuss abschießbar
- Robustheit: 29 525 Frames Realzufalls-Lauf ohne Laufzeitfehler, `save`/`restore` immer balanciert

Nicht sinnvoll headless prüfbar und daher **nicht** verifiziert: das tatsächliche Aussehen
(Layout, Lesbarkeit, Farbwirkung) und der Klang. Bei Grafikänderungen lohnt ein Blick im Browser.

---

## 8. Bekannte Eigenheiten

- `game.time` läuft in `paused` weiter (Animationen von Blinkleuchten, Panels pulsieren).
  Weltbewegung und Gegner sind aber an `state === "playing"` gebunden.
- Während der Explosionspause steht die Welt komplett (gewollt, das ist der Impact).
- Der Roboter bleibt im Game-Over ausgeblendet (`robot.destroyed`), weil er explodiert ist.
- Der Zielbalken im HUD ist `distance / levelLength`; das Gate wird aus dem Restweg berechnet, driftet also nicht.
- Git: nur ein Commit („Robo Runner: …“, `1da8ba1`) vom Zeitpunkt vor allen späteren Features;
  Schrott, Shop, Gegner, Explosionen, Schießen sind noch **nicht committet**.

---

## 9. Nächste sinnvolle Schritte

1. **Schießen auf Touch**: Enter ist gesetzt, mobil fehlt eine zweite Geste (z. B. Tap in der
   unteren Bildhälfte rechts = Schuss, oder ein gezeichneter Feuer-Button).
2. **Munition / Wärme**: Schießen ist derzeit unbegrenzt (nur 0,26 s Cooldown) – falls es zu stark wird,
   Munition als Pickup (analog Benzin) oder Überhitzung einführen.
3. **Shop-Erweiterung**: Schnellfeuer (kürzerer Cooldown), Doppelschuss, Gegner-Schaden-Upgrade –
   die Item-Tabelle `SHOP_ITEMS` ist generisch, aber Tasten `1`–`4` und Panelhöhe müssten mitwachsen.
4. **Gegner-Varianten**: Trefferpunkte > 1 („Panzergegner“), Gegner, die Hindernisse legen,
   oder ein Zwischengegner am Levelende.
5. **Level-Bonus**: Schrott für Restbenzin oder für unverletzt durchgespielte Level.
6. **PWA/Verpackung** für Android/iOS (Manifest + Service Worker) – laut ursprünglichem Ziel.
7. **Meta-Progression**, falls doch gewünscht: Schrott dauerhaft speichern und Upgrades zwischen Runs kaufen.

---

## 10. Änderungshistorie (chronologisch)

1. Grundgerüst: Endlos-Runner, Hindernisse, variable Sprünge, Punkte/Rekord, Partikel
2. Gräben als echte Bodenlücken + Doppelsprung, niedrigerer Einzelsprung
3. Hindernis-Optik ausgebaut (Kiste/Pylon/Beton/Fass/Kegel) + Presse mit vertikaler Bewegung
4. Level mit Ziel-Gate, Benzin als Fortschrittsgrenze, 3 Leben, Tempo- und Sprunganzeige entfernt
5. Level 3× länger, Benzinverbrauch gesenkt, Kanister schwerer erreichbar, Schwierigkeit pro Level
6. Leben bleiben über Level, seltener Ersatz-Roboter, Turm nur mit Doppelsprung
7. Lavagräben mit auf- und abfliegendem Lavatropfen (gezielter Einzel- oder Doppelsprung)
8. Schrott als Spielwährung + Shop zwischen den Leveln
9. Roboter explodiert richtig beim Aufprall, Welt friert kurz ein
10. Gegner: Krabbler, Drohne mit Sturzangriff, Geschützturm mit Beschuss
11. Spieler-Schuss mit `Enter`
12. Git-Repo angelegt, Projekt-Doku erstellt

---

## 11. Befehle für den Alltag

```powershell
# Syntax prüfen (erwartet: "document is undefined", das heißt: Parsen ok)
& cscript.exe //nologo //E:JScript "C:\Projekte\Testspiel\game.js" 2>&1 | Out-String

# Spiel öffnen
Start-Process "C:\Projekte\Testspiel\index.html"

# Git
git -C C:\Projekte\Testspiel status --short
git -C C:\Projekte\Testspiel log --oneline
```
