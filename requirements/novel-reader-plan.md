# Novel Reader: Step-by-Step Development Plan

## Context

Requirement #4, "Novel Reader". The reader shows the chapter title and content, has Prev/Next buttons, and has a floating settings button that opens a popup for font size, light/dark theme and font family (2–3 options).

The developer writes the code. Each task is one commit. After each task, Claude reviews before committing.

To resume in a new chat: point Claude at this file, name the next unchecked task, and ask for a review when done.

## Decisions

- **Storage**: one `chapters` collection with a unique compound index on `{ novelId: 1, chapterNumber: 1 }`. Rejected one-collection-per-novel (dynamic Mongoose models, duplicated id, N× index/seed maintenance, no cross-novel queries).
- **Chapter shape**: `{ novelId: number, chapterNumber: number, title: string, content: string[] }`.
    - camelCase fields, matching the rest of the codebase.
    - No separate `id`: `(novelId, chapterNumber)` is the key.
    - No `likes`/`views` until chapter stats are actually designed.
    - `content` is an array of paragraphs. Empty `content: []` is accepted (tested).
- **Chapter bounds**: the API returns `totalChapters` with each chapter so Prev/Next can be disabled at the ends.
- **Layout**: the reader renders inside `Page` (with TopBar), so `BrowserRouter` moves above `Page`.
- **Settings persistence**: saved to the user account when logged in. Logged-out readers use localStorage.
- **Settings styling**: JS state holds the choice, CSS holds the look. Theme and font use `data-theme` / `data-font` attributes with CSS custom properties. Font size is passed as a single custom property via `style`.

## Conventions

- Follow the existing novel pattern: type + guard → model → service → controller → route.
- Throw `novelotError` for HTTP errors.
- Tests go next to the existing ones in `src/test/unit/...` and `src/test/integrations/`.
- Use the `@apptypes/`, `@models/`, `@helpers/` etc. aliases like existing files.
- Run `npm test -- --run` in the package you changed before each commit.

---

## Phase 1: Database (backend)

- [x] **1. Chapter type and runtime guard**
    - Files: `novelot-backend/src/types/Chapter.ts`, `src/test/unit/types/Chapter.test.ts`
    - Done: guard rejects missing/wrong-type fields, `null` and `undefined`; accepts empty content.

- [ ] **2. Chapter Mongoose model**
    - File: `src/models/chapterModel.ts`
    - Schema, the compound unique index, and the `"chapters"` collection name. Add one function, `getChapter(novelId, chapterNumber)`.
    - Think about: what should it return when nothing is found? `novelModel` and `userModel` handle "not found" differently.
    - Done when: it type-checks (`npm run build`).

- [ ] **3. Count chapters**
    - File: `src/models/chapterModel.ts`
    - Add `countChapters(novelId)` using `countDocuments`.
    - Think about: why can this query use the `{ novelId, chapterNumber }` index even though it filters only on `novelId`?
    - Done when: it type-checks.

- [ ] **4. Seed sample chapters**
    - Files: `src/assets/chapterList.json` (2 novels × 3 short chapters), `mongo-init/import.sh` (one more `mongoimport` line)
    - Note: `import.sh` only runs on a fresh volume, and `mongoimport` doesn't create indexes (Mongoose's autoIndex does on startup).
    - Done when: after recreating the volume, `chapters` has 6 documents in Compass, and `getIndexes` shows the compound index once the backend has started.

## Phase 2: Backend API

- [ ] **5. Validate route parameters**
    - Files: `src/helpers/validator.ts`, `src/test/unit/helpers/validator.test.ts`
    - Add `validatePositiveInt(value, name)`. It throws `novelotError(400, ...)` for `"abc"`, `"0"`, `"-1"` and `"1.5"`.
    - Done when: the unit tests cover each bad case and one valid case.

- [ ] **6. Chapter service**
    - Files: `src/services/chapterService.ts`, `src/test/unit/services/chapterService.test.ts`
    - `getChapter(novelId, chapterNumber)` → `{ ...chapter, totalChapters }`. It throws 404 when the chapter is missing.
    - Mock the model the same way `novelService.test.ts` does.
    - Done when: the tests pass for found and not found.

- [ ] **7. Controller and route**
    - Files: `src/controllers/chapterController.ts`, `src/routes/novelRouter.ts`, controller unit test
    - Route: `GET /api/novels/:novelId/chapters/:chapterNumber`. Validate the params, call the service, return 200.
    - Think about: should the route live in `novelRouter` or in its own router mounted under it? Why?
    - Done when: the controller unit test passes, and `curl localhost:1714/api/novels/1/chapters/1` works against Compose.

- [ ] **8. Integration test**
    - File: `src/test/integrations/getChapter.test.ts` (use `getAllNovels.test.ts` as a template)
    - Cases: 200 with `totalChapters`, 404 for a missing chapter, 400 for a bad parameter.
    - Done when: `npm run test:integrations` passes.

## Phase 3: Frontend reader

- [ ] **9. Move the Router above Page**
    - Files: `novelot-frontend/src/main.tsx`, `src/App.tsx`
    - Put `BrowserRouter` in `main.tsx` so TopBar can use `<Link>` too.
    - Done when: search still works and the existing tests pass. Fix any tests that render `App` without a router.

- [ ] **10. Frontend Chapter type and guard**
    - Files: `src/types/Chapter.ts` and its test. Keep it in sync with the backend copy (AGENTS.md contract).
    - Done when: the guard tests pass.

