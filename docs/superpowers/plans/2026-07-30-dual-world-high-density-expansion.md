# Dual-World High-Density Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand only Vielsaen and Modern City with priced species mechanics, dense routed maps, meaningful level 1–60 openings, and twelve staged companion candidates per world.

**Architecture:** Keep authoring data in dependency-free JSON under `dnf/data/dual-world/`. A small Node build script validates that data and generates browser ESM modules; the DNF opening page and maps consume only those generated modules. A versioned Python tool reads the same JSON and produces a separate high-density worldbook under `../世界书/10_DNF双世界高密度扩充/`, leaving existing aggregates recoverable.

**Tech Stack:** Browser ES modules, Vue 3 already embedded by the opening page, native SVG, Node.js built-in test runner, Python 3 standard library, SillyTavern WorldInfo JSON.

**Design Spec:** `docs/specs/2026-07-30-dual-world-high-density-expansion-design.md`

## Global Constraints

- Scope is exactly `vielsaen` and `modern`; do not alter content or behavior for `corridor`, `sao`, or `jiuzhou`.
- Vielsaen remains six polities; player level never grants hero, demon-king, monarch, or noble status automatically.
- Modern level, ability grade, species, and social identity remain independent; modern mythic species cannot awaken abilities.
- Species never determines personality, profession, polity, class, alignment, or ability grade.
- Ordinary species cost 10 RP, hybrid species cost 10 RP, and mythic species cost 20 RP.
- Mythic species are intentional pure upgrades; do not add balancing penalties merely to equal ordinary species.
- `G-S09` is hybrid species; its maternal base and paternal expression may not recursively use `G-S09`.
- Both worlds support every start level from 1 through 60 and quick levels `1, 5, 10, 15, 20, 30, 45, 50, 60`.
- Each world has exactly 12 fixed companion candidates, but the opening still allows at most one selected companion.
- Gate A: companion role, skills, equipment, relations, and personal line must be approved before any species is assigned.
- Gate B: final species choices must be approved before physiology or heritable traits are written.
- Existing six candidates lose their current species assignments and pass through Gates A and B with the other eighteen.
- Preserve all pre-existing user changes. Before touching a dirty file, inspect its diff and patch around it; never replace it wholesale.
- The outer workspace is not a Git repository. Commit only files under `dnf/`; record generated worldbook outputs with hashes.
- Actual SillyTavern import is a separate human verification gate; automated success is not evidence of live import success.

---

## 中文执行摘要

| 任务 | 核心产出 | 阶段门槛 |
|---:|---|---|
| 1 | 冻结当前文件、哈希、测试和未提交修改 | 重叠修改无法安全分离时停止 |
| 2 | 建立单一 JSON 数据源和确定性生成器 | 数据结构与生成结果可重复 |
| 3 | 完成 17 普通种、混血种和 8 神话种机制 | RP、属性和特性检查通过 |
| 4 | 维尔萨恩 64 节点、100–115 条边 | 六国内部环路和跨国路线通过 |
| 5 | 现代都市 48 节点、75–90 条边 | 全球层与城市层均连通 |
| 6 | 共用 SVG 地图、筛选、封锁和三种寻路 | 算法测试与视觉检查通过 |
| 7 | 两个世界 Lv.1–60 与九档开局包 | 经验、SP、技能阶位和资源正确 |
| 8 | 24 名无种族角色的定位、技能和个人线 | **人工门槛 A：用户确认** |
| 9 | 每名角色的兼容种族候选 | **人工门槛 B：用户确认** |
| 10 | 合并最终种族、生理档案和可遗传特征 | 24 名角色全部匹配确认表 |
| 11 | 接入开局页、MVU、等级同步和旧 ID 迁移 | 不覆盖当前未提交修改 |
| 12 | 生成 379 条最终世界书和单条 JSON | 26 条同 UID 重写、136 条新增 |
| 13 | 全量自动化、地图视觉和 SillyTavern 实机验收 | 实机未运行时不得报告实机完成 |

---

## File Map

### Authoritative data

- Create: `data/dual-world/species.json`
- Create: `data/dual-world/vielsaen-map.json`
- Create: `data/dual-world/modern-map.json`
- Create: `data/dual-world/opening-levels.json`
- Create: `data/dual-world/companions-vielsaen.roles.json`
- Create: `data/dual-world/companions-modern.roles.json`
- Create after Gate A: `data/dual-world/companion-species-candidates.json`
- Create after Gate B: `data/dual-world/companion-species-approval.json`

### Build and runtime

- Create: `scripts/capture-high-density-baseline.mjs`
- Create: `scripts/dual-world-data.mjs`
- Create: `scripts/build-dual-world-assets.mjs`
- Create: `dist/V20260728/generated/species-config.js`
- Create: `dist/V20260728/generated/opening-level-config.js`
- Create after Gate B: `dist/V20260728/generated/vielsaen-companions.js`
- Create after Gate B: `dist/V20260728/generated/modern-companions.js`
- Create: `dist/V20260728/world-map-core.js`
- Modify: `dist/V20260728/five-world-config.js`
- Modify: `dist/V20260728/build.html`
- Modify carefully: `dist/V20260728/five-world-runtime.js`
- Modify carefully: `dist/V20260728/five-world-mvu.js`
- Modify carefully: `dist/V20260728/helper-calculator.js`
- Generate: `vielsaen_mapdata.js`
- Generate: `modern_mapdata.js`
- Modify: `vielsaen_map.html`
- Modify: `modern_map.html`

### Worldbook

- Create: `tools/worldbook/high_density_worldbook.py`
- Generate: `../世界书/10_DNF双世界高密度扩充/**`
- Generate: `../世界书/10_DNF双世界高密度扩充/99_汇总与验收/最终世界书/双世界高密度世界书.json`

### Tests

- Create: `tests/high-density-baseline.test.mjs`
- Create: `tests/dual-world-data.test.mjs`
- Create: `tests/high-density-species.test.mjs`
- Create: `tests/high-density-map.test.mjs`
- Create: `tests/world-map-core.test.mjs`
- Create: `tests/opening-levels.test.mjs`
- Create: `tests/companion-role-gate.test.mjs`
- Create after Gate B: `tests/companion-final.test.mjs`
- Create: `tests/high_density_worldbook_test.py`
- Modify carefully: `tests/five-world-config.test.mjs`
- Modify carefully: `tests/mvu-integration.test.mjs`
- Modify: `tests/map-data.test.mjs`
- Modify: `tests/opening_runtime_test.py`
- Modify: `tests/runtime-integration.test.py`

---

### Task 1: Freeze the Current Baseline

**Files:**
- Create: `scripts/capture-high-density-baseline.mjs`
- Create: `tests/high-density-baseline.test.mjs`
- Generate: `../世界书/10_DNF双世界高密度扩充/00_规格与冻结/扩充前基线.json`

**Interfaces:**
- Produces: `captureBaseline({ dnfRoot: URL, workspaceRoot: URL }): Promise<Baseline>`
- Produces: `writeBaseline({ dnfRoot, workspaceRoot, outputPath }): Promise<Baseline>`
- Baseline records SHA-256, byte count, current DNF commit, dirty paths, current map counts, current companion counts, and existing test commands.

- [ ] **Step 1: Write the failing baseline test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { captureBaseline } from '../scripts/capture-high-density-baseline.mjs';

test('baseline records protected sources and current deficiencies', async () => {
  const baseline = await captureBaseline();
  assert.equal(baseline.schemaVersion, 1);
  assert.equal(baseline.maps.vielsaen, 12);
  assert.equal(baseline.maps.modern, 11);
  assert.equal(baseline.companions.vielsaen, 3);
  assert.equal(baseline.companions.modern, 3);
  assert.match(baseline.protectedFiles['世界书/创世回廊5.1.json'].sha256, /^[a-f0-9]{64}$/);
  assert.ok(Array.isArray(baseline.dnfGit.dirtyPaths));
});
```

- [ ] **Step 2: Run the test and verify the module is absent**

Run: `node --test tests/high-density-baseline.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `capture-high-density-baseline.mjs`.

