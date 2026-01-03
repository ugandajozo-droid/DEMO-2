# PocketBuddy - PRD (Product Requirements Document)

## Pôvodný problém
Vytvorenie modernej webovej aplikácie PocketBuddy – personalizovaného AI asistenta pre slovenské stredné školy, určeného pre študentov aj učiteľov. Celá aplikácia v slovenskom jazyku.

## Architektúra
- **Frontend**: React + Tailwind CSS + Shadcn/UI
- **Backend**: FastAPI (Python)
- **Databáza**: MongoDB
- **AI**: OpenAI GPT-5.2 cez Emergent LLM Key

## Používateľské persóny
1. **Admin** - správa používateľov, schvaľovanie registrácií, globálna správa AI zdrojov
2. **Učiteľ** - nahrávanie študijných materiálov, správa predmetov, AI chat
3. **Študent** - AI chat, prístup k materiálom podľa ročníka

## Základné požiadavky (statické)
- [x] Slovenský jazyk UI
- [x] Ružovo-modro-biela farebná téma
- [x] 3 roly: Admin, Učiteľ, Študent
- [x] Registrácia so schválením adminom
- [x] AI chat s GPT-5.2
- [x] Správa AI zdrojov
- [x] Správa ročníkov a tried
- [x] Správa predmetov

## Implementované funkcie (3. január 2025)
- [x] Landing page s PocketBuddy brandingom
- [x] Registrácia a prihlásenie s JWT autentifikáciou
- [x] Admin dashboard so štatistikami
- [x] Správa používateľov (aktivácia/deaktivácia/mazanie)
- [x] Schvaľovanie registrácií
- [x] Správa predmetov (CRUD)
- [x] Správa ročníkov a tried (CRUD)
- [x] Správa AI zdrojov (nahrávanie súborov, priradenie k predmetom)
- [x] AI chat s PocketBuddy (GPT-5.2)
- [x] Mazanie konverzácií
- [x] Seed data endpoint pre demo dáta

## Prioritizovaný backlog

### P0 (Kritické) - HOTOVO
- Všetky základné funkcie implementované

### P1 (Dôležité) - TODO
- [ ] Nahrávanie súborov priamo do chatu
- [ ] Spracovanie nahratých PDF/dokumentov pre RAG kontext
- [ ] Hromadné preradenie študentov do vyššieho ročníka
- [ ] Export dát používateľov

### P2 (Nice-to-have) - TODO
- [ ] Notifikácie pre admina o nových registráciách
- [ ] História zmien používateľov
- [ ] Štatistiky používania AI
- [ ] Dark mode

## Ďalšie kroky
1. Implementovať spracovanie nahratých dokumentov pre lepší RAG kontext
2. Pridať podporu pre viac typov súborov v chate
3. Vylepšiť matematické vysvetlenia s LaTeX formátovaním

## Demo prístupy
- **Admin**: admin@pocketbuddy.sk / admin123
