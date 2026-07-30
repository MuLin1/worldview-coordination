import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DNF_ROOT = join(SCRIPT_DIR, '..');
const DATA_DIR = join(DNF_ROOT, 'data', 'dual-world');
const GENERATED_DIR = join(DNF_ROOT, 'dist', 'V20260728', 'generated');
const WORLD_ROOT = join(DNF_ROOT, '..', '世界书');
const OUTPUT_DIR = join(WORLD_ROOT, '10_DNF双世界高密度扩充');

/** @typedef {{ key: string, label: string, count: number }} CategoryCount */

/**
 * Load a JSON file and return parsed data.
 * @param {string} path
 * @returns {Promise<any>}
 */
export async function loadJson(path) {
  const text = await readFile(path, 'utf-8');
  return JSON.parse(text);
}

/**
 * Load all dual-world data files.
 * @param {string} [rootUrl] - optional path override for data directory
 * @returns {Promise<DualWorldData>}
 */
export async function loadDualWorldData(rootUrl) {
  const dataDir = rootUrl || DATA_DIR;
  const [species, vielsaenMap, modernMap, levels, vielsaenRoles, modernRoles, approvals] = await Promise.all([
    loadJson(join(dataDir, 'species.json')),
    loadJson(join(dataDir, 'vielsaen-map.json')),
    loadJson(join(dataDir, 'modern-map.json')),
    loadJson(join(dataDir, 'opening-levels.json')),
    loadJson(join(dataDir, 'companions-vielsaen.roles.json')),
    loadJson(join(dataDir, 'companions-modern.roles.json')),
    loadJson(join(dataDir, 'companion-species-approval.json')),
  ]);
  return {
    species,
    maps: { vielsaen: vielsaenMap, modern: modernMap },
    levels,
    roles: { vielsaen: vielsaenRoles, modern: modernRoles },
    approvals,
  };
}

/**
 * Stable JSON stringify with sorted keys.
 * @param {any} value
 * @returns {string}
 */
export function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(v => stableStringify(v)).join(',') + ']';
  }
  const keys = Object.keys(value).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(value[k])).join(',') + '}';
}

/**
 * Render a named ESM export.
 * @param {string} exportName
 * @param {any} value
 * @returns {string}
 */
export function renderNamedExport(exportName, value) {
  return `export const ${exportName} = Object.freeze(${stableStringify(value)});\n`;
}

/**
 * Create a validation issue.
 * @param {string} path
 * @param {string} rule
 * @param {string} message
 * @returns {ValidationIssue}
 */
export function issue(path, rule, message = '') {
  return { path, rule, message: message || rule };
}

/**
 * Validate dual-world data for a given phase.
 * @param {DualWorldData} data
 * @param {'base'|'roles'|'final'} phase
 * @returns {ValidationIssue[]}
 */
export function validateDualWorldData(data, phase = 'base') {
  const issues = [];

  // Base validations - always run
  if (!data.maps?.vielsaen || data.maps.vielsaen.worldId !== 'vielsaen') {
    issues.push(issue('maps.vielsaen.worldId', 'vielsaen_world_id', '维尔萨恩地图 worldId 必须为 vielsaen'));
  }
  if (!data.maps?.modern || data.maps.modern.worldId !== 'modern') {
    issues.push(issue('maps.modern.worldId', 'modern_world_id', '现代都市地图 worldId 必须为 modern'));
  }
  if (!Array.isArray(data.species?.entries)) {
    issues.push(issue('species.entries', 'species_entries_array', '种族条目必须是数组'));
  }
  if (!Array.isArray(data.levels?.quickLevels)) {
    issues.push(issue('levels.quickLevels', 'quick_levels_array', '快速等级必须是数组'));
  }
  if (!Array.isArray(data.roles?.vielsaen)) {
    issues.push(issue('roles.vielsaen', 'vielsaen_roles_array', '维尔萨恩角色必须是数组'));
  }
  if (!Array.isArray(data.roles?.modern)) {
    issues.push(issue('roles.modern', 'modern_roles_array', '现代都市角色必须是数组'));
  }

  // Phase-specific validations
  if (phase === 'roles') {
    issues.push(...validateRoleGate(data.roles));
  }
  if (phase === 'final') {
    issues.push(...validateFinalCompanions(data));
  }

  return issues;
}

