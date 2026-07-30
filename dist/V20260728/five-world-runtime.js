import {
  WORLD_REGISTRY,
  NORMAL_SPECIES,
  MYTHIC_SPECIES,
  VIELSAEN_CONFIG,
  MODERN_CONFIG,
  REPLACEMENT_BONDS,
} from './five-world-config.js';

const DAY_MS = 86_400_000;
const CAPABILITIES = new Set(['可妊娠', '可授精', '双向', '无']);
const SEXES = new Set(['雌性', '雄性', '双性', '无性', '可变']);

const clone = value => typeof structuredClone === 'function'
  ? structuredClone(value)
  : JSON.parse(JSON.stringify(value));

const averageInt = range => Math.round((range[0] + range[1]) / 2);
const randomInt = (range, random) => range[0] + Math.floor(random() * (range[1] - range[0] + 1));
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const speciesRegistry = system => system === '神话' ? MYTHIC_SPECIES : NORMAL_SPECIES;

function requireWorld(worldId) {
  const world = WORLD_REGISTRY[worldId];
  if (!world) throw new Error(`未知世界ID: ${worldId}`);
  return world;
}

function requireSpecies(profile) {
  const config = speciesRegistry(profile.生物体系)[profile.生物大类];
  if (!config) throw new Error(`生殖分类无效: ${profile.生物大类}`);
  return config;
}

export function parseWorldDate(value, worldId) {
  const world = requireWorld(worldId);
  const match = /^([A-Z])(\d{4})年(\d{1,2})月(\d{1,2})日$/.exec(String(value || '').trim());
  if (!match) throw new Error('日期无效：必须使用“世界前缀+年+月+日”');
  if (match[1] !== world.prefix) throw new Error('日期世界前缀不匹配');

  const year = Number(match[2]);
  const month = Number(match[3]);
  const day = Number(match[4]);
  const epoch = Date.UTC(year, month - 1, day);
  const parsed = new Date(epoch);
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new Error('日期无效');
  }

  return {
    worldId,
    prefix: world.prefix,
    iso: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    epochDay: Math.floor(epoch / DAY_MS),
  };
}

function formatWorldDate(epochDay, worldId) {
  const date = new Date(epochDay * DAY_MS);
  return `${requireWorld(worldId).prefix}${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`;
}

export function createPhysiologyProfile(input = {}) {
  const {
    adult,
    sex,
    capability,
    system,
    classificationId,
    species,
    heritableTraits = [],
    cycleEnabled = true,
    cycleStartDate = '',
    cycleOffsetDays = 0,
  } = input;
  if (typeof adult !== 'boolean') throw new Error('是否成年必须显式指定');
  if (!SEXES.has(sex)) throw new Error(`生理性别无效: ${sex}`);
  if (!CAPABILITIES.has(capability)) throw new Error(`生殖能力无效: ${capability}`);
  if (!['普通', '神话'].includes(system)) throw new Error(`生物体系无效: ${system}`);

  const config = speciesRegistry(system)[classificationId];
  if (!config) throw new Error(`生殖分类无效: ${classificationId}`);

  return {
    是否成年: adult,
    生理性别: sex,
    生殖能力: capability,
    生物体系: system,
    生物大类: classificationId,
    具体种族: String(species || config.name),
    可遗传特征: [...new Set(heritableTraits.map(String).filter(Boolean))],
    自然周期: {
      是否启用: Boolean(cycleEnabled && adult && ['可妊娠', '双向'].includes(capability)),
      配置ID: classificationId,
      周期起始日期: cycleStartDate,
      当前阶段: '',
      周期序号: 0,
      抑制状态: '无',
      个体偏移天数: Number.isFinite(cycleOffsetDays) ? Math.trunc(cycleOffsetDays) : 0,
    },
    妊娠: {
      状态: '未妊娠',
      受孕事件ID: '',
      授精方ID: '',
      开始日期: '',
      预计分娩日期: '',
      剩余天数: 0,
      生育方式: config.birthMode,
      预计数量: 0,
      待结算: false,
      参数快照: null,
    },
    后代记录: [],
    魔力档案: {},
    异能档案: {},
  };
}

