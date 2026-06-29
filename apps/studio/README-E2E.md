# Frontend E2E Tests (Playwright)

Quick start to run Playwright E2E tests locally.

Prerequisites:
- Node 18+ and pnpm/yarn/npm installed
- Frontend dev server running (`pnpm dev` or `npm run dev`) at `http://localhost:3000`

Install dev dependencies:

```bash
cd apps/studio
npm install
# or pnpm install
```

Run the E2E tests:

```bash
# start dev server in one terminal
npm run dev

# in another terminal, run Playwright tests
npx playwright test --project=chromium
```

Generate HTML report:

```bash
npx playwright show-report
```

Notes:
- Tests simulate permissions by writing `permissions` array to `localStorage` before navigation. Adjust according to your frontend auth implementation.
- If your app uses server-side rendering and reads permissions only on server, you'll need to provide a test fixture or mock the API endpoints instead.
