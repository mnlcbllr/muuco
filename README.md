# Muuco

A mobile-first personal organizer with an iOS-inspired interface and a purple owl companion. Built with Expo SDK 58, React Native, TypeScript, and Expo Router.

## Implemented

- Today: quick capture, inbox, unfinished tasks, notes, and local search.
- Projects: fixed kanban columns, completion counts, notes, and reversible archiving.
- Calendar: week navigation, a daily agenda, manual task blocks, and fixed commitments.
- Local free-slot suggestions: checks 9 am–6 pm in 15-minute steps; saves only after approval. This is **not AI**.
- Separate task deadlines and scheduled times, overlap validation, and stale-edit protection.
- Local task-start reminders on mobile, with permission handling, private notification text, and reconciliation when the app opens.
- System light/dark appearance, native mobile tabs, native date/time controls, and guarded unsaved forms.
- Native encrypted SQLite with a device-protected key. The app refuses an unencrypted native fallback.
- Original supplied mascot artwork in `assets/brand/` and derived app/avatar/adaptive icon assets.

## Run

Use Node 22.13+ (Node 26 is used during development) and npm.

```sh
npm ci
npm run web
```

The browser is an **unencrypted interface preview**, not a secure replacement for the mobile app. It uses local SQLite/WASM through asynchronous worker APIs. Clearing site data removes its database. It is client-rendered, with no server-rendering dependency. Synchronous SQLite APIs are intentionally not used; those would additionally require cross-origin isolation headers for SharedArrayBuffer. A production host must serve `index.html` for application routes.

### Android / iOS

**Expo Go does not include SQLCipher. Use a development build.**

```sh
npx expo run:android
# macOS + Xcode:
npx expo run:ios
```

These generate native directories from app configuration; do not edit generated native files. The CLI will ask for application identifiers if needed. Alternatively configure Expo Build with your account and chosen identifiers before creating a cloud development build; no paid builds or publishing are triggered by this repository.

Once installed, launch Metro with `npm start` and open the app in its development client. A development client still needs Metro to serve its JavaScript; standalone release builds are required to verify complete airplane-mode operation.

## Verification

```sh
npm run check
npx expo-doctor
npx expo export --platform web
npx expo export --platform android
npx expo export --platform ios
```

Browser regressions (isolated test data, no personal workspace changes):

```sh
npx playwright install chromium
npm run test:e2e
```

Playwright starts the web preview if needed and checks capture conversion, persistence after reload, projects and notes, scheduling conflicts, calendar linkage, completion, archiving, unsaved-input protection, dark appearance, and a narrow viewport. Screenshots are saved under the ignored `test-results/` directory. These are browser checks, not native iPhone/Android tests.

Tests exercise date/time handling (including DST), conflict checks, scheduling, reminder eligibility, and production repository SQL against Node's real SQLite engine. They do not replace SQLCipher/native-device tests.

## Architecture

- `src/app/`: Expo Router screens and layouts.
- `src/ui/`: semantic light/dark colors, shared controls, native/web date controls, and form protection.
- `src/core/model.ts`: domain types, validation, calendar arithmetic, and scheduling rules.
- `src/data/`: schema migrations, serialized SQLite operations, device encryption, and platform reminder integration.
- `tests/`: domain and SQLite regression tests.

One task row owns its single scheduled work session for this first version. `dueDate` is a local calendar date; `startAt` is an absolute ISO timestamp. There are no duplicate per-screen task records or cached progress percentages. Multi-session tasks would justify a separate block table later.

## Privacy and current limitations

- **No cloud AI is connected.** The assistant screen says so explicitly. No provider credentials, personal-content uploads, remote push tokens, analytics, accounts, or sync are implemented. Connecting cloud AI needs a protected authenticated gateway, provider/retention choices, spending controls, and explicit context-sharing consent.
- **Encrypted backup/export and restore are not implemented. Do not store irreplaceable information as its only copy in this development build.** Uninstalling can lose data and its device key. Android automatic app backup is disabled. iOS backup/recovery behavior still needs a release review; device-bound keys must not be treated as a recovery solution.
- Reminders currently fire at scheduled task starts, not deadlines. The nearest 60 eligible reminders are registered. Later reminders require another app open. System permissions, force-stop, battery restrictions, and focus settings affect delivery; exact alarm timing is not promised.
- There is one work session per task, no recurring tasks, no external calendar access, and no multi-device sync. The assistant cannot know commitments you have not entered.
- Search scans the loaded personal workspace, rather than maintaining a second index. Pagination/FTS can follow measured data-volume needs.
- Real Android and iPhone testing is still required for encryption, reminders after reboot, keyboard/sheet behavior, accessibility, and release offline operation.
- The current SDK-compatible tooling dependency tree reports moderate `glob`/`minimatch` denial-of-service advisories. They are in the build/lint tooling chain, not an organizer feature. Do not run `npm audit fix --force`: npm currently proposes an incompatible Expo downgrade. Review upstream fixes before release.

## Artwork

Source images were supplied by the project owner and are preserved in `assets/brand/`. App imagery is derived from them; commercial rights and app-store/trademark availability have not been verified.
