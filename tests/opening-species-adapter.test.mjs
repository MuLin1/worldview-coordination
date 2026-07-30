import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptSpeciesForOpening,
  buildSpeciesAttributeTendencyEffect,
  buildSpeciesTraitStateEffect,
} from '../dist/V20260728/opening-species-adapter.js';
import {
  NORMAL_SPECIES,
  MYTHIC_SPECIES,
} from '../dist/V20260728/generated/species-config.js';

test('opening adapter preserves RP, start level, numeric tendencies, and traits', () => {
  const races = adaptSpeciesForOpening(NORMAL_SPECIES, MYTHIC_SPECIES);
  assert.equal(races.length, 26);

  const canine = races.find(race => race.classificationId === 'G-S01');
  assert.equal(canine.cost, 10);
  assert.equal(canine.startLevel, NORMAL_SPECIES['G-S01'].startLevel);
  assert.deepEqual(canine.bonuses, NORMAL_SPECIES['G-S01'].bonuses);
  assert.ok(canine.buffs.some(buff => buff.name === '敏锐嗅觉'));
  assert.ok(canine.buffs.some(buff => buff.name === '强烈嗅觉依赖' && buff.negative));
  assert.ok(canine.buffs.every(buff => buff.trigger && buff.numericEffect));

  const dragon = races.find(race => race.classificationId === 'G-M01');
  assert.equal(dragon.cost, 20);
  assert.deepEqual(dragon.bonuses, MYTHIC_SPECIES['G-M01'].bonuses);
});

test('species state effects expose machine-readable trigger and numeric fields', () => {
  const tendency = buildSpeciesAttributeTendencyEffect({
    strength: 2,
    dexterity: -1,
    constitution: 1,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
  });
  assert.deepEqual(tendency.属性影响, { 力量: 2, 敏捷: -1, 体质: 1 });
  assert.equal(tendency.触发条件, '角色创建完成时自动生效');
  assert.equal(tendency.已计入人物属性, true);

  const trait = buildSpeciesTraitStateEffect({
    name: '测试特性',
    detail: '追踪检定 +2。',
    trigger: '进行追踪检定时',
    numericEffect: '追踪检定 +2',
  });
  assert.equal(trait.类型, 'BUFF');
  assert.equal(trait.触发条件, '进行追踪检定时');
  assert.equal(trait.数值效果, '追踪检定 +2');
  assert.match(trait.特殊影响, /\+2/);
});
