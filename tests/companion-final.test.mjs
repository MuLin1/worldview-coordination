import test from 'node:test';
import assert from 'node:assert/strict';
import { VIELSAEN_COMPANIONS } from '../dist/V20260728/generated/vielsaen-companions.js';
import { MODERN_COMPANIONS } from '../dist/V20260728/generated/modern-companions.js';

test('each world compiles exactly twelve approved companions', () => {
  assert.equal(VIELSAEN_COMPANIONS.length, 12);
  assert.equal(MODERN_COMPANIONS.length, 12);
  const all = [...VIELSAEN_COMPANIONS, ...MODERN_COMPANIONS];
  assert.equal(new Set(all.map(x => x.id)).size, 24);
  for (const companion of all) {
    assert.equal(companion.physiology.adult, true);
    assert.ok(companion.speciesId);
    assert.ok(companion.speciesTraits.length >= 2);
    assert.ok(companion.heritableTraits.length >= 1);
  }
});

test('hybrid companions contain complete non-recursive lineage data', () => {
  const hybrids = [...VIELSAEN_COMPANIONS, ...MODERN_COMPANIONS]
    .filter(x => x.speciesId === 'G-S09');
  assert.ok(hybrids.length >= 2, `expected >= 2 hybrids, got ${hybrids.length}`);
  for (const companion of hybrids) {
    assert.notEqual(companion.hybrid.maternalBaseId, 'G-S09');
    assert.notEqual(companion.hybrid.paternalExpressionId, 'G-S09');
    assert.equal(companion.hybrid.positiveTraits.length, 2);
    assert.equal(companion.hybrid.negativeTraits.length, 2);
  }
});

test('Modern mythic companions have no awakened ability', () => {
  for (const companion of MODERN_COMPANIONS.filter(x => x.speciesSystem === '神话')) {
    assert.equal(companion.ability, null, `${companion.id} mythic should have null ability`);
  }
});

test('mythic companions cost 20 RP, ordinary cost 10 RP', () => {
  for (const c of [...VIELSAEN_COMPANIONS, ...MODERN_COMPANIONS]) {
    if (c.speciesId === 'G-S09') assert.equal(c.rpCost, 10);
    else if (c.speciesSystem === '神话') assert.equal(c.rpCost, 20);
    else assert.equal(c.rpCost, 10);
  }
});

test('all companions have complete personal lines and skills', () => {
  for (const c of [...VIELSAEN_COMPANIONS, ...MODERN_COMPANIONS]) {
    assert.equal(c.activeSkills.length, 3);
    assert.equal(c.passiveSkills.length, 2);
    assert.equal(c.personalLine.length, 3);
    assert.equal(c.relations.length >= 2, true);
  }
});

test('Vielsaen hybrid is G-S09 dog+deer', () => {
  const hybrid = VIELSAEN_COMPANIONS.find(c => c.speciesId === 'G-S09');
  assert.ok(hybrid);
  assert.equal(hybrid.hybrid.maternalBaseId, 'G-S01');
  assert.equal(hybrid.hybrid.paternalExpressionId, 'G-S07');
});

test('Modern hybrid is G-S09 cat+weasel', () => {
  const hybrid = MODERN_COMPANIONS.find(c => c.speciesId === 'G-S09');
  assert.ok(hybrid);
  assert.equal(hybrid.hybrid.maternalBaseId, 'G-S02');
  assert.equal(hybrid.hybrid.paternalExpressionId, 'G-S04');
});