/**
 * Validate role gate data (Gate A - species-neutral).
 * @param {object} roles
 * @returns {ValidationIssue[]}
 */
function validateRoleGate(roles) {
  const issues = [];
  const forbiddenFields = ['species', 'race', 'classificationId', 'physiology', 'heritableTraits',
    '种族', '生理档案', '可遗传特征'];

  function walk(obj, path = '') {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      const fullPath = path ? `${path}.${key}` : key;
      if (forbiddenFields.includes(key)) {
        issues.push(issue(fullPath, 'forbidden_species_field', `Gate A 阶段禁止使用字段: ${key}`));
        continue;
      }
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        walk(obj[key], fullPath);
      }
    }
  }

  for (const worldId of ['vielsaen', 'modern']) {
    const list = roles[worldId];
    if (!Array.isArray(list)) continue;
    for (let i = 0; i < list.length; i++) {
      walk(list[i], `${worldId}[${i}]`);
    }
    if (list.length !== 12 && list.length !== 0) {
      issues.push(issue(`roles.${worldId}.length`, 'role_count', `${worldId} 必须有 12 个角色，当前为 ${list.length}`));
    }
  }
  return issues;
}

/**
 * Validate final companions (Gate B approved).
 * @param {DualWorldData} data
 * @returns {ValidationIssue[]}
 */
function validateFinalCompanions(data) {
  const issues = [];
  const validSexes = new Set(['雌性', '雄性', '双性', '无性', '可变']);
  const validCapabilities = new Set(['可妊娠', '可授精', '双向', '无']);
  const choices = data.approvals?.choices;
  if (!Array.isArray(choices)) {
    issues.push(issue('approvals.choices', 'approval_choices_array', '同伴审批条目必须是数组'));
    return issues;
  }

  const allRoles = [...(data.roles?.vielsaen || []), ...(data.roles?.modern || [])];
  const roleIds = new Set(allRoles.map(role => role.id));
  const choiceByRole = new Map();
  for (const [index, choice] of choices.entries()) {
    const path = `approvals.choices[${index}]`;
    if (!roleIds.has(choice.roleId)) {
      issues.push(issue(`${path}.roleId`, 'unknown_approved_role', `审批角色不存在: ${choice.roleId}`));
    }
    if (choiceByRole.has(choice.roleId)) {
      issues.push(issue(`${path}.roleId`, 'duplicate_approved_role', `审批角色重复: ${choice.roleId}`));
    }
    choiceByRole.set(choice.roleId, choice);
    if (!validSexes.has(choice.sex)) {
      issues.push(issue(`${path}.sex`, 'invalid_companion_sex', `生理性别无效: ${choice.sex}`));
    }
    if (!validCapabilities.has(choice.capability)) {
      issues.push(issue(`${path}.capability`, 'invalid_companion_capability', `生殖能力无效: ${choice.capability}`));
    }
  }

  for (const role of allRoles) {
    if (!choiceByRole.has(role.id)) {
      issues.push(issue(`approvals.${role.id}`, 'missing_companion_approval', `缺少角色审批: ${role.id}`));
    }
  }
  return issues;
}

/**
 * Analyze a graph and return a report.
 * @param {object} map - the map data with nodes and edges
 * @returns {GraphReport}
 */
