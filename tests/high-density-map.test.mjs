import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyzeGraph } from '../scripts/dual-world-data.mjs';

const DNF_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

async function loadJson(name) {
  const text = await readFile(join(DNF_ROOT, 'data', 'dual-world', name), 'utf-8');
  return JSON.parse(text);
}

test('Vielsaen has the approved node distribution and dense topology', async () => {
  const map = await loadJson('vielsaen-map.json');
  assert.equal(map.nodes.length, 64);
  const counts = Object.groupBy(map.nodes, node => node.type);
  assert.equal(counts.capital?.length || 0, 6);
  assert.equal((counts.city?.length || 0) + (counts.port?.length || 0), 12);
  assert.equal((counts.settlement?.length || 0) + (counts.gate?.length || 0), 12);
  assert.equal(counts.wilderness?.length || 0, 12);
  assert.equal(counts.dungeon?.length || 0, 10);
  assert.equal(counts.hub?.length || 0, 6);
  assert.equal(counts.hidden?.length || 0, 6);
  assert.ok(map.edges.length >= 100, `edges ${map.edges.length} < 100`);
  assert.ok(map.edges.length <= 115, `edges ${map.edges.length} > 115`);
});

test('Vielsaen routes are connected, cyclic, and state-aware', async () => {
  const map = await loadJson('vielsaen-map.json');
  const report = analyzeGraph(map);
  assert.deepEqual(report.isolatedNodeIds, []);
  assert.deepEqual(report.unknownEdgeNodeIds, []);
  assert.ok(report.cycleCount >= 3, `cycles ${report.cycleCount} < 3`);
  assert.ok(report.stateControlledEdgeIds.length >= 4, `state edges ${report.stateControlledEdgeIds.length} < 4`);
  for (const region of report.externalRouteCountByRegion) {
    assert.ok(region.count >= 2, `region ${region.region} only has ${region.count} external routes`);
  }
});