export function createRootState({ worldId, profiles = {} } = {}) {
  requireWorld(worldId);
  const root = {
    世界状态: {
      当前世界: worldId,
      维尔萨恩: {
        魔王: { 是否公开: false, 状态: '未凝聚', 证据: [] },
        勇者: { 状态: '未出现', 候选ID: '', 确认ID: '', 证据: [] },
        圣地: { 状态: '稳定', 证据: [] },
        五个月空窗期: { 状态: '未开始', 开始日期: '', 已过天数: 0, 总天数: 150 },
        魔力枯竭: {},
      },
      现代都市: {
        主线: { 阶段: 0, 证据: [], 历史: [] },
        裂隙: {},
        异界魔物活动: {},
        魔物王入侵: { 状态: '未公开', 证据: [] },
        成人触发保护: { 仅限成年: true, 要求行为能力: true, 要求有效同意: true },
      },
      跨世界彩蛋: {},
    },
    生殖系统: {
      请求账本: [],
      结算账本: [],
      待生育事件: [],
      生育记录: [],
    },
    角色档案: Object.fromEntries(
      Object.entries(profiles).map(([id, profile]) => [id, clone(profile)]),
    ),
    上次结算日期: '',
  };
  return root;
}

function cyclePhase(profile, currentDate, worldId) {
  const cycle = profile.自然周期;
  if (!cycle?.是否启用 || cycle.抑制状态 === '抑制' || !cycle.周期起始日期) return null;
  const config = requireSpecies(profile);
  const start = parseWorldDate(cycle.周期起始日期, worldId);
  if (start.epochDay > currentDate.epochDay) return { phase: '未开始', sequence: 0 };

  const length = Math.max(1, averageInt(config.cycleDays) + cycle.个体偏移天数);
  const active = Math.min(length, averageInt(config.activeDays));
  const day = (currentDate.epochDay - start.epochDay) % length;
  const recoveryEnd = Math.min(length, active + Math.max(2, Math.floor((length - active) / 3)));
  return {
    phase: day < active ? '活跃期' : day < recoveryEnd ? '恢复期' : '静息期',
    sequence: Math.floor((currentDate.epochDay - start.epochDay) / length) + 1,
  };
}

export function advanceState(root, dateValue) {
  const worldId = root?.世界状态?.当前世界;
  const current = parseWorldDate(dateValue, worldId);
  if (root.上次结算日期) {
    const previous = parseWorldDate(root.上次结算日期, worldId);
    if (current.epochDay < previous.epochDay) throw new Error('日期倒退：停止状态推进');
    if (current.epochDay === previous.epochDay) return { changed: false, elapsedDays: 0 };
  }

  const pending = new Set(root.生殖系统.待生育事件);
  for (const [id, profile] of Object.entries(root.角色档案)) {
    if (!profile?.是否成年) continue;
    const cycle = cyclePhase(profile, current, worldId);
    if (cycle) {
      profile.自然周期.当前阶段 = cycle.phase;
      profile.自然周期.周期序号 = cycle.sequence;
    }

    const pregnancy = profile.妊娠;
    if (pregnancy?.状态 === '妊娠中') {
      const due = parseWorldDate(pregnancy.预计分娩日期, worldId);
      pregnancy.剩余天数 = Math.max(0, due.epochDay - current.epochDay);
      if (pregnancy.剩余天数 === 0) {
        pregnancy.状态 = '待分娩';
        pregnancy.待结算 = true;
        pending.add(id);
      }
    }
  }
  root.生殖系统.待生育事件 = [...pending];
  const elapsedDays = root.上次结算日期
    ? current.epochDay - parseWorldDate(root.上次结算日期, worldId).epochDay
    : 0;
  root.上次结算日期 = dateValue;
  return { changed: true, elapsedDays };
}

