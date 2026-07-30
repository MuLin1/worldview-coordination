// 从生成模块导入完整种族数据（含属性、特性、限制等）
import {
  NORMAL_SPECIES as _NORMAL_SPECIES_FULL,
  MYTHIC_SPECIES as _MYTHIC_SPECIES_FULL,
  SPECIES_LIST,
  getSpeciesById,
} from './generated/species-config.js';

export {
  _NORMAL_SPECIES_FULL as SPECIES_FULL,
  _MYTHIC_SPECIES_FULL as MYTHIC_SPECIES_FULL,
  SPECIES_LIST,
  getSpeciesById,
};

const freezeEntries = entries => Object.freeze(Object.fromEntries(
  entries.map(([id, value]) => [id, Object.freeze(value)]),
));

/** Only these two worlds are active in the current worldbook. */
export const WORLDBOOK_WORLD_IDS = Object.freeze(['vielsaen', 'modern']);

export const WORLD_REGISTRY = Object.freeze({
  corridor: Object.freeze({ label: '创世回廊', prefix: 'C', exclusiveState: null }),
  sao: Object.freeze({ label: '刀剑神域', prefix: 'S', exclusiveState: null }),
  jiuzhou: Object.freeze({ label: '大明志异', prefix: 'J', exclusiveState: null }),
  vielsaen: Object.freeze({ label: '维尔萨恩', prefix: 'V', exclusiveState: '维尔萨恩' }),
  modern: Object.freeze({ label: '现代都市', prefix: 'U', exclusiveState: '现代都市' }),
});

const normal = (name, cycleDays, activeDays, seasonal, gestationDays, birthMode, offspringCount, adjustments) => ({
  name,
  system: '普通',
  cycleDays,
  activeDays,
  seasonal,
  defaultOffsetDays: [-2, 2],
  gestationDays,
  birthMode,
  offspringCount,
  adjustments,
});

// Numerical ranges are game-scale defaults. A registered concrete species may
// narrow them, but may not replace the shared engine.
export const NORMAL_SPECIES = freezeEntries([
  ['G-S01', normal('犬科', [21, 35], [5, 9], '弱季节性', [58, 72], '胎生', [1, 5], ['医疗抑制', '周期调节'])],
  ['G-S02', normal('猫科', [18, 30], [4, 8], '季节性', [60, 70], '胎生', [1, 5], ['医疗抑制', '光照调节'])],
  ['G-S03', normal('熊科', [28, 42], [5, 9], '季节性', [180, 240], '胎生', [1, 3], ['医疗抑制', '季节调节'])],
  ['G-S04', normal('鼬科', [18, 30], [4, 8], '季节性', [35, 50], '胎生', [1, 6], ['医疗抑制', '光照调节'])],
  ['G-S05', normal('小型啮齿与兔形类', [16, 28], [3, 7], '弱季节性', [28, 45], '胎生', [1, 6], ['医疗抑制', '周期调节'])],
  ['G-S06', normal('马科', [19, 25], [4, 7], '季节性', [320, 370], '胎生', [1, 2], ['医疗抑制', '光照调节'])],
  ['G-S07', normal('鹿科', [24, 36], [4, 8], '强季节性', [190, 250], '胎生', [1, 3], ['医疗抑制', '季节调节'])],
  ['G-S08', normal('牛羊羚类', [17, 25], [3, 6], '品种差异', [145, 290], '胎生', [1, 3], ['医疗抑制', '周期调节'])],
  ['G-S09', normal('混血种', [18, 24], [3, 6], '弱季节性', [108, 122], '胎生', [1, 6], ['医疗抑制', '周期调节'])],
  ['G-S10', normal('猛禽类', [24, 40], [5, 10], '强季节性', [28, 45], '卵生', [1, 3], ['医疗抑制', '光照调节'])],
  ['G-S11', normal('鸣禽鸦鹦类', [20, 35], [4, 9], '季节性', [18, 32], '卵生', [1, 5], ['医疗抑制', '光照调节'])],
  ['G-S12', normal('水禽与海鸟类', [24, 42], [5, 10], '强季节性', [25, 55], '卵生', [1, 4], ['医疗抑制', '光照调节'])],
  ['G-S13', normal('蜥蜴与蛇类', [25, 50], [5, 12], '温度相关', [45, 100], '卵生', [1, 6], ['医疗抑制', '温度调节'])],
  ['G-S14', normal('龟鳖类', [35, 60], [7, 14], '温度相关', [55, 120], '卵生', [1, 6], ['医疗抑制', '温度调节'])],
  ['G-S15', normal('鳄类', [28, 50], [6, 12], '温度相关', [65, 95], '卵生', [1, 5], ['医疗抑制', '温度调节'])],
  ['G-S16', normal('鲸豚类', [25, 40], [5, 10], '品种差异', [300, 390], '胎生', [1, 2], ['医疗抑制', '周期调节'])],
  ['G-S17', normal('软骨鱼类', [30, 60], [6, 14], '品种差异', [180, 390], '卵生', [1, 4], ['医疗抑制', '水温调节'])],
  ['G-S18', normal('硬骨鱼类', [20, 45], [5, 12], '品种差异', [20, 90], '卵生', [1, 6], ['医疗抑制', '水温调节'])],
]);

const mythic = (name, cycleDays, activeDays, gestationDays, birthMode, offspringCount) => ({
  name,
  system: '神话',
  cycleDays,
  activeDays,
  seasonal: '魔力与个体状态相关',
  defaultOffsetDays: [-5, 5],
  gestationDays,
  birthMode,
  offspringCount,
  adjustments: ['高阶医疗抑制', '魔力调节'],
});

