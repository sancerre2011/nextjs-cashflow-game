import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manifestPath = path.join(__dirname, "manifest.ts");

test("manifest declares install-friendly PNG and maskable icons", () => {
  const source = fs.readFileSync(manifestPath, "utf8");

  assert.match(source, /icon-192\.png/);
  assert.match(source, /icon-512\.png/);
  assert.match(source, /icon-maskable-192\.png/);
  assert.match(source, /icon-maskable-512\.png/);
  assert.match(source, /purpose:\s*"maskable"/);
});