- [ ] **11. API call**
    - File: `src/api/novelClients.ts` (or wherever `UseNovels.ts` makes its call)
    - Add `getChapter(novelId, chapterNumber)` using the existing `api` instance, and check the response with `isChapter`.
    - Done when: it type-checks (`npm run build`).

- [ ] **12. Route and Reader skeleton**
    - Files: `src/components/reader/Reader.tsx`, `src/App.tsx`, `Reader.test.tsx`
    - Route: `/novels/:novelId/chapters/:chapterNumber`. For now Reader only shows the parsed params.
    - Test with `MemoryRouter initialEntries={["/novels/1/chapters/2"]}`.
    - Done when: opening the URL directly (and refreshing it) shows the params.

- [ ] **13. `useChapter` hook**
    - Files: `src/components/reader/logic/useChapter.ts` and its test (copy the structure of `UseNovels.ts`)
    - Returns `{ chapter, loading, error }` and fetches again when the params change.
    - Think about: what happens if the user clicks Next twice quickly and the responses come back in the wrong order?
    - Done when: the tests pass for loading, success, error and a param change.

- [ ] **14. Render the chapter**
    - Files: `Reader.tsx`, `Reader.css`
    - Show the title and the content as paragraphs, plus loading and error states.
    - Done when: a seeded chapter shows in the browser.

- [ ] **15. Prev/Next navigation**
    - Files: `Reader.tsx` (or a `ChapterNav.tsx`), tests
    - Navigate to the neighbouring URL. Prev is disabled on chapter 1 and Next is disabled at `totalChapters`. Scroll to the top on change.
    - Done when: the tests cover both bounds, and the browser back button returns to the previous chapter.

- [ ] **16. Entry point from search**
    - Files: `src/components/search/grid/NovelGrid.tsx` and its test
    - Each novel card links to `/novels/:id/chapters/1`.
    - Done when: clicking a card opens chapter 1.

## Phase 4: Reader settings (local)

- [ ] **17. Theme with CSS custom properties**
    - File: `Reader.css`
    - Define `--reader-bg`, `--reader-fg` and `--reader-font` under `.reader[data-theme="light"|"dark"]` and `[data-font=...]`. Font size uses `var(--reader-font-size)` with a fallback.
    - Test it by hard-coding `data-theme="dark"` on the root in JSX for now.
    - Done when: switching the hard-coded attribute changes the look.

- [ ] **18. `useReaderSettings` hook (state only)**
    - Files: `src/components/reader/logic/useReaderSettings.ts` and its test
    - Holds `{ fontSize, theme, font }` with defaults, and provides setters or an updater. Keep the font size within a min and max.
    - Done when: the tests pass. Reader passes the values to `data-theme`, `data-font` and the `--reader-font-size` style.

- [ ] **19. Floating settings button and popup shell**
    - Files: `ReaderSettings.tsx`, `ReaderSettings.css`, test
    - A fixed-position button that opens and closes the popup. Look at `layout/Dropdown.css` for existing popup styles.
    - Think about: closing on outside click or Escape. How does `AccountDropdown` handle this?
    - Done when: the tests cover opening and closing.

- [ ] **20. Settings controls**
    - File: `ReaderSettings.tsx`
    - A− / A+ buttons, a light/dark toggle and a font choice, connected to the hook through props.
    - Done when: the tests check that each control changes the attribute or custom property on the reader root.

- [ ] **21. Fonts**
    - Files: `Reader.css`, possibly `index.html`
    - Pick 2–3 families (system font stacks, or self-hosted or Google fonts) for `[data-font=...]`.
    - Done when: all options render visibly differently.

- [ ] **22. localStorage persistence**
    - File: `useReaderSettings.ts` and its test
    - Load on start and save on change. Handle stored data that is corrupt or out of date.
    - Done when: settings survive a refresh while logged out.

## Phase 5: Account persistence

- [ ] **23. User schema: `readerSettings`**
    - Files: backend `src/types/User.ts`, `src/models/userModel.ts`, related tests
    - Add an optional `readerSettings` subdocument, with a guard or validation for its values.
    - Done when: the existing user tests still pass.

- [ ] **24. `GET /api/users/me/settings`**
    - Files: `userController.ts`, `userService.ts`, `userRouter.ts`, tests
    - Authenticate the same way as `getMe`. Return the stored settings, or a 404 or defaults (your choice — why?).
    - Done when: the integration test covers authorised and unauthorised requests.

- [ ] **25. `PATCH /api/users/me/settings`**
    - Same files. Validate the body (font size within range, theme and font from the allowed values).
    - Done when: the integration test covers a valid update, an invalid body and no token.

- [ ] **26. Frontend settings API calls**
    - File: `src/api/novelClients.ts`
    - Add `getSettings` and `saveSettings` on `authApi` with the access token, the same way `AuthContext` calls `/me`.
    - Done when: it type-checks.

- [ ] **27. Hook uses the account when logged in**
    - Files: `useReaderSettings.ts`, `ReaderSettings.tsx`, tests
    - Logged in: load from the account and save when the popup closes. Logged out: use localStorage (Task 22).
    - Think about: what happens to settings chosen while logged out once the user logs in?
    - Done when: the tests cover both logged-in and logged-out paths, and settings follow the account in a second browser.

---

## Verification

- After every task: `npm test -- --run` in the package you touched. For backend tasks, also `npm run build`. For frontend tasks, also `npm run build && npm run lint`.
- End to end: `docker compose up --build` (fresh volume for the seed). Then search → click a novel → read → Next/Prev at both bounds → change settings → refresh → log in → check the settings are restored.
