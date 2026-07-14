# AI Schedule Assistant App Icon Design

## Direction

Use the approved "Time Slices" direction: three offset schedule bars and three teal time nodes form a subtle S-shaped rhythm. The mark should feel abstract, calm, and recognizable at launcher size without using literal calendar, checkmark, robot, or sparkle symbols.

## Visual System

- Canvas: 1024 x 1024 px.
- Background: `#EFFAFA`, matching the product's cool white and teal palette.
- Primary mark: `#0F172A`, matching the app's primary text color.
- Accent nodes: `#0891B2`, matching the app's primary action color.
- Geometry: three rounded horizontal bars with consistent thickness and generous negative space.
- Safe area: all foreground geometry remains within the central 66% adaptive-icon safe zone.
- Effects: flat fills only; no gradients, shadows, outlines, text, or decorative highlights.

## Android Delivery

- Keep a 1024px full icon as the Expo source icon.
- Keep a transparent 1024px foreground asset for Expo adaptive icons.
- Keep a monochrome 1024px foreground asset for themed icon support.
- Replace legacy launcher assets at mdpi through xxxhdpi.
- Add Android 8+ adaptive icon XML using the same vector geometry and background color.

## Acceptance Criteria

- The launcher no longer displays the default Android robot icon.
- Square and round launchers preserve the mark and background without clipping.
- The 42px preview remains legible and visually balanced.
- `app.json` points to version-controlled icon sources so future Expo prebuilds preserve the design.

