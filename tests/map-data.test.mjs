import test from 'node:test';
import assert from 'node:assert/strict';
import { VIELSAEN_MAP } from '../vielsaen_mapdata.js';
import { MODERN_MAP } from '../modern_mapdata.js';

test('Vielsaen map covers the continent, sea, six nations, routes, and event nodes', () => {
  assert.equal(VIELSAEN_MAP.worldId, 'vielsaen');
  assert.equal(VIELSAEN_MAP.regions.length, 6);
  assert.ok(VIELSAEN_MAP.nodes.some(node => node.name === '艾沃兰大陆'));
  assert.ok(VIELSAEN_MAP.nodes.some(node => node.name === '瑟雷亚海'));
  assert.ok(VIELSAEN_MAP.nodes.some(node => node.eventKey));
  assert.ok(VIELSAEN_MAP.edges.length >= 6);
});

test('Modern map is global and only exposes state-bound event keys', () => {
  assert.equal(MODERN_MAP.worldId, 'modern');
  assert.ok(new Set(MODERN_MAP.nodes.map(node => node.region)).size >= 5);
  for (const node of MODERN_MAP.nodes) {
    assert.ok(node.city);
    assert.ok(node.agency);
    assert.ok(node.riftStateKey);
    assert.ok(node.invasionStateKey);
    assert.ok(node.plotStageKey);
  }
  assert.ok(MODERN_MAP.edges.length >= MODERN_MAP.nodes.length - 1);
});