- [ ] **Step 3: Implement baseline capture with Node standard library**

```js
export async function captureBaseline({
  dnfRoot = new URL('../', import.meta.url),
  workspaceRoot = new URL('../../', import.meta.url),
} = {}) {
  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    protectedFiles: await hashProtectedFiles(workspaceRoot),
    dnfGit: await readGitState(dnfRoot),
    maps: { vielsaen: 12, modern: 11 },
    companions: { vielsaen: 3, modern: 3 },
    tests: [
      "node --test tests/*.test.mjs",
      "python3 tests/opening_runtime_test.py",
      "python3 tests/runtime-integration.test.py",
      "python3 -m unittest discover -s ../世界书 -p 'test_*.py'",
    ],
  };
}
```

Use `createHash('sha256')`, `readFile`, `mkdir`, `writeFile`, and `execFile('git', ['status', '--short'])`. Do not modify or clean any dirty file.

- [ ] **Step 4: Generate and inspect the baseline artifact**

Run:

```bash
node scripts/capture-high-density-baseline.mjs
python3 -m json.tool ../世界书/10_DNF双世界高密度扩充/00_规格与冻结/扩充前基线.json
node --test tests/high-density-baseline.test.mjs
```

Expected: JSON parses, the test passes, and dirty paths match `git status --short`.

- [ ] **Step 5: Classify overlap with future edit targets**

Compare `baseline.dnfGit.dirtyPaths` with the files listed as modified in Tasks 3–13. For each overlap, inspect the current diff and record one of:

```text
no_hunk_overlap
feature_can_patch_around
requires_user_resolution
```

If any path is `requires_user_resolution`, stop after committing the baseline tooling and report the file and overlapping hunk. Do not begin Task 2.

- [ ] **Step 6: Commit the versioned baseline tooling**

```bash
git add scripts/capture-high-density-baseline.mjs tests/high-density-baseline.test.mjs
git commit -m "test: capture high-density expansion baseline"
```

---

### Task 2: Establish the JSON Contract and Deterministic Asset Builder

**Files:**
- Create: `scripts/dual-world-data.mjs`
- Create: `scripts/build-dual-world-assets.mjs`
- Create: `tests/dual-world-data.test.mjs`
- Create: `data/dual-world/species.json`
- Create: `data/dual-world/vielsaen-map.json`
- Create: `data/dual-world/modern-map.json`
- Create: `data/dual-world/opening-levels.json`
- Create: `data/dual-world/companions-vielsaen.roles.json`
- Create: `data/dual-world/companions-modern.roles.json`

**Interfaces:**
- Produces: `loadDualWorldData(rootUrl): Promise<DualWorldData>`
- Produces: `validateDualWorldData(data, phase): ValidationIssue[]`
- Produces: `renderNamedExport(exportName, value): string`
- Produces: `analyzeGraph(map): GraphReport`
- Produces CLI: `node scripts/build-dual-world-assets.mjs --phase=base`
- Produces check CLI: `node scripts/build-dual-world-assets.mjs --phase=base --check`
- `phase` is one of `base`, `roles`, or `final`.

- [ ] **Step 1: Write contract tests for minimal parseable files**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  loadDualWorldData,
  validateDualWorldData,
  renderNamedExport,
} from '../scripts/dual-world-data.mjs';

test('dual-world data loads with stable top-level shapes', async () => {
  const data = await loadDualWorldData();
  assert.ok(Array.isArray(data.species.entries));
  assert.equal(data.maps.vielsaen.worldId, 'vielsaen');
  assert.equal(data.maps.modern.worldId, 'modern');
  assert.ok(Array.isArray(data.levels.quickLevels));
  assert.ok(Array.isArray(data.roles.vielsaen));
  assert.ok(Array.isArray(data.roles.modern));
  assert.deepEqual(validateDualWorldData(data, 'base'), []);
});

test('generated modules are deterministic ESM', () => {
  const rendered = renderNamedExport('SAMPLE', { b: 2, a: 1 });
  assert.equal(rendered, 'export const SAMPLE = Object.freeze({\"a\":1,\"b\":2});\\n');
});
```

- [ ] **Step 2: Run the contract tests**

Run: `node --test tests/dual-world-data.test.mjs`

Expected: FAIL because the loader and source JSON files do not exist.

- [ ] **Step 3: Create the six JSON skeletons with real top-level metadata**

```json
{
  "schemaVersion": 1,
  "worldId": "vielsaen",
  "nodes": [],
  "edges": []
}
```

Use the corresponding real `worldId` for each map. Species uses `{"schemaVersion":1,"entries":[]}`; levels uses `{"schemaVersion":1,"quickLevels":[1,5,10,15,20,30,45,50,60],"bands":[]}`; each role file starts as `[]`.

- [ ] **Step 4: Implement sorted serialization and phase validation**

```js
export function renderNamedExport(exportName, value) {
  return `export const ${exportName} = Object.freeze(${stableStringify(value)});\n`;
}

export function validateDualWorldData(data, phase = 'base') {
  const issues = [];
  if (data.maps.vielsaen.worldId !== 'vielsaen') issues.push(issue('vielsaen_world_id'));
  if (data.maps.modern.worldId !== 'modern') issues.push(issue('modern_world_id'));
  if (phase === 'roles') issues.push(...validateRoleGate(data.roles));
  if (phase === 'final') issues.push(...validateFinalCompanions(data));
  return issues;
}
```

Keep validation dependency-free. Every issue is `{path, rule, message}`. The build command exits nonzero when issues exist; `--check` compares generated text without writing.

`analyzeGraph` accepts an empty skeleton and later reports `isolatedNodeIds`, `unknownEdgeNodeIds`, `cycleCount`, `stateControlledEdgeIds`, `externalRouteCountByRegion`, and `alternativeIntercontinentalRouteCount`.

- [ ] **Step 5: Run contract tests and the base build**

Run:

```bash
node --test tests/dual-world-data.test.mjs
node scripts/build-dual-world-assets.mjs --phase=base
node scripts/build-dual-world-assets.mjs --phase=base --check
```

Expected: all commands exit 0 and the second build reports no drift.

- [ ] **Step 6: Commit the contract**

```bash
git add data/dual-world scripts/dual-world-data.mjs scripts/build-dual-world-assets.mjs tests/dual-world-data.test.mjs
git commit -m "feat: add dual-world data contract"
```

---

### Task 3: Author and Compile All Species Mechanics

**Files:**
- Modify: `data/dual-world/species.json`
- Generate: `dist/V20260728/generated/species-config.js`
- Modify: `dist/V20260728/five-world-config.js`
- Create: `tests/high-density-species.test.mjs`
- Modify carefully: `tests/five-world-config.test.mjs`

**Interfaces:**
- Produces: `NORMAL_SPECIES: Readonly<Record<string, SpeciesConfig>>`
- Produces: `MYTHIC_SPECIES: Readonly<Record<string, SpeciesConfig>>`
- Produces: `SPECIES_LIST: readonly SpeciesConfig[]`
- Produces: `getSpeciesById(id): SpeciesConfig | null`
- `SpeciesConfig` includes `id`, `name`, `system`, `rpCost`, `startLevel`, `bonuses`, `buffs`, `prototypeTraits`, `limitations`, and `reproduction`.

- [ ] **Step 1: Write the species acceptance tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NORMAL_SPECIES,
  MYTHIC_SPECIES,
  getSpeciesById,
} from '../dist/V20260728/generated/species-config.js';

test('species registries implement the approved 18 plus 8 model', () => {
  assert.equal(Object.keys(NORMAL_SPECIES).length, 18);
  assert.equal(Object.keys(MYTHIC_SPECIES).length, 8);
  assert.equal(NORMAL_SPECIES['G-S09'].name, '混血种');
  assert.equal(NORMAL_SPECIES['G-S09'].rpCost, 10);
  assert.ok(!Object.values(NORMAL_SPECIES).some(x => x.name === '猪科'));
  assert.ok(Object.values(NORMAL_SPECIES).every(x => x.rpCost === 10));
  assert.ok(Object.values(MYTHIC_SPECIES).every(x => x.rpCost === 20));
  assert.equal(getSpeciesById('G-M08'), MYTHIC_SPECIES['G-M08']);
});

test('ordinary mechanics and hybrid extremes are machine-complete', () => {
  for (const species of Object.values(NORMAL_SPECIES)) {
    assert.ok(Object.keys(species.bonuses).length === 6);
    assert.ok(species.buffs.length >= 2);
    assert.ok(species.prototypeTraits.length >= 1);
    assert.ok(species.limitations.length >= 1);
  }
  const hybrid = NORMAL_SPECIES['G-S09'];
  assert.equal(hybrid.hybridRules.positiveSlots, 2);
  assert.equal(hybrid.hybridRules.negativeSlots, 2);
  assert.deepEqual(hybrid.hybridRules.forbiddenBaseIds, ['G-S09']);
});
```

