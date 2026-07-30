import { WORLD_REGISTRY } from './five-world-config.js';
import { createRootState, advanceState, normalizePhysiologyProfile } from './five-world-runtime.js';

const LABEL_TO_ID = Object.freeze(Object.fromEntries(
  Object.entries(WORLD_REGISTRY).map(([id, world]) => [world.label, id]),
));

function mergeMissing(target, defaults) {
  for (const [key, value] of Object.entries(defaults)) {
    if (target[key] === undefined) {
      target[key] = typeof structuredClone === 'function'
        ? structuredClone(value)
        : JSON.parse(JSON.stringify(value));
    } else if (
      value
      && target[key]
      && typeof value === 'object'
      && typeof target[key] === 'object'
      && !Array.isArray(value)
      && !Array.isArray(target[key])
    ) {
      mergeMissing(target[key], value);
    }
  }
  return target;
}

function resolveInitialWorldId(statData, requestedWorldId) {
  if (requestedWorldId) {
    if (!WORLD_REGISTRY[requestedWorldId]) throw new Error(`未知世界ID: ${requestedWorldId}`);
    return requestedWorldId;
  }
  const current = statData?.世界状态?.当前世界;
  if (WORLD_REGISTRY[current]) return current;
  const label = statData?.系统配置?.世界观;
  return LABEL_TO_ID[label] || 'corridor';
}

function linkExplicitProfiles(statData) {
  if (!statData.角色档案 || typeof statData.角色档案 !== 'object') statData.角色档案 = {};
  if (statData.人物?.生理档案) statData.角色档案.player = statData.人物.生理档案;
  for (const [name, bond] of Object.entries(statData.羁绊列表 || {})) {
    if (bond?.生理档案) statData.角色档案[`bond:${name}`] = bond.生理档案;
  }
}

export function ensureFiveWorldState(statData, requestedWorldId) {
  if (!statData || typeof statData !== 'object') throw new Error('MVU stat_data 无效');
  const worldId = resolveInitialWorldId(statData, requestedWorldId);
  const defaults = createRootState({ worldId });
  mergeMissing(statData, defaults);
  statData.世界状态.当前世界 = worldId;
  linkExplicitProfiles(statData);
  for (const profile of Object.values(statData.角色档案 || {})) {
    normalizePhysiologyProfile(profile);
  }
  statData.生殖系统.最后错误 ??= '';
  return statData;
}

export function switchWorld(statData, worldId) {
  if (!WORLD_REGISTRY[worldId]) throw new Error(`未知世界ID: ${worldId}`);
  ensureFiveWorldState(statData);
  statData.世界状态.当前世界 = worldId;
  statData.系统配置 ??= {};
  statData.系统配置.世界观 = WORLD_REGISTRY[worldId].label;
  return statData.世界状态;
}

export function advanceMvuState(statData, dateValue) {
  ensureFiveWorldState(statData);
  try {
    const result = advanceState(statData, dateValue);
    statData.生殖系统.最后错误 = '';
    return { ...result, error: '' };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    statData.生殖系统.最后错误 = message;
    return { changed: false, elapsedDays: 0, error: message };
  }
}

export const DNFFiveWorldMvu = Object.freeze({
  ensureFiveWorldState,
  switchWorld,
  advanceMvuState,
});

if (typeof globalThis !== 'undefined') globalThis.DNFFiveWorldMvu = DNFFiveWorldMvu;
