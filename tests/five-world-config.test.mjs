import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WORLD_REGISTRY,
  NORMAL_SPECIES,
  MYTHIC_SPECIES,
  VIELSAEN_CONFIG,
  MODERN_CONFIG,
  REPLACEMENT_BONDS,
} from '../dist/V20260728/five-world-config.js';

test('world registry contains exactly the five supported IDs', () => {
  assert.deepEqual(
    Object.keys(WORLD_REGISTRY),
    ['corridor', 'sao', 'jiuzhou', 'vielsaen', 'modern'],
  );
  assert.equal(WORLD_REGISTRY.vielsaen.label, '维尔萨恩');
  assert.equal(WORLD_REGISTRY.modern.label, '现代都市');
  assert.equal('amber' in WORLD_REGISTRY, false);
  assert.equal('dragon' in WORLD_REGISTRY, false);
});

test('normal and mythic reproductive registries are complete and distinct', () => {
  assert.equal(Object.keys(NORMAL_SPECIES).length, 18);
  assert.equal(Object.keys(MYTHIC_SPECIES).length, 8);

  for (const [id, config] of Object.entries({ ...NORMAL_SPECIES, ...MYTHIC_SPECIES })) {
    assert.match(id, /^[GM]-[SM]\d{2}$/);
    assert.ok(config.cycleDays[0] > 0);
    assert.ok(config.activeDays[0] > 0);
    assert.ok(config.gestationDays[0] > 0);
    assert.ok(['胎生', '卵生'].includes(config.birthMode));
    assert.ok(config.offspringCount[0] > 0);
    assert.ok(Array.isArray(config.adjustments));
  }
  assert.ok(Object.values(NORMAL_SPECIES).every(x => x.system === '普通'));
  assert.ok(Object.values(MYTHIC_SPECIES).every(x => x.system === '神话'));
});

test('replacement world dictionaries match the accepted worldbook', () => {
  assert.deepEqual(
    VIELSAEN_CONFIG.nations.map(x => x.name),
    ['瓦尔凯恩帝国', '瑟兰提亚海盟', '布雷西亚王国', '奥瑟兰学邦', '卡德罗斯山国', '维萨林城邦联盟'],
  );
  assert.equal(VIELSAEN_CONFIG.schools.length, 6);
  assert.equal(VIELSAEN_CONFIG.deities.length, 7);
  assert.equal(MODERN_CONFIG.abilityTypes.length, 8);
  assert.deepEqual(MODERN_CONFIG.plotStages.map(x => x.stage), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test('all replacement bonds are original, adult, classified, and rebalanced', () => {
  assert.ok(REPLACEMENT_BONDS.length >= 6);
  const ids = new Set();
  for (const character of REPLACEMENT_BONDS) {
    assert.ok(['vielsaen', 'modern'].includes(character.worldId));
    assert.equal(character.physiology.adult, true);
    assert.ok(character.physiology.classificationId in NORMAL_SPECIES
      || character.physiology.classificationId in MYTHIC_SPECIES);
    assert.ok(character.level >= 1 && character.level <= 20);
    assert.ok(character.role);
    assert.ok(character.species);
    assert.ok(character.heritableTraits.length >= 2);
    assert.equal(ids.has(character.id), false);
    ids.add(character.id);
  }
});
