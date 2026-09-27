# Hinweise für Agenten in diesem Projekt

## Zuerst lesen

`SPIEL.md` ist die vollständige Projektdokumentation (Systeme, Konstanten, Architektur,
Test-Vorgehen, offene Punkte). Vor Änderungen an `game.js` dort nachsehen.

## Git: immer automatisch committen

Nach jeder abgeschlossenen Änderung selbstständig committen – **ohne Rückfrage**.
Der Nutzer hat das dauerhaft so freigegeben.

- Nur Dateien stagen, die zur Änderung gehören; **`.kilo/` niemals committen**
  (enthält Worktrees/Sitzungszustand und ist per `.kilo/.gitignore` ausgeschlossen).
- Commit-Message auf Deutsch, kurz und beschreibend, ein Betreff plus optional Stichpunkte:

  ```
  Kurzbeschreibung der Änderung

  - Was wurde geändert und warum
  - Relevante Werte/Balance-Änderungen
  ```

- Keine Secrets, keine Temp-Testdateien committen. Testdateien liegen unter
  `C:\Users\holge\AppData\Local\Temp\kilo\` und werden nach den Tests gelöscht.
- Nicht am Commit-Stil herumexperimentieren: das Repo nutzt deutsche Betreffzeilen.

## Prüfen vor dem Commit

```powershell
# Syntax (erwartet: Fehler "'document' is undefined" = Parsen ok)
& cscript.exe //nologo //E:JScript "C:\Projekte\Testspiel\game.js" 2>&1 | Out-String

# Spiel zum Ansehen öffnen
Start-Process "C:\Projekte\Testspiel\index.html"
```

Es gibt kein Build-System und kein Node. Logik wird headless über `cscript` mit gestubbten
Browser-APIs getestet – Rezept, Stub-Vorlage und Fallstricke stehen in `SPIEL.md`, Abschnitt 6.
Nach Logikänderungen dort das beschriebene Test-Vorgehen nutzen, Debug-Hook danach wieder entfernen.