function conceptionValidation(root, request) {
  const required = ['eventId', 'date', 'participantIds', 'gestatingId', 'inseminatingId'];
  const missing = required.filter(key => {
    const value = request[key];
    return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
  });
  if (missing.length) return `事件数据不完整: ${missing.join('、')}`;

  parseWorldDate(request.date, root.世界状态.当前世界);
  const participants = request.participantIds.map(id => root.角色档案[id]);
  if (participants.some(profile => !profile)) return '参与者档案不存在';
  if (participants.some(profile => !profile.是否成年)) return '参与者存在未成年角色';

  const gestating = root.角色档案[request.gestatingId];
  const inseminating = root.角色档案[request.inseminatingId];
  if (!gestating || !inseminating) return '妊娠或授精候选档案不存在';
  if (!['可妊娠', '双向'].includes(gestating.生殖能力)
    || !['可授精', '双向'].includes(inseminating.生殖能力)) {
    return '生殖能力组合无效';
  }
  if (!request.internalInsemination) return '未发生体内授精';
  if (gestating.妊娠.状态 !== '未妊娠' && gestating.妊娠.状态 !== '已结算') {
    return '妊娠候选当前不可再次受孕';
  }
  if (!request.healthEvidence || !request.ageEvidence) return '缺少健康与年龄证据';
  return '';
}

function conceptionProbability(gestating, request) {
  let probability = 20;
  const phase = gestating.自然周期?.当前阶段;
  if (phase === '活跃期') probability += 25;
  if (phase === '恢复期') probability += 5;
  if (request.healthEvidence) probability += 5;
  for (const measure of request.contraception || []) {
    if (typeof measure === 'number') probability -= measure;
    else probability -= 20;
  }
  for (const modifier of request.worldModifiers || []) {
    if (typeof modifier === 'number') probability += modifier;
    else if (modifier && Number.isFinite(modifier.value)) probability += modifier.value;
  }
  return clamp(Math.round(probability), 0, 95);
}

export function submitConception(root, request, random = Math.random) {
  const existing = root.生殖系统.结算账本.find(entry => entry.事件ID === request.eventId);
  if (existing) return { ...clone(existing), duplicate: true };

  const requestRecord = {
    事件ID: String(request.eventId || ''),
    日期: request.date || '',
    参与者ID: clone(request.participantIds || []),
    妊娠候选ID: request.gestatingId || '',
    授精候选ID: request.inseminatingId || '',
  };
  root.生殖系统.请求账本.push(requestRecord);

  const reason = conceptionValidation(root, request);
  if (reason) {
    const rejected = { 事件ID: requestRecord.事件ID, status: '已拒绝', reason, roll: null, probability: 0 };
    root.生殖系统.结算账本.push(rejected);
    return clone(rejected);
  }

  const gestating = root.角色档案[request.gestatingId];
  const config = requireSpecies(gestating);
  const probability = conceptionProbability(gestating, request);
  const roll = Math.floor(random() * 100) + 1;
  const success = roll <= probability;
  const result = {
    事件ID: request.eventId,
    status: success ? '受孕成功' : '未受孕',
    reason: '',
    roll,
    probability,
    参数快照: {
      classificationId: gestating.生物大类,
      system: gestating.生物体系,
      species: gestating.具体种族,
      cyclePhase: gestating.自然周期?.当前阶段 || '',
      birthMode: config.birthMode,
      gestationDays: [...config.gestationDays],
      offspringCount: [...config.offspringCount],
      worldModifiers: clone(request.worldModifiers || []),
      contraception: clone(request.contraception || []),
    },
  };

  if (success) {
    const start = parseWorldDate(request.date, root.世界状态.当前世界);
    const duration = randomInt(config.gestationDays, random);
    const count = randomInt(config.offspringCount, random);
    gestating.妊娠 = {
      状态: '妊娠中',
      受孕事件ID: request.eventId,
      授精方ID: request.inseminatingId,
      开始日期: request.date,
      预计分娩日期: formatWorldDate(start.epochDay + duration, root.世界状态.当前世界),
      剩余天数: duration,
      生育方式: config.birthMode,
      预计数量: count,
      待结算: false,
      参数快照: clone(result.参数快照),
    };
  }
  root.生殖系统.结算账本.push(result);
  return clone(result);
}

function childSex(random) {
  const roll = random() * 100;
  if (roll < 49) return '雄性';
  if (roll < 98) return '雌性';
  if (roll < 98.67) return '双性';
  if (roll < 99.34) return '无性';
  return '可变';
}

