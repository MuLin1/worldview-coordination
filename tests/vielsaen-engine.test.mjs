import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createPhysiologyProfile,
  createRootState,
  submitConception,
  advanceVielsaenState,
} from '../dist/V20260728/five-world-runtime.js';

const makeRoot = () => createRootState({
  worldId: 'vielsaen',
  profiles: {
    hero: createPhysiologyProfile({
      adult: true,
      sex: '雌性',
      capability: '可妊娠',
      system: '普通',
      classificationId: 'G-S01',
      species: '赤狐',
      heritableTraits: ['赤金被毛'],
      cycleStartDate: 'V2026年1月1日',
    }),
    partner: createPhysiologyProfile({
      adult: true,
      sex: '雄性',
      capability: '可授精',
      system: '普通',
      classificationId: 'G-S02',
      species: '猞猁',
      heritableTraits: ['簇状耳尖'],
      cycleEnabled: false,
    }),
  },
});

test('Vielsaen state never advances while another world is active', () => {
  const root = makeRoot();
  root.世界状态.当前世界 = 'modern';
  const before = structuredClone(root.世界状态.维尔萨恩);
  const result = advanceVielsaenState(root, {
    type: 'condenseDemonKing',
    evidence: ['边境死亡累计', '灵魂与生命魔力失衡'],
  });
  assert.equal(result.changed, false);
  assert.deepEqual(root.世界状态.维尔萨恩, before);
});

test('demon king and hero transitions require evidence and valid order', () => {
  const root = makeRoot();
  assert.equal(advanceVielsaenState(root, { type: 'publishDemonKing', evidence: ['目击'] }).accepted, false);
  assert.equal(root.世界状态.维尔萨恩.魔王.是否公开, false);

  assert.equal(advanceVielsaenState(root, {
    type: 'condenseDemonKing',
    evidence: ['边境死亡累计', '灵魂与生命魔力失衡'],
  }).accepted, true);
  assert.equal(advanceVielsaenState(root, { type: 'publishDemonKing', evidence: [] }).accepted, false);
  assert.equal(advanceVielsaenState(root, { type: 'publishDemonKing', evidence: ['可复核公开事件'] }).accepted, true);

  assert.equal(advanceVielsaenState(root, {
    type: 'confirmHero',
    characterId: 'hero',
    evidence: ['使命觉醒'],
  }).accepted, false);
  assert.equal(advanceVielsaenState(root, {
    type: 'setHeroCandidate',
    characterId: 'hero',
    evidence: ['异世界记忆证据'],
  }).accepted, true);
  assert.equal(advanceVielsaenState(root, {
    type: 'confirmHero',
    characterId: 'hero',
    evidence: ['使命觉醒', '能力觉醒'],
  }).accepted, true);
  assert.equal(root.世界状态.维尔萨恩.勇者.确认ID, 'hero');
});

test('sanctuary and five-month window advance only through explicit evidence', () => {
  const root = makeRoot();
  assert.equal(advanceVielsaenState(root, {
    type: 'updateSanctuary',
    status: '受威胁',
    evidence: [],
  }).accepted, false);
  assert.equal(advanceVielsaenState(root, {
    type: 'updateSanctuary',
    status: '受威胁',
    evidence: ['护界节点失效'],
  }).accepted, true);
  advanceVielsaenState(root, {
    type: 'condenseDemonKing',
    evidence: ['边境死亡累计', '灵魂与生命魔力失衡'],
  });
  advanceVielsaenState(root, { type: 'publishDemonKing', evidence: ['公开目击'] });
  advanceVielsaenState(root, {
    type: 'setHeroCandidate',
    characterId: 'hero',
    evidence: ['异世界记忆证据'],
  });
  advanceVielsaenState(root, {
    type: 'confirmHero',
    characterId: 'hero',
    evidence: ['使命觉醒', '能力觉醒'],
  });
  assert.equal(advanceVielsaenState(root, {
    type: 'startWindow',
    date: 'V2026年7月1日',
    evidence: ['魔王公开', '勇者使命确认'],
  }).accepted, true);
  assert.equal(advanceVielsaenState(root, {
    type: 'advanceWindow',
    date: 'V2026年8月1日',
    evidence: ['日期推进'],
  }).state.五个月空窗期.已过天数, 31);
});

test('mana exhaustion can overlap a natural cycle without changing conception probability', () => {
  const baseline = makeRoot();
  const exhausted = makeRoot();
  const event = {
    eventId: 'probability-check',
    date: 'V2026年7月1日',
    participantIds: ['hero', 'partner'],
    gestatingId: 'hero',
    inseminatingId: 'partner',
    internalInsemination: true,
    contraception: [],
    healthEvidence: { hero: '健康', partner: '健康' },
    ageEvidence: { hero: '成年档案', partner: '成年档案' },
    worldModifiers: [],
  };
  advanceVielsaenState(exhausted, {
    type: 'setManaExhaustion',
    characterId: 'hero',
    status: '发情表现',
    evidence: ['个体魔力储备归零'],
  });
  const a = submitConception(baseline, event, () => 0.5);
  const b = submitConception(exhausted, event, () => 0.5);
  assert.equal(a.probability, b.probability);
});
