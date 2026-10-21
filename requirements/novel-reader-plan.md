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
- **Not found**: `chapterModel.getChapter` throws `novelotError(404)`, consistent with `userModel`. Accepted cost: a future "does chapter N exist?" check needs its own model function or a try/catch.
- **Chapter bounds**: the reader needs `totalChapters` to disable Next on the last chapter. Prev doesn't need it, because chapter 1 is always first.
    - `totalChapters` is stored on the novel document. The seed script writes it, and `novelModel.getTotalChapters` reads it.
    - `chapterService.getChapter` attaches it to each chapter response: `{ ...chapter, totalChapters }`. That way a reader who opens a chapter URL directly gets the content and the bounds in one request.
    - Accepted: the stored count could drift from the real chapters. That's unlikely, because novels are uploaded once and the seed (or a future upload) writes both together. A chapter added while someone is reading isn't seen until the next chapter request.
    - Rejected: counting `chapters` with `countDocuments` on every request (the count belongs to the novel, so it's stored there instead). Also rejected: a per-chapter `hasNext` flag, which needs an extra lookup and can't support "Chapter 3 of 12" or a progress bar.
    - Only the backend `Novel` has the field. The frontend `Novel` and its `novelList.json` fixture are unchanged, because search doesn't use the count and `isNovel` ignores extra keys.
- **Layout**: the reader renders inside `Page` (with TopBar), so `BrowserRouter` moves above `Page`.
- **Settings persistence**: saved to the user account when logged in. Logged-out readers use localStorage.
- **Settings styling**: JS state holds the choice, CSS holds the look. Theme and font use `data-theme` / `data-font` attributes with CSS custom properties. Font size is passed as a single custom property via `style`.
- **Settings state**: a `ReaderSettingsContext`, following the `AuthContext` pattern, with its provider in `main.tsx` inside `AuthProvider`. That way task 27 loads account settings once per login and can react to `useAuth()`.
    - Scope: reader only. The `data-*` attributes stay on the reader root, not `<html>`.
    - API: one `settings` object (`{ theme, font, fontSize }`) plus named actions (`setTheme`, `setFont`, `increaseFontSize`, `decreaseFontSize`). One object keeps saving in tasks 22 and 27 simple.
    - Font size: px, 14–28, step 2, default 18. The provider enforces the limits.
    - Rejected: a plain hook in `Reader`. Its state resets whenever Reader unmounts, so it would call `GET /me/settings` on every chapter visit from search.
    - Accepted cost: every test that renders Reader needs the provider.

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

- [x] **2. Chapter Mongoose model**
    - File: `src/models/chapterModel.ts`
    - Done: schema with `content: [String]`, compound unique index, `"chapters"` collection, `getChapter` uses `.lean()` and throws 404 when missing.

- [x] **3. Count chapters**
    - File: `src/models/chapterModel.ts`
    - Done: `getTotalChapters(novelId)` uses `countDocuments({ novelId })`, which can use the compound index because `novelId` is its first field. It returns 0 rather than throwing, because a novel with no chapters still exists.
    - Superseded by task 5b: the count is now stored on the novel, and `chapterModel.getTotalChapters` is removed.

- [x] **4. Seed sample chapters**
    - Files: `src/assets/chapterList.json` (2 novels × 3 short chapters), `mongo-init/import.sh` (one more `mongoimport` line)
    - Note: `import.sh` only runs on a fresh volume, and `mongoimport` doesn't create indexes (Mongoose's autoIndex does on startup).
    - Done when: after recreating the volume, `chapters` has 6 documents in Compass, and `getIndexes` shows the compound index once the backend has started.

## Phase 2: Backend API

- [x] **5. Validate route parameters**
    - Files: `src/helpers/validator.ts`, `src/test/unit/helpers/validator.test.ts`
    - Add `validateChapterRoutes(novelId: number, chapterNumber: number)`. It throws `novelotError(400, "Bad Novel Id")` or `novelotError(400, "Bad Chapter Number")` unless the value passes `Number.isInteger(x) && x >= 1`.
    - The controller (task 7) converts with `Number(req.params.x)` before validating, like `validPage`. So `"abc"` becomes `NaN` and `""` becomes `0`, and both are rejected. Accepted trade-off: lenient strings like `"1e2"` and `" 1"` pass once converted.
    - Done when: the unit tests reject `NaN`, `0`, `-1`, `1.5` and `Infinity` for each param, and accept valid pairs.

- [x] **5b. Store totalChapters on novels**
    - Files: backend `src/types/Novel.ts` and its test, `src/models/novelModel.ts`, `src/helpers/epub/epubToSeed.ts`, `src/assets/novelList.json`, `src/models/chapterModel.ts`
    - Add `totalChapters: number` to the backend type, guard and schema. `novelController` filters search results through `isNovel`, so any novel missing the field disappears from search.
    - `epubToSeed.ts` sets `totalChapters` from the filtered chapter count. Rerun it to regenerate `novelList.json`.
    - Add `novelModel.getTotalChapters(novelId)`: it uses `findOne({ id: novelId }).lean()` and throws `novelotError(404, "Novel Not Found")` when the novel is missing. Remove `chapterModel.getTotalChapters`.
    - Done when: backend `npm test -- --run` passes.

