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
3. **Študent** - AI chat, prístup k materiálom podľa ročníka, Flashcards, Kvízy

## Základné požiadavky (statické)
- [x] Slovenský jazyk UI
- [x] Tmavá téma (dark mode)
- [x] Ružovo-modro-biela farebná téma
- [x] 3 roly: Admin, Učiteľ, Študent
- [x] Registrácia so schválením adminom
- [x] AI chat s GPT-5.2
- [x] Správa AI zdrojov
- [x] Správa ročníkov a tried
- [x] Správa predmetov
- [x] AI používa emoji 😊
- [x] Flashcards generátor
- [x] Quiz generátor

## Implementované funkcie (3. január 2025)
- [x] Landing page s PocketBuddy brandingom
- [x] Registrácia a prihlásenie s JWT autentifikáciou
- [x] Admin dashboard so štatistikami
- [x] Správa používateľov (aktivácia/deaktivácia/mazanie)
- [x] Schvaľovanie registrácií
- [x] Správa predmetov (CRUD) - 24+ predmetov
- [x] Správa ročníkov a tried (CRUD) - 4 ročníky
- [x] Správa AI zdrojov (nahrávanie súborov, priradenie k predmetom)
- [x] AI chat s PocketBuddy (GPT-5.2 s emoji)
- [x] Mazanie konverzácií
- [x] Seed data endpoint pre demo dáta
- [x] **Flashcards generátor** - AI generuje učebné kartičky
- [x] **Quiz generátor** - AI generuje kvízy s vysvetleniami
- [x] **Nahrávanie súborov do chatu** - attachment upload
- [x] Tmavá téma (dark mode)
- [x] Navigácia v sidebar (Predmety, Zdroje AI, atď.)

## Opravené chyby (3. január 2025)
- [x] SelectItem value="" error vo FlashcardsPage.js - zmenené na value="all"
- [x] SelectItem value="" error vo QuizPage.js - zmenené na value="all"

## Prioritizovaný backlog

### P0 (Kritické) - HOTOVO
- [x] Všetky základné funkcie implementované
- [x] Flashcards a Quiz generátory
- [x] Opravené SelectItem errory

### P1 (Dôležité) - TODO
- [ ] Hromadné preradenie študentov do vyššieho ročníka
- [ ] Čítanie obsahu nahratých PDF/dokumentov pre RAG kontext
- [ ] Export dát používateľov

### P2 (Nice-to-have) - TODO
- [ ] Notifikácie pre admina o nových registráciách
- [ ] História zmien používateľov
- [ ] Štatistiky používania AI
- [ ] LaTeX formátovanie matematických vzorcov

## Test výsledky (3. január 2025)
- **Backend**: 100% (19/19 testov prešlo)
- **Frontend**: 100% (všetky UI funkcie fungujú)
- **Test súbor**: /app/tests/test_pocketbuddy_api.py

## Demo prístupy
- **Admin**: admin@pocketbuddy.sk / admin123

## Technické poznámky
- AI endpoint používa Emergent LLM Key pre GPT-5.2
- Všetky súbory sa ukladajú do /app/backend/uploads/
- JWT tokeny platia 24 hodín
