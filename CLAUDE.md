# Coach — dnevnik snage

Osobni dnevnik treninga snage i dnevnih navika (san, težina, hrana). Spec: `SPEC.md`. Bez ovisnosti: Node 24, ESM, `node --test`.

- `bin/coach.js`: CLI. `lib/core.js`: izračuni (čisti, testirani). `lib/store.js`: JSON u `data/`.
  `lib/server.js`: API + statički PWA iz `web/index.html` (vanilla JS).
- Server: `coach serve --port 4340` (launchd `coach.serve`, `scripts/install.sh`), na jednom
  stalno upaljenom računalu. `data/` je zaseban privatni git repo (u kodu je ignoriran) i svaki se
  unos sam commita u njega. Podaci treninga nikad ne idu u ovaj (javni) repo.
- Testovi: `npm test`. Ručno testiranje uz `COACH_DATA=$(mktemp -d)` i test port (4401), nikad na
  `data/`.

## Unos treninga kroz razgovor

Kad korisnik priča o treningu, upiši ga CLI-jem (`node bin/coach.js …`, alias `coach`):

1. Prepoznaj vježbu: `coach exercises`. Ako je nema, pitaj, pa `coach exercise add "Ime" --alias a,b` (`--video URL` za link na izvedbu; kasnije `coach exercise video <vježba> URL`).
2. Zagrijavanje: bilježi se samo oznaka (2–4 serije), bez kilaža → `--warmup` ili `coach warmup`.
3. Radne (top) serije: `coach log <vježba> 100x5@8 102.5x4@8.5` (`100x5x3@8` = tri serije). RPE = 10 − RIR ("dva u rezervi" = @8); kad nije rečen, izostavi ga. Datum je
   danas, inače `--date YYYY-MM-DD`.
4. Ispravci: `coach undo <vježba>`, `coach fix <vježba> <n> 100x4`.
5. Nakon svakog unosa ukratko javi tri parametra koje CLI ispiše: najteža serija, maks. volumen
   serije, e1RM, svaki s % u odnosu na prošli put i PR ako je novi rekord.
6. Pitanje "koliko za 3 ponavljanja uz isti zamor" → `coach calc 60x5@8 --reps 3` (`--rir N` za drugi RIR).
7. "Gotovo" / "kraj treninga" → `coach report --session` i kratak sažetak: rekordi, napredak, što
   stagnira.

## Dan: san, težina, hrana

Kad korisnik spomene san, vaganje ili hranu, upiši u dan (`--date YYYY-MM-DD` za drugi dan):

- San kao ocjena 1–5 (1 loše, 3 ok, 5 odlično): `coach sleep 4`. Ako opiše riječima, procijeni
  ocjenu i reci koju si upisao.
- Težina: `coach weight 87.6`.
- Hrana: `coach eat "čips" --grickalice --kasno`. Oznake:
  - `--slatko`: sve s dodanim šećerom (slatkiši, kolači, keksi, sokovi, zaslađeni jogurti);
  - `--grickalice`: čips, smoki, krekeri, kikiriki i slično;
  - `--kasno`: pojedeno navečer (od ~20 h ili manje od 3 h prije spavanja). `--time HH:MM` ako
    se zna vrijeme.
  Zdrava hrana ide bez oznaka. Ispravak: `coach eat --rm <n>`; pregled: `coach day`.
- Cilj je što manje šećera i grickalica navečer. Nakon unosa javi niz (dana bez slatkog, večeri
  bez grickalica) kratko i bez moraliziranja.

Tjedni izvještaj: `coach report --week --save` izračuna brojke i spremi ih u
`data/reports/<YYYY-Www>.md`. Na vrh dodaj kratak komentar trenera (2–4 rečenice, na hrvatskom,
bez izmišljanja brojki, uključi i navike: san, težinu, slatko i grickalice navečer) pa commitaj u `data/` (`git -C data commit`).
