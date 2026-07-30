import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createPhysiologyProfile,
  createRootState,
  registerModernAbility,
  advanceModernState,
  validateAdultTrigger,
} from '../dist/V20260728/five-world-runtime.js';

const normal = species => createPhysiologyProfile({
  adult: true,
  sex: '雌性',
  capability: '可妊娠',
  system: '普通',
  classificationId: 'G-S01',
  species,
  heritableTraits: ['深色被毛'],
});

test('modern abilities require evidence and never bind to species', () => {
  const wolf = normal('灰狼');
  const fox = normal('赤狐');
  assert.equal(registerModernAbility(wolf, { evidence: [] }, () => 0).accepted, false);

  const wolfResult = registerModernAbility(wolf, { evidence: ['检测报告', '觉醒事件'] }, () => 0);
  const foxResult = registerModernAbility(fox, { evidence: ['检测报告', '觉醒事件'] }, () => 0);
  assert.equal(wolfResult.accepted, true);
  assert.equal(wolfResult.ability.type, foxResult.ability.type);
  assert.notEqual(wolfResult.ability.type, wolf.具体种族);
  assert.equal(wolf.异能档案.登记状态, '已登记');
});

test('mythic creatures cannot awaken a modern ability', () => {
  const mythic = createPhysiologyProfile({
    adult: true,
    sex: '可变',
    capability: '双向',
    system: '神话',
    classificationId: 'G-M01',
    species: '巨龙',
    heritableTraits: ['鳞色'],
  });
  const result = registerModernAbility(mythic, { evidence: ['检测报告'] }, () => 0);
  assert.equal(result.accepted, false);
  assert.match(result.reason, /神话生物/);
  assert.deepEqual(mythic.异能档案, {});
});

test('modern plot advances one stage only with the configured evidence', () => {
  const root = createRootState({ worldId: 'modern' });
  assert.equal(advanceModernState(root, {
    type: 'advancePlot',
    targetStage: 2,
    evidence: ['异常裂隙样本', '基本取证'],
  }).accepted, false);
  assert.equal(advanceModernState(root, {
    type: 'advancePlot',
    targetStage: 1,
    evidence: ['异常裂隙样本'],
  }).accepted, false);
  assert.equal(advanceModernState(root, {
    type: 'advancePlot',
    targetStage: 1,
    evidence: ['异常裂隙样本', '基本取证'],
  }).accepted, true);
  assert.equal(root.世界状态.现代都市.主线.阶段, 1);
});

test('rift and invasion state require evidence and stay isolated', () => {
  const root = createRootState({ worldId: 'modern' });
  assert.equal(advanceModernState(root, {
    type: 'updateRift',
    nodeId: 'shanghai',
    status: '活跃',
    evidence: [],
  }).accepted, false);
  assert.equal(advanceModernState(root, {
    type: 'updateRift',
    nodeId: 'shanghai',
    status: '活跃',
    evidence: ['应急中心读数'],
  }).accepted, true);
  assert.equal(root.世界状态.现代都市.裂隙.shanghai.状态, '活跃');

  root.世界状态.当前世界 = 'corridor';
  const result = advanceModernState(root, {
    type: 'updateRift',
    nodeId: 'london',
    status: '活跃',
    evidence: ['机构报告'],
  });
  assert.equal(result.changed, false);
  assert.equal('london' in root.世界状态.现代都市.裂隙, false);
});

test('adult trigger protection requires adult capacity and explicit consent', () => {
  const profiles = {
    a: normal('灰狼'),
    b: normal('赤狐'),
    minor: createPhysiologyProfile({
      adult: false,
      sex: '雄性',
      capability: '无',
      system: '普通',
      classificationId: 'G-S02',
      species: '猞猁',
    }),
  };
  assert.equal(validateAdultTrigger(profiles, ['a', 'b'], { capacity: true, consent: true }).accepted, true);
  assert.equal(validateAdultTrigger(profiles, ['a', 'minor'], { capacity: true, consent: true }).accepted, false);
  assert.equal(validateAdultTrigger(profiles, ['a', 'b'], { capacity: true, consent: false }).accepted, false);
});
