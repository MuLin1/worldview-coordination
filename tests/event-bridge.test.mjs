import test from 'node:test';
import assert from 'node:assert/strict';

import { createPhysiologyProfile } from '../dist/V20260728/five-world-runtime.js';
import {
  consumeReproductionRequests,
  processReproductionEvent,
  settlePendingBirths,
} from '../dist/V20260728/five-world-event-bridge.js';

const adult = (overrides = {}) => createPhysiologyProfile({
  adult: true,
  sex: '雌性',
  capability: '可妊娠',
  system: '普通',
  classificationId: 'G-S01',
  species: '灰狼',
  heritableTraits: ['灰银被毛'],
  cycleStartDate: 'V2026年7月1日',
  ...overrides,
});

const makeValidStatData = () => {
  const data = {
    系统配置: { 世界观: '维尔萨恩' },
    人物: { 生理档案: adult() },
    羁绊列表: {
      父方: {
        生理档案: adult({
          sex: '雄性',
          capability: '可授精',
          cycleEnabled: false,
        }),
      },
    },
  };
  return data;
};

const event = {
  类型: '受孕请求',
  事件ID: 'conversation:42:1',
  日期: 'V2026年7月30日',
  参与者ID: ['player', 'bond:父方'],
  妊娠候选ID: 'player',
  授精候选ID: 'bond:父方',
  是否体内授精: true,
  避孕措施: [],
  健康与年龄证据: {
    健康: { player: '健康', 'bond:父方': '健康' },
    年龄: { player: '成年', 'bond:父方': '成年' },
  },
  世界修正证据: [],
};

test('bridge maps facts and ignores no caller-supplied roll because forbidden result fields are rejected', () => {
  const statData = makeValidStatData();
  const withRoll = { ...event, D100: 1, 受孕结果: '受孕成功' };
  const rejected = processReproductionEvent(statData, withRoll, () => 0.99);
  assert.equal(rejected.status, '已拒绝');
  assert.equal(rejected.roll, null);
  assert.match(rejected.reason, /脚本只读字段/);
});

test('bridge rejects minor before RNG is called', () => {
  let calls = 0;
  const statData = makeValidStatData();
  statData.人物.生理档案.是否成年 = false;
  const result = processReproductionEvent(statData, event, () => { calls += 1; return 0; });
  assert.equal(result.status, '已拒绝');
  assert.equal(result.roll, null);
  assert.equal(calls, 0);
});

test('duplicate conception and birth requests are idempotent', () => {
  const statData = makeValidStatData();
  const first = processReproductionEvent(statData, event, () => 0);
  const duplicate = processReproductionEvent(statData, event, () => 0.99);
  assert.equal(first.status, '受孕成功');
  assert.equal(duplicate.duplicate, true);
  assert.equal(statData.生殖系统.结算账本.length, 1);

  const pregnancy = statData.角色档案.player.妊娠;
  pregnancy.状态 = '待分娩';
  statData.生殖系统.待生育事件 = ['player'];
  const born = settlePendingBirths(statData, () => 0.5);
  const bornAgain = settlePendingBirths(statData, () => 0);
  assert.equal(born.length, 1);
  assert.equal(bornAgain.length, 0);
  assert.equal(statData.生殖系统.生育记录.length, 1);
});

test('magic exhaustion never changes conception probability', () => {
  const normal = makeValidStatData();
  const exhausted = makeValidStatData();
  exhausted.人物.生理档案.魔力档案 = { 魔力透支: true };
  const a = processReproductionEvent(normal, event, () => 0.5);
  const b = processReproductionEvent(exhausted, event, () => 0.5);
  assert.equal(a.probability, b.probability);
});