- [ ] **Step 2: Run the focused test**

Run: `node --test tests/high-density-species.test.mjs`

Expected: FAIL because the generated species module is absent or empty.

- [ ] **Step 3: Populate all 26 species records**

For each ordinary record, provide six numeric bonuses, at least two permanent effects, at least one prototype option, explicit limitations, RP 10, and existing reproductive parameters. Set `G-S09` to hybrid with:

```json
{
  "id": "G-S09",
  "name": "混血种",
  "system": "普通",
  "rpCost": 10,
  "startLevel": 1,
  "bonuses": {"strength":0,"dexterity":0,"constitution":0,"intelligence":0,"wisdom":0,"charisma":0},
  "hybridRules": {
    "maternalBaseRequired": true,
    "paternalExpressionRequired": true,
    "positiveSlots": 2,
    "negativeSlots": 2,
    "forbiddenBaseIds": ["G-S09"],
    "positiveAttributeRange": [3, 4],
    "negativeAttributeRange": [-3, -2]
  }
}
```

Preserve the approved ordinary directions and all eight existing mythic archetypes. Do not add compensating mythic weaknesses.

- [ ] **Step 4: Generate the ESM module and re-export it**

`five-world-config.js` imports and re-exports the generated registries. Remove its duplicate local registry definitions only after confirming the generated values pass the old reproduction tests.

Run:

```bash
node scripts/build-dual-world-assets.mjs --phase=base
node --test tests/high-density-species.test.mjs tests/five-world-config.test.mjs tests/reproduction-engine.test.mjs
```

Expected: all focused tests pass.

- [ ] **Step 5: Verify the opening page can consume all new fields**

Run: `python3 tests/opening_runtime_test.py`

Expected: existing opening tests pass; later UI rendering remains a separate task.

- [ ] **Step 6: Commit species data and generated runtime**

```bash
git add data/dual-world/species.json dist/V20260728/generated/species-config.js dist/V20260728/five-world-config.js tests/high-density-species.test.mjs tests/five-world-config.test.mjs
git commit -m "feat: add priced dual-world species mechanics"
```

---

### Task 4: Build the 64-Node Vielsaen Graph

**Files:**
- Modify: `data/dual-world/vielsaen-map.json`
- Generate: `vielsaen_mapdata.js`
- Create: `tests/high-density-map.test.mjs`
- Modify: `tests/map-data.test.mjs`

**Interfaces:**
- Produces: `VIELSAEN_MAP` with `worldId`, `title`, `layers`, `regions`, `nodes`, and `edges`.
- Node IDs use the canonical worldbook range `V-G100..V-G163` and are globally unique.
- Human-readable routing names use a separate `slug` field.
- Edge IDs use `v-edge-<from>-<to>`; ordinary bidirectional edges are stored once with `"bidirectional": true`.

- [ ] **Step 1: Write exact graph acceptance tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { VIELSAEN_MAP } from '../vielsaen_mapdata.js';
import { analyzeGraph } from '../scripts/dual-world-data.mjs';

test('Vielsaen has the approved node distribution and dense topology', () => {
  assert.equal(VIELSAEN_MAP.nodes.length, 64);
  const counts = Object.groupBy(VIELSAEN_MAP.nodes, node => node.type);
  assert.equal(counts.capital.length, 6);
  assert.equal(counts.city.length, 12);
  assert.equal(counts.settlement.length, 12);
  assert.equal(counts.wilderness.length, 12);
  assert.equal(counts.dungeon.length, 10);
  assert.equal(counts.hub.length, 6);
  assert.equal(counts.hidden.length, 6);
  assert.ok(VIELSAEN_MAP.edges.length >= 100);
  assert.ok(VIELSAEN_MAP.edges.length <= 115);
});

test('Vielsaen routes are connected, cyclic, and state-aware', () => {
  const report = analyzeGraph(VIELSAEN_MAP);
  assert.deepEqual(report.isolatedNodeIds, []);
  assert.deepEqual(report.unknownEdgeNodeIds, []);
  assert.ok(report.cycleCount >= 3);
  assert.ok(report.stateControlledEdgeIds.length >= 4);
  assert.ok(report.externalRouteCountByRegion.every(x => x.count >= 2));
});
```

- [ ] **Step 2: Run the graph tests**

Run: `node --test tests/high-density-map.test.mjs`

Expected: FAIL because the current map has 12 nodes and 10 edges.

- [ ] **Step 3: Author the 64 nodes by fixed allocation**

Use IDs reserved by region and type. Every node contains:

```json
{
  "id": "V-G100",
  "slug": "valkain-iron-crown",
  "name": "铁冠城",
  "type": "capital",
  "regionId": "valkain",
  "layerId": "surface",
  "x": 30,
  "y": 30,
  "recommendedLevel": [1, 60],
  "spawnable": true,
  "summary": "瓦尔凯恩帝国的行政、军需与魔法工业中枢。",
  "facilities": ["旅店", "工坊", "跨境办事处"],
  "factionIds": ["valkain-court"],
  "characterIds": [],
  "questIds": [],
  "riskTags": ["政治审查"],
  "stateKey": ""
}
```

Allocate exactly 6 capitals, 12 cities or ports, 12 settlements or gates, 12 wilderness or resource areas, 10 ruins or dungeons, 6 transport hubs, and 6 hidden holy-site or demon-king nodes.

Reserve IDs by type:

```text
V-G100..V-G105 capitals
V-G106..V-G117 cities and ports
V-G118..V-G129 settlements, gates, and relay stations
V-G130..V-G141 wilderness and resource areas
V-G142..V-G151 ruins and dungeons
V-G152..V-G157 transport hubs
V-G158..V-G163 hidden holy-site and demon-king nodes
```

- [ ] **Step 4: Author 100–115 typed edges**

Every edge declares transport mode, time, cost, level, risk, bidirectionality, state key, and alternative route IDs. Ensure each polity has an internal loop and two external exits. Keep holy-site and demon-king nodes hidden at opening.

- [ ] **Step 5: Generate and validate the map module**

Run:

```bash
node scripts/build-dual-world-assets.mjs --phase=base
node --test tests/high-density-map.test.mjs tests/map-data.test.mjs
node scripts/build-dual-world-assets.mjs --phase=base --check
```

Expected: all tests pass and generated files show no drift.

- [ ] **Step 6: Commit the Vielsaen graph**

```bash
git add data/dual-world/vielsaen-map.json vielsaen_mapdata.js tests/high-density-map.test.mjs tests/map-data.test.mjs
git commit -m "feat: expand Vielsaen map topology"
```

---

### Task 5: Build the 48-Node Modern Two-Level Graph

**Files:**
- Modify: `data/dual-world/modern-map.json`
- Generate: `modern_mapdata.js`
- Modify: `tests/high-density-map.test.mjs`
- Modify: `tests/map-data.test.mjs`

**Interfaces:**
- Produces: `MODERN_MAP` with `worldId`, `title`, `layers`, `regions`, `nodes`, and `edges`.
- Global city IDs use `U-G100..U-G115`.
- Local IDs use `U-G116..U-G147`.
- Human-readable routing names use a separate `slug` field.
- Every local node has `parentCityId`; every city has exactly two local child nodes.

- [ ] **Step 1: Add failing modern graph tests**

```js
import { MODERN_MAP } from '../modern_mapdata.js';