- [x] **6. Chapter service**
    - Files: `src/services/chapterService.ts`, `src/test/unit/services/chapterService.test.ts`
    - `getChapter(novelId, chapterNumber)` → `{ ...chapter, totalChapters }`, using `chapterModel.getChapter` and `novelModel.getTotalChapters`. Both models throw 404s; the service lets them propagate.
    - Mock both models the same way `novelService.test.ts` does.
    - Think about: if the chapter is missing, should the service still call `getTotalChapters`? The order of the two calls decides this.
    - Done when: the tests pass for found (adds `totalChapters`), chapter not found (404 propagates, novel model not called) and novel not found (404 propagates).

- [x] **7. Controller and route**
    - Files: `src/controllers/chapterController.ts`, `src/routes/novelRouter.ts`, controller unit test
    - Route: `GET /api/novels/:novelId/chapters/:chapterNumber`. Validate the params, call the service, return 200.
    - Think about: should the route live in `novelRouter` or in its own router mounted under it? Why?
    - Done when: the controller unit test passes, and `curl localhost:1714/api/novels/1/chapters/1` works against Compose.

- [x] **8. Integration test**
    - File: `src/test/integrations/getChapter.test.ts` (use `getAllNovels.test.ts` as a template)
    - Cases: 200 with `totalChapters`, 404 for a missing chapter, 400 for a bad parameter. Seed a novel (with `totalChapters`) as well as its chapters.
    - Done when: `npm run test:integrations` passes.

## Phase 3: Frontend reader

- [x] **9. Move the Router above Page**
    - Files: `novelot-frontend/src/main.tsx`, `src/App.tsx`, `src/App.test.tsx`
    - Put `BrowserRouter` in `main.tsx`, above `AuthProvider`, so TopBar can use `<Link>` and `AuthProvider` can use `useNavigate`. App tests wrap `App` in `MemoryRouter`.
    - Done when: search still works and the existing tests pass. Fix any tests that render `App` without a router.

- [x] **10. Frontend Chapter type and guard**
    - Files: `src/types/Chapter.ts` and its test. Keep it in sync with the backend copy (AGENTS.md contract).
    - `Chapter` mirrors the backend; `ChapterResponse = Chapter & { totalChapters }` describes the API payload, checked by `isChapterResponse`.
    - Guards take `unknown` and require `novelId`, `chapterNumber` and `totalChapters` to be integers ≥ 1 (stricter than the backend guard). No `chapterNumber <= totalChapters` check.
    - Done when: the guard tests pass.

- [x] **11. API call**
    - Merged into Task 13: the request and `isChapterResponse` check live inline in `useChapter`, matching `UseNovels.ts`. An invalid reply throws.

- [x] **12. Route and Reader skeleton**
    - Files: `src/components/reader/Reader.tsx`, `src/App.tsx`, `Reader.test.tsx`, `App.test.tsx`
    - Route: `/novels/:novelId/chapters/:chapterNumber`. Reader reads the params with `useParams` and converts them with `Number()`. A bad URL (`NaN`) is left to the backend's 400, which surfaces as the reader's error state.
    - Tests need `MemoryRouter` plus a matching `Route`, or `useParams` comes back empty.

- [x] **13. `useChapter` hook**
    - Files: `src/components/reader/logic/useChapter.ts` and its test
    - `useChapter(novelId, chapterNumber)` returns the `ChapterResponse` directly using React 19 `use(promise)`. It suspends while pending and throws on a failed request or an invalid reply.
    - Promises are cached in a module-level `Map` keyed by `novelId/chapterNumber`, so a retried render reuses the same promise. Out-of-order replies can't show, because the screen only reads the current key's promise.
    - Failures stay cached on purpose: evicting on reject makes React retry, refetch and fail forever. Recovery is a page reload, which empties the cache.
    - Rejected: a hook returning `{ chapter, loading, error }`. Resetting state in `useEffect` trips `react-hooks/set-state-in-effect`.
    - Tests: `renderHook` with a `Suspense` wrapper inside `await act(...)`; `vi.resetModules()` in `beforeEach` for a fresh cache; errors checked with `.rejects.toThrow`.

- [x] **14. Render the chapter**
    - Files: `Reader.tsx`, `ChapterContent.tsx`, `ErrorBoundary.tsx`, `Reader.css`, tests
    - `ChapterContent` calls `useChapter` and shows the title and the content as paragraphs. `Reader` wraps it in an error boundary (fallback: message plus a Reload button) and `Suspense` (fallback: loading). The boundary is keyed by chapter, so navigation resets the error and shows the loading fallback.
    - Done when: a seeded chapter shows in the browser.

