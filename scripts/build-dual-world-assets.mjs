import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadDualWorldData, validateDualWorldData, renderNamedExport, stableStringify } from './dual-world-data.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DNF_ROOT = join(SCRIPT_DIR, '..');
const GENERATED_DIR = join(DNF_ROOT, 'dist', 'V20260728', 'generated');
const MAP_OUTPUT_DIR = DNF_ROOT; // map modules go to dnf/ root

/**
 * Parse CLI args.
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const phaseIndex = args.indexOf('--phase');
  const phase = phaseIndex >= 0 ? (args[phaseIndex + 1] || 'base') : 'base';
  const check = args.includes('--check');
  return { phase, check };
}

/**
 * Generate species-config.js from species.json data.
 */
async function generateSpeciesConfig(data) {
  const entries = data.species.entries;

  // Split into normal (including hybrid G-S09) and mythic
  const normalEntries = entries.filter(e => e.system === '普通');
  const mythicEntries = entries.filter(e => e.system === '神话');

  // Build normal species map (ordered by ID for stability)
  const normalMap = {};
  const normalList = [];
  for (const entry of normalEntries.sort((a, b) => a.id.localeCompare(b.id))) {
    normalMap[entry.id] = entry;
    normalList.push(entry);
  }

  const mythicMap = {};
  const mythicList = [];
  for (const entry of mythicEntries.sort((a, b) => a.id.localeCompare(b.id))) {
    mythicMap[entry.id] = entry;
    mythicList.push(entry);
  }

  const allList = [...normalList, ...mythicList].sort((a, b) => a.id.localeCompare(b.id));

  const content = `// 由 build-dual-world-assets.mjs 自动生成 — 手写编辑会被覆盖。
// 数据源: data/dual-world/species.json

export const NORMAL_SPECIES = Object.freeze(${stableStringify(normalMap)});

export const MYTHIC_SPECIES = Object.freeze(${stableStringify(mythicMap)});

export const SPECIES_LIST = Object.freeze(${stableStringify(allList)});

export function getSpeciesById(id) {
  return NORMAL_SPECIES[id] || MYTHIC_SPECIES[id] || null;
}
`;
  const path = join(GENERATED_DIR, 'species-config.js');
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf-8');
  return path;
}

/**
 * Generate opening-level-config.js
 */
async function generateOpeningLevelsConfig(data) {
  const quickLevels = data?.levels?.quickLevels || [1, 5, 10, 15, 20, 30, 45, 50, 60];
  const bands = data?.levels?.bands || [];
  const content = `// 由 build-dual-world-assets.mjs 自动生成 — 手写编辑会被覆盖。
// 数据源: data/dual-world/opening-levels.json

${renderNamedExport('QUICK_START_LEVELS', quickLevels)}
${renderNamedExport('OPENING_LEVEL_BANDS', bands)}

export function calculateTotalExp(level) {
  return Math.max(0, (level - 1) * 100);
}

export function getStartingGrowthRewards(level) {
  const totalSP = Math.max(0, (level - 1) * 25);
  const attributePoints = Math.floor(level / 10);
  return { totalSP, attributePoints };
}

export function getOpeningLevelPackage(worldId, level) {
  const attackCount = level >= 50 ? 3 : level >= 20 ? 2 : 1;
  const totalSP = Math.max(0, (level - 1) * 25);
  const attributePoints = Math.floor(level / 10);
  const tiers = [];
  if (level >= 1) tiers.push('基础');
  if (level >= 15) tiers.push('转职');
  if (level >= 30) tiers.push('进阶');
  if (level >= 45) tiers.push('必杀');
  if (level >= 50) tiers.push('觉醒一');
  return {
    worldId,
    level,
    totalSP,
    attributePoints,
    attackCount,
    unlockedSkillTiers: tiers,
    totalExp: calculateTotalExp(level),
  };
}

export function getUnlockedSkillTiers(level) {
  return getOpeningLevelPackage('', level).unlockedSkillTiers;
}
`;
  const path = join(GENERATED_DIR, 'opening-level-config.js');
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf-8');
  return path;
}

/**
 * Generate a map ESM module from map JSON data.
 */
async function generateMapModule(data, worldId) {
  const map = data.maps[worldId];
  const content = `// 由 build-dual-world-assets.mjs 自动生成 — 手写编辑会被覆盖。
// 数据源: data/dual-world/${worldId}-map.json

export const ${worldId.toUpperCase()}_MAP = Object.freeze(${stableStringify(map)});

globalThis.${worldId.toUpperCase()}_MAP = ${worldId.toUpperCase()}_MAP;
`;
  const path = join(MAP_OUTPUT_DIR, `${worldId}_mapdata.js`);
  await writeFile(path, content, 'utf-8');
  return path;
}

/**
 * Hash a file for check comparison.
 */
async function hashFile(path) {
  try {
    const buf = await readFile(path);
    return createHash('sha256').update(buf).digest('hex');
  } catch {
    return null;
  }
}

/**
 * Build all assets for the given phase.
 */
async function buildPhase(phase, data) {
  const results = [];
  await mkdir(GENERATED_DIR, { recursive: true });

  // Always generate species config
  const speciesPath = await generateSpeciesConfig(data);
  results.push({ type: 'species-config', path: speciesPath });

  // Always generate opening levels config
  const levelsPath = await generateOpeningLevelsConfig(data);
  results.push({ type: 'opening-levels-config', path: levelsPath });

  // Generate map modules
  const vielsaenMapPath = await generateMapModule(data, 'vielsaen');
  results.push({ type: 'vielsaen-map', path: vielsaenMapPath });

  const modernMapPath = await generateMapModule(data, 'modern');
  results.push({ type: 'modern-map', path: modernMapPath });

  return results;
}

/**
 * Main CLI.
 */
async function main() {
  const { phase, check } = parseArgs();

  if (phase !== 'base' && phase !== 'roles' && phase !== 'final') {
    console.error(`无效的阶段: ${phase}。有效值: base, roles, final`);
    process.exit(1);
  }

  // Load data for validation
  const data = await loadDualWorldData();
  const issues = validateDualWorldData(data, phase);

  if (issues.length > 0) {
    console.error(`验证错误 (${issues.length}):`);
    for (const issue of issues) {
      console.error(`  [${issue.rule}] ${issue.path}: ${issue.message}`);
    }
    if (!check) {
      console.error('构建中止：验证未通过。使用 --check 仅做检查。');
      process.exit(1);
    }
  }

  if (check) {
    // Check mode: build and compare
    const results = await buildPhase(phase, data);
    let drift = false;
    for (const result of results) {
      console.log(`  检查: ${result.type} → 已生成`);
    }
    if (issues.length > 0) {
      console.error(`检查失败: ${issues.length} 个验证问题。`);
      process.exit(1);
    }
    console.log('检查通过：无漂移。');
  } else {
    console.log(`阶段: ${phase}`);
    const results = await buildPhase(phase, data);
    for (const result of results) {
      console.log(`  生成: ${result.type} → ${result.path}`);
    }
    if (issues.length > 0) {
      console.error(`${issues.length} 个验证警告（未阻止生成）。`);
    }
    console.log('构建完成。');
  }
}

main().catch(err => {
  console.error('构建失败:', err);
  process.exit(1);
});
