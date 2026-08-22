# Portable Asset Handoff

## Guarantee for Local IDE Use

All 16 required binary assets are preserved in the private GitHub release [`resend-clone-assets-v1`](https://github.com/compliancelogbook/Resend-Clone/releases/tag/resend-clone-assets-v1). The archive contains the fonts, page imagery, generated feature tiles, logo mark, the live Spline cube scene, and the dashboard imagery in the exact paths expected by the application.

The repository deliberately does not place those 21 MB of binaries under `client/` or `public/`, because that would make the managed build unreliable. Instead, `asset-manifest.json` version-controls every expected path and SHA-256 checksum, while the release holds the binary archive.

## First Local Run

Clone the private repository, authenticate GitHub CLI if necessary, and run the following in the repository root:

```bash
pnpm install
pnpm assets:restore
pnpm assets:check
pnpm dev
```

The restore command downloads the private release and extracts it to `~/.resend-clone-assets`. The Vite configuration serves that directory at `/manus-storage`, which is the same asset URL structure used by the application. The check command verifies every restored file against the committed checksum manifest before you start developing.

## Custom Location

Set `RESEND_ASSETS_DIR` to use another asset location. This is useful for a shared development drive or a project-specific cache.

```bash
RESEND_ASSETS_DIR=/absolute/path/to/assets pnpm assets:restore
RESEND_ASSETS_DIR=/absolute/path/to/assets pnpm dev
```

Use the same environment variable for both commands. The expected subdirectory is `manus-storage` and is created by the restore process.

## Recovery and Verification

If the local asset cache is deleted, rerun `pnpm assets:restore`. The archive is versioned independently of the managed preview and remains available through the private GitHub repository. The asset manifest is the source of truth for the file list and integrity checks.
