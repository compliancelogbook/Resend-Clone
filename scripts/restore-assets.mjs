import AdmZip from "adm-zip";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(projectRoot, "asset-manifest.json"), "utf8"));
const targetRoot = path.resolve(process.env.RESEND_ASSETS_DIR || path.join(os.homedir(), ".resend-clone-assets"));
const checkOnly = process.argv.includes("--check");

function checksum(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function audit() {
  return manifest.assets.filter((asset) => {
    const absolutePath = path.join(targetRoot, asset.path);
    return !fs.existsSync(absolutePath) || checksum(absolutePath) !== asset.sha256;
  });
}

let missing = audit();
if (checkOnly) {
  if (missing.length === 0) {
    console.log(`Asset check passed: ${manifest.assets.length} files are available in ${targetRoot}.`);
    process.exit(0);
  }
  console.error(`Asset check failed: ${missing.length} file(s) are missing or have an unexpected checksum.`);
  for (const asset of missing) console.error(` - ${asset.path}`);
  console.error("Run: pnpm assets:restore");
  process.exit(1);
}

if (missing.length === 0) {
  console.log(`Assets already restored and verified in ${targetRoot}.`);
  process.exit(0);
}

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "resend-clone-assets-"));
const archivePath = path.join(tempDirectory, manifest.bundle.archive);

try {
  console.log(`Downloading the protected asset bundle from ${manifest.bundle.repository}…`);
  execFileSync(
    "gh",
    [
      "release",
      "download",
      manifest.bundle.releaseTag,
      "--repo",
      manifest.bundle.repository,
      "--pattern",
      manifest.bundle.archive,
      "--dir",
      tempDirectory,
    ],
    { stdio: "inherit" },
  );
  if (!fs.existsSync(archivePath)) throw new Error("The GitHub release archive was not downloaded.");
  new AdmZip(archivePath).extractAllTo(targetRoot, true);
  missing = audit();
  if (missing.length > 0) throw new Error(`Checksum verification failed for ${missing.length} restored asset(s).`);
  console.log(`Restored and verified ${manifest.assets.length} assets in ${targetRoot}.`);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}
