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

**Asistent**: gumb u gornjoj traci otvara Fleetov chat s Claude sesijama u ovom repou (bočni panel
na desktopu, cijeli ekran na mobitelu), iframe na Fleetov embed view (`#/embed`); nova sesija se
pokreće iz panela. Config je lokalan za mašinu, `~/.config/coach/assistant.json` =
`{ "fleetUrl": "https://<shed>.<tailnet>.ts.net:7443", "host": "<fleet host>", "dir": "~/Code/coach" }`
(`COACH_FLEET_URL` pregazi `fleetUrl`); bez njega gumba nema (`lib/assistant.js`). `dir` mora biti
u Fleetovim `spawnDirs` tog hosta (skriveni unos je dovoljan).