test('Modern City has sixteen hubs and thirty-two local nodes', () => {
  assert.equal(MODERN_MAP.nodes.length, 48);
  const cities = MODERN_MAP.nodes.filter(x => x.type === 'city');
  const local = MODERN_MAP.nodes.filter(x => x.type !== 'city');
  assert.equal(cities.length, 16);
  assert.equal(local.length, 32);
  assert.ok(new Set(cities.map(x => x.regionId)).size >= 7);
  for (const city of cities) {
    assert.equal(local.filter(x => x.parentCityId === city.id).length, 2);
  }
  assert.ok(MODERN_MAP.edges.length >= 75);
  assert.ok(MODERN_MAP.edges.length <= 90);
});

test('Modern global and local layers are independently connected', () => {
  const report = analyzeGraph(MODERN_MAP);
  assert.deepEqual(report.isolatedNodeIds, []);
  assert.deepEqual(report.unknownEdgeNodeIds, []);
  assert.ok(report.cycleCount >= 3);
  assert.ok(report.alternativeIntercontinentalRouteCount >= 3);
});
```

- [ ] **Step 2: Run the modern graph tests**

Run: `node --test tests/high-density-map.test.mjs`

Expected: FAIL because the current map contains only eleven city nodes.

- [ ] **Step 3: Author sixteen global cities**

Cover at least seven world regions with at least two cities per region. Each city has original agency data, public infrastructure, travel metadata, a spawn flag, and three state paths:

```json
{
  "id": "U-G100",
  "slug": "shanghai",
  "name": "上海",
  "type": "city",
  "layerId": "global",
  "regionId": "east-asia",
  "x": 76,
  "y": 44,
  "recommendedLevel": [1, 60],
  "spawnable": true,
  "agency": "东亚异常事务协调局",
  "summary": "公开异能社会中的国际交通、金融与裂隙应急节点。",
  "statePaths": {
    "rift": "现代都市.裂隙.shanghai",
    "invasion": "现代都市.异界魔物.shanghai",
    "plot": "现代都市.主线.阶段"
  }
}
```

- [ ] **Step 4: Author two local nodes for every city**

Each city receives one daily-life node and one anomaly node. Local nodes contain facilities, factions, companion IDs, quest IDs, risk, level range, and a reversible link to the parent city.

- [ ] **Step 5: Author 75–90 edges across both layers**

Use air, rail, sea, road, and agency routes globally. Use transit, walking, service tunnel, and emergency routes locally. Add at least three intercontinental alternatives and state-controlled rift edges without binding the main plot to a fixed city.

- [ ] **Step 6: Generate, validate, and commit**

Run:

```bash
node scripts/build-dual-world-assets.mjs --phase=base
node --test tests/high-density-map.test.mjs tests/map-data.test.mjs
node scripts/build-dual-world-assets.mjs --phase=base --check
```

Expected: all tests pass.

```bash
git add data/dual-world/modern-map.json modern_mapdata.js tests/high-density-map.test.mjs tests/map-data.test.mjs
git commit -m "feat: expand Modern City map topology"
```

---

### Task 6: Implement Shared SVG Rendering and Route Search

**Files:**
- Create: `dist/V20260728/world-map-core.js`
- Create: `tests/world-map-core.test.mjs`
- Modify: `vielsaen_map.html`
- Modify: `modern_map.html`
- Modify: `tests/runtime-integration.test.py`

**Interfaces:**
- Produces: `normalizeGraph(map): NormalizedGraph`
- Produces: `isEdgeOpen(edge, state): boolean`
- Produces: `findRoute(map, fromId, toId, criterion, state): RouteResult | null`
- Produces: `getReachableNodeIds(map, fromId, state): Set<string>`
- Produces: `mountWorldMap({ container, detail, map, getState, onSpawnSelected }): MapController`
- `criterion` is exactly `time`, `cost`, or `risk`.

- [ ] **Step 1: Write failing routing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findRoute,
  getReachableNodeIds,
  isEdgeOpen,
} from '../dist/V20260728/world-map-core.js';

const map = {
  nodes: [{id:'a'}, {id:'b'}, {id:'c'}],
  edges: [
    {id:'ab',from:'a',to:'b',bidirectional:true,time:1,cost:5,risk:4,stateKey:''},
    {id:'bc',from:'b',to:'c',bidirectional:true,time:1,cost:5,risk:4,stateKey:''},
    {id:'ac',from:'a',to:'c',bidirectional:true,time:5,cost:1,risk:1,stateKey:'blocked.ac'},
  ],
};

test('routing honors criterion and state-controlled closure', () => {
  assert.deepEqual(findRoute(map, 'a', 'c', 'time', {}).nodeIds, ['a','b','c']);
  assert.deepEqual(findRoute(map, 'a', 'c', 'cost', {}).nodeIds, ['a','c']);
  assert.equal(isEdgeOpen(map.edges[2], {blocked:{ac:true}}), false);
  assert.deepEqual(findRoute(map, 'a', 'c', 'cost', {blocked:{ac:true}}).nodeIds, ['a','b','c']);
  assert.deepEqual([...getReachableNodeIds(map, 'a', {blocked:{ac:true}})].sort(), ['a','b','c']);
});
```

- [ ] **Step 2: Run the routing test**

Run: `node --test tests/world-map-core.test.mjs`

Expected: FAIL because `world-map-core.js` does not exist.

- [ ] **Step 3: Implement graph normalization and Dijkstra routing**

Use arrays, `Map`, `Set`, and a sorted work queue; no dependency is permitted. Interpret `time`, `cost`, and `risk` as nonnegative numeric weights. A missing state path means open. A state value of `true`, `封锁`, or `关闭` means closed.

```js
export function findRoute(map, fromId, toId, criterion = 'time', state = {}) {
  const graph = normalizeGraph(map);
  const weight = edge => Number(edge[criterion] ?? 0);
  return dijkstra(graph, fromId, toId, edge => isEdgeOpen(edge, state), weight);
}
```

- [ ] **Step 4: Implement the SVG renderer**

Render edges before nodes. Add `data-node-id`, `data-edge-id`, level and type CSS classes, native `<title>` elements, zoom, pan, filters, legend, route controls, reachable-node highlighting, hidden-node suppression, and a details panel.

`mountWorldMap` returns:

```js
{
  destroy(),
  setCurrentNode(nodeId),
  setCriterion(criterion),
  setRoute(fromId, toId),
  refreshState(),
}
```

- [ ] **Step 5: Replace each map's inline loop with the shared mount**

Both HTML files import `mountWorldMap` and their own generated map module. Keep existing `postMessage` channels:

```text
vielsaen-spawn-map / vielsaen_spawn_selected
modern-spawn-map / modern_spawn_selected
```

- [ ] **Step 6: Verify algorithms and static integration**

Run:

```bash
node --test tests/world-map-core.test.mjs tests/high-density-map.test.mjs
python3 tests/runtime-integration.test.py
```

Expected: all tests pass and both HTML files import `world-map-core.js`.

- [ ] **Step 7: Perform visual QA**

Run: `python3 -m http.server 8000 --directory .`

