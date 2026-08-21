# Android packaging (Phase 4)

This scaffolds packaging the same Vite web app as an Android installable, to compete with ahn-lab’s APK while keeping one codebase.

## Option A — Capacitor (recommended)

From `web/`:

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Timeline Visualizer" app.lovetitle.timeline --web-dir dist
npm run build
npx cap add android
npx cap copy android
npx cap open android
```

Then build a release APK/AAB in Android Studio. Point `server.url` only for debug; production uses the bundled `dist`.

## Option B — TWA (Trusted Web Activity)

Use [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) against `https://lovetitle-timeline.vercel.app` with Digital Asset Links. Fastest path to Play Store if the PWA already passes installability checks.

## Privacy constraints

- Do not add Google Sign-In for Timeline fetch.
- Timeline JSON stays on-device; only map tile requests leave the device (same as web).

## Status

Scaffold + docs shipped in v1.7.0. Full signed APK CI is a follow-up once signing keys are available.
