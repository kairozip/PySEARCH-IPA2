PySearch — one logo everywhere (UI, EXE, taskbar, desktop)
===========================================================

Source artwork:  pysearch_mascot.png  (must have real transparency, not a baked-in checkerboard)

1) Drop your PNG at:  assets/pysearch_mascot.png

2) Generate transparent PNG + Windows icons (same image for app UI and installer):

     npm run icons

   This runs:
   - tools/fix-mascot-alpha.js  → removes checkerboard / grey fringe / dark specks (real alpha)
   - tools/build-app-icons.js   → writes assets/icon.ico + assets/icon.png from the mascot

3) Rebuild the app so the .exe and shortcuts pick up the new icon:

     npm run build

electron-builder uses build.win.icon → assets/icon.ico for:
- PySearch.exe (portable)
- NSIS installer
- Desktop / Start Menu shortcuts (Windows uses the .exe embedded icon)

The browser shell uses core/app-icon.js: icon.ico → icon.png → pysearch_mascot.png.

If Windows still shows an old taskbar icon, unpin the old shortcut and pin the new .exe once (icon cache).

Optional vector: assets/logo.svg (not used for EXE/taskbar).