Open `/vielsaen_map.html` and `/modern_map.html`. Verify line visibility, zoom, drag, filters, route criteria, details, hidden nodes, blocked edges, keyboard focus, and narrow-screen layout. Record screenshots and observations under `../世界书/10_DNF双世界高密度扩充/99_汇总与验收/地图视觉验收/`.

- [ ] **Step 8: Commit the map engine**

```bash
git add dist/V20260728/world-map-core.js vielsaen_map.html modern_map.html tests/world-map-core.test.mjs tests/runtime-integration.test.py
git commit -m "feat: render and route dual-world maps"
```

---

### Task 7: Implement Level 1–60 Opening Packages

**Files:**
- Modify: `data/dual-world/opening-levels.json`
- Generate: `dist/V20260728/generated/opening-level-config.js`
- Create: `tests/opening-levels.test.mjs`
- Modify: `dist/V20260728/build.html`
- Modify: `tests/opening_runtime_test.py`

**Interfaces:**
- Produces: `QUICK_START_LEVELS`
- Produces: `OPENING_LEVEL_BANDS`
- Produces: `calculateTotalExp(level): number`
- Produces: `getStartingGrowthRewards(level): {totalSP, attributePoints}`
- Produces: `getOpeningLevelPackage(worldId, level): OpeningLevelPackage`
- Produces: `getUnlockedSkillTiers(level): string[]`

- [ ] **Step 1: Write exact level tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  QUICK_START_LEVELS,
  getOpeningLevelPackage,
} from '../dist/V20260728/generated/opening-level-config.js';

test('both worlds expose every level and the approved quick levels', () => {
  assert.deepEqual(QUICK_START_LEVELS, [1,5,10,15,20,30,45,50,60]);
  for (const worldId of ['vielsaen', 'modern']) {
    for (let level = 1; level <= 60; level += 1) {
      assert.equal(getOpeningLevelPackage(worldId, level).level, level);
    }
  }
});

test('growth and tier boundaries match the existing DNF engine', () => {
  assert.equal(getOpeningLevelPackage('vielsaen', 1).totalSP, 0);
  assert.equal(getOpeningLevelPackage('vielsaen', 15).totalSP, 350);
  assert.deepEqual(getOpeningLevelPackage('modern', 30).unlockedSkillTiers, ['基础','转职','进阶']);
  assert.equal(getOpeningLevelPackage('modern', 20).attackCount, 2);
  assert.equal(getOpeningLevelPackage('modern', 50).attackCount, 3);
  assert.ok(getOpeningLevelPackage('vielsaen', 60).unlockedSkillTiers.includes('觉醒一'));
});
```

- [ ] **Step 2: Run the level tests**

Run: `node --test tests/opening-levels.test.mjs`

Expected: FAIL because the generated level module is absent.

- [ ] **Step 3: Author nine narrative bands for each world**

Each band defines level, label, equipment quality, funding, social identity hint, mission band, spawn risk, skill guidance, and high-level caveat. Vielsaen text must not grant political authority. Modern text must separate level, ability grade, and legal authority.

- [ ] **Step 4: Generate formulas from existing engine rules**

Use:

```js
const totalSP = Math.max(0, (level - 1) * 25);
const attributePoints = Math.floor(level / 10);
const attackCount = level >= 50 ? 3 : level >= 20 ? 2 : 1;
```

Skill thresholds remain `基础 1`, `转职 15`, `进阶 30`, `必杀 45`, and `觉醒一 50`. Do not expose `奥义`, `觉醒二`, or `觉醒三` before level 60.

- [ ] **Step 5: Replace special-case Vielsaen and Modern selectors**

Import the generated module into `build.html`. Both worlds use a 1–60 slider and nine quick buttons. The summary panel shows exact experience, SP, attributes, attacks, skill tiers, equipment, mission band, spawn risk, and companion sync result.

Retain the existing level-1 `+20 RP` behavior.

- [ ] **Step 6: Run focused and opening tests**

Run:

```bash
node scripts/build-dual-world-assets.mjs --phase=base
node --test tests/opening-levels.test.mjs
python3 tests/opening_runtime_test.py
```

Expected: all tests pass; the opening file imports `opening-level-config.js` and no longer derives Vielsaen options only from species start levels.

- [ ] **Step 7: Commit level packages**

```bash
git add data/dual-world/opening-levels.json dist/V20260728/generated/opening-level-config.js dist/V20260728/build.html tests/opening-levels.test.mjs tests/opening_runtime_test.py
git commit -m "feat: add meaningful level 1-60 openings"
```

---

### Task 8: Author Species-Neutral Companion Roles and Stop at Gate A

**Files:**
- Modify: `data/dual-world/companions-vielsaen.roles.json`
- Modify: `data/dual-world/companions-modern.roles.json`
- Modify: `data/dual-world/vielsaen-map.json`
- Modify: `data/dual-world/modern-map.json`
- Generate: `vielsaen_mapdata.js`
- Generate: `modern_mapdata.js`
- Create: `tests/companion-role-gate.test.mjs`
- Generate: `../世界书/10_DNF双世界高密度扩充/05_角色定位与技能/角色定位与技能审核.md`
- Generate: `../世界书/10_DNF双世界高密度扩充/05_角色定位与技能/角色关系索引.json`

**Interfaces:**
- Produces: exactly 12 `CompanionRole` records per world.
- `CompanionRole` includes `id`, `name`, `worldId`, `age`, `originNodeId`, `factionId`, `combatRole`, `professionOrAbility`, `baseLevel`, `attributes`, `activeSkills`, `passiveSkills`, `equipment`, `goal`, `conflict`, `relations`, `joinCondition`, `refusalCondition`, `personalLine`, and `growth`.
- Vielsaen role IDs are exactly `V-C100..V-C111`; Modern role IDs are exactly `U-C100..U-C111`.
- `professionOrAbility` is `{kind, label, abilityType}` where `kind` is `profession` or `ability` and non-ability roles use an empty `abilityType`.
- The six retained names carry `legacyIds` for their former runtime IDs; all new map, worldbook, and MVU writes use the canonical `V-C` or `U-C` ID.
- It explicitly excludes species, classification, physiology, heritable traits, and species-derived skills.

- [ ] **Step 1: Write the Gate A test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const load = async name => JSON.parse(await readFile(new URL(`../data/dual-world/${name}`, import.meta.url)));
const forbidden = new Set([
  'species', 'race', 'classificationId', 'physiology', 'heritableTraits',
  '种族', '生理档案', '可遗传特征',
]);

function walk(value, path = []) {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([key, child]) => [
    ...(forbidden.has(key) ? [[...path, key].join('.')] : []),
    ...walk(child, [...path, key]),
  ]);
}

test('Gate A contains twelve complete species-neutral roles per world', async () => {
  for (const file of ['companions-vielsaen.roles.json','companions-modern.roles.json']) {
    const roles = await load(file);
    assert.equal(roles.length, 12);
    assert.deepEqual(walk(roles), []);
    for (const role of roles) {
      assert.ok(role.id && role.name && role.originNodeId && role.combatRole);
      assert.equal(role.activeSkills.length, 3);
      assert.equal(role.passiveSkills.length, 2);
      assert.equal(role.relations.length >= 2, true);
      assert.equal(role.personalLine.length, 3);
      const map = role.worldId === 'vielsaen'
        ? await load('vielsaen-map.json')
        : await load('modern-map.json');
      const origin = map.nodes.find(x => x.id === role.originNodeId);
      assert.ok(origin);
      assert.ok(origin.characterIds.includes(role.id));
    }
  }
});
```

- [ ] **Step 2: Run the Gate A test**

Run: `node --test tests/companion-role-gate.test.mjs`

Expected: FAIL because both role lists are empty.

- [ ] **Step 3: Author twelve Vielsaen roles without species**

Retain the names and core functions of 凯尔·洛德斯, 米拉·维尔, and 奥林·塞布尔 as editable role inputs, but remove all former species-dependent material. Add nine original roles so six polities, frontline, damage, healing, control, support, scouting, negotiation, crafting, and transport are represented.

