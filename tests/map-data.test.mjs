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

test('Modern map has 48 nodes across two layers with proper structure', () => {
  assert.equal(MODERN_MAP.worldId, 'modern');
  assert.equal(MODERN_MAP.nodes.length, 48);
  assert.equal(MODERN_MAP.layers.length, 2);
  assert.ok(MODERN_MAP.edges.length >= 75);
  // At least 7 world regions
  assert.ok(new Set(MODERN_MAP.nodes.filter(n => n.type === 'city').map(n => n.regionId)).size >= 7);
});
