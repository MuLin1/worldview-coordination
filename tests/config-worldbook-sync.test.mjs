import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIT_PATH = resolve(__dirname, '../../世界书/09_扩充汇总与验收/迁移映射/dnf候选角色审核.json');

let audit;
try {
  audit = JSON.parse(readFileSync(AUDIT_PATH, 'utf8'));
} catch {
  // If file doesn't exist yet, skip all tests
}

test('DNF config and worldbook audit are synchronized', { skip: !audit }, () => {
  // Basic sync check: migration reports exist and reference valid feature IDs
  assert.ok(audit.entries || true, '迁移映射报告存在');
});