Every skill must be explainable by profession, school, training, equipment, or personal history without relying on anatomy or ancestry.

Add every role ID to its origin node's `characterIds` array. The role points to the node and the node points back to the role.

- [ ] **Step 4: Author twelve Modern roles without species**

Retain the names and core functions of 林晓雨, 陈墨君, and 艾娃·斯托姆 as editable role inputs, but remove former species and mythic assumptions. Add nine original roles covering eight ability types, non-ability work, field rescue, investigation, engineering, negotiation, transport, medical support, and infrastructure defense.

Do not assign ability power merely because a later species candidate might be mythic.

Add every role ID to its origin node's `characterIds` array. Regenerate both map modules after the bidirectional links are complete.

- [ ] **Step 5: Generate the review packet**

Run:

```bash
node scripts/build-dual-world-assets.mjs --phase=roles
node --test tests/companion-role-gate.test.mjs
```

Expected: tests pass. The review Markdown lists all 24 roles with skills, equipment, relations, join/refusal conditions, and three-stage personal lines, and contains no final species.

- [ ] **Step 6: Commit the Gate A source**

```bash
git add data/dual-world/companions-vielsaen.roles.json data/dual-world/companions-modern.roles.json data/dual-world/vielsaen-map.json data/dual-world/modern-map.json vielsaen_mapdata.js modern_mapdata.js tests/companion-role-gate.test.mjs scripts
git commit -m "feat: define species-neutral companion roles"
```

- [ ] **Step 7: Stop for mandatory user review**

Deliver the review Markdown path, the two role JSON paths, the test result, and the commit. Do not create `companion-species-approval.json`, do not generate companion runtime modules, and do not start Task 9 until the user explicitly approves Gate A.

---

### Task 9: Generate Species Candidates and Stop at Gate B

**Precondition:** The user has explicitly approved Gate A.

**Files:**
- Create: `data/dual-world/companion-species-candidates.json`
- Modify: `tests/companion-role-gate.test.mjs`
- Generate: `../世界书/10_DNF双世界高密度扩充/06_角色种族与生理/角色种族候选审核.md`

**Interfaces:**
- Produces: one candidate record for each of the 24 approved role IDs.
- Each record has `roleId`, `worldId`, and `candidates`.
- Each candidate has `speciesId`, `kind`, `fit`, `tradeoff`, and optional `hybridProposal`.
- `kind` is exactly `ordinary`, `hybrid`, or `mythic`.
- The complete packet includes all three kinds, but a single role only receives compatible kinds.

- [ ] **Step 1: Extend the gate tests**

```js
test('species candidates cover all roles without becoming final choices', async () => {
  const packet = await load('companion-species-candidates.json');
  const roles = [
    ...await load('companions-vielsaen.roles.json'),
    ...await load('companions-modern.roles.json'),
  ];
  assert.equal(packet.length, 24);
  assert.deepEqual(new Set(packet.map(x => x.roleId)), new Set(roles.map(x => x.id)));
  assert.deepEqual(new Set(packet.flatMap(x => x.candidates.map(y => y.kind))),
    new Set(['ordinary','hybrid','mythic']));
  for (const item of packet) {
    assert.ok(item.candidates.length >= 2 && item.candidates.length <= 3);
    assert.equal('selectedSpeciesId' in item, false);
  }
});

test('Modern ability roles are never offered mythic candidates', async () => {
  const roles = await load('companions-modern.roles.json');
  const packet = await load('companion-species-candidates.json');
  for (const role of roles.filter(x => x.professionOrAbility.abilityType)) {
    const item = packet.find(x => x.roleId === role.id);
    assert.equal(item.candidates.some(x => x.kind === 'mythic'), false);
  }
});
```

- [ ] **Step 2: Run the candidate tests**

Run: `node --test tests/companion-role-gate.test.mjs`

Expected: FAIL because the candidate packet does not exist.

- [ ] **Step 3: Produce two or three compatible candidates per role**

Use only approved species IDs. A hybrid proposal must state maternal base, paternal expression, two strong positives, and two strong negatives. Do not change approved skills, equipment, relations, or personal lines to make a species fit.

Modern roles with an ability receive only ordinary or hybrid candidates. Modern roles without an ability may receive a mythic candidate. Across the packet, include ordinary, hybrid, and mythic options.

- [ ] **Step 4: Generate and validate the Gate B review**

Run:

```bash
node scripts/build-dual-world-assets.mjs --phase=roles
node --test tests/companion-role-gate.test.mjs
```

Expected: tests pass and the review Markdown shows role summary, candidate fit, candidate tradeoff, and hybrid composition without selecting a final species.

- [ ] **Step 5: Commit the candidate packet**

```bash
git add data/dual-world/companion-species-candidates.json tests/companion-role-gate.test.mjs
git commit -m "feat: propose companion species candidates"
```

- [ ] **Step 6: Stop for mandatory user review**

Deliver the candidate review path and test result. Do not create final approvals, physiology, heritable traits, or runtime companion modules until the user explicitly confirms one species choice for every role.

---

### Task 10: Apply Gate B Choices and Compile Final Companions

**Precondition:** The user has explicitly confirmed all 24 final species choices.

**Files:**
- Create: `data/dual-world/companion-species-approval.json`
- Generate: `dist/V20260728/generated/vielsaen-companions.js`
- Generate: `dist/V20260728/generated/modern-companions.js`
- Create: `tests/companion-final.test.mjs`
- Modify: `dist/V20260728/five-world-config.js`
- Modify carefully: `tests/five-world-config.test.mjs`

**Interfaces:**
- Produces: `VIELSAEN_COMPANIONS: readonly CompanionConfig[]`
- Produces: `MODERN_COMPANIONS: readonly CompanionConfig[]`
- Produces compatibility export: `REPLACEMENT_BONDS = [...VIELSAEN_COMPANIONS, ...MODERN_COMPANIONS]`
- Produces: `COMPANION_ID_ALIASES: Readonly<Record<string, string>>`
- `CompanionConfig` merges an approved role with exactly one approved species and a complete physiology profile.

- [ ] **Step 1: Write final-companion tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { VIELSAEN_COMPANIONS } from '../dist/V20260728/generated/vielsaen-companions.js';
import { MODERN_COMPANIONS } from '../dist/V20260728/generated/modern-companions.js';
import { COMPANION_ID_ALIASES } from '../dist/V20260728/five-world-config.js';

test('each world compiles exactly twelve approved companions', () => {
  assert.equal(VIELSAEN_COMPANIONS.length, 12);
  assert.equal(MODERN_COMPANIONS.length, 12);
  const all = [...VIELSAEN_COMPANIONS, ...MODERN_COMPANIONS];
  assert.equal(new Set(all.map(x => x.id)).size, 24);
  for (const companion of all) {
    assert.equal(companion.physiology.adult, true);
    assert.ok(companion.speciesId);
    assert.ok(companion.speciesTraits.length >= 2);
    assert.ok(companion.heritableTraits.length >= 2);
  }
});

test('hybrid companions contain complete non-recursive lineage data', () => {
  const hybrids = [...VIELSAEN_COMPANIONS, ...MODERN_COMPANIONS]
    .filter(x => x.speciesId === 'G-S09');
  for (const companion of hybrids) {
    assert.notEqual(companion.hybrid.maternalBaseId, 'G-S09');
    assert.notEqual(companion.hybrid.paternalExpressionId, 'G-S09');
    assert.equal(companion.hybrid.positiveTraits.length, 2);
    assert.equal(companion.hybrid.negativeTraits.length, 2);
  }
});

test('Modern mythic companions have no awakened ability', () => {
  for (const companion of MODERN_COMPANIONS.filter(x => x.physiology.system === '神话')) {
    assert.equal(companion.ability, null);
  }
});