export const MYTHIC_SPECIES = freezeEntries([
  ['G-M01', mythic('巨龙', [90, 180], [10, 21], [540, 900], '卵生', [1, 2])],
  ['G-M02', mythic('凤凰', [120, 240], [12, 24], [360, 720], '卵生', [1, 2])],
  ['G-M03', mythic('麒麟', [80, 160], [9, 18], [420, 720], '胎生', [1, 2])],
  ['G-M04', mythic('狮鹫', [60, 120], [8, 16], [270, 420], '卵生', [1, 3])],
  ['G-M05', mythic('深海巨兽', [120, 240], [14, 28], [600, 1080], '胎生', [1, 2])],
  ['G-M06', mythic('独角兽', [70, 140], [8, 16], [360, 600], '胎生', [1, 2])],
  ['G-M07', mythic('雷鸟', [80, 160], [9, 18], [300, 480], '卵生', [1, 3])],
  ['G-M08', mythic('多首巨蛇', [100, 200], [12, 24], [420, 720], '卵生', [1, 4])],
]);

export const VIELSAEN_CONFIG = Object.freeze({
  land: '艾沃兰大陆',
  sea: '瑟雷亚海',
  nations: Object.freeze([
    { id: 'valkain', name: '瓦尔凯恩帝国', role: '中央集权、魔法工业与代理扩张' },
    { id: 'serantia', name: '瑟兰提亚海盟', role: '海贸、金融、舰队与群岛航路' },
    { id: 'bresia', name: '布雷西亚王国', role: '粮食、陆军、骑士制度与大陆平原' },
    { id: 'oseran', name: '奥瑟兰学邦', role: '魔法教育、医疗、标准制定与中立研究' },
    { id: 'kadros', name: '卡德罗斯山国', role: '山地要塞、矿脉、构型材料与防御工事' },
    { id: 'visalin', name: '维萨林城邦联盟', role: '交通咽喉、转口贸易、情报与多城自治' },
  ]),
  schools: Object.freeze(['生息学派', '灵魂学派', '塑能学派', '构型学派', '护界学派', '迁跃学派']),
  deities: Object.freeze(['阿维娜', '瑟弗兰', '凯尔铎', '瓦尔迦', '伊瑟琳', '欧洛恩', '奈维尔']),
  hotspots: Object.freeze(['格兰维尔河谷', '赫尔岬走廊', '凯斯特群岛']),
});

export const MODERN_CONFIG = Object.freeze({
  year: 2026,
  abilityTypes: Object.freeze(['身体强化', '元素操控', '物质塑形', '能量放射', '感知与精神', '生命调节', '空间干涉', '规则特例']),
  abilityGrades: Object.freeze(['E', 'D', 'C', 'B', 'A', 'S']),
  plotStages: Object.freeze([
    { stage: 0, name: '常态都市生活', requiredEvidence: ['异常裂隙样本', '基本取证'] },
    { stage: 1, name: '异常裂隙样本', requiredEvidence: ['组织痕迹对比', '2014年档案线索'] },
    { stage: 2, name: '旧案回声', requiredEvidence: ['排除自然灾害', '人为开启步骤'] },
    { stage: 3, name: '人为裂隙', requiredEvidence: ['统一指挥证据', '锚点网络证据'] },
    { stage: 4, name: '魔物王与锚点网络', requiredEvidence: ['公开预警', '联合指挥基础'] },
    { stage: 5, name: '全球魔物入侵', requiredEvidence: ['稳定主要战线', '远征队组建条件'] },
    { stage: 6, name: '异界联合远征', requiredEvidence: ['统治核心定位', '关闭与撤离方案'] },
    { stage: 7, name: '击败魔物王', requiredEvidence: ['魔物王败亡', '主通道关闭', '锚点网络失效'] },
  ]),
});

// 从自动生成模块导入最终同伴数据
import { VIELSAEN_COMPANIONS } from './generated/vielsaen-companions.js';
import { MODERN_COMPANIONS } from './generated/modern-companions.js';

export { VIELSAEN_COMPANIONS, MODERN_COMPANIONS };

const withOpeningAliases = character => Object.freeze({
  ...character,
  species: character.speciesName || character.physiology?.species || '',
  profession: character.professionOrAbility?.label || '',
  level: character.baseLevel,
  role: character.combatRole || '',
  origin: character.joinCondition || character.originNodeId || '',
  faction: character.factionId || '无固定势力',
  ability: character.professionOrAbility?.kind === 'ability'
    ? Object.freeze({
        name: character.activeSkills?.[0]?.name || character.professionOrAbility.label,
        type: character.professionOrAbility.abilityType || '',
        grade: '异能',
      })
    : null,
});

// 兼容性导出：合并的同伴列表
export const REPLACEMENT_BONDS = Object.freeze([
  ...VIELSAEN_COMPANIONS,
  ...MODERN_COMPANIONS,
].map(withOpeningAliases));

// 旧 ID 到新规范 ID 的迁移映射
export const COMPANION_ID_ALIASES = Object.freeze({
  vielsaen_kael_rhodes: 'V-C100',
  vielsaen_mira_vel: 'V-C101',
  vielsaen_orin_sable: 'V-C102',
  modern_lin_xiaoyu: 'U-C100',
  modern_chen_mojun: 'U-C101',
  modern_ava_storm: 'U-C102',
});
