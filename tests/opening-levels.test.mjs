import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUICK_START_LEVELS,
  OPENING_LEVEL_BANDS,
  getOpeningLevelPackage,
  calculateTotalExp,
  getStartingGrowthRewards,
  getUnlockedSkillTiers,
} from '../dist/V20260728/generated/opening-level-config.js';

test('both worlds expose every level and the approved quick levels', () => {
  assert.deepEqual(QUICK_START_LEVELS, [1,5,10,15,20,30,45,50,60]);
  for (const worldId of ['vielsaen', 'modern']) {
    for (let level = 1; level <= 60; level += 1) {
      assert.equal(getOpeningLevelPackage(worldId, level).level, level);
    }
  }
});

test('growth and tier boundaries match the existing DNF engine', () => {
  assert.equal(getOpeningLevelPackage('vielsaen', 1).totalSP, 0);
  assert.equal(getOpeningLevelPackage('vielsaen', 15).totalSP, 350);
  assert.deepEqual(getOpeningLevelPackage('modern', 30).unlockedSkillTiers, ['基础','转职','进阶']);
  assert.equal(getOpeningLevelPackage('modern', 20).attackCount, 2);
  assert.equal(getOpeningLevelPackage('modern', 50).attackCount, 3);
  assert.ok(getOpeningLevelPackage('vielsaen', 60).unlockedSkillTiers.includes('觉醒一'));
});

test('SP and attribute points follow DNF formula', () => {
  // SP = max(0, (level-1) * 25)
  assert.equal(calculateTotalExp(1), 0);
  assert.equal(calculateTotalExp(10), 900);
  assert.equal(calculateTotalExp(60), 5900);
  const rewards = getStartingGrowthRewards(30);
  assert.equal(rewards.totalSP, 725); // 29 * 25
  assert.equal(rewards.attributePoints, 3); // floor(30/10)
});

test('skill tiers unlock at correct thresholds', () => {
  assert.deepEqual(getUnlockedSkillTiers(1), ['基础']);
  assert.deepEqual(getUnlockedSkillTiers(14), ['基础']);
  assert.deepEqual(getUnlockedSkillTiers(15), ['基础','转职']);
  assert.deepEqual(getUnlockedSkillTiers(29), ['基础','转职']);
  assert.deepEqual(getUnlockedSkillTiers(30), ['基础','转职','进阶']);
  assert.deepEqual(getUnlockedSkillTiers(44), ['基础','转职','进阶']);
  assert.deepEqual(getUnlockedSkillTiers(45), ['基础','转职','进阶','必杀']);
  assert.deepEqual(getUnlockedSkillTiers(49), ['基础','转职','进阶','必杀']);
  assert.deepEqual(getUnlockedSkillTiers(50), ['基础','转职','进阶','必杀','觉醒一']);
  assert.deepEqual(getUnlockedSkillTiers(60), ['基础','转职','进阶','必杀','觉醒一']);
});

test('attack count follows level thresholds', () => {
  assert.equal(getOpeningLevelPackage('vielsaen', 1).attackCount, 1);
  assert.equal(getOpeningLevelPackage('vielsaen', 19).attackCount, 1);
  assert.equal(getOpeningLevelPackage('vielsaen', 20).attackCount, 2);
  assert.equal(getOpeningLevelPackage('vielsaen', 49).attackCount, 2);
  assert.equal(getOpeningLevelPackage('vielsaen', 50).attackCount, 3);
  assert.equal(getOpeningLevelPackage('vielsaen', 60).attackCount, 3);
});

test('opening level bands have narrative data for both worlds', () => {
  for (const worldId of ['vielsaen', 'modern']) {
    const bands = OPENING_LEVEL_BANDS.filter(b => b.worldId === worldId);
    assert.ok(bands.length >= 9, `${worldId} has ${bands.length} bands`);
    for (const band of bands) {
      assert.ok(band.level);
      assert.ok(band.label);
      assert.ok(band.summary);
    }
  }
});