function inheritedTraits(mother, father, random) {
  const candidates = [...new Set([
    ...(mother.可遗传特征 || []),
    ...(father.可遗传特征 || []),
  ])];
  const selected = candidates.filter(() => random() < 0.5);
  return selected.length ? selected : candidates.slice(0, 1);
}

export function settleBirth(root, gestatingId, random = Math.random) {
  const profile = root.角色档案[gestatingId];
  if (!profile) throw new Error('妊娠方档案不存在');
  const pregnancy = profile.妊娠;
  if (!pregnancy?.受孕事件ID) throw new Error('没有可结算的妊娠');
  const birthEventId = `birth:${pregnancy.受孕事件ID}`;
  const existing = root.生殖系统.生育记录.find(entry => entry.事件ID === birthEventId);
  if (existing) return { ...clone(existing), duplicate: true };
  if (pregnancy.状态 !== '待分娩') throw new Error('尚未达到分娩日期');

  const father = root.角色档案[pregnancy.授精方ID];
  if (!father) throw new Error('授精方档案不存在');
  const count = Math.max(1, Number(pregnancy.预计数量) || 1);
  const children = Array.from({ length: count }, (_, index) => ({
    后代ID: `${pregnancy.受孕事件ID}-child-${index + 1}`,
    出生日期: pregnancy.预计分娩日期,
    妊娠方ID: gestatingId,
    授精方ID: pregnancy.授精方ID,
    基础种族: profile.具体种族,
    生物体系: profile.生物体系,
    生理性别: childSex(random),
    遗传特征: inheritedTraits(profile, father, random),
    出生方式: pregnancy.生育方式,
    血统: profile.具体种族 === father.具体种族 ? '纯血' : '混血',
    个体备注: {},
  }));
  const record = {
    事件ID: birthEventId,
    受孕事件ID: pregnancy.受孕事件ID,
    妊娠方ID: gestatingId,
    children,
    参数快照: clone(pregnancy.参数快照),
  };
  root.生殖系统.生育记录.push(record);
  profile.后代记录.push(...children);
  profile.妊娠.状态 = '已结算';
  profile.妊娠.待结算 = false;
  root.生殖系统.待生育事件 = root.生殖系统.待生育事件.filter(id => id !== gestatingId);
  return clone(record);
}

const evidenceList = event => Array.isArray(event?.evidence)
  ? [...new Set(event.evidence.map(String).map(x => x.trim()).filter(Boolean))]
  : [];
const rejection = (reason, state) => ({ accepted: false, changed: false, reason, state });
const acceptance = state => ({ accepted: true, changed: true, reason: '', state });

