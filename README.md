# FORMA Studio

Personal mouse-first home workout studio in Russian, Hebrew (RTL), and English.

Website: https://markalex012.github.io/forma-home-studio/
Android downloads: https://github.com/markalex012/forma-home-studio/releases

## Version 1.0
- 14 initial creator videos across 8 categories
- Catalog filters, favorites, and equipment checklist
- Program builder with ordered workout stages
- Weekly planner and today's program
- Manual completion tracking, history, and seven-day statistics
- Personal YouTube video entries
- JSON backup and restore, with Android document picker
- Daily metadata checks; hidden only after 3 consecutive confirmed missing responses
- Android TV app optimized for mouse and wheel, launching videos in YouTube

YouTube completion cannot be detected across app boundaries. Return with Back and explicitly complete or skip each stage.

Personal state is local to each browser/app. No account or cloud sync. Shared availability is loaded from the raw catalog in this repository, so scheduled changes do not require reinstalling the APK.

## Source
- index.html: original visual catalog
- studio.js, studio.css, studio-core.js: full studio extension
- catalog.json: shared catalog and availability
- scripts/check_catalog.py: daily checker
- android/: native Android application
- tests/: validation and availability regression tests

## Checks
Run node --test tests/*.test.cjs and python -m unittest discover -s tests -p '*_test.py'.
GitHub Actions uses Java 17, Gradle 8.11.1, AGP 8.9.2 and SDK 35, plus native tests and Android lint.

The full app FORMA Studio (org.markalex.forma.studio) is separate from the FORMA TV prototype. Personal test signing is cached; a lost cache may require reinstalling with backup. This is not a Google Play publication.

No ESP32 integration. Video and imagery belong to creators / Unsplash.
