# AI Schedule Assistant One-Hour Portfolio Release Design

## Goal

Prepare a public, HR-ready portfolio release in one focused hour. The repository must let a non-technical reviewer understand the product quickly and let a technical reviewer verify that the mobile workflow, persistence, tests, and release artifact are real.

The portfolio targets both product and product-engineering evaluation. It does not add new product features.

## Public Demo Contract

The public source code and public APK use a deterministic offline AI demo by default. This keeps the complete workflow usable without exposing paid API credentials or depending on an external service.

The applicant records a separate real-device video from the already installed API-enabled build. The README labels the two modes clearly:

- Public APK: offline, reproducible demonstration.
- Recorded real-device demo: actual model integration.
- Production architecture: model credentials belong behind a server-side proxy and are never shipped in the mobile bundle.

## Deliverables

### Repository Landing Page

Create a concise Chinese README with this reading order:

1. One-sentence product value proposition.
2. Four core mobile screenshots.
3. A 60-90 second real-device demonstration link or placeholder until the user uploads it.
4. Android APK download link through GitHub or Gitee Release.
5. Core workflow and product decisions.
6. Technical architecture, AI provider abstraction, SQLite persistence, Zustand state, maps, and notifications.
7. Test and build commands with current results.
8. Demo-mode and production-security explanation.

### Product Evidence

Add a short product case document covering:

- target user and primary pain point;
- the chosen end-to-end scenario;
- product hypothesis and success indicators;
- scope decisions and explicit non-goals;
- a lightweight user-research demo with assumptions clearly labeled rather than presented as completed interviews;
- next validation steps.

### Engineering Evidence

Add a short engineering note covering:

- Expo React Native cross-platform structure;
- UI to Zustand to repository to SQLite data flow;
- AI client interface and offline/online implementations;
- map, location, and notification integration;
- security boundary for model credentials;
- test strategy and known limitations.

### Release Evidence

Produce one Android APK suitable for portfolio evaluation, a SHA-256 checksum, release notes, and a short installation warning for Android devices that block unknown sources. Do not commit the APK into normal source history; attach it to a hosted Release.

## Security Requirements

- Remove all hard-coded DeepSeek and map API credentials from tracked source.
- Add a safe example configuration without real secrets.
- Make offline demo mode the default public behavior.
- Rebuild the public APK after removing credentials.
- Instruct the user to revoke and rotate both exposed credentials before publishing.
- Do not claim that environment variables make a mobile-bundled secret secure.

## Quality Requirements

- Fix all current Jest failures.
- Pass the complete Jest suite.
- Pass `npm.cmd run typecheck`.
- Build the Android release successfully.
- Verify APK package metadata and checksum.
- If device installation cannot be performed from this workspace, state that limitation and have the user install the rebuilt APK before publishing it.

## Screenshot And Video Story

The four screenshots show:

1. Today overview and action timeline.
2. Natural-language schedule creation and structured confirmation.
3. AI action plan with route or preparation details.
4. Calendar persistence or preference personalization.

The real-device recording follows one uninterrupted story: enter a natural-language request, confirm the parsed schedule, inspect the generated action plan, show route/reminder context, then return through the calendar to prove persistence. The user records this from the existing API-enabled phone build.

## One-Hour Execution Order

1. Security and public demo mode.
2. Test repairs and type checking.
3. README plus product and engineering evidence.
4. Screenshot capture and media placement.
5. Public APK rebuild, metadata verification, checksum, and release notes.
6. Final repository audit and HR message.

If time becomes constrained, preserve items 1, 2, 3, and a verified APK. The video can remain a clearly labeled pending link because the user records it independently on the phone.

## Out Of Scope

- iOS binary or TestFlight delivery;
- CI/CD setup;
- new application features;
- deployed model proxy;
- formal user interviews or fabricated research results;
- retroactively fabricated Git history.

## Acceptance Criteria

The work is ready to send when the repository contains no real credentials, the public demo runs without credentials, tests and type checking pass, the README presents both product and engineering evidence, the rebuilt APK and checksum exist, and the remaining user-only actions are limited to credential revocation, phone recording upload, and remote Release publication.
