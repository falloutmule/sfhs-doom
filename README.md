# SFHS Doom — Android Portrait Emulator Candidate

An unofficial, single-file Chocolate Doom/Freedoom browser build with a portrait-first Android interface, adjustable touch controls, a simultaneous minimap, and a mobile HUD.

> **Status: Android emulator-accepted candidate.** Physical Samsung acceptance is pending. This is not a final release or a claim of physical-device acceptance.

[Play on GitHub Pages](https://falloutmule.github.io/sfhs-doom/) · [Download the exact candidate HTML](https://github.com/falloutmule/sfhs-doom/raw/main/dist/sfhs-doom-android.html)

## Candidate at a glance

- **Platform:** portrait-first Android Chrome; desktop Chromium is a secondary supported target. Landscape is a functional fallback.
- **Controls:** left movement pad, right turn pad, Fire, Use, Run, Menu, Map, and previous/next weapon controls. The input bridge feeds SDL input rather than changing gameplay state directly.
- **Adjustable layout:** use the clearly labeled control-edit action to drag and resize controls, tune opacity/look sensitivity/dead zone, choose presets, and save, reset, export, or import a versioned JSON profile.
- **Map and HUD:** a read-only explored-line minimap remains visible with the game, alongside health, armor, ammo, keys, and ready-weapon information.
- **Offline behavior:** the selected product is one HTML file with its Wasm runtime and open Freedoom Phase 2 data embedded; it requires no runtime network resource.

## Exact published candidate

| Field | Value |
| --- | --- |
| File | `dist/sfhs-doom-android.html` |
| Bytes | 48,275,694 |
| SHA-256 | `fb357e4276a019832a30ba0719a26b5ad815c7accb45ff46be8b302c7406c171` |
| Candidate product build commit | `c16277b4291520e2d6579a6381b9602bbea24151` |
| Current documentation/evidence authority | `12537ce3d1d9f0106153377b76e9450a49cc074f` |
| Verification date | 2026-08-06 |

The prior protected P3 artifact remains available at `dist/sfhs-doom-freedoom2.html` (48,225,654 bytes; SHA-256 `6737dbfc8c7909ea18a820de3cd6677654fab95277caf05eb9d660cb9235490e`).

## Build and focused verification

The HTML artifact is generated; do not hand-edit it. Use the pinned Emscripten 6.0.5 toolchain and the source/build instructions in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The focused publication lane is:

```powershell
python tools/validate-p6-mobile.py dist/sfhs-doom-android.html
python -m unittest tests.test_p6_mobile_contract tests.test_artifact_manifest
python tools/validate_artifact_manifest.py evidence/manifests/P06/sfhs-doom-android.json
python tools/validate_project_docs.py
python tools/taskctl.py validate
cd browser-tests
npm ci
npx playwright test tests/p6-layout.spec.mjs tests/p6-candidate.spec.mjs --workers=1
```

See [docs/TESTING.md](docs/TESTING.md) for gate scope and [docs/SOURCE_AUTHORITY.md](docs/SOURCE_AUTHORITY.md) for the source/artifact authority record.

## Scope and limitations

- Android Studio Emulator acceptance passed; **Physical Samsung acceptance is pending**. Speaker audibility, thumb comfort, heat, battery behavior, and device-specific performance remain untested.
- The P4 local-file launcher is **blocked and not merged**. This candidate does not load local IWADs, PWADs, DeHackEd patches, or demos.
- This is unofficial and is not affiliated with or endorsed by id Software, Chocolate Doom, or the Freedoom maintainers.

## Licensing and source

Chocolate Doom source and modifications are provided under the GPLv2; see [COPYING.md](COPYING.md). Freedoom has separate licensing and notice records. Read [the third-party inventory](docs/licenses/THIRD_PARTY_INVENTORY.md), [source-compliance checklist](docs/licenses/SOURCE_COMPLIANCE_CHECKLIST.md), and [trademark/non-affiliation notice](docs/licenses/TRADEMARK_AND_NONAFFILIATION.md). No commercial Doom data is included.

## Project documents

- [Game specification](docs/GAME-SPEC.md)
- [Project status](docs/PROJECT-STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Testing and evidence](docs/TESTING.md)
- [Decisions](docs/DECISIONS.md)
- [Source authority](docs/SOURCE_AUTHORITY.md)

---

## Preserved upstream Chocolate Doom README

# Chocolate Doom

Chocolate Doom aims to accurately reproduce the original DOS version of
Doom and other games based on the Doom engine in a form that can be
run on modern computers.

Originally, Chocolate Doom was only a Doom source port. The project
now includes ports of Heretic and Hexen, and Strife.

Chocolate Doom’s aims are:

 * To always be 100% Free and Open Source software.
 * Portability to as many different operating systems as possible.
 * Accurate reproduction of the original DOS versions of the games,
   including bugs.
 * Compatibility with the DOS demo, configuration and savegame files.
 * To provide an accurate retro “feel” (display and input should
   behave the same).

More information about the philosophy and design behind Chocolate Doom
can be found in the PHILOSOPHY file distributed with the source code.

## Setting up gameplay

For instructions on how to set up Chocolate Doom for play, see the
INSTALL file.

## Configuration File

Chocolate Doom is compatible with the DOS Doom configuration file
(normally named `default.cfg`). Existing configuration files for DOS
Doom should therefore simply work out of the box. However, Chocolate
Doom also provides some extra settings. These are stored in a
separate file named `chocolate-doom.cfg`.

The configuration can be edited using the chocolate-setup tool.

## Command line options

Chocolate Doom supports a number of command line parameters, including
some extras that were not originally suported by the DOS versions. For
binary distributions, see the CMDLINE file included with your
download; more information is also available on the Chocolate Doom
website.

## Playing TCs

With Vanilla Doom there is no way to include sprites in PWAD files.
Chocolate Doom’s ‘-file’ command line option behaves exactly the same
as Vanilla Doom, and trying to play TCs by adding the WAD files using
‘-file’ will not work.

Many Total Conversions (TCs) are distributed as a PWAD file which must
be merged into the main IWAD. Typically a copy of DEUSF.EXE is
included which performs this merge. Chocolate Doom includes a new
option, ‘-merge’, which will simulate this merge. Essentially, the
WAD directory is merged in memory, removing the need to modify the
IWAD on disk.

To play TCs using Chocolate Doom, run like this:

```
chocolate-doom -merge thetc.wad
```

Here are some examples:

```
chocolate-doom -merge batman.wad -deh batman.deh vbatman.deh  (Batman Doom)
chocolate-doom -merge aoddoom1.wad -deh aoddoom1.deh  (Army of Darkness Doom)
```

## Other information

 * Chocolate Doom includes a number of different options for music
   playback. See the README.Music file for more details.

 * More information, including information about how to play various
   classic TCs, is available on the Chocolate Doom website:

     https://www.chocolate-doom.org/

   You are encouraged to sign up and contribute any useful information
   you may have regarding the port!

 * Chocolate Doom is not perfect. Although it aims to accurately
   emulate and reproduce the DOS executables, some behavior can be very
   difficult to reproduce. Because of the nature of the project, you
   may also encounter Vanilla Doom bugs; these are intentionally
   present; see the NOT-BUGS file for more information.

   New bug reports, feedback, questions or suggestions can be submitted
   to the issue tracker on Github:

     https://github.com/chocolate-doom/chocolate-doom/issues

 * Source code patches are welcome, but please follow the style
   guidelines - see the file named HACKING included with the source
   distribution.

 * Chocolate Doom is distributed under the GNU GPL. See the COPYING
   file for more information.
