import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createPhysiologyProfile,
  createRootState,
  parseWorldDate,
  advanceState,
  submitConception,
  settleBirth,
  renderPhysiologySummary,
} from '../dist/V20260728/five-world-runtime.js';

const adult = (overrides = {}) => createPhysiologyProfile({
  adult: true,
  sex: '雌性',
  capability: '可妊娠',
  system: '普通',
  classificationId: 'G-S01',
  species: '灰狼',
  heritableTraits: ['灰银被毛', '琥珀色虹膜'],
  cycleStartDate: 'V2026年7月1日',
  ...overrides,
});

test('strict world date parsing rejects wrong prefixes and impossible dates', () => {
  assert.deepEqual(parseWorldDate('V2026年7月30日', 'vielsaen'), {
    worldId: 'vielsaen',
    prefix: 'V',
    iso: '2026-07-30',
    epochDay: 20664,
  });
  assert.throws(() => parseWorldDate('U2026年7月30日', 'vielsaen'), /日期世界前缀不匹配/);
  assert.throws(() => parseWorldDate('V2026年2月30日', 'vielsaen'), /日期无效/);
});

test('state advance updates each adult independently and rejects backwards time', () => {
  const root = createRootState({
    worldId: 'vielsaen',
    profiles: {
      player: adult(),
      bond: adult({ classificationId: 'G-S02', species: '猞猁', cycleStartDate: 'V2026年7月10日' }),
    },
  });

  const result = advanceState(root, 'V2026年7月30日');
  assert.equal(result.changed, true);
  assert.equal(root.角色档案.player.自然周期.当前阶段, '活跃期');
  assert.equal(root.角色档案.bond.自然周期.当前阶段, '静息期');
  assert.equal(root.上次结算日期, 'V2026年7月30日');
  assert.throws(() => advanceState(root, 'V2026年7月29日'), /日期倒退/);
});

test('conception validates adults and capabilities before rolling', () => {
  const root = createRootState({
    worldId: 'vielsaen',
    profiles: {
      mother: adult(),
      father: adult({ sex: '雄性', capability: '可授精', cycleEnabled: false }),
      child: adult({ adult: false }),
    },
  });

  const base = {
    eventId: 'evt-1',
    date: 'V2026年7月30日',
    participantIds: ['mother', 'father'],
    gestatingId: 'mother',
    inseminatingId: 'father',
    internalInsemination: true,
    contraception: [],
    healthEvidence: { mother: '健康', father: '健康' },
    ageEvidence: { mother: '成年档案', father: '成年档案' },
    worldModifiers: [],
  };

  const rejected = submitConception(root, { ...base, eventId: 'evt-minor', participantIds: ['mother', 'child'], inseminatingId: 'child' }, () => 0);
  assert.equal(rejected.status, '已拒绝');
  assert.match(rejected.reason, /未成年|生殖能力/);
  assert.equal(rejected.roll, null);

  const accepted = submitConception(root, base, () => 0);
  assert.equal(accepted.status, '受孕成功');
  assert.equal(accepted.roll, 1);
  assert.ok(accepted.probability > 0);
  assert.equal(root.角色档案.mother.妊娠.受孕事件ID, 'evt-1');
  assert.equal(root.生殖系统.结算账本.length, 2);

  const duplicate = submitConception(root, base, () => 0.99);
  assert.equal(duplicate.duplicate, true);
  assert.equal(duplicate.roll, 1);
  assert.equal(root.生殖系统.结算账本.length, 2);
});

test('pregnancy uses a parameter snapshot and advances to pending birth', () => {
  const root = createRootState({
    worldId: 'vielsaen',
    profiles: {
      mother: adult(),
      father: adult({ sex: '雄性', capability: '可授精', cycleEnabled: false }),
    },
  });
  submitConception(root, {
    eventId: 'evt-pregnancy',
    date: 'V2026年1月1日',
    participantIds: ['mother', 'father'],
    gestatingId: 'mother',
    inseminatingId: 'father',
    internalInsemination: true,
    contraception: [],
    healthEvidence: { mother: '健康', father: '健康' },
    ageEvidence: { mother: '成年档案', father: '成年档案' },
    worldModifiers: [],
  }, () => 0);

  const pregnancy = root.角色档案.mother.妊娠;
  assert.equal(pregnancy.参数快照.classificationId, 'G-S01');
  assert.equal(pregnancy.参数快照.birthMode, '胎生');
  advanceState(root, pregnancy.预计分娩日期);
  assert.equal(pregnancy.状态, '待分娩');
  assert.equal(pregnancy.剩余天数, 0);
  assert.deepEqual(root.生殖系统.待生育事件, ['mother']);
});

test('birth settlement is idempotent and follows gestating species', () => {
  const root = createRootState({
    worldId: 'vielsaen',
    profiles: {
      mother: adult(),
      father: adult({
        sex: '雄性',
        capability: '可授精',
        classificationId: 'G-S02',
        species: '猞猁',
        heritableTraits: ['斑点被毛', '簇状耳尖'],
        cycleEnabled: false,
      }),
    },
  });
  submitConception(root, {
    eventId: 'evt-birth',
    date: 'V2026年1月1日',
    participantIds: ['mother', 'father'],
    gestatingId: 'mother',
    inseminatingId: 'father',
    internalInsemination: true,
    contraception: [],
    healthEvidence: { mother: '健康', father: '健康' },
    ageEvidence: { mother: '成年档案', father: '成年档案' },
    worldModifiers: [],
  }, () => 0);
  const pregnancy = root.角色档案.mother.妊娠;
  pregnancy.状态 = '待分娩';
  pregnancy.预计数量 = 2;

  const result = settleBirth(root, 'mother', () => 0.5);
  assert.equal(result.children.length, 2);
  assert.ok(result.children.every(x => x.基础种族 === '灰狼'));
  assert.ok(result.children.every(x => x.血统 === '混血'));
  assert.ok(result.children.every(x => x.生理性别 === '雌性'));
  assert.ok(result.children.every(x => x.遗传特征.length > 0));

  const duplicate = settleBirth(root, 'mother', () => 0);
  assert.equal(duplicate.duplicate, true);
  assert.equal(root.生殖系统.生育记录.length, 1);
});

test('physiology renderer folds inactive state and exposes active pregnancy fields', () => {
  const profile = adult();
  const folded = renderPhysiologySummary(profile);
  assert.match(folded, /生理状态/);
  assert.doesNotMatch(folded, /预计分娩日期/);

  profile.妊娠 = {
    状态: '妊娠中',
    开始日期: 'V2026年1月1日',
    预计分娩日期: 'V2026年3月10日',
    剩余天数: 12,
    预计数量: 2,
    生育方式: '胎生',
  };
  const expanded = renderPhysiologySummary(profile);
  assert.match(expanded, /预计分娩日期/);
  assert.match(expanded, /V2026年3月10日/);
  assert.match(expanded, /预计数量/);
});
