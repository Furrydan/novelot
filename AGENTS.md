# Repository Guidance

## Commands and Verification

- `novelot-backend/` and `novelot-frontend/` are independent npm packages with separate lockfiles, not a root workspace. Run `npm ci` and package commands inside the relevant directory.
- CI (`.github/workflows/test.yml`) uses Node 22 and runs only `npm test` in each package; it does not check builds or lint. Dockerfiles use Node 20.
- In either package, `npm test -- --run` runs coverage once; plain `npm test` can enter watch mode locally. For a focused test without coverage, use `npx vitest run <test-path> -t "<test-name>"`.
- Backend: `npm run build` is type-check-only (`noEmit: true`), despite the configured `dist` directory. Start source with `npm start` (`tsx src/index.ts`), not `node dist/index.js`. Focused suites: `npm run test:unit` and `npm run test:integrations`.
- Frontend: `npm run build` runs TypeScript checking followed by Vite bundling; `npm run lint` is a separate check. `npm run dev` serves port 5173.
- Backend integration tests import `src/app.ts` and start `MongoMemoryServer`; they do not need Compose Mongo or application env files and set their own token secrets. Frontend tests use jsdom with `src/test/setup.ts`.

## Local Runtime

- Root `docker compose up --build` requires `novelot-backend/.env` and `novelot-frontend/.env`. App source is copied into images, not bind-mounted: rebuild after code edits.
- Backend expects `MONGODB_URI`, `ACCESS_TOKEN_SECRET`, and `REFRESH_TOKEN_SECRET`. Compose injects them; direct startup does not load `.env` automatically despite the installed `dotenv` dependency. For the seeded DB, use `mongodb://mongo:27017/novelot` inside Compose or `mongodb://localhost:27017/novelot` from the host.
- Frontend `VITE_API_URL` is a browser-reachable origin (default `http://localhost:1714`), not an `/api` URL or Docker service hostname. `src/api/novelClients.ts` appends the API paths. There is no Vite proxy; backend CORS allows only `http://localhost:5173`.
- `mongo-init/import.sh` imports backend `src/assets/{novelList,userList}.json` into `novelot` only when the Mongo volume is first initialized. Seed edits do not update an existing volume. `docker compose down -v` deletes persisted data; do not use it as routine shutdown.

## Cross-File Contracts

- Backend `src/app.ts` constructs Express and mounts `/api`; `src/index.ts` connects Mongo before listening. Keep startup side effects out of `app.ts` so integration tests can import it.
- Frontend `src/main.tsx` installs `AuthProvider`; the current app is a search view, not a React Router app despite the root README's stack table.
- The packages each maintain `src/types/Novel.ts`, including runtime guards; there is no shared/generated contract. Check both copies when changing novel payloads.
- Frontend import aliases must agree between `tsconfig.app.json` and `vite.config.ts`; backend Vitest reads aliases via `resolve.tsconfigPaths`.
- Empty/out-of-range novel pages return HTTP 400 with `"Invalid Page"`, not an empty list. Frontend `src/components/search/logic/UseNovels.ts` recognizes that exact message and decrements the page; change this contract on both sides together.