export function advanceVielsaenState(root, event = {}) {
  const state = root?.世界状态?.维尔萨恩;
  if (!state) throw new Error('缺少维尔萨恩状态');
  if (root.世界状态.当前世界 !== 'vielsaen') return rejection('当前世界不是维尔萨恩', state);

  const evidence = evidenceList(event);
  if (evidence.length === 0) return rejection('缺少剧情证据', state);

  switch (event.type) {
    case 'condenseDemonKing':
      if (state.魔王.状态 !== '未凝聚') return rejection('魔王之力已经凝聚', state);
      state.魔王.状态 = '已凝聚';
      state.魔王.证据.push(...evidence);
      return acceptance(state);
    case 'publishDemonKing':
      if (state.魔王.状态 !== '已凝聚') return rejection('魔王尚未凝聚，不能公开', state);
      state.魔王.是否公开 = true;
      state.魔王.证据.push(...evidence);
      return acceptance(state);
    case 'setHeroCandidate':
      if (!event.characterId || !root.角色档案[event.characterId]) return rejection('勇者候选档案不存在', state);
      if (state.勇者.状态 === '已确认') return rejection('勇者已经确认', state);
      state.勇者.状态 = '候选';
      state.勇者.候选ID = event.characterId;
      state.勇者.证据.push(...evidence);
      return acceptance(state);
    case 'confirmHero':
      if (!event.characterId || state.勇者.候选ID !== event.characterId) return rejection('角色不是已登记候选', state);
      state.勇者.状态 = '已确认';
      state.勇者.确认ID = event.characterId;
      state.勇者.证据.push(...evidence);
      return acceptance(state);
    case 'updateSanctuary':
      if (!event.status) return rejection('缺少圣地状态', state);
      state.圣地.状态 = String(event.status);
      state.圣地.证据.push(...evidence);
      return acceptance(state);
    case 'startWindow': {
      parseWorldDate(event.date, 'vielsaen');
      if (!state.魔王.是否公开 || state.勇者.状态 !== '已确认') {
        return rejection('魔王与勇者状态未满足空窗期起点', state);
      }
      state.五个月空窗期 = {
        状态: '进行中',
        开始日期: event.date,
        已过天数: 0,
        总天数: 150,
        证据: evidence,
      };
      return acceptance(state);
    }
    case 'advanceWindow': {
      const windowState = state.五个月空窗期;
      if (windowState.状态 !== '进行中') return rejection('五个月空窗期尚未开始', state);
      const start = parseWorldDate(windowState.开始日期, 'vielsaen');
      const current = parseWorldDate(event.date, 'vielsaen');
      if (current.epochDay < start.epochDay) return rejection('日期倒退', state);
      windowState.已过天数 = Math.min(windowState.总天数, current.epochDay - start.epochDay);
      if (windowState.已过天数 >= windowState.总天数) windowState.状态 = '已结束';
      windowState.证据 = [...new Set([...(windowState.证据 || []), ...evidence])];
      return acceptance(state);
    }
    case 'setManaExhaustion':
      if (!event.characterId || !root.角色档案[event.characterId]) return rejection('角色档案不存在', state);
      state.魔力枯竭[event.characterId] = {
        状态: String(event.status || '枯竭'),
        证据: evidence,
      };
      root.角色档案[event.characterId].魔力档案.枯竭状态 = String(event.status || '枯竭');
      return acceptance(state);
    default:
      return rejection(`未知维尔萨恩事件: ${event.type || ''}`, state);
  }
}

export function registerModernAbility(profile, request = {}, random = Math.random) {
  if (!profile) return rejection('角色档案不存在', {});
  if (profile.生物体系 === '神话') return rejection('神话生物不会觉醒异能', profile.异能档案);
  const evidence = evidenceList(request);
  if (evidence.length === 0) return rejection('缺少觉醒与检测证据', profile.异能档案);

  const typeIndex = Math.min(
    MODERN_CONFIG.abilityTypes.length - 1,
    Math.floor(random() * MODERN_CONFIG.abilityTypes.length),
  );
  const gradeIndex = Math.min(
    MODERN_CONFIG.abilityGrades.length - 1,
    Math.floor(random() * MODERN_CONFIG.abilityGrades.length),
  );
  const ability = {
    type: MODERN_CONFIG.abilityTypes[typeIndex],
    grade: MODERN_CONFIG.abilityGrades[gradeIndex],
    name: String(request.name || `${MODERN_CONFIG.abilityTypes[typeIndex]}个体表现`),
    evidence,
  };
  profile.异能档案 = {
    登记状态: '已登记',
    异能类别: ability.type,
    异能等级: ability.grade,
    异能名称: ability.name,
    觉醒证据: evidence,
  };
  return { accepted: true, changed: true, reason: '', ability };
}

function hasRequiredEvidence(actual, required) {
  const present = new Set(actual);
  return required.every(item => present.has(item));
}

