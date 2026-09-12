import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const expectedRoles = [
  "Janitor",
  "Nurse",
  "Truck Driver",
  "Police Officer",
  "Manager",
  "Doctor",
  "Engineer",
  "Teacher",
  "Secretary",
  "Mechanic",
  "Pilot",
  "Attorney",
];

test("avatar presets include all CSV roles", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), {
    encoding: "utf8",
  });

  const presetsMatch = source.match(
    /const avatarPresets: AvatarPreset\[] = \[(?<content>[\s\S]*?)\n\];/,
  );
  assert.ok(presetsMatch?.groups?.content, "avatarPresets block should exist");

  for (const role of expectedRoles) {
    assert.match(
      presetsMatch.groups.content,
      new RegExp(`name:\\s*"${role.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`),
      `${role} should be present in avatar presets`,
    );
  }
});

test("avatar selection uses a compact combobox", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), {
    encoding: "utf8",
  });

  assert.match(source, /id="avatar-select"/, "avatar select id should exist");
  assert.match(
    source,
    /onChange=\{\(event\) => onSelectAvatarById\(event\.target\.value\)\}/,
    "avatar selection should apply on select change",
  );
  assert.ok(
    !source.includes('{t("Select")} {t(avatar.name)}'),
    "card-style per-avatar select buttons should be removed",
  );
});

test("app has no language selector or German translation table", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), {
    encoding: "utf8",
  });

  assert.ok(
    !source.includes('id="language-select"'),
    "language select should be removed",
  );
  assert.ok(
    !source.includes("const deTranslations"),
    "German translation table should be removed",
  );
  assert.ok(
    !source.includes("LANGUAGE_STORAGE_KEY"),
    "language storage key should be removed",
  );
});

test("avatar preset fields are read-only while child count stays editable", async () => {
  const source = await readFile(new URL("../app/page.tsx", import.meta.url), {
    encoding: "utf8",
  });

  assert.match(
    source,
    /id="salary"[\s\S]{0,220}readOnly/,
    "salary input should be read-only",
  );
  assert.match(
    source,
    /id="savings"[\s\S]{0,220}readOnly/,
    "savings input should be read-only",
  );
  assert.match(
    source,
    /id=\{expense\.key\}[\s\S]*?readOnly/,
    "fixed expense inputs should be read-only",
  );
  assert.match(
    source,
    /id=\{liability\.key\}[\s\S]*?readOnly/,
    "fixed liability inputs should be read-only",
  );
  assert.match(
    source,
    /id="child-cost"[\s\S]{0,220}readOnly/,
    "child cost input should be read-only",
  );
  assert.match(
    source,
    /id="child-count"[\s\S]*?onChange=\{\(event\) =>[\s\S]*?setChildCount/,
    "child count should remain editable",
  );
});
