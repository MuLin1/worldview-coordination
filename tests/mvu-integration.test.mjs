import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ensureFiveWorldState,
  switchWorld,
  advanceMvuState,
} from '../dist/V20260728/five-world-mvu.js';

const profile = {
  是否成年: true,
  生理性别: '雌性',
  生殖能力: '可妊娠',
  生物体系: '普通',
  生物大类: 'G-S01',
  具体种族: '灰狼',
  可遗传特征: ['灰银被毛'],
  自然周期: {
    是否启用: true,
    配置ID: 'G-S01',
    周期起始日期: 'V2026年7月1日',
    当前阶段: '',
    周期序号: 0,
    抑制状态: '无',
    个体偏移天数: 0,
  },
  妊娠: {
    状态: '未妊娠',
    受孕事件ID: '',
    授精方ID: '',
    开始日期: '',
    预计分娩日期: '',
    剩余天数: 0,
    生育方式: '胎生',
    预计数量: 0,
    待结算: false,
    参数快照: null,
  },
  后代记录: [],
  魔力档案: {},
  异能档案: {},
};

test('MVU initialization keeps existing data and links explicit physiology profiles', () => {
  const statData = {
    系统配置: { 世界观: '维尔萨恩' },
    人物: { 名称: '玩家', 生理档案: structuredClone(profile), 等级: 3 },
    羁绊列表: { 米拉: { 生理档案: structuredClone(profile), 好感度: 20 } },
    自定义字段: { keep: true },
  };
  const result = ensureFiveWorldState(statData);
  assert.equal(result.世界状态.当前世界, 'vielsaen');
  assert.equal(result.角色档案.player.具体种族, '灰狼');
  assert.equal(result.角色档案['bond:米拉'].具体种族, '灰狼');
  assert.deepEqual(statData.自定义字段, { keep: true });
});

test('world switching preserves inactive world state and rejects retired IDs', () => {
  const statData = {};
  ensureFiveWorldState(statData, 'vielsaen');
  statData.世界状态.维尔萨恩.圣地.状态 = '受威胁';
  switchWorld(statData, 'modern');
  statData.世界状态.现代都市.主线.阶段 = 2;
  switchWorld(statData, 'vielsaen');
  assert.equal(statData.世界状态.维尔萨恩.圣地.状态, '受威胁');
  assert.equal(statData.世界状态.现代都市.主线.阶段, 2);
  assert.throws(() => switchWorld(statData, 'amber'), /未知世界ID/);
  assert.throws(() => switchWorld(statData, 'dragon'), /未知世界ID/);
});

test('MVU advancement reports invalid dates instead of guessing', () => {
  const statData = {
    人物: { 生理档案: structuredClone(profile) },
  };
  ensureFiveWorldState(statData, 'vielsaen');
  const bad = advanceMvuState(statData, '阿拉德历2026年7月30日');
  assert.equal(bad.changed, false);
  assert.match(bad.error, /日期无效/);
  assert.equal(statData.生殖系统.最后错误, bad.error);

  const good = advanceMvuState(statData, 'V2026年7月30日');
  assert.equal(good.changed, true);
  assert.equal(statData.角色档案.player.自然周期.当前阶段, '活跃期');
  assert.equal(statData.生殖系统.最后错误, '');
});
