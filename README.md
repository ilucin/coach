# Coach

Dnevnik snage i navika: san, težina, hrana (slatko, grickalice navečer) te radne serije, oznaka zagrijavanja i tri parametra po vježbi (najteža serija, maks.
volumen serije, e1RM) uspoređena s prošlim treningom i rekordom. Unos kroz web app (PWA) ili kroz
Claude (`coach` CLI). Vidi `SPEC.md` i `CLAUDE.md`.

    node bin/coach.js            # pomoć
    node bin/coach.js serve      # http://127.0.0.1:4340
    npm test
    scripts/install.sh           # launchd agent (macOS) + data/ kao zaseban privatni git repo

Podaci treninga žive u `data/` (ignorirano ovdje); ako je `data/` git repo, svaki unos se u njega
sam commita.
