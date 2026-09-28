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
| `game.js` | **Das ganze Spiel**, eine IIFE mit `"use strict"`, ~4.000 Zeilen |
| `manifest.json` | Web-App-Manifest: Vollbild-Anzeige, Icons, Name (für „Zum Home-Bildschirm") |
| `sw.js` | Service Worker: cached die Dateien, damit es offline und installierbar läuft |
| `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | App-Icons (512/192/180 px, per PowerShell/System.Drawing erzeugt) |
| `kilo.json` | Tool-Config: erlaubt `cscript`-Bash-Befehle ohne Rückfrage |
| `AGENTS.md` | Regeln für Agenten (u. a. automatisch committen) |
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
| `P` / `Esc` | Pause an/aus (in der Pause: `P`/`Leertaste` weiter, `Esc` ins Hauptmenü) |
| `R` | Lauf sofort neu starten |
| `M` | Ton an/aus (gespeichert) |
| `-` / `+` | Lautstärke in 10-%-Schritten (gespeichert) |
| Klick neben die Shop-Zeilen | Weiter zum nächsten Level |
| Hauptmenü | `Leertaste`/`Enter`/Klick **SPIELEN** = Lauf starten, `E`/**EINSTELLUNGEN**, `P`/**PROFIL** |
| Profil | `↑`/`↓` wählt Name/Zurück, `Enter`/Klick auf die Namenszeile = Namen eingeben, dann tippen und `Enter` = fertig (`Esc` = abbrechen), `Esc` = zurück |
| Einstellungen | `↑`/`↓` wählt Zeile, `←`/`→` (oder `-`/`+`) ändert den Wert, `Enter` schaltet/öffnet, `Esc` zurück; Klick auf `-`/`+` geht auch |
| Steuerung (Untermenü) | `↑`/`↓` wählt, `Enter` belegt die Taste neu („Taste drücken …"), `Esc` bricht ab bzw. geht zurück; „Standard" setzt auf Leertaste/Enter |
| Game Over | `Leertaste` = nochmal, `Esc` = Hauptmenü (Knöpfe anklickbar) |
| **Handy:** Tippen irgendwo | Springen (Doppelsprung = zweimal tippen) |
| Eigene Tasten | Sprung- und Schusstaste sind frei belegbar (Einstellungen → Steuerung), Standard bleibt Leertaste und Enter |
| **Handy:** Feuer-Knopf unten rechts | Schießen, halten feuert dauerhaft |
| **Handy:** Pause-Knopf unten links | Pause; im Pausenmenü WEITER oder HAUPTMENÜ antippen |

Sprung ist **variabel**: kurz tippen = niedrig (Jump-Cut), halten = maximal hoch.
Zusätzlich: Input-Buffer 0,13 s und Coyote-Time 0,1 s am Grabenrand.

---

## 4. Spielablauf

Endlos-Runner: der Roboter steht bei `x = 168` fest, die Welt scrollt von rechts nach links.
Ein Level endet an einem **Portal** (früher ein Ziel-Gate). Es ist ein freistehender Wirbel ohne
Rahmen oder Stangen: vier unterschiedlich schnell und gegenläufig rotierende Ringe, heller Kern,
umlaufende Funken, Bodenlichtung und die Beschriftung „PORTAL" darüber. Beim Durchgang wird der
Roboter ausgeblendet, es gibt Blitz, Schockwellen und einen eigenen Sound, dann öffnet sich der Shop.

### Level-Parameter

| Größe | Formel / Wert |
|---|---|
| Länge | `12600 + (level-1) * 3600` px (Level 1 dauert ca. 33 s, Länge wächst pro Level) |
| Starttempo | `min(820 - 160, 330 + (level-1) * 40)` px/s → Level 1: 330, Level 5: 490 |
| Tempo im Level | `min(820, startTempo + distance * 0.008) * Touch-Faktor` – steigt nur noch sanft an |
| Touch-Faktor | auf Touchgeräten `0.85` (alles 15 % langsamer, weil Tippen unpräziser ist) |

**Das Tempo steigt bewusst hauptsächlich mit der Levelnummer**, nicht mehr innerhalb eines Levels:

| Level | Start | Ende | vorher (Ende) |
|---|---|---|---|
| 1 | 330 | 431 | 673 |
| 2 | 370 | 500 | 726 |
| 3 | 410 | 568 | 780 |
| 4 | 450 | 637 | 833 |
| 5 | 490 | 706 | 940 |

Auf dem Handy zusätzlich ×0,85 (Level 1: 281 → 366 px/s, Level 5: 417 → 600 px/s). Der Verlauf
skaliert auch die Hindernisbreiten mit, weil die Grabenbreite aus `game.speed` berechnet wird –
die nötige Flugzeit bleibt dadurch unverändert fair.
| Hindernis-Takt | `spawnGap() = max(0.85, 2.2 * 0.82^(level-1))` s – **rein levelbasiert**, das Tempo im Level erhöht den Druck über die kürzere Reaktionszeit |
| Gegner-Takt | `enemyGap() = max(1.15, 2.6 * 0.85^(level-1))` s |
| Graben-Anteil | `pitChance() = clamp(0.22 + (level-1)*0.05, 0, 0.45)` der Spawns |
| Grabenbreite | `speed * (0.20 + min(0.24, (level-1)*0.06) + rand(0,0.05))`, geklemmt 92–358 px |

**Anzahl der Hindernisse steigt pro Level** (gemessen über je 50 s auf gleicher Level-Position,
Hindernisse + Gräben + Gegner): Level 1 ≈ 36, Level 2 ≈ 79, Level 3 ≈ 97, Level 5 ≈ 134.
Der Spawnabstand sinkt dabei von 2,30 s (Level 1) auf 1,12 s (Level 5).

**Sonderhindernisse und Gegner sind gestaffelt** (`levelUnlocks()` = `level >= 2`):

| Level 1 | ab Level 2 |
|---|---|
| nur statische Hindernisse und Gräben (ohne Lava) | zusätzlich Türme, Pressen, Lava und doppelte Hindernisse |
| keine Gegner in der ersten Levelhälfte | Gegner von Anfang an, alle drei Typen |
| Gegner danach nur **Krabbler** | Krabbler 42 %, Drohne 34 %, Turm 24 % |

Chancen ab Level 2 (gedeckelt): Turm `min(0.3, 0.12+(level-2)*0.04)` ·
Presse `min(0.35, 0.14+(level-2)*0.05)` · Doppelhindernis `min(0.32, 0.1+(level-2)*0.05)` ·
Lava `min(0.65, 0.3+(level-2)*0.1)`.
Level 1 startet außerdem mit 2,4 s Vorlauf bis zum ersten Hindernis statt 1,2 s.

### Kulissen pro Level

Jedes Level hat eine eigene Hintergrundkulisse (`BIOMES`-Array, Zugriff über `biome()`;
nach Level 5 wiederholt es sich). Die Kulisse steuert Himmelsverlauf, Himmelskörper,
Sterne, zwei Parallax-Ebenen, die Bodenfarben und einen Umgebungseffekt:

| Level | Kulisse | Himmel | Himmelskörper (`orb`) | Parallax-Ebenen | Boden | Effekt |
|---|---|---|---|---|---|---|
| 1 | DAEMMERUNG | Abendblau → Violett → Orange | glutorangener Planet mit violetten Bändern, Halo | sanfte Hügel (Sinuskurve) | violett-grau, Kante Amber | – |
| 2 | WUESTE | Violett → Sand | Sandgasriese mit **Ring** (Bänder in Ocker/Creme) | Dünen (flache Sinuskurve) | warmes Sandbraun, Kante Hellgold | – |
| 3 | NACHTSTADT | fast schwarz → Mitternachtsblau | blau-grüne Welt mit Bändern, Randlicht | Silhouetten-Stadt mit erleuchteten Fenstern | Indigo, Kante Hellblau | – |
| 4 | EISFELD | Nachtblau → Eisblau → Weiß | blassblauer Eisplanet mit **Ring**, Bänder hellblau/weiß | Berggipfel (Sägezahn) | blaugrau, Kante Eisweiß | Schneefall |
| 5 | VULKAN | Schwarz → Glutrot | Magmaglut mit rotglühenden Bändern und dunkler Terminatorlinie | Vulkan mit leuchtendem Krater + Gipfel | schwarzrot, Kante Glutorange | aufsteigende Glut |

Jeder Himmelskörper wird als **Kugel mit Eigenfarbe** gezeichnet (`drawPlanet()`): Halo, Kugel mit
Verlauf von beleuchteter Seite (`lit`) über Grundton (`base`) zur Schattenseite (`dark`), drei
Bänder, zwei Flecken, ein Randlicht für die Atmosphäre. Wüste und Eisfeld haben zusätzlich einen
**Ring** (`drawPlanetRing()`), der in zwei Durchgängen gezeichnet wird – hinter dem Planeten und,
per Clip auf die untere Hälfte, davor.

**Der Boden ist auf den Planeten abgestimmt** (`ground: { fill, edge, dash }` pro Kulisse): Füllung im
Farbton des Himmelskörpers, Kantenton in dessen Lichtfarbe, Markierungen passend dazwischen.
Die Gräben übernehmen das ebenfalls: Wände werden mit `rgbaFromHex(orb.lit, …)` beleuchtet, die
Schattenkante mit `orb.dark`, die Tiefe bekommt einen schwachen Ton der Bodenfüllung – ein Graben
liegt also farblich in der jeweiligen Kulisse.

Die Ebenen-Kulissen kennen vier Formen: `hill`, `dune`, `city` (Rechtecke mit Fenstern), `peak`
(Sägezahn) und `volcano` (Kegel mit abgeflachtem Krater). Schnee und Glut sind zustandslos aus
`hash01(i)` + `game.time` berechnet, brauchen also keine Partikelverwaltung.
Der HUD-Leveltitel zeigt den Kulissennamen mit an (`LEVEL 3 · NACHTSTADT`).

### Punktestand

`score` wächst kontinuierlich (`distance/10`), plus +5 pro passiertem Hindernis/Graben,
+15 pro Benzinkanister, +`value*4` pro Schrottteil, +25 pro abgeschossenem Gegner,
+10 pro abgefangener Gegnerkugel, +100 pro Ersatz-Roboter, +100 pro Level, am Levelende
`+2 * Restbenzin` als Bonus. Rekord liegt in `localStorage`.

### Benzin (Fortschrittsgrenze)

| Größe | Wert |
|---|---|
| Verbrauch | `100 / 5600` pro px → **ein voller Tank reicht 5600 px** (rein streckenbasiert, nicht zeitbasiert) |
| Kanister | +25 %, Deckel bei `fuelMax` |
| Start | Tank voll bei jedem Levelstart (`fuel = fuelMax`) |
| Tank-Upgrade | `fuelMax` startet 100, +25 pro Shop-Kauf |
| Leer | kostet **ein Leben**, Respawn mit mindestens 45 % |
| Warnung | Ton bei Unterschreiten von 25 %, Wiederholung alle 0,55 s unter 12 % |
| Kanister-Dichte | Basis `max(700, 1040-(level-1)*18)` px, multipliziert mit einer Welle (0,88–1,12) und ±4 % Streuung → kleinster Abstand ~920 px (Level 1) bzw. ~850 px (Level 5) |

Kanister folgen einem festen **Rhythmus aus drei Höhen** (`CAN_KINDS = ["mid", "ground", "high"]`),
damit keine zwei gleich aussehen und nichts nebeneinander liegt:

| Art | Höhe über dem Boden | Sammlung |
|---|---|---|
| `mid` | 112–132 px | normaler Sprung |
| `ground` | 40–52 px | im Vorbeifahren |
| `high` | 140–158 px | Sprung nahe dem Scheitelpunkt |

Reihenfolge immer mid → ground → high → mid … (zwei Drittel in der Luft, ein Drittel am Boden).
Der Zähler `game.canCount` läuft pro Level. **Kein Doppelpack mehr** – Kanister liegen mindestens
~850 px auseinander. Wird ein Spawn von einer Presse blockiert, versucht das Spiel es im nächsten
Frame erneut, statt den Kanister zu verlieren.
Liegt ein Kanister über Hindernis/Graben, wird er automatisch angehoben; eine Presse löscht ihn.

### Schrott (Spielwährung) und Shop

Schrottteile liegen alle 240–430 px, 35 % in der Luft (96–146 px hoch). Werte, Häufigkeit und
Aussehen (sechs Sorten, jede mit eigener Animation und zufälliger Drehung):

| Typ | Wert | Gewicht | Stufe | Aussehen |
|---|---|---|---|---|
| Schraube `bolt` | 1 | 34 | 0 | Sechskantkopf mit Stahlverlauf, Schlitz und wanderndem Glanzpunkt |
| Feder `spring` | 2 | 24 | 0 | fünf Windungen, die sich sichtbar zusammendrücken und dehnen |
| Zahnrad `gear` | 3 | 18 | 1 | acht trapezförmige Zähne, dreht sich, Nabe mit Passfeder |
| Rohr `pipe` | 4 | 14 | 1 | gebogener Krümmer mit Lichtkante und Muffen |
| Blech `plate` | 6 | 7 | 2 | verbogene Platte, die leicht wippt, mit Riffelung und Nieten |
| Platine `chip` | 9 | 3 | 2 | grüne Leiterplatte mit Goldkontakten, schwarzem IC und **zwei blinkenden LEDs** |

Die **Stufe** bestimmt den Lichthof: Stufe 0 klein und dezent, Stufe 1 kräftiger, Stufe 2 mit
pulsierendem Ring – seltene Teile fallen also sofort auf.

**Sammel-Kombo:** Jedes Stück innerhalb von 2,2 s nach dem vorherigen erhöht den Multiplikator um
0,25 bis maximal **x2**. Der schwebende Text zeigt den tatsächlichen Gewinn, z. B. `+13  x1.5`.
Nach 2,2 s ohne Fund beginnt die Kette wieder bei x1. In der Praxis bringt eine Serie also deutlich
mehr Schrott als einzelne Funde – das belohnt sauberes Spiel – und die Schrottmenge pro Level liegt
dadurch über der alten Kalkulation (die Shop-Preise sind noch auf die alte Menge ausgelegt).

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

Spawn-Takte (Basis `spawnGap()`, siehe Level-Parameter):
Hindernisse `spawnGap() * rand(0.92,1.12)` · Gräben `spawnGap() * rand(1.15,1.45)` ·
Presse `spawnGap() * rand(1.1,1.4)` · Turm `spawnGap() * rand(1.25,1.55)`
(Turm und Presse nur ab Level 2, Turm braucht 320 px freie Anlaufzone).

### Gräben und Lava

Optik der Gräben: eine Tiefenfüllung mit Verlauf (oben fast schwarz, unten mit einem schwachen Ton
der jeweiligen Bodenfarbe), dazu innen an der linken Wand ein weicher Lichtsaum **in der Lichtfarbe
des Planeten** (`orb.lit`), rechts eine dunkle Kante in dessen Schattenfarbe (`orb.dark`), eine
sanfte „Lippe" am oberen Rand und eine Abdunklung zum Bildrand unten. Bewusst **keine** harten
Linien mehr – die früheren orangen Gefahrenstriche im Graben, die orangen Kantenbalken und die
durchgehende Neonlinie über dem Boden sind entfernt; die Bodenkante ist jetzt ein weicher Verlauf mit
einem 2 px dünnen Biome-Farbton bei 20 % Deckkraft. Die Wandbreite skaliert mit der Grabenbreite
(`max(16, min(38, w * 0.3))`), sodass auch schmale Gräben plastisch wirken.

- Grabenbreite nach Formel im Level-Parameter-Block, geklemmt auf 92–358 px.
  Weil die Breite mit dem Tempo skaliert, ist die nötige Flugzeit konstant (~0,3–0,42 s von 0,49–0,62 s Sprungzeit).
- **Erst ab Level 2** sind `min(0.65, 0.3+(level-2)*0.1)` der Gräben **Lavagräben**
  (glühende Füllung, Blasen, Lichtschein); Level 1 hat nur gewöhnliche Gräben.
- Jeder Lavagraben spuckt einen **Lavatropfen** (32×34), der sinusförmig zwischen 30 px **unter** und
  170 px **über** dem Boden pendelt (`rate` 2,2–2,8).
  Dadurch gibt es drei Fälle: Tropfen tief → einfacher Sprung; Tropfen auf Flughöhe → nur Doppelsprung;
  Tropfen hoch → einfacher Sprung (Doppelsprung würde treffen). Verifiziert: alle Tropfenpositionen lösbar.
- Kein Spawn von Hindernissen/Gräben/Gegnern in den letzten 900 px vor dem Ziel,
  keine Kanister in den letzten 320 px, kein Schrott in den letzten 260 px.

### Gegner (greifen aktiv an)

Kontakt kostet ein Leben („GEGNER - 1 LEBEN WEG"), Schild fängt es ab. Spawn nur in freien Lücken
(`rightmostEdge() < VIEW_W - 340`) und nicht im Zielbereich, eigener Takt `enemyGap() * rand(0.9,1.1)`.
**Level 1:** erst ab der Levelhälfte und nur Krabbler (sanfter Einstieg).

| Typ | Größe | Angriff | Konter |
|---|---|---|---|
| Krabbler | 46×38 | läuft dem Roboter entgegen (`70 + level*9`, max 160 px/s) | einfacher Sprung oder Schuss |
| Drohne | 42×28 | schwebt 168±22 px hoch, **Sturzangriff** (330 px/s) sobald unter 580 px, steigt mit 300 px/s wieder auf | oben: durchlaufen, tief: überspringen oder Schuss |
| Geschützturm | 46×52 | **schießt** im Bereich 208–780 px alle 1,2–1,8 s (erstmalig nach 0,32–0,6 s) | Turm und Kugel überspringen oder Kugel abschießen |

Gegnerkugel: 18×13 auf Höhe `GROUND_Y-48`, Fluggeschwindigkeit `Welt + 230 px/s` (kommt also schneller als der Scroll).
Mischungsverhältnis ab Level 2: Krabbler 42 %, Drohne 34 %, Turm 24 %.

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
| `menu` | Hauptmenü mit **SPIELEN**, **EINSTELLUNGEN** und **PROFIL**, Welt scrollt langsam im Hintergrund |
| `profile` | Profil: Name eingeben, bester Punktestand, höchstes Level, Anzahl Läufe |
| `settings` | Einstellungen: Lautstärke, Musik, (nur Touch) Knopfgröße, Steuerung, Zurück |
| `controls` | Untermenü Steuerung: Tasten für Springen und Schießen belegen, Standard, Zurück |
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

Himmel (Kulisse) → Kulissen-Hügel → Umgebungseffekt (Schnee/Glut) → Gräben inkl. Lava+Tropfen →
Boden (segmentiert, damit Gräben echte Lücken sind) →
Portal → Kanister → Ersatz-Roboter → Schrott → Hindernisse → Gegner → Gegnerkugeln → Spielerschüsse →
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
COYOTE 0.1 · JUMP_BUFFER 0.13 · MAX_SPEED 820 · SPEED_RAMP 0.008 · SPEED_PER_LEVEL 40
TOUCH_SPEED_FACTOR 0.85
START_LIVES 3 · FUEL_MAX 100 · FUEL_PER_PIXEL 100/5600 · FUEL_PER_CAN 25 · RESPAWN_FUEL 45
INVULN_TIME 1.5 · SPARE_CHANCE 0.5 · SPARE_LIFT 220
Dichte: spawnGap 2.2*0.82^(level-1) · enemyGap 2.6*0.85^(level-1) · pitChance 0.22+(level-1)*0.05
SHOT_SPEED 900 · SHOT_COOLDOWN 0.26 · SHOT_SCORE 25 · BULLET_SPEED 230 · SHOP_LOCK_TIME 0.9
```

Gemessene Sprunghöhen (Roboterfuß): Einzelsprung 109 px, Doppelsprung 188 px, Zusatz-Sprung 218 px.
Daraus folgen die Hindernishöhen: alles bis 100 px ist einfach, `tower` (132 px) nur doppelt.

### Persistenz (`localStorage`)

| Key | Inhalt |
|---|---|
| `roborunner.highscore` | bester Punktestand |
| `roborunner.sound` | `"on"` / `"off"` |
| `roborunner.volume` | Gesamtlautstärke 0 … 1 (Default 0,6) |
| `roborunner.music` | Musiklautstärke 0 … 1 (Default 0,5) |
| `roborunner.keys` | Tastenbelegung als `jump;shoot`, z. B. `Space;Enter` |
| `roborunner.button` | Knopfgröße für Touchgeräte 0,8 … 1,4 (Default 1) |
| `roborunner.name` | Spielername aus dem Profil (max. 12 Zeichen) |
| `roborunner.bestLevel` | höchstes erreichtes Level |
| `roborunner.runs` | Anzahl gestarteter Läufe |

### Profil und Statistik

Im Hauptmenü öffnet `P` (oder der Knopf **PROFIL**) den Profilbildschirm:

- **Name** eingeben. Dafür hängt in `index.html` ein echtes, unsichtbares Eingabefeld
  (`#nameInput`, in `style.css` auf 2 px mit `opacity: 0` gesetzt). `startNameEdit()` fokussiert es –
  damit öffnet sich auf dem Handy die Bildschirmtastatur, auf dem Desktop tippt man direkt.
  Während der Eingabe liest `update()` den Wert live nach `game.nameDraft` (mit blinkendem Cursor auf
  dem Canvas); `finishNameEdit()` bereinigt den Namen (`sanitizeName()`: nur Buchstaben, Ziffern,
  Leerzeichen, `_`, `-`, Umlaute, höchstens 12 Zeichen, außen getrimmt) und speichert ihn.
  Solange das Feld fokussiert ist, schluckt der Tastatur-Handler alle Tasten außer `Enter`/`Esc` –
  so wird beim Tippen nicht gesprungen.
- **Bester Punktestand** (bester Wert aus `roborunner.highscore`)
- **Höchstes Level** (`saveBestLevel()` beim Levelabschluss und bei Game Over)
- **Läufe** (hochgezählt bei `startGame(true)`, also bei Spielen/Nochmal/`R` – ein bloßer Menüwechsel
  zählt nicht mit)

Der Name erscheint danach auch im Hauptmenü (`SPIELER <Name> · REKORD <Punkte>`). Ohne Eingabefeld
im DOM (z. B. wenn man `game.js` allein lädt) bleibt der Bildschirm benutzbar, nur das Umbenennen
entfällt – alle Zugriffe sind über `nameInputUsable()` abgesichert.

### Steuerung anpassen (Einstellungen → Steuerung)

Zwei Aktionen sind frei belegbar: **Springen** und **Schießen** (`keyBindings`, gespeichert unter
`roborunner.keys`). Ablauf: Zeile wählen → `Enter` → die gewünschte Taste drücken; `Esc` bricht ab.
Die aktuell belegte Taste erscheint als Klartext (`keyLabel()` übersetzt Keycodes, z. B. `KeyJ` → „J",
`ArrowUp` → „PFEIL HOCH", `NumpadEnter` → „ENTER (NUM)"). `Standard` stellt Leertaste und Enter wieder
her. Belegt man eine Taste, die schon für die andere Aktion gilt, **tauschen** beide; global
reservierte Tasten (`Esc`, `M`, `P`, `R`, `-`, `+`) werden mit Hinweis abgelehnt. In den Menüs gelten
Leertaste/Enter immer als Bestätigung, und im Shop haben die Ziffern Vorrang vor der Sprungtaste,
damit man dort weiterhin kaufen kann.

### Knopfgröße auf Touchgeräten

Die Zeile **Knopfgröße** (nur sichtbar wenn `touchMode`) skaliert Feuer- und Pause-Knopf in
10-%-Schritten von 80 % bis 140 % (`btnScale`, gespeichert unter `roborunner.button`). Gezeichnet wird
über `translate` + `scale(btnScale, btnScale)`, damit Symbol, Ring und Beschriftung zusammen wachsen;
die Trefferflächen (Feuer-Knopf-Radius, Pause-Rechteck) nutzen denselben Faktor.

Schrott und Upgrades sind **bewusst nicht** dauerhaft (Meta-Progression wurde abgelehnt).

### Audio

Web Audio, komplett synthetisch (`tone()` mit Oszillator + Hüllkurve, `noise()` mit Lowpass-Rauschen).
Der `AudioContext` wird erst beim ersten Tastendruck/Klick erzeugt (Autoplay-Sperre), bei Blur
suspendiert. Sounds: Sprung, Doppelsprung, Kanister (Tonhöhe steigt mit Combo), Schrott,
Spielerschuss, Gegnerschuss, Gegnerabschuss, Crash-Explosion, Grabensturz, Lava, Schild, Tank leer,
Warnpiepen, Kauf, abgelehnter Kauf, Level-Fanfare, Extra-Leben, Game Over.

Der **Abschuss eines Gegners** (`sfxEnemyDown`) ist bewusst der auffälligste Trefferklang und
mehrschichtig aufgebaut: knackiger Highpass-Transient (2600 Hz) als Einschlag, Bass-Stoß 150→58 Hz,
das „Motor stirbt ab" 520→96 Hz mit Sub-Oktave, zwei Funkenblitze (1450 und 2050 Hz), ein
Bandpass-Rauschen (1800 Hz) für Trümmer und zum Abschluss eine kurze Quittung auf 1046 Hz.
Spitzenpegel 0,19 – lauter als Sprung/Schuss (0,1/0,062), leiser als der eigene Einschlag (0,22) –
und mit ±3 % Zufalls-Verstimmung, damit Serienabschüsse nicht monoton klingen.

Sprung und Schuss sind bewusst **tief und leise** gehalten, weil sie am häufigsten ausgelöst werden:
Sprung ist ein Booster aus Sinus 185→300 Hz plus Triangle 92→150 Hz und einem kurzen Luftstoß
(`noiseType`, Lowpass 900 Hz), Doppelsprung das gleiche eine Oktave höher (250→410 / 125→205 Hz,
Bandpass). Der Schuss liegt bei 720→190 Hz mit kurzem Highpass-Transienten. Spitzenpegel: Sprung 0,1,
Doppelsprung 0,09, Schuss 0,062 (vorher 0,18 bzw. 0,10). Alle drei bekommen zusätzlich eine leichte
Zufalls-Verstimmung von ±3 %, damit sich der Dauerton nicht einschleift.

### Sterbe-Klänge

Die Todesfälle klingen absichtlich **tief und weich** – vorher hatten Einschlag, Sturz, Lava und die
Game-Over-Melodie Rechteck- und Sägezahn-Anteile, die spitz und billig klangen:

| Auslöser | Klang |
|---|---|
| Einschlag (`sfxExplosion`) | zwei tiefe Sinus-Wellen 98→34 Hz und 58→27 Hz (Druckwelle + Sub-Boom), gedämpftes Rauschen (Lowpass 1500 Hz), Metallklang 420→165 Hz, verzögerter Nachhall |
| Grabensturz (`sfxPit`) | weicher Doppel-Absturz 520→68 Hz und 250→40 Hz plus Luftrauschen (statt Sägezahn) |
| Lava (`sfxLava`) | tiefes Grollen 128→44 Hz, Lowpass-Rauschen und ein spätes Zischen (Highpass 2200 Hz) |
| Tank leer (`sfxFuelEmpty`) | stotternder Motor: zwei abfallende Triangle-Töne 215→152 und 182→108 Hz mit kleinem Rauschen |
| Game Over (`sfxGameOver`) | absteigende Melodie 392/330/262/196 Hz (Triangle) je mit Sub-Oktave, dann ein langer tiefer Schlusston 98→62 Hz |

`noiseType()` hat dafür einen optionalen Startversatz (`delay`) bekommen, damit Nachhall und Zischen
später einsetzen können. Alle Sterbeklänge haben eine leichte Zufalls-Verstimmung (±2–3 %).

### Hintergrundmusik

Ebenfalls synthetisch, kein Audiofile: ein kleiner Sequencer (`music*`-Funktionen) mit Bass, Melodie
und Schlagzeug. Jede Kulisse hat einen eigenen Track in `MUSIC_TRACKS` (Wurzelton, Tonleiter,
Akkordfolge, Tempo, Wellenformen, Melodie und Drum-Bitmasken), umgeschaltet in `musicSetLevel()`.

| Level | Kulisse | Tempo | Charakter |
|---|---|---|---|
| 1 | Dämmerung | 104 BPM | ruhig, Triangel-Bass, luftige Pentatonik |
| 2 | Wüste | 112 BPM | Square-Bass, phrygisch angehaucht (kleine Sekunde) |
| 3 | Nachtstadt | 124 BPM | treibender Synthwave-Saw-Bass, dichtere Hats |
| 4 | Eisfeld | 100 BPM | weiche Sinus-Töne, sparsames Schlagzeug |
| 5 | Vulkan | 134 BPM | aggressiver Saw, Viertel-Kick, dichte Hats |

Technik: 16 Schritte pro Takt, `stepDur = 60 / bpm / 4`; ein Vorlauf-Scheduler (`musicTick`, alle
40 ms per `setInterval`) plant 0,25 s im Voraus über `ctx.currentTime`. Läuft der Kontext durch
Blur/Suspend hinterher, setzt `musicTick` die Zeit neu (`nextTime < currentTime`) – sonst käme ein
Schwall nachgeholter Töne. Die Musik hängt an einem eigenen Gain (`music.gain`) hinter dem Master,
`M` stummschaltet sie also sofort. **Musiklautstärke** ist getrennt regelbar (`music.volume`,
10-%-Schritte, gespeichert unter `roborunner.music`, 0 % = aus) – per Einstellungsmenü oder `-`/`+`,
wenn dort die Musikzeile gewählt ist. Start beim ersten Tastendruck, Stopp bei Game Over, Neustart
mit jedem Lauf (im Hauptmenü läuft der Track von Level 1). Ohne Audio-API oder ohne `setInterval`
passiert schlicht nichts (alle Musikfunktionen steigen vorher aus).

### Bedienoberfläche (Hauptmenü und Einstellungen)

Beide Bildschirme sind aus klickbaren Buttons gebaut. Die Zeichenfunktionen registrieren jeden Button
über `uiButton(x, y, w, h, id, label, sub, hot)` in `game.uiButtons` (jeden Frame neu, geleert am
Anfang von `drawHud`), der Klickpfad läuft über `clickUi()` → `uiAction(id)`. Tasten und Klicks
landen damit in derselben Aktion (`play`, `settings`, `back`, `menu`, `retry`, `resume`, `pause`,
`volume±`, `music±`). Der Roboter fährt im Hintergrund weiter (Welt-Tempo 150), gestartet wird er
nicht mehr durch irgendeinen Klick: im Menü reagieren nur die Buttons und `Leertaste`/`Enter`/`E`.
Auf Touchgeräten gibt es zusätzlich einen runden **Pause-Knopf unten links** (`PAUSE_BTN`), damit die
Pause auf dem Handy erreichbar ist.

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

- Kanister: geprüft, dass kein Paar dichter als 600 px liegt (Level 1: min 926 / avg 1082 px,
  Level 5: min 848 / avg 1006 px), der Höhenrhythmus mid→ground→high durchläuft, der Bodenanteil
  bei ~32 % liegt und die Benzinbilanz bei ~58 % Sammelquote liegt; Level 1 mit sauberem Spiel in
  32 s schaffbar (90 % Restbenzin), Level 5 mit 47 %, Nur-Boden-Spieler verliert 2 Leben
- Profil: geprüft, dass das Hauptmenü den Rekord und den Profil-Knopf zeigt, `P` das Profil öffnet,
  Name, Punkte, Level und Läufe angezeigt werden, `Enter` das Namensfeld fokussiert (Leertaste
  springt dabei nicht), der getippte Name live erscheint, beim Abschluss bereinigt (`Max!Power 24` →
  `MaxPower 24`) und gespeichert wird, der Name danach im Menü steht (`SPIELER …`), Läufe nur bei
  echten Starts zählen, das höchste Level bei Abschluss steigt – und dass der Bildschirm auch ohne
  echtes Eingabefeld im DOM benutzbar bleibt
- Steuerung: mit Desktop- und Touch-Stub geprüft – Einstellungen zeigen auf dem Desktop 4 Zeilen,
  auf Touch 5 (mit Knopfgröße); Steuerung öffnet sich, zeigt die aktuellen Tasten als Klartext,
  nimmt eine neue Taste an (`Space;KeyK` gespeichert), lehnt reservierte Tasten (M) mit Hinweis ab,
  `Esc` bricht ab, Doppelbelegung tauscht (Springen K, Schießen J), „Standard" setzt zurück, und
  danach springt Leertaste bzw. schießt Enter wieder; Knopfgröße lässt sich auf 120 % stellen,
  wird gespeichert und der Feuer-Knopf reagiert im größeren Radius
- Tempo: für Level 1–5 Start- und Endgeschwindigkeit geprüft (Desktop 330/431 bis 490/706 px/s,
  Touch jeweils ×0,85 also 281/366 bis 417/600), Level 1 mit sauberem Spiel in 32,9 s (Touch
  38,8 s) beendet, Gräben auch beim neuen Tempo überspringbar (7 bzw. 6 von 23 Timings)
- Schrott: geprüft, dass alle sechs Sorten im Verhältnis ihrer Gewichte spawnen (225 Stücke:
  bolt 70, spring 56, pipe 37, gear 35, plate 18, chip 9), alle sechs Zeichenroutinen fehlerfrei
  laufen, die Kombo in Folge 10 / 13 / 15 / 18 Punkte ergibt (x1 → x1.75), als `x1.25` im
  schwebenden Text erscheint und nach 2,2 s Pause wieder bei x1 beginnt
- Planeten/Boden: geprüft, dass alle fünf Kulissen mit Verläufen rendern und `save`/`restore`
  balanciert bleibt, die Ringplaneten (Wüste, Eisfeld) die zusätzlichen Ringbahnen zeichnen
  (1311 vs 830 Ellipsen pro Frame über 120 Frames) und die Gräben mit der neuen, kulissen-
  abhängigen Beleuchtung fehlerfrei durchlaufen (176 Frames mit Graben im Bild)
- Graben-Optik: geprüft, dass die orangen Striche im Graben, die orangen Kantenbalken und die
  durchgehende Bodenlinie nicht mehr gezeichnet werden, die Tiefenfüllung da ist, Verläufe für
  Wände und Lippe genutzt werden und normale wie Lavagräben ohne Zeichenfehler durchlaufen
  (`save`/`restore` balanciert)
- Abschuss-Klang: geprüft, dass Treffer-Transient (Highpass), Bass 150→58 Hz, Motor-Absturz
  520→96 Hz, Funken 1450/2050 Hz und Quittung 1046 Hz vorhanden sind, ohne Rechteck/Sägezahn,
  Pegel 0,19 (lauter als Sprung/Schuss, leiser als der Einschlag), Verstimmung wirkt, und der Klang
  sich klar vom Kanister-Aufsammeln unterscheidet
- Sterbe-Klänge: geprüft, dass Einschlag, Sturz, Lava, Tank leer und Game-Over-Melodie keine
  Rechteck-/Sägezahn-Anteile mehr enthalten, ihre tiefen Frequenzen treffen (98/58, 520/250, 128,
  215/182, 392/330/262/196 Hz), Rauschen gedämpft und teils verzögert kommt und die Spitzenpegel
  unter 0,24 liegen; zusätzlich Smoke-Test über alle 19 Klangfunktionen (keine stumm, keine Fehler)
- Klänge: mit Frequenz-mitschreibendem Audio-Stub geprüft – Sprung 92–300 Hz, Doppelsprung
  125–410 Hz, Schuss 115–720 Hz (jeweils kein Ton über der neuen Obergrenze), Spitzenpegel 0,1 /
  0,09 / 0,062, Luftstoß bzw. Transient vorhanden, Tonhöhe variiert mit dem Zufall (706 vs 734 Hz)
- Musik: mit AudioContext-Stub und manuellem `setInterval` geprüft – Start beim ersten Tastendruck,
  Scheduler erzeugt Töne im begrenzten Vorlauf, Zeitsprung (200 s) wird abgefangen statt als Schwall
  nachgeholt, Mute stellt den Musik-Gain sofort auf 0 und Unmute wieder her, Level 4 nutzt den
  Eisfeld-Takt (100 BPM, Schrittweite 0,150 s), Stopp bei Game Over, Wiederstart mit dem neuen Lauf;
  ohne Audio-API läuft alles unverändert weiter (12 000 Frames geprüft)
- Mobil/Touch: mit Touch-Stub geprüft – Mobil-Hinweise im Titel, Feuer-Knopf wird gezeichnet,
  Knopf feuert (und springt nicht zusätzlich), Halten feuert 30 von 30 Frames, nach dem Loslassen
  kein Schuss mehr, Knopf im Shop ohne Wirkung, Vollbild wird genau einmal angefordert;
  mit Desktop-Stub gegengeprüft: kein Knopf, keine Handy-Hinweise, Klick springt, Enter schießt
- Kulissen/Portal: 5 verschiedene Kulissennamen im HUD (Level 6 wiederholt Level 1), alle fünf
  inkl. Schnee/Glut fehlerfrei gerendert, Portal beendet das Level mit 3 Effekten, Roboter
  ausgeblendet, Shop erscheint, in Level 2 ist der Roboter wieder sichtbar
- Level-Dichte: gemessen über je 50 s pro Level steigt die Zahl der Hindernisse+Gegner
  34 → 75 → 93 → 137 (Level 1 bis 5), Spawnabstand 2,42 s → 1,06 s; Level 1 ohne Türme/Pressen/Lava
  und ohne Gegner in der ersten Hälfte; erstes Hindernis in Level 1 erst nach 2,4 s;
  Level-1-Graben mit 7 von 19 Timings überspringbar
- Steuerung/HUD: Titel, HUD ohne Tempo- und Sprunganzeige, Level- und Benzinanzeige, alle Regeln im Titel
- Physik: Sprunghöhen (109/188/218 px), Graben-Sprungfenster 6 von 21 Timings, 7 von 11 für Krabbler/Turm/Drohne/Schuss
- Benzin: Verbrauch exakt 5600 px pro Tank, Kanister +25 %, Deckel greift, Tank leer kostet ein Leben,
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
- Der Zielbalken im HUD ist `distance / levelLength`; die Portalposition wird aus dem Restweg
  berechnet (`portalX = robot.x + (levelLength - distance)`), driftet also nicht.
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
12. Git-Repo angelegt, Projekt-Doku erstellt, Auto-Commit-Regel in `AGENTS.md`
13. Level 1 entschärft: Hindernistakt und Sonderchancen sind jetzt level- statt tempoabhängig,
    damit die Anzahl der Hindernisse pro Level klar steigt (Level 1 ohne Türme/Pressen/Lava,
    Gegner dort erst ab der Levelhälfte und nur Krabbler, 2,4 s Anlauf statt 1,2 s)
14. Fünf verschiedene Hintergrundkulissen (Dämmerung, Wüste, Nachtstadt, Eisfeld, Vulkan) inklusive
    Schnee- und Glut-Effekt; Ziel-Gate durch ein animiertes Portal ersetzt, in das der Roboter
    sichtbar hineingeht (`gateX` → `portalX`)
15. Auf dem Raspberry Pi veröffentlicht: als Unterordner `/spiel/` im vorhandenen nginx-Container,
    öffentlich über `https://holger80.dynv6.net/spiel/` (siehe Abschnitt 12)
16. Handy-tauglich gemacht: Web-App-Manifest mit Vollbild, Service Worker (offline), App-Icons,
    Touch-Feuerknopf mit Dauerfeuer, Vollbild-Anforderung beim ersten Tippen, Mobil-Hinweise im
    Titel (siehe Abschnitt 13)
17. Externe Sicherung: privates GitHub-Repo `holgerdahinten80/roborunner` als `origin` eingerichtet,
    komplette Historie gepusht; Push-Anleitung steht in Abschnitt 11
18. Zwei Stangen/Pylonen am Portal entfernt, damit der Roboter frei durch den Wirbel fährt; Wirbel
    dafür größer (Ringe 26–74 px Radius, Glow 96 px) und Beschriftung direkt über dem Portal
19. Hintergrundmusik: synthetischer Sequencer in `game.js` mit Bass, Melodie und Schlagzeug,
    fünf kulissenabhängige Tracks (104–134 BPM), Vorlauf-Scheduler und sauberer Mute-Anbindung
    (siehe Abschnitt 5, „Hintergrundmusik")
20. Sprung- und Schussklang angenehmer: deutlich tiefere Frequenzen (Sprung 380–720 → 92–300 Hz,
    Doppelsprung 560–1380 → 125–410 Hz, Schuss 480–2100 → 115–720 Hz), weichere Wellenformen und
    Hüllkurven, leisere Spitzenpegel, kurze Luft-/Transient-Geräusche und ±3 % Zufalls-Verstimmung;
    `noise()` akzeptiert dafür jetzt einen Filtertyp (`noiseType`)
21. Hauptmenü mit **SPIELEN** und **EINSTELLUNGEN** (Zustände `menu`/`settings`), klickbare Buttons
    über `uiButton`/`clickUi`/`uiAction`, eigene Musiklautstärke (`roborunner.music`), Pause- und
    Game-Over-Menü mit Knöpfen, Pause-Knopf unten links für Touchgeräte; im Menü fährt der Roboter
    im Hintergrund weiter, gestartet wird nur noch über den Spielen-Knopf (oder Leertaste/Enter)
22. Sterbe-Klänge überarbeitet: keine Rechteck-/Sägezahn-Anteile mehr, stattdessen tiefe Sinus-/
    Triangle-Wellen mit Sub-Boom, gedämpftem Rauschen und verzögertem Nachhall; Game Over ist jetzt
    eine absteigende Melodie mit tiefem Schlusston (`noiseType` bekam dafür einen Delay-Parameter)
23. Kanisterverteilung überarbeitet: Doppelpack entfernt (keine zwei Kanister nebeneinander mehr),
    fester Höhenrhythmus mid → ground → high, gleichmäßigerer Abstand (Welle + kleinere Basis),
    verpasste Spawns werden wiederholt statt verworfen; Benzinbilanz bleibt bei ~58 % Sammelquote
24. Tankverbrauch gesenkt: `FUEL_PER_PIXEL` von `100/4600` auf `100/5600` – ein voller Tank reicht
    jetzt 5600 px statt 4600 (+22 %), die nötige Sammelquote sinkt von 74 % auf 61 %.
    Level 1 mit sauberem Spiel 90 % Restbenzin, Level 5 47 %; wer nur Bodenkanister mitnimmt,
    verliert weiterhin zwei Leben pro Level
25. Abschuss-Klang aufgewertet: mehrschichtiger Treffer-Sound (Highpass-Transient, Bass-Stoß
    150→58 Hz, Motor-Absturz 520→96 Hz, Funken 1450/2050 Hz, Trümmer-Rauschen, Quittung 1046 Hz)
    statt des bisherigen Rechteck-Platschers, mit Zufalls-Verstimmung
26. Gräben hübscher und ohne harte Linien: Tiefenverlauf, Lichtsaum an der linken Wand, dunkle
    rechte Kante, weiche Lippe und Bodenabdunklung; orange Striche im Graben, orange Kantenbalken
    und die durchgehende Neonlinie über dem Boden entfernt (dort jetzt ein weicher Verlauf plus
    2 px Biome-Ton bei 20 %). Ungenutztes `glow` aus den Kulissen-Daten entfernt
27. Planeten farbig und Boden angepasst: jeder Himmelskörper ist jetzt eine Kugel mit Verlauf
    (beleuchtete Seite, Grundton, Schattenseite), drei Bändern, zwei Flecken und Randlicht; Wüste
    und Eisfeld haben einen Ring in zwei Durchgängen. Bodenfüllung, Kante und Markierungen folgen
    dem Planeten, ebenso die Gräben (Wandlicht in `orb.lit`, Schatten in `orb.dark`,
    `rgbaFromHex()` als Hilfsfunktion)
28. Schrott aufgewertet: zwei neue Sorten (`pipe` Wert 4, `chip` Wert 9), alle sechs mit eigener
    Animation (wippendes Blech, drehendes Zahnrad, sich komprimierende Feder, blinkende LEDs),
    zufälliger Drehung und Stufen-Leuchten (Stufe 2 mit pulsierendem Ring); dazu eine Sammel-Kombo
    bis x2 innerhalb von 2,2 s, im schwebenden Text als `+13  x1.5` sichtbar
29. Tempo entschärft und Schwierigkeit auf die Levelnummer verlagert: `SPEED_RAMP` von 0,022 auf
    0,008, `MAX_SPEED` 940 → 820, Schritt pro Level 45 → 40 – Level 1 läuft jetzt 330 → 431 px/s
    (vorher 330 → 673), Level 5 490 → 706 (vorher 940). Level-Länge auf `12600 + (n-1)*3600`
    gekürzt, damit die Dauer mit ~33 s weiterhin etwa das Dreifache des Ursprungs ist.
    Neu: `TOUCH_SPEED_FACTOR = 0.85` – auf Touchgeräten läuft alles 15 % langsamer
    (Level 1: 281 → 366 px/s). Benzinquote dadurch ~58 % statt 61 %
30. Steuerung einstellbar: neue Tastenbelegung für Springen und Schießen (Einstellungen → Steuerung,
    „Taste drücken …", Tausch bei Doppelbelegung, reservierte Tasten abgelehnt, Standard-Reset,
    gespeichert als `roborunner.keys`) und eine Knopfgröße für Touchgeräte von 80 % bis 140 %
    (`roborunner.button`), die Feuer- und Pause-Knopf samt Trefferflächen skaliert
31. Profil im Hauptmenü: Namenseingabe über ein unsichtbares Eingabefeld (öffnet auf dem Handy die
    Bildschirmtastatur), Anzeige von bestem Punktestand, höchstem Level und Anzahl Läufen;
    `saveBestLevel()`, Laufzähler nur bei echten Starts, Name und Statistik in `localStorage`

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
git -C C:\Projekte\Testspiel log --oneline origin/main    # was liegt auf GitHub
```

### Git-Remote (externe Sicherung)

| | |
|---|---|
| `origin` | `git@github.com:holgerdahinten80/roborunner.git` – privat, über SSH (kein Token nötig) |
| Branch | `main`, verfolgt `origin/main` |

```powershell
# nach jedem Commit hochladen
git -C C:\Projekte\Testspiel push

# prüfen, ob lokal und Remote gleich sind (Hash-Vergleich)
git -C C:\Projekte\Testspiel rev-parse HEAD
git -C C:\Projekte\Testspiel ls-remote origin
```

Der SSH-Zugang läuft über den vorhandenen Schlüssel (`ssh -T git@github.com` meldet
`Hi holgerdahinten80!`). GitLab ist **nicht** eingerichtet – dort ist kein Schlüssel hinterlegt.
Der Raspberry Pi hat kein Git, dort liegen nur die ausgelieferten Dateien (Abschnitt 12).

---

## 12. Auslieferung auf dem Raspberry Pi

Das Spiel läuft öffentlich auf dem vorhandenen Heimserver (kein eigener Webserver nötig).

| Zugang | Adresse |
|---|---|
| Internet (HTTPS, jeder mit der Adresse) | `https://holger80.dynv6.net/spiel/` |
| Nur im Heimnetz | `http://192.168.178.30:8080/spiel/` |

### Wie es eingebunden ist

```
Internet -> Caddy (Container "caddy", Port 80/443, Let's-Encrypt-Zertifikat)
            Caddyfile: holger80.dynv6.net { reverse_proxy localhost:8080 }
         -> nginx (Container "nginx-web", Host-Port 8080)
            Bind-Mount /media/ssd/html -> /usr/share/nginx/html
            Spiel liegt darin als Unterordner /spiel/
```

- Der Zugriff geschieht per SSH über den Host-Eintrag `rasp` (192.168.178.30, User `pi`,
  Schlüssel `~/.ssh/id_rsa`). `pi` ist in der Gruppe `docker` – **für alles hier ist kein sudo nötig**.
- Die bestehende Startseite `/media/ssd/html/index.html` (795 KB) bleibt unberührt; das Spiel
  liegt als eigener Unterordner daneben.
- Kein Backend, keine Datenbank, keine Anmeldung: reine statische Dateien. Damit ist die
  Sicherheitsfläche minimal, aber auch jeder mit der Adresse kann spielen.

### Update einspielen (aus `C:\Projekte\Testspiel` heraus)

```powershell
$stage = "$env:TEMP\kilo\roborunner"
New-Item -ItemType Directory -Path $stage -Force | Out-Null
Copy-Item index.html, style.css, game.js, manifest.json, sw.js, `
          icon-192.png, icon-512.png, apple-touch-icon.png -Destination $stage -Force

# 1. auf den Pi kopieren
scp -r $stage rasp:/home/pi/roborunner_stage

# 2. in den nginx-Container (Bind-Mount) kopieren und Rechte setzen
#    Wichtig: docker exec startet keine Shell, Platzhalter deshalb mit sh -c
ssh rasp "docker cp /home/pi/roborunner_stage/. nginx-web:/usr/share/nginx/html/spiel/ ; ^
          docker exec nginx-web sh -c 'chmod 755 /usr/share/nginx/html/spiel && chmod 644 /usr/share/nginx/html/spiel/*'"

# 3. prüfen
ssh rasp "curl -s -o /dev/null -w 'spiel/: %{http_code}\n' http://127.0.0.1:8080/spiel/"
Invoke-WebRequest https://holger80.dynv6.net/spiel/ -UseBasicParsing | Select-Object StatusCode
```

Wichtige Details dabei:

- **Rechte setzen ist Pflicht**: `docker cp` legt Ordner mit Modus 700 an, der nginx-Worker läuft
  aber als Benutzer `nginx` (uid 101) – ohne `chmod 755` auf den Ordner und `644` auf die Dateien
  antwortet nginx mit 403.
- Der Container muss **nicht** neu gestartet werden; nginx liest die Dateien bei jedem Request.
- Der Ordner liegt im Bind-Mount auf der Host-Platte, übersteht also `docker compose up -d`
  und einen Neustart des Pi. Nur ein neues Image/Setup würde ihn verlieren.
- Zum Prüfen über die öffentliche Domain von außen: `Invoke-WebRequest` von Windows aus
  (aus dem Heimnetz heraus zeigt `curl` gegen `127.0.0.1` sonst nur den HTTP→HTTPS-Redirect 308,
  und ohne SNI schlägt TLS lokal fehl – deshalb `--resolve` oder der Weg über das Internet).
- Aufräumen nach dem Update: `ssh rasp "rm -rf /home/pi/roborunner_stage"`.

---

## 13. Auf dem Handy im Vollbild (PWA)

Die Seite ist als installierbare Web-App eingerichtet, damit sie ohne Browserleiste läuft.

| Wo | Vorgehen |
|---|---|
| Android (Chrome) | Menü → **„App installieren"** bzw. „Zum Startbildschirm hinzufügen", oder im Spiel einfach loslegen – beim ersten Tippen wird automatisch Vollbild angefordert |
| iPhone/iPad (Safari) | **Teilen → „Zum Home-Bildschirm"**, dann über das Icon starten (Safari kann kein Vollbild per API) |

Was dafür im Code steckt:

- `manifest.json`: `display: fullscreen` (mit `standalone` als Rückfall), Name, Theme-/Hintergrundfarbe
  `#0a0d14`, Icons 192/512 px plus maskable Variante.
- `index.html`: `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style:
  black-translucent`, `apple-touch-icon`, `theme-color`, `viewport-fit=cover` (Notch) und die
  Registrierung des Service Workers (Fehler werden geschluckt).
- `sw.js`: cached die acht Dateien; **Netzwerk zuerst**, bei fehlender Verbindung kommt die Kopie aus
  dem Cache. `CACHE`-Version erhöhen, wenn altes Verhalten hängen bleibt.
- `game.js`: `touchMode` erkennt Touchgeräte (`ontouchstart` oder `navigator.maxTouchPoints`).
  Nur dann erscheint der **Feuer-Knopf** unten rechts (`FIRE_BTN`, Radius 40 px), Halten feuert
  dauerhaft über `game.fireHeld`, und beim ersten Tippen wird einmalig Vollbild angefordert
  (`requestFullscreen` in `try/catch`, weil iOS die API nicht kennt). Auf dem Desktop ist alles
  unverändert – kein Knopf, Tippen = Springen, `Enter` = Schuss.
- Der Service Worker läuft nur in einem sicheren Kontext: über `https://holger80.dynv6.net/spiel/`
  ja, über `http://192.168.178.30:8080/spiel/` nicht (dort funktioniert das Spiel, aber ohne
  Offline-Cache und ohne Installationsangebot).

Praktisch: Auf dem Handy quer halten, dann füllt das 16:9-Bild den Schirm fast vollständig.
