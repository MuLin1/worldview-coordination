import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NORMAL_SPECIES,
  MYTHIC_SPECIES,
  SPECIES_LIST,
  getSpeciesById,
} from '../dist/V20260728/generated/species-config.js';

test('species registries implement the approved 18 plus 8 model', () => {
  assert.equal(Object.keys(NORMAL_SPECIES).length, 18);
  assert.equal(Object.keys(MYTHIC_SPECIES).length, 8);
  assert.equal(NORMAL_SPECIES['G-S09'].name, '混血种');
  assert.equal(NORMAL_SPECIES['G-S09'].rpCost, 10);
  assert.ok(!Object.values(NORMAL_SPECIES).some(x => x.name === '猪科'));
  assert.ok(Object.values(NORMAL_SPECIES).every(x => x.rpCost === 10));
  assert.ok(Object.values(MYTHIC_SPECIES).every(x => x.rpCost === 20));
  assert.equal(getSpeciesById('G-M08'), MYTHIC_SPECIES['G-M08']);
});

test('ordinary mechanics and hybrid extremes are machine-complete', () => {
  for (const species of Object.values(NORMAL_SPECIES)) {
    assert.ok(Object.keys(species.bonuses).length === 6);
    assert.ok(species.buffs.length >= 2);
    assert.ok(species.prototypeTraits.length >= 1);
    assert.ok(species.limitations.length >= 1);
  }
  const hybrid = NORMAL_SPECIES['G-S09'];
  assert.equal(hybrid.hybridRules.positiveSlots, 2);
  assert.equal(hybrid.hybridRules.negativeSlots, 2);
  assert.deepEqual(hybrid.hybridRules.forbiddenBaseIds, ['G-S09']);
});

test('mythic species are pure upgrades with no balancing penalties', () => {
  for (const species of Object.values(MYTHIC_SPECIES)) {
    // Mythic species are intentional pure upgrades
    assert.ok(species.buffs.length >= 4, `${species.id} should have at least 4 buffs as a pure upgrade`);
    assert.ok(species.prototypeTraits.length >= 2, `${species.id} should have multiple prototype options`);
    // Limitations are inherent physical/logistical, not balancing penalties
    assert.ok(species.limitations.length >= 1);
    // Verify mythic bonuses are clearly superior to ordinary
    const totalBonus = Object.values(species.bonuses).reduce((a, b) => a + b, 0);
    assert.ok(totalBonus >= 8, `${species.id} total bonus ${totalBonus} should be ≥ 8 for mythic tier`);
  }
});

test('G-S09 hybrid has complete non-recursive rules', () => {
  const hybrid = NORMAL_SPECIES['G-S09'];
  assert.equal(hybrid.hybridRules.maternalBaseRequired, true);
  assert.equal(hybrid.hybridRules.paternalExpressionRequired, true);
  assert.deepEqual(hybrid.hybridRules.positiveAttributeRange, [3, 4]);
  assert.deepEqual(hybrid.hybridRules.negativeAttributeRange, [-3, -2]);
  assert.ok(hybrid.hybridRules.forbiddenBaseIds.includes('G-S09'));
});

test('all species have descriptions and valid IDs', () => {
  const all = [...Object.values(NORMAL_SPECIES), ...Object.values(MYTHIC_SPECIES)];
  assert.equal(all.length, 26);
  for (const s of all) {
    assert.ok(s.id, `species ${s.name} missing id`);
    assert.ok(s.summary, `species ${s.name} missing summary`);
    assert.ok(s.system === '普通' || s.system === '神话');
  }
});

test('SPECIES_LIST contains all 26 entries', () => {
  assert.equal(SPECIES_LIST.length, 26);
});

test('normal species bonuses obey design constraints', () => {
  for (const species of Object.values(NORMAL_SPECIES)) {
    if (species.id === 'G-S09') continue; // hybrid has zero bonuses
    const bonuses = species.bonuses;
    const totalPositive = Object.values(bonuses).filter(v => v > 0).reduce((a, b) => a + b, 0);
    assert.ok(totalPositive <= 3, `${species.id} total positive bonus ${totalPositive} exceeds +3`);
    for (const v of Object.values(bonuses)) {
      assert.ok(v >= -1 && v <= 2, `${species.id} bonus value ${v} out of [-1, +2] range`);
    }
  }
});
