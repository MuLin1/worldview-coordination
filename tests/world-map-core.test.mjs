import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findRoute,
  getReachableNodeIds,
  isEdgeOpen,
  normalizeGraph,
  getNodeIcon,
} from '../dist/V20260728/world-map-core.js';
import { readFile } from 'node:fs/promises';

const map = {
  nodes: [{id:'a'}, {id:'b'}, {id:'c'}, {id:'d'}],
  edges: [
    {id:'ab',from:'a',to:'b',bidirectional:true,time:1,cost:5,risk:4,stateKey:''},
    {id:'bc',from:'b',to:'c',bidirectional:true,time:1,cost:5,risk:4,stateKey:''},
    {id:'ac',from:'a',to:'c',bidirectional:true,time:5,cost:1,risk:1,stateKey:'blocked.ac'},
    {id:'cd',from:'c',to:'d',bidirectional:false,time:2,cost:3,risk:5,stateKey:''},
  ],
};

test('routing honors criterion and state-controlled closure', () => {
  assert.deepEqual(findRoute(map, 'a', 'c', 'time', {}).nodeIds, ['a','b','c']);
  assert.deepEqual(findRoute(map, 'a', 'c', 'cost', {}).nodeIds, ['a','c']);
  assert.equal(isEdgeOpen(map.edges[2], {blocked:{ac:true}}), false);
  assert.deepEqual(findRoute(map, 'a', 'c', 'cost', {blocked:{ac:true}}).nodeIds, ['a','b','c']);
  assert.deepEqual([...getReachableNodeIds(map, 'a', {blocked:{ac:true}})].sort(), ['a','b','c','d']);
});

test('routing handles nonexistent destinations', () => {
  assert.equal(findRoute(map, 'a', 'z', 'time', {}), null);
});

test('routing handles same-node', () => {
  const r = findRoute(map, 'a', 'a', 'time', {});
  assert.equal(r.nodeIds.length, 1);
  assert.equal(r.nodeIds[0], 'a');
  assert.equal(r.totalWeight, 0);
});

test('unidirectional edge cannot be traversed backwards', () => {
  assert.ok(findRoute(map, 'c', 'd', 'time', {}));
  assert.equal(findRoute(map, 'd', 'c', 'time', {}), null);
});

test('state values indicating closure block edges', () => {
  const edge = {stateKey:'test.key'};
  assert.equal(isEdgeOpen(edge, {test:{key:true}}), false);
  assert.equal(isEdgeOpen(edge, {test:{key:'封锁'}}), false);
  assert.equal(isEdgeOpen(edge, {test:{key:'关闭'}}), false);
  assert.equal(isEdgeOpen(edge, {test:{key:'open'}}), true);
  assert.equal(isEdgeOpen(edge, {}), true);
  assert.equal(isEdgeOpen({stateKey:''}, {}), true);
});

test('normalizeGraph produces index maps and adjacency lists', () => {
  const g = normalizeGraph(map);
  assert.ok(g.nodeIndex instanceof Map);
  assert.ok(g.adjacency instanceof Map);
  assert.equal(g.nodeIndex.size, 4);
  assert.equal(g.adjacency.size, 4);
});

test('every supported node type has a visible icon', () => {
  const types = [
    'capital', 'city', 'port', 'settlement', 'gate', 'wilderness',
    'dungeon', 'hub', 'hidden', 'local-daily', 'local-anomaly',
  ];
  for (const type of types) {
    assert.notEqual(getNodeIcon(type), getNodeIcon('unknown'), type);
  }
});

test('both shipped map pages mount the SVG topology core and expose route controls', async () => {
  for (const page of ['vielsaen_map.html', 'modern_map.html']) {
    const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
    assert.match(html, /mountWorldMap/);
    assert.match(html, /controller\.setRoute/);
    assert.match(html, /route-from/);
    assert.match(html, /route-to/);
    assert.doesNotMatch(html, /for\s*\(const node of data\.nodes\).*createElement\('button'\)/s);
  }
});