- [x] **15. Prev/Next navigation**
    - Files: `ChapterContent.tsx`, `ChapterContent.css`, `Reader.tsx`, `Reader.css`, tests
    - Prev/Next are `<button type="button">`s in a `<nav>` inside `ChapterContent` that call `useNavigate` with the neighbouring URL. Between them sits an "n of total" counter. Prev is disabled at `chapterNumber <= 1` and Next at `chapterNumber >= totalChapters`.
    - Kept buttons over `<Link>` for the built-in `disabled` state. Accepted cost: no middle-click into a new tab and no URL preview on hover.
    - `Reader` scrolls to the top in a `useEffect` keyed on `[novelId, chapterNumber]`. `Reader` stays mounted between chapters, so the effect runs as soon as the URL changes, and it also covers typed URLs and back/forward. Accepted cost: back doesn't restore the previous scroll position.
    - CSS uses BEM (`chapter`, `chapter__*`). Hover only applies to `:enabled` buttons.
    - Tests: `useNavigate` is mocked with `vi.hoisted` + `vi.mock("react-router-dom")`, so `ChapterContent` tests need no Router. The scroll test uses `createMemoryRouter` + `router.navigate` to change the URL while `Reader` stays mounted. `window.scrollTo` is spied in `beforeEach` because jsdom doesn't implement it.
    - Done when: the tests cover both bounds, and the browser back button returns to the previous chapter.

- [x] **16. Entry point from search**
    - Files: `src/components/search/grid/NovelGrid.tsx` and its test
    - Each novel card links to `/novels/:id/chapters/1`.
    - Done when: clicking a card opens chapter 1.

## Phase 4: Reader settings (local)

- [ ] **17. Theme with CSS custom properties**
    - File: `Reader.css`
    - Define `--reader-bg`, `--reader-fg` and `--reader-font` under `.reader[data-theme="light"|"dark"]` and `[data-font=...]`. Font size uses `var(--reader-font-size)` with a fallback.
    - Test it by hard-coding `data-theme="dark"` on the root in JSX for now.
    - Replace the hard-coded `white` / `black` / `grey` in `ChapterContent.css` with the custom properties. The reader root's class is now `chapter`, not `reader`.
    - Done when: switching the hard-coded attribute changes the look.

- [ ] **18. `ReaderSettingsContext` (state only)**
    - Files: `src/context/ReaderSettingsContext.tsx` and its test, `src/main.tsx`, `Reader.tsx`, `Reader.css`, `Reader.test.tsx`, possibly `src/types/ReaderSettings.ts`
    - Build the provider and `useReaderSettings()` from your understanding of `AuthContext.tsx`. Use the API and limits from Decisions → Settings state.
    - Reader replaces its two `useState`s with the context, keeps the temporary buttons working, and adds the `--reader-font-size` style. `Reader.css` reads it with a fallback, which finishes the font-size part of task 17.
    - Think about:
        - Where do the allowed themes and fonts live, so the task 22/23 guards can reuse them?
        - Why does TypeScript reject a `--custom` key in `style`?
        - What should `useReaderSettings()` do outside the provider?
    - Done when: the context tests cover the defaults, each action, and both font-size limits. Reader tests pass with the provider, and the temporary buttons still work in the browser.

- [ ] **19. Floating settings button and popup shell**
    - Files: `ReaderSettings.tsx`, `ReaderSettings.css`, test
    - A fixed-position button that opens and closes the popup. Look at `layout/Dropdown.css` for existing popup styles.
    - Think about: closing on outside click or Escape. How does `AccountDropdown` handle this?
    - Done when: the tests cover opening and closing.

- [ ] **20. Settings controls**
    - File: `ReaderSettings.tsx`
    - A− / A+ buttons, a light/dark toggle and a font choice, connected through `useReaderSettings()`.
    - Remove the temporary theme and font buttons from `Reader.tsx`.
    - Done when: the tests check that each control changes the attribute or custom property on the reader root. This includes the deferred Reader attribute tests (defaults, theme, font), which find the root with `closest('.chapter')`.

- [ ] **21. Fonts**
    - Files: `Reader.css`, possibly `index.html`
    - Pick 2–3 families (system font stacks, or self-hosted or Google fonts) for `[data-font=...]`.
    - Done when: all options render visibly differently.

- [ ] **22. localStorage persistence**
    - File: `ReaderSettingsContext.tsx` and its test
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

- [ ] **27. Provider uses the account when logged in**
    - Files: `ReaderSettingsContext.tsx` (reads login state with `useAuth()`), `ReaderSettings.tsx`, tests
    - Logged in: load from the account and save when the popup closes. Logged out: use localStorage (Task 22).
    - Think about: what happens to settings chosen while logged out once the user logs in?
    - Done when: the tests cover both logged-in and logged-out paths, and settings follow the account in a second browser.

---

## Verification

- After every task: `npm test -- --run` in the package you touched. For backend tasks, also `npm run build`. For frontend tasks, also `npm run build && npm run lint`.
- End to end: `docker compose up --build` (fresh volume for the seed). Then search → click a novel → read → Next/Prev at both bounds → change settings → refresh → log in → check the settings are restored.
