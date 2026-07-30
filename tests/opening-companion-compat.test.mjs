import test from 'node:test';
import assert from 'node:assert/strict';

import { REPLACEMENT_BONDS } from '../dist/V20260728/five-world-config.js';
import { createPhysiologyProfile } from '../dist/V20260728/five-world-runtime.js';

const VALID_SEXES = new Set(['雌性', '雄性', '双性', '无性', '可变']);
const VALID_CAPABILITIES = new Set(['可妊娠', '可授精', '双向', '无']);

test('replacement companions expose every field consumed by the opening UI', () => {
  for (const companion of REPLACEMENT_BONDS) {
    assert.equal(typeof companion.name, 'string');
    assert.ok(companion.name);
    assert.equal(typeof companion.species, 'string', companion.name);
    assert.ok(companion.species, companion.name);
    assert.equal(typeof companion.profession, 'string', companion.name);
    assert.ok(companion.profession, companion.name);
    assert.equal(typeof companion.role, 'string', companion.name);
    assert.ok(companion.role, companion.name);
    assert.equal(typeof companion.origin, 'string', companion.name);
    assert.ok(companion.origin, companion.name);
    assert.equal(typeof companion.faction, 'string', companion.name);
    assert.ok(companion.faction, companion.name);
    assert.equal(Number.isFinite(companion.level), true, companion.name);
  }
});

test('replacement companions provide valid physiology profiles', () => {
  for (const companion of REPLACEMENT_BONDS) {
    const physiology = companion.physiology || {};
    assert.equal(VALID_SEXES.has(physiology.sex), true, `${companion.name}: ${physiology.sex}`);
    assert.equal(
      VALID_CAPABILITIES.has(physiology.capability),
      true,
      `${companion.name}: ${physiology.capability}`,
    );
    assert.doesNotThrow(() => createPhysiologyProfile({
      adult: physiology.adult,
      sex: physiology.sex,
      capability: physiology.capability,
      system: physiology.system,
      classificationId: physiology.classificationId,
      species: companion.species,
      heritableTraits: companion.heritableTraits || [],
      cycleEnabled: true,
      cycleStartDate: '',
    }), companion.name);
  }
});
