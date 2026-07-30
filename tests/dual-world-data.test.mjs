import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadDualWorldData,
  validateDualWorldData,
  renderNamedExport,
} from '../scripts/dual-world-data.mjs';

test('dual-world data loads with stable top-level shapes', async () => {
  const data = await loadDualWorldData();
  assert.ok(Array.isArray(data.species.entries));
  assert.equal(data.maps.vielsaen.worldId, 'vielsaen');
  assert.equal(data.maps.modern.worldId, 'modern');
  assert.ok(Array.isArray(data.levels.quickLevels));
  assert.ok(Array.isArray(data.roles.vielsaen));
  assert.ok(Array.isArray(data.roles.modern));
  assert.deepEqual(validateDualWorldData(data, 'base'), []);
});

test('generated modules are deterministic ESM', () => {
  const rendered = renderNamedExport('SAMPLE', { b: 2, a: 1 });
  assert.equal(rendered, 'export const SAMPLE = Object.freeze({"a":1,"b":2});\n');
});
