import test from 'node:test';
import assert from 'node:assert/strict';
import { VIELSAEN_MAP } from '../vielsaen_mapdata.js';
import { MODERN_MAP } from '../modern_mapdata.js';

test('Vielsaen map has 64 nodes, six regions, hidden nodes, and dense edges', () => {
  assert.equal(VIELSAEN_MAP.worldId, 'vielsaen');
  assert.equal(VIELSAEN_MAP.regions.length, 6);
  assert.equal(VIELSAEN_MAP.nodes.length, 64);
  // Hidden nodes exist (圣地/魔王 related)
  assert.ok(VIELSAEN_MAP.nodes.some(node => node.type === 'hidden'));
  // State-controlled edges exist
  assert.ok(VIELSAEN_MAP.edges.some(edge => edge.stateKey));
  assert.ok(VIELSAEN_MAP.edges.length >= 100);
});

test('Modern map skeleton has correct worldId (full map in Task 5)', () => {
  assert.equal(MODERN_MAP.worldId, 'modern');
  // Skeleton or full map: both are valid
  assert.ok(Array.isArray(MODERN_MAP.nodes));
  assert.ok(Array.isArray(MODERN_MAP.edges));
});
