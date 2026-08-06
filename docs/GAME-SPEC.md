# SFHS Doom Game Specification

## Public candidate identity

SFHS Doom is an unofficial browser packaging of Chocolate Doom with embedded Freedoom Phase 2 data. The current public product is the exact one-file Android portrait candidate `dist/sfhs-doom-android.html`.

The primary experience is portrait Android Chrome: a first-person game view, separate explored-line minimap, adjustable multi-touch controls, and a compact read-only HUD are visible together. Landscape remains a functional fallback; desktop Chromium is a secondary supported target.

## Boundaries

The candidate preserves the Chocolate Doom simulation and renderer. Mobile controls enter through SDL input events. The mobile state packet is read-only; it supplies the minimap and HUD without changing simulation state. The product contains no commercial Doom data and makes no required runtime network request.

## Current acceptance statement

This is an **Android emulator-accepted candidate**. Physical Samsung acceptance is pending, so no physical-device performance, comfort, heat, battery, or speaker-audibility claim is made. P4 local-file launcher work is blocked and not part of the product.