export function analyzeGraph(map) {
  const nodeIds = new Set(map.nodes.map(n => n.id));
  const report = {
    isolatedNodeIds: [],
    unknownEdgeNodeIds: [],
    cycleCount: 0,
    stateControlledEdgeIds: [],
    alternativeIntercontinentalRouteCount: 0,
    externalRouteCountByRegion: [],
  };

  // Find unknown edge endpoints
  const nodeDegree = new Map();
  for (const node of map.nodes) {
    nodeDegree.set(node.id, { in: 0, out: 0 });
  }
  for (const edge of map.edges) {
    if (!nodeIds.has(edge.from)) {
      report.unknownEdgeNodeIds.push(edge.from);
    }
    if (!nodeIds.has(edge.to)) {
      report.unknownEdgeNodeIds.push(edge.to);
    }
    if (nodeIds.has(edge.from) && nodeIds.has(edge.to)) {
      const fromDeg = nodeDegree.get(edge.from);
      if (fromDeg) fromDeg.out += 1;
      const toDeg = nodeDegree.get(edge.to);
      if (toDeg) toDeg.in += 1;
      if (edge.bidirectional && edge.from !== edge.to) {
        fromDeg.in += 1;
        toDeg.out += 1;
      }
    }
    if (edge.stateKey) {
      report.stateControlledEdgeIds.push(edge.id || `${edge.from}-${edge.to}`);
    }
  }

  // Find isolated nodes
  for (const [nodeId, deg] of nodeDegree) {
    if (deg.in === 0 && deg.out === 0) {
      report.isolatedNodeIds.push(nodeId);
    }
  }

  // Count cycles using DFS on each connected component
  if (nodeIds.size > 0 && report.isolatedNodeIds.length === 0 && report.unknownEdgeNodeIds.length === 0) {
    const adj = new Map();
    for (const nodeId of nodeIds) {
      adj.set(nodeId, []);
    }
    for (const edge of map.edges) {
      adj.get(edge.from)?.push(edge.to);
      if (edge.bidirectional) {
        adj.get(edge.to)?.push(edge.from);
      }
    }
    const visited = new Set();
    const stack = new Set();
    let cycles = 0;
    function dfs(node) {
      visited.add(node);
      stack.add(node);
      for (const neighbor of (adj.get(node) || [])) {
        if (!visited.has(neighbor)) {
          dfs(neighbor);
        } else if (stack.has(neighbor)) {
          cycles++;
        }
      }
      stack.delete(node);
    }
    for (const nodeId of nodeIds) {
      if (!visited.has(nodeId)) {
        dfs(nodeId);
      }
    }
    report.cycleCount = cycles;
  }

  // Calculate external routes by region
  if (map.regions && map.regions.length > 0) {
    const regionNodes = new Map();
    for (const node of map.nodes) {
      if (node.regionId) {
        if (!regionNodes.has(node.regionId)) regionNodes.set(node.regionId, new Set());
        regionNodes.get(node.regionId).add(node.id);
      }
    }
    report.externalRouteCountByRegion = [];
    for (const [regionId, nodes] of regionNodes) {
      let externalCount = 0;
      for (const edge of map.edges) {
        const fromRegion = map.nodes.find(n => n.id === edge.from)?.regionId;
        const toRegion = map.nodes.find(n => n.id === edge.to)?.regionId;
        if (nodes.has(edge.from) && toRegion && toRegion !== regionId) externalCount++;
        if (nodes.has(edge.to) && fromRegion && fromRegion !== regionId) externalCount++;
        if (edge.bidirectional) {
          if (nodes.has(edge.to) && fromRegion && fromRegion !== regionId && !nodes.has(edge.from)) externalCount++;
        }
      }
      report.externalRouteCountByRegion.push({ region: regionId, count: externalCount });
    }
  }

  // Count alternative intercontinental routes
  // Look for multiple distinct paths between continents/regions
  if (map.layers && map.layers.length > 1) {
    report.alternativeIntercontinentalRouteCount = map.edges.filter(e =>
      e.layerId && e.alternativeRouteIds && e.alternativeRouteIds.length > 0
    ).length;
  } else if (map.regions && map.regions.length >= 7) {
    // Modern map: count cross-region connections as intercontinental
    const interEdges = map.edges.filter(e => {
      const fromNode = map.nodes.find(n => n.id === e.from);
      const toNode = map.nodes.find(n => n.id === e.to);
      return fromNode?.regionId && toNode?.regionId && fromNode.regionId !== toNode.regionId;
    });
    report.alternativeIntercontinentalRouteCount = interEdges.length >= 3 ? interEdges.length : 0;
  }

  return report;
}

/** @typedef {{ schemaVersion: number }} SpeciesData */
/** @typedef {{ worldId: string, title?: string, layers: any[], regions: any[], nodes: any[], edges: any[] }} MapData */
/** @typedef {{ schemaVersion: number, quickLevels: number[], bands: any[] }} LevelsData */
/** @typedef {{ species: SpeciesData, maps: {vielsaen: MapData, modern: MapData}, levels: LevelsData, roles: {vielsaen: any[], modern: any[]}, approvals: {choices: any[]} }} DualWorldData */
/** @typedef {{ path: string, rule: string, message: string }} ValidationIssue */
/** @typedef {{ isolatedNodeIds: string[], unknownEdgeNodeIds: string[], cycleCount: number, stateControlledEdgeIds: string[], externalRouteCountByRegion: {region:string, count:number}[], alternativeIntercontinentalRouteCount: number }} GraphReport */
