import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveIsDark, systemDarkForApply } from './themeMode.ts';

const here = path.dirname(fileURLToPath(import.meta.url));

assert.equal(resolveIsDark('light', true), false);
assert.equal(resolveIsDark('dark', false), true);
assert.equal(resolveIsDark('system', true), true);
assert.equal(resolveIsDark('system', false), false);

let osDark = true;
const read = () => osDark;
let stored = false;
stored = systemDarkForApply('system', read, stored);
assert.equal(stored, true);
assert.equal(resolveIsDark('system', stored), true);

stored = systemDarkForApply('light', read, stored);
assert.equal(stored, true, 'locked light must not rewrite the cached OS flag');
assert.equal(resolveIsDark('light', stored), false);

osDark = false;
stored = systemDarkForApply('system', read, stored);
assert.equal(stored, false, 're-entering system mode must re-read matchMedia, not keep the stale flag');
assert.equal(resolveIsDark('system', stored), false);

osDark = true;
stored = systemDarkForApply('dark', read, stored);
assert.equal(stored, false, 'locked dark must not refresh OS flag');
stored = systemDarkForApply('system', read, stored);
assert.equal(stored, true);

const changelog = fs.readFileSync(path.join(here, '../../docs/更新日志.md'), 'utf8');
const headings = [...changelog.matchAll(/^## 版本【([^】]+)】/gm)].map((m) => m[1]);
const last = headings.at(-1);
assert.ok(last.startsWith('V3.15.4'), `newest heading at file end should be V3.15.4, got ${last}`);
const i3 = headings.indexOf('V3.15.3.20260910');
const i4 = headings.indexOf('V3.15.4.20260911');
assert.ok(i3 >= 0 && i4 >= 0 && i4 > i3, 'V3.15.4 must come after V3.15.3 so reverse() shows it first');
const reversed = [...headings].reverse();
assert.ok(reversed[0].startsWith('V3.15.4'), `update-timeline reverse() first item should be V3.15.4, got ${reversed[0]}`);

const donk = fs.readFileSync(path.join(here, '../views/MainLayout/components/15warriorsDonk.vue'), 'utf8');
assert.match(donk, /linear-gradient\(rgba\(245, 245, 247, 0\), #f5f5f7\)/);
assert.match(donk, /html\.dark & \{[\s\S]*background: linear-gradient\(rgba\(18, 20, 26, 0\), var\(--el-fill-color-light/);

const store = fs.readFileSync(path.join(here, '../stores/themeStore.ts'), 'utf8');
assert.match(store, /systemDarkForApply/);
assert.match(store, /systemDark\.value = systemDarkForApply/);

console.log('themeMode.node-test.mjs ok');