export function advanceModernState(root, event = {}) {
  const state = root?.世界状态?.现代都市;
  if (!state) throw new Error('缺少现代都市状态');
  if (root.世界状态.当前世界 !== 'modern') return rejection('当前世界不是现代都市', state);

  const evidence = evidenceList(event);
  if (evidence.length === 0) return rejection('缺少剧情证据', state);

  if (event.type === 'advancePlot') {
    const current = state.主线.阶段;
    if (event.targetStage !== current + 1 || event.targetStage > 7) {
      return rejection('现代都市主线只能顺序推进一级', state);
    }
    const gate = MODERN_CONFIG.plotStages[current];
    if (!hasRequiredEvidence(evidence, gate.requiredEvidence)) {
      return rejection(`缺少阶段${current}推进证据`, state);
    }
    state.主线.历史.push({ 从: current, 到: event.targetStage, 证据: evidence });
    state.主线.阶段 = event.targetStage;
    state.主线.证据 = [...new Set([...state.主线.证据, ...evidence])];
    if (event.targetStage >= 5) {
      state.魔物王入侵 = { 状态: '进行中', 证据: evidence };
    }
    if (event.targetStage === 7) {
      state.魔物王入侵 = { 状态: '最终行动', 证据: evidence };
    }
    return acceptance(state);
  }

  if (event.type === 'updateRift') {
    if (!event.nodeId || !event.status) return rejection('裂隙节点或状态缺失', state);
    state.裂隙[event.nodeId] = { 状态: String(event.status), 证据: evidence };
    return acceptance(state);
  }

  if (event.type === 'updateMonsterActivity') {
    if (!event.nodeId || !event.status) return rejection('魔物活动节点或状态缺失', state);
    state.异界魔物活动[event.nodeId] = { 状态: String(event.status), 证据: evidence };
    return acceptance(state);
  }

  return rejection(`未知现代都市事件: ${event.type || ''}`, state);
}

export function validateAdultTrigger(profiles, participantIds, context = {}) {
  if (!Array.isArray(participantIds) || participantIds.length === 0) {
    return { accepted: false, reason: '参与者为空' };
  }
  const participants = participantIds.map(id => profiles?.[id]);
  if (participants.some(profile => !profile)) return { accepted: false, reason: '参与者档案不存在' };
  if (participants.some(profile => profile.是否成年 !== true)) return { accepted: false, reason: '参与者存在未成年人' };
  if (context.capacity !== true) return { accepted: false, reason: '缺少行为能力确认' };
  if (context.consent !== true) return { accepted: false, reason: '缺少有效同意' };
  return { accepted: true, reason: '' };
}

const escapeHtml = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

export function renderPhysiologySummary(profile) {
  if (!profile) return '';
  const cycle = profile.自然周期 || {};
  const pregnancy = profile.妊娠 || {};
  const activePregnancy = ['妊娠中', '待分娩'].includes(pregnancy.状态);
  const summary = [
    profile.是否成年 ? '成年' : '未成年',
    profile.具体种族,
    profile.生物体系,
    profile.生殖能力,
  ].filter(Boolean).map(escapeHtml).join(' · ');

  if (!cycle.当前阶段 && !activePregnancy) {
    return `<details class="dnf-physiology"><summary>生理状态 · ${summary}</summary></details>`;
  }
  const rows = [
    ['是否成年', profile.是否成年 ? '是' : '否'],
    ['具体种族', profile.具体种族],
    ['生物体系', profile.生物体系],
    ['生殖能力', profile.生殖能力],
    ['当前自然周期阶段', cycle.当前阶段 || '未启用'],
    ['抑制或调节状态', cycle.抑制状态 || '无'],
  ];
  if (activePregnancy) {
    rows.push(
      ['是否妊娠', pregnancy.状态],
      ['妊娠开始日期', pregnancy.开始日期],
      ['预计分娩日期', pregnancy.预计分娩日期],
      ['剩余怀孕时间', `${pregnancy.剩余天数}天`],
      ['预计数量', `${pregnancy.预计数量}${pregnancy.生育方式 === '卵生' ? '枚' : '名'}`],
    );
  }
  return `<details class="dnf-physiology" open><summary>生理状态 · ${summary}</summary>${rows
    .map(([label, value]) => `<div><span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b></div>`)
    .join('')}</details>`;
}

export const DNFFiveWorld = Object.freeze({
  WORLD_REGISTRY,
  NORMAL_SPECIES,
  MYTHIC_SPECIES,
  VIELSAEN_CONFIG,
  MODERN_CONFIG,
  REPLACEMENT_BONDS,
  createPhysiologyProfile,
  createRootState,
  parseWorldDate,
  advanceState,
  submitConception,
  settleBirth,
  advanceVielsaenState,
  registerModernAbility,
  advanceModernState,
  validateAdultTrigger,
  renderPhysiologySummary,
});

if (typeof globalThis !== 'undefined') globalThis.DNFFiveWorld = DNFFiveWorld;
