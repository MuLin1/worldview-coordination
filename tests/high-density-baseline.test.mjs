import test from 'node:test';
import assert from 'node:assert/strict';
import { captureBaseline } from '../scripts/capture-high-density-baseline.mjs';

test('baseline records protected sources and current deficiencies', async () => {
  const baseline = await captureBaseline();
  assert.equal(baseline.schemaVersion, 1);
  assert.equal(baseline.maps.vielsaen, 12);
  assert.equal(baseline.maps.modern, 11);
  assert.equal(baseline.companions.vielsaen, 3);
  assert.equal(baseline.companions.modern, 3);
  assert.match(baseline.protectedFiles['世界书/创世回廊5.1.json'].sha256, /^[a-f0-9]{64}$/);
  assert.ok(Array.isArray(baseline.dnfGit.dirtyPaths));
});