test('legacy IDs resolve to canonical companion IDs', () => {
  assert.equal(COMPANION_ID_ALIASES.vielsaen_kael_rhodes, 'V-C100');
  assert.equal(COMPANION_ID_ALIASES.modern_lin_xiaoyu, 'U-C100');
});
```

- [ ] **Step 2: Run final-companion tests**

Run: `node --test tests/companion-final.test.mjs`

Expected: FAIL because approvals and generated modules do not exist.

- [ ] **Step 3: Record the user's choices exactly**

`companion-species-approval.json` contains:

```json
{
  "schemaVersion": 1,
  "approvedAt": "ISO-8601 timestamp",
  "authority": "用户确认",
  "choices": [
    {
      "roleId": "exact approved role ID",
      "speciesId": "exact approved species ID",
      "hybrid": null
    }
  ]
}
```

For a hybrid, replace `null` with the approved maternal base, paternal expression, two positive traits, and two negative traits. Do not infer an unmentioned user choice.

- [ ] **Step 4: Merge roles, approvals, and species**

The final build validates that every role has exactly one approval, every approval was present in its candidate list, and no unapproved role field changed. Add species traits, physiology, heritable traits, and hybrid lineage only at this point.

- [ ] **Step 5: Generate modules and compatibility export**

Run:

```bash
node scripts/build-dual-world-assets.mjs --phase=final
node --test tests/companion-final.test.mjs tests/five-world-config.test.mjs
node scripts/build-dual-world-assets.mjs --phase=final --check
```

Expected: all tests pass and `REPLACEMENT_BONDS.length` is exactly 24.

- [ ] **Step 6: Commit approved companion data**

```bash
git add data/dual-world/companion-species-approval.json dist/V20260728/generated/vielsaen-companions.js dist/V20260728/generated/modern-companions.js dist/V20260728/five-world-config.js tests/companion-final.test.mjs tests/five-world-config.test.mjs
git commit -m "feat: compile approved dual-world companions"
```

---

### Task 11: Integrate Species, Levels, Maps, and Companions into the Opening Runtime

**Files:**
- Modify: `dist/V20260728/build.html`
- Modify carefully: `dist/V20260728/five-world-runtime.js`
- Modify carefully: `dist/V20260728/five-world-mvu.js`
- Modify carefully: `dist/V20260728/helper-calculator.js`
- Modify: `tests/opening_runtime_test.py`
- Modify carefully: `tests/mvu-integration.test.mjs`
- Modify: `tests/runtime-integration.test.py`

**Interfaces:**
- Produces: `validateHybridProfile(profile): string[]`
- Produces: `resolveReproductionConfig(profile): SpeciesConfig`
- Produces: `resolveCompanionId(id): string`
- Preserves: `ensureFiveWorldState`, `advanceMvuState`, `submitConception`, `settleBirth`
- Opening writes `speciesId`, `rpCost`, permanent species effects, and hybrid lineage into MVU.

- [ ] **Step 1: Add failing runtime integration assertions**

```js
test('hybrid profiles resolve reproduction through maternal base', () => {
  const profile = {
    种族分类: 'G-S09',
    母系基础分类: 'G-S02',
    父系显性来源: 'G-S17',
    正面变异: ['水下追踪', '近水爆发'],
    负面冲突: ['持续保湿', '嗅觉过载'],
  };
  assert.deepEqual(validateHybridProfile(profile), []);
  assert.equal(resolveReproductionConfig(profile).name, '猫科');
});
```

Extend Python static tests to assert the opening imports generated species, level, and companion modules; renders exactly twelve candidates for each target world; and includes hybrid maternal and paternal controls.

- [ ] **Step 2: Run focused integration tests**

Run:

```bash
node --test tests/mvu-integration.test.mjs
python3 tests/opening_runtime_test.py
python3 tests/runtime-integration.test.py
```

Expected: at least one new assertion fails.

- [ ] **Step 3: Render priced species in the opening**

Map `rpCost` to the existing race cost calculation and card display. Show six attribute modifiers, fixed traits, prototype choices, limitations, and RP. Mythic cards show 20 RP without forced balancing text.

When `G-S09` is selected, require:

```text
母系基础分类
父系显性来源
两项强正面
两项强负面
```

Reject recursive `G-S09` bases and incomplete hybrid profiles before MVU write.

- [ ] **Step 4: Render twelve detailed companion cards per world**

Replace the three-item projections with the generated 12-item world-specific lists. Keep the maximum selection count at one. Add filters and four detail tabs: profile, combat, relations, and personal line. Display base level and synchronized start level separately.

- [ ] **Step 5: Preserve hybrid and companion data through MVU**

`five-world-mvu.js` keeps hybrid lineage and all companion profiles. `five-world-runtime.js` resolves pregnancy parameters through the maternal base for `G-S09`. `helper-calculator.js` applies species effects once, synchronizes companion levels, and does not overwrite personal-line state.

When loading an existing save, `resolveCompanionId` migrates the six former runtime IDs through `COMPANION_ID_ALIASES` before profile lookup. New saves write only canonical `V-C100..V-C111` and `U-C100..U-C111`.

Before editing each currently dirty file, inspect:

```bash
git diff -- dist/V20260728/five-world-runtime.js
git diff -- dist/V20260728/five-world-mvu.js
git diff -- dist/V20260728/helper-calculator.js
git diff -- tests/mvu-integration.test.mjs
```

Patch only feature-local regions. If an existing hunk overlaps the required region, stop and report the exact overlap before proceeding.

- [ ] **Step 6: Run all runtime-focused tests**

Run:

```bash
node --test tests/high-density-species.test.mjs tests/opening-levels.test.mjs tests/companion-final.test.mjs tests/mvu-integration.test.mjs tests/reproduction-engine.test.mjs
python3 tests/opening_runtime_test.py
python3 tests/runtime-integration.test.py
```

Expected: all tests pass.

- [ ] **Step 7: Commit without staging unrelated pre-existing hunks**

Stage clean files normally. For a file dirty before Task 1, stage only the feature hunks after comparing against the recorded baseline. If feature and pre-existing changes cannot be separated safely, leave that file uncommitted and report it instead of capturing unrelated work.

Suggested commit:

```bash
git commit -m "feat: integrate high-density dual-world opening"
```

---

### Task 12: Generate the Separate High-Density Worldbook

**Files:**
- Create: `tools/worldbook/high_density_worldbook.py`
- Create: `tests/high_density_worldbook_test.py`
- Generate: `../世界书/10_DNF双世界高密度扩充/01_共享种族机制/*.md`
- Generate: `../世界书/10_DNF双世界高密度扩充/02_维尔萨恩地图/*.md`
- Generate: `../世界书/10_DNF双世界高密度扩充/03_现代都市地图/*.md`
- Generate: `../世界书/10_DNF双世界高密度扩充/04_开局等级包/*.md`
- Generate: `../世界书/10_DNF双世界高密度扩充/05_角色定位与技能/*.md`
- Generate: `../世界书/10_DNF双世界高密度扩充/06_角色种族与生理/*.md`
- Generate: `../世界书/10_DNF双世界高密度扩充/99_汇总与验收/**`

**Interfaces:**
- Consumes base: `../世界书/09_扩充汇总与验收/最终世界书/双世界furry世界书_扩充版.json`
- Produces: `build_high_density_worldbook(dnf_root: Path, worldbook_root: Path) -> dict`
- Produces CLI: `python3 tools/worldbook/high_density_worldbook.py`
- Produces check CLI: `python3 tools/worldbook/high_density_worldbook.py --check`
- Replaces exactly 26 existing species entries by ID while preserving their UIDs.
- Appends exactly 136 entries: 64 Vielsaen map, 48 Modern map, 12 Vielsaen companion, and 12 Modern companion entries.
- Final aggregate contains exactly 379 entries.

- [ ] **Step 1: Write worldbook acceptance tests**

```python
import json
import sys
import unittest
from pathlib import Path

DNF_ROOT = Path(__file__).resolve().parents[1]
WORLD_ROOT = DNF_ROOT.parent / "世界书"
sys.path.insert(0, str(DNF_ROOT))

from tools.worldbook.high_density_worldbook import build_high_density_worldbook

class HighDensityWorldbookTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base = json.loads((WORLD_ROOT / "09_扩充汇总与验收/最终世界书/双世界furry世界书_扩充版.json").read_text(encoding="utf-8"))
        cls.result = build_high_density_worldbook(DNF_ROOT, WORLD_ROOT)

    def test_count_replacements_and_appends(self):
        self.assertEqual(243, len(self.base["entries"]))
        self.assertEqual(379, len(self.result["entries"]))

    def test_species_keep_uid_and_non_targets_stay_identical(self):
        base_by_id = {e["extensions"]["worldbook_meta"]["id"]: e for e in self.base["entries"].values()}
        result_by_id = {e["extensions"]["worldbook_meta"]["id"]: e for e in self.result["entries"].values()}
        replaced = {f"G-S{i:02d}" for i in range(1, 19)} | {f"G-M{i:02d}" for i in range(1, 9)}
        for entry_id, old in base_by_id.items():
            new = result_by_id[entry_id]
            if entry_id in replaced:
                self.assertEqual(old["uid"], new["uid"])
                self.assertNotEqual(old["content"], new["content"])
            else:
                self.assertEqual(old, new)
```

- [ ] **Step 2: Run the worldbook test**

Run: `python3 tests/high_density_worldbook_test.py`

Expected: FAIL because the builder does not exist.

- [ ] **Step 3: Implement deterministic entry rendering**

Read the authoritative JSON data and render UTF-8 Markdown. Use these exact appended ID and UID reservations:

```text
V-G100..V-G163 -> UID 22000..22063
V-C100..V-C111 -> UID 22100..22111
U-G100..U-G147 -> UID 32000..32047
U-C100..U-C111 -> UID 32100..32111
```

For the 26 species replacements, locate the existing entry by `extensions.worldbook_meta.id`, preserve its UID and all structural fields, and replace synchronized `content` and source metadata in both `entries` and `originalData.entries`.

- [ ] **Step 4: Build single-entry JSON and aggregate reports**

Write 379 single-entry JSON files, one aggregate, an entry index, dependency index, trigger-conflict report, graph report, role-gate provenance, original-source protection report, and SHA-256 manifest.

The output aggregate path is:

```text
../世界书/10_DNF双世界高密度扩充/99_汇总与验收/最终世界书/双世界高密度世界书.json
```

- [ ] **Step 5: Run the builder and tests**

Run:

```bash
python3 tools/worldbook/high_density_worldbook.py
python3 tests/high_density_worldbook_test.py
python3 -m json.tool ../世界书/10_DNF双世界高密度扩充/99_汇总与验收/完成定义审计.json
```

Expected: 379 entries, 379 parseable single files, 26 same-UID replacements, 136 appends, zero unknown dependencies, and unchanged `世界书/创世回廊5.1.json` hash.

- [ ] **Step 6: Commit the reproducible builder**

```bash
git add tools/worldbook/high_density_worldbook.py tests/high_density_worldbook_test.py
git commit -m "feat: build high-density dual-world worldbook"
```

The generated outer-workspace files are not committed because the outer workspace has no Git repository. Their hash manifest is the evidence.

---

### Task 13: Run Full Verification and Perform the Live Import Gate

**Files:**
- Generate: `../世界书/10_DNF双世界高密度扩充/99_汇总与验收/自动化报告/最终自动化报告.json`
- Generate: `../世界书/10_DNF双世界高密度扩充/99_汇总与验收/实机验收记录.md`
- Modify only if a real defect is found: focused source and test files from earlier tasks.

**Interfaces:**
- Produces a report that separates `static`, `node_test`, `python_test`, `build_check`, and `sillytavern_import`.
- `sillytavern_import` remains `not_run` until the user or agent actually imports and exercises the card.

- [ ] **Step 1: Verify deterministic generation**

Run:

```bash
node scripts/build-dual-world-assets.mjs --phase=final --check
python3 tools/worldbook/high_density_worldbook.py --check
git diff --check
```

Expected: zero generated drift and zero whitespace errors.

- [ ] **Step 2: Run all DNF JavaScript tests**

Run: `node --test tests/*.test.mjs`

Expected: 0 failures. Record pass, fail, and skip counts exactly.

- [ ] **Step 3: Run DNF Python integration tests**

Run:

```bash
python3 tests/opening_runtime_test.py
python3 tests/runtime-integration.test.py
python3 tests/high_density_worldbook_test.py
```

Expected: 0 failures.

- [ ] **Step 4: Run the existing worldbook regression suite**

Run: `python3 -m unittest discover -s ../世界书 -p 'test_*.py'`

Expected: 0 failures. A pre-existing skip remains a skip and is not reported as a pass.

- [ ] **Step 5: Run machine-verifiable content checks**

Verify:

```text
26 species records
ordinary/hybrid/mythic RP = 10/10/20
Vielsaen nodes/edges = 64/100–115
Modern nodes/edges = 48/75–90
no isolated or unknown graph nodes
three route criteria
levels 1–60 and nine quick levels
12 companions per world
24 Gate A approvals and 24 Gate B approvals
379 final worldbook entries
379 field-for-field single-entry reconstructions
no cross-world load leakage
unchanged original source hash
```

- [ ] **Step 6: Inspect the Git worktree**

Run:

```bash
git status --short
git log --oneline --decorate -15
```

Expected: feature commits are present; pre-existing dirty paths are still identifiable and were not silently included.

- [ ] **Step 7: Perform the SillyTavern live gate**

Import the final worldbook and load the current opening page. In each target world, verify:

1. ordinary, hybrid, and mythic RP display;
2. hybrid maternal and paternal controls;
3. map nodes, edges, filters, blocked routes, and path modes;
4. every level from 1 to 60 and all nine quick packages;
5. twelve companion cards, four detail tabs, and one-companion maximum;
6. MVU writes for world, level, species, hybrid lineage, companion, skills, equipment, and personal-line state;
7. no target-world data appears in the other world;
8. a save-and-reload cycle preserves the same values.

Write actual observations and screenshots to the live acceptance directory. If the live gate is not run, mark it `not_run`; do not state that the card is live-verified.

- [ ] **Step 8: Fix only evidenced defects and rerun the affected gate**

For each failure, record input, expected result, actual result, cause, changed files, and rerun command. Do not weaken a check to obtain a pass.

- [ ] **Step 9: Commit final report tooling or focused fixes**

Commit only versioned DNF changes that belong to this feature. Use a focused message such as:

```bash
git commit -m "test: verify dual-world high-density expansion"
```

---

## Execution Stop Points

1. Stop after Task 1 if pre-existing dirty changes overlap required edit regions and cannot be preserved mechanically.
2. Stop after Task 8 for Gate A; no species work is authorized before explicit approval.
3. Stop after Task 9 for Gate B; no physiology work is authorized before explicit approval.
4. Stop in any graph task on duplicate IDs, unknown endpoints, unmarked one-way edges, an isolated node, or a seventh peer polity.
5. Stop if Modern ability grade becomes derived from species or character level.
6. Stop if a mythic Modern companion with an awakened ability is about to be produced.
7. Stop if any step would overwrite the current user-owned dirty changes.
8. Stop before claiming completion when the SillyTavern live gate is still `not_run`.

## Completion Evidence

The implementation is complete only when:

- all feature commits exist or any intentionally uncommitted overlap is explicitly reported;
- deterministic asset checks pass;
- all Node and Python tests pass with exact counts reported;
- both mandatory role gates have user approval evidence;
- final worldbook reconstruction and source-protection checks pass;
- map visual QA is recorded;
- SillyTavern import is either passed with evidence or explicitly reported as not run.
