# Coach — dnevnik snage

Osobni dnevnik treninga snage. **Ne daje program**: bilježi što je odrađeno i svaki trening
uspoređuje s prošlim brojkama. Jedan korisnik. Node server na stalno
upaljenom računalu, PWA na mobitelu, unos kroz Claude. UI je na hrvatskom.

## Pojmovi

- **Vježba**: npr. bench press, čučanj. Ima ime, aliase ("bench", "potisak s klupe") i opcionalno
  `bodyweight`, za vježbe bez kilaže.
- **Trening**: datum, popis vježbi, opcionalna bilješka.
- **Unos vježbe na treningu**:
  - `zagrijavanje`: označeno da/ne (2–4 serije). Nema kilaža ni ponavljanja.
  - `radne serije`: popis `{kg, ponavljanja}`, samo top setovi.
  - opcionalna bilješka.
- **Volumen serije** = kg × ponavljanja. 100 kg × 5 = 500 kg.
- **RPE** (opcionalno po seriji) = 10 − RIR. U appu i izvještajima prikazuje se kao RIR (ponavljanja u rezervi).
- **Preračun serije**: isti zamor na drugom broju ponavljanja = e1RM × %1RM(ponavljanja, RPE). Npr. 60×5 RIR 2 → 3 pon. RIR 2 ≈ 63,8 kg. Kartica Kalkulator u appu, `coach calc` u CLI-ju.
- **e1RM** (procjena 1RM) po RTS RPE tablici, kao plsource.org/rpe-calc: kg / %1RM(ponavljanja, RPE). Serija bez RPE računa se kao RPE 10.

## Izračuni (deterministički, u kodu, ne u Claudeu)

**Tri ključna parametra** po vježbi na svakom treningu (iz radnih serija):
1. **Najteža serija**: najveća kilaža (kod jednake kilaže, više ponavljanja). Npr. 105 kg × 3.
2. **Maks. volumen serije**: najveći kg × ponavljanja u jednoj seriji. Npr. 100 × 5 = 500 kg.
3. **e1RM**: najveća procjena 1RM među radnim serijama. Npr. 116,7 kg.

Svaki od tri parametra uspoređuje se:
- s **prethodnim treningom** iste vježbe: razlika i %, npr. "e1RM 116,7 kg (+4,2%)";
- s **dosadašnjim najboljim** (rekord). Novi rekord se istakne (PR značka).

Uz to, za kontekst:
- **ukupni volumen** vježbe (zbroj radnih serija);
- sirove brojke prošlog puta ("zadnji put: 100×5, 100×5").

Tjedno: ista tri parametra kao najbolja vrijednost u tjednu, uspoređena s prošlim tjednom i s
rekordom.

## Unos kroz Claude

- Korisnik govori ili piše u Assistant panelu (Fleet embed, kao u Brainu), nakon svake serije ili na
  kraju treninga, npr. "bench, 3 zagrijavanja, pa 100×5, 100×5, 102,5×4".
- Claude prepozna vježbu (alias, pa po potrebi pita), složi unos i upiše ga kroz CLI:
  `coach log`, `coach add-set`, `coach show`, `coach stats`. Nakon unosa vrati kratku potvrdu:
  tri parametra, % u odnosu na prošli put, eventualni PR.
- Unos tijekom treninga ide u današnji trening. Ispravci idu riječima ("zadnja serija je bila 4,
  ne 5").
- U repou je `CLAUDE.md` s uputama za takav unos.

## Aplikacija (PWA, mobitel prvi)

- **Danas**: tekući trening. Za svaku vježbu oznaka zagrijavanja, radne serije i tri parametra
  (najteža serija, maks. volumen serije, e1RM), svaki s % u odnosu na prošli put i PR značkom. U ovoj verziji nema ručnih formi, unos ide kroz Claude.
- **Vježbe**: popis vježbi. Detalj vježbe:
  - graf sva tri parametra kroz vrijeme;
  - povijest treninga;
  - rekordi;
  - "zadnji put", da se zna od čega se nastavlja.
- **Tjedan**: tjedni izvještaji, uz arhivu prošlih tjedana.
- suite: tema, PIN lock, Assistant panel.

## Izvještaj na kraju treninga

- Korisnik kaže "gotovo", "kraj treninga" ili slično. Claude pokrene `coach report --session`.
- Izvještaj sadrži, za svaku vježbu:
  - najtežu seriju, maks. volumen serije i e1RM;
  - za svaki parametar promjenu u odnosu na prošli put (apsolutno i u %) i usporedbu s rekordom;
  - PR-ove.
- Na kraju je sažetak treninga (novi PR-ovi, što je napredovalo, što je stagniralo).
- Isti prikaz je i na ekranu Danas, odnosno u detalju treninga.

## Tjedni izvještaj

- Fleet bot, nedjeljom navečer.
- `coach report --week` izračuna brojke: broj treninga i, za svaku vježbu, tri parametra (najbolji u
  tjednu), usporedbu s prošlim tjednom i rekordom, nove PR-ove i vježbe koje stagniraju.
- Claude na temelju tih brojki napiše kratak komentar.
- Izvještaj se sprema u `data/reports/<YYYY-Www>.md` i prikazuje u appu (Tjedan).

## Podaci

- JSON u `data/`, zasebnom privatnom git repou (javni repo koda ga ignorira): `exercises.json` i `workouts/<YYYY-MM-DD>.json`.
- Svaki unos je commit u `data/`. Piše samo jedan server.
- Testovi koriste fixture, nikad `data/`.

## Infrastruktura

- `coach serve` (Node, bez ovisnosti) na 127.0.0.1:**4340**, `GET /api/health`.
- launchd agent `coach.serve` (`scripts/install.sh`), `tailscale serve` za HTTPS i PWA.

## Izvan opsega (za sad)

Program ili plan treninga, pristup za coacha, kardio, Apple Health / Garmin, timer odmora,
ručne forme za unos.
