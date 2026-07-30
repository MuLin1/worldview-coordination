# DNF Five-World Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two retired DNF worlds with Vielsaen and Modern City, add an isolated five-world runtime and deterministic reproductive/world state engines, then connect the active V20260728 UI and maps.

**Architecture:** Keep the current standalone UI scripts, but move new shared data and calculations into one ES module, `five-world-runtime.js`. Existing calculator, status-bar, mobile, and opening files consume the same global API; map files contain only nodes and edges, while progression remains in the runtime. Python and Node tests verify behavior and scan every active runtime path for retired content.

**Tech Stack:** Browser ES modules, SillyTavern/MVU event APIs, plain HTML/CSS, Node built-in test runner, Python standard library.

## Global Constraints

- Active runtime is `dist/V20260728`.
- Valid world IDs are exactly `corridor`, `sao`, `jiuzhou`, `vielsaen`, and `modern`.
- `amber` and `dragon` are removed, without save compatibility aliases.
- Existing Corridor, SAO, and Daming lore remains intact; only shared reproductive configuration is added.
- World-specific state advances only while its own world is selected; saved state for inactive worlds is retained.
- AI submits evidence/events; scripts alone compute cycles, conception, pregnancy, birth, ability registration, and stage progression.
- Invalid or backwards dates stop all time advancement.
- Local civilized species are furry; no local humans, humanoid fantasy races, primate furry, or species-bound culture/profession/alignment/ability.
- Normal and mythic species use separate registries; mythic creatures cannot awaken modern abilities.
- Retired Amber Sword, Dragon Raja, and Thriller Paradise runtime content must not remain in the two replacement modules.
- No new runtime dependencies.

---

### Task 1: Freeze runtime dictionaries and migration audit

**Files:**
- Create: `dist/V20260728/five-world-config.js`
- Create: `docs/migration/five-world-id-map.md`
- Create: `docs/migration/retired-content-audit.json`
- Create: `tests/five-world-config.test.mjs`

**Interfaces:**
- Produces: `WORLD_REGISTRY`, `NORMAL_SPECIES`, `MYTHIC_SPECIES`, `VIELSAEN_CONFIG`, `MODERN_CONFIG`, `REPLACEMENT_BONDS`.

- [ ] **Step 1: Write config tests**

```js
assert.deepEqual(Object.keys(WORLD_REGISTRY), ['corridor', 'sao', 'jiuzhou', 'vielsaen', 'modern']);
assert.equal(Object.keys(NORMAL_SPECIES).length, 18);
assert.equal(Object.keys(MYTHIC_SPECIES).length, 8);
assert.ok(REPLACEMENT_BONDS.every(x => ['vielsaen', 'modern'].includes(x.worldId)));
```

- [ ] **Step 2: Run the test and verify missing-module failure**

```bash
"/mnt/c/Program Files/nodejs/node.exe" --test tests/five-world-config.test.mjs
```

- [ ] **Step 3: Add exact registries and audit artifacts**

```js
export const WORLD_REGISTRY = Object.freeze({
  corridor: { label: '创世回廊', prefix: 'C', exclusiveState: null },
  sao: { label: '刀剑神域', prefix: 'S', exclusiveState: null },
  jiuzhou: { label: '大明志异', prefix: 'J', exclusiveState: null },
  vielsaen: { label: '维尔萨恩', prefix: 'V', exclusiveState: '维尔萨恩' },
  modern: { label: '现代都市', prefix: 'U', exclusiveState: '现代都市' }
});
```

- [ ] **Step 4: Run config tests**

```bash
"/mnt/c/Program Files/nodejs/node.exe" --test tests/five-world-config.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add dist/V20260728/five-world-config.js docs/migration tests/five-world-config.test.mjs
git commit -m "feat: freeze five-world runtime dictionaries"
```

### Task 2: Shared date, cycle, conception, pregnancy, and birth engine

**Files:**
- Create: `dist/V20260728/five-world-runtime.js`
- Create: `tests/reproduction-engine.test.mjs`

**Interfaces:**
- Consumes: all registries from `five-world-config.js`.
- Produces: `createPhysiologyProfile`, `createRootState`, `parseWorldDate`, `advanceState`, `submitConception`, `settleBirth`, `renderPhysiologySummary`.

- [ ] **Step 1: Write deterministic tests with an injected RNG**

```js
assert.equal(parseWorldDate('V2026年7月30日', 'vielsaen').iso, '2026-07-30');
assert.throws(() => advanceState(state, 'V2026年7月29日'), /日期倒退/);
assert.equal(submitConception(state, request, () => 0.01).status, '受孕成功');
assert.equal(submitConception(state, request, () => 0.01).duplicate, true);
assert.equal(settleBirth(state, pregnancy, () => 0.5).children.length, pregnancy.expectedCount);
```

- [ ] **Step 2: Run and verify missing-module failure**

```bash
"/mnt/c/Program Files/nodejs/node.exe" --test tests/reproduction-engine.test.mjs
```

- [ ] **Step 3: Implement minimal pure calculations and idempotent ledgers**

```js
export function submitConception(root, request, random = Math.random) {
  if (root.生殖系统.结算账本.some(x => x.事件ID === request.事件ID)) {
    return { ...root.生殖系统.结算账本.find(x => x.事件ID === request.事件ID), duplicate: true };
  }
  // validate adults/capabilities, snapshot parameters, then perform D100
}
```

- [ ] **Step 4: Run reproduction tests**

```bash
"/mnt/c/Program Files/nodejs/node.exe" --test tests/reproduction-engine.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add dist/V20260728/five-world-runtime.js tests/reproduction-engine.test.mjs
git commit -m "feat: add deterministic reproductive state engine"
```

### Task 3: Vielsaen evidence-gated state engine

**Files:**
- Modify: `dist/V20260728/five-world-runtime.js`
- Create: `tests/vielsaen-engine.test.mjs`

**Interfaces:**
- Produces: `advanceVielsaenState(state, event)`.

- [ ] **Step 1: Write tests for world isolation and evidence gates**

```js
assert.equal(advanceVielsaenState(v, { worldId: 'modern' }).changed, false);
assert.equal(advanceVielsaenState(v, { type: 'confirmHero', evidence: [] }).accepted, false);
assert.equal(advanceVielsaenState(v, validHeroEvidence).state.勇者.状态, '已确认');
assert.equal(overlap.最终受孕概率, baseline.最终受孕概率);
```

- [ ] **Step 2: Run and verify failures**

```bash
"/mnt/c/Program Files/nodejs/node.exe" --test tests/vielsaen-engine.test.mjs
```

- [ ] **Step 3: Implement demon king, hero, sanctuary, five-month window, and mana exhaustion transitions**

```js
if (!Array.isArray(event.evidence) || event.evidence.length === 0) {
  return reject('缺少剧情证据');
}
```

- [ ] **Step 4: Run tests and commit**

```bash
"/mnt/c/Program Files/nodejs/node.exe" --test tests/vielsaen-engine.test.mjs
git add dist/V20260728/five-world-runtime.js tests/vielsaen-engine.test.mjs
git commit -m "feat: add evidence-gated Vielsaen state engine"
```

### Task 4: Modern City ability and stage engine

**Files:**
- Modify: `dist/V20260728/five-world-runtime.js`
- Create: `tests/modern-engine.test.mjs`

**Interfaces:**
- Produces: `registerModernAbility(profile, evidence, random)` and `advanceModernState(state, event)`.

- [ ] **Step 1: Test species/ability separation, mythic rejection, and sequential stages**

```js
assert.equal(registerModernAbility(mythic, evidence).accepted, false);
assert.notEqual(registerModernAbility(canid, evidence, rng).ability.type, canid.具体种族);
assert.equal(advanceModernState(stage0, { targetStage: 2, evidence: ['x'] }).accepted, false);
assert.equal(advanceModernState(stage0, { targetStage: 1, evidence: ['sample', 'chain'] }).accepted, true);
```

- [ ] **Step 2: Run, implement, rerun, and commit**

```bash
"/mnt/c/Program Files/nodejs/node.exe" --test tests/modern-engine.test.mjs
git add dist/V20260728/five-world-runtime.js tests/modern-engine.test.mjs
git commit -m "feat: add Modern City ability and plot engine"
```

### Task 5: MVU event integration and five-world switching

**Files:**
- Modify: `dist/V20260728/helper-calculator.js`
- Modify: `dist/V20260728/mobile-phone.js`
- Modify: `dist/V20260728/build.html`
- Modify: `dist/V20260728/auto-fix.js`
- Create: `tests/runtime-integration.test.py`

**Interfaces:**
- Consumes: `window.DNFFiveWorld`.
- Produces: MVU initialization/migration, event handling, exact five-world selection.

- [ ] **Step 1: Add static integration assertions**

```python
assert "id: 'vielsaen'" in mobile
assert "id: 'modern'" in mobile
assert "id: 'amber'" not in active_world_registry
assert "DNFFiveWorld.advanceState" in calculator
```

- [ ] **Step 2: Run and verify failures**

```bash
python3 -m unittest tests/runtime-integration.test.py -v
```

- [ ] **Step 3: Import runtime, replace IDs/labels, initialize missing root state, and call the engine after MVU updates**

```js
import './five-world-runtime.js';
const result = DNFFiveWorld.advanceState(statData, statData?.世界信息?.日期);
```

- [ ] **Step 4: Run Python tests and Node syntax checks**

```bash
python3 -m unittest tests/runtime-integration.test.py -v
"/mnt/c/Program Files/nodejs/node.exe" --check dist/V20260728/helper-calculator.js
```

- [ ] **Step 5: Commit**

```bash
git add dist/V20260728/helper-calculator.js dist/V20260728/mobile-phone.js dist/V20260728/build.html dist/V20260728/auto-fix.js tests/runtime-integration.test.py
git commit -m "feat: integrate five-world runtime with MVU"
```

### Task 6: Replace retired bonds and rebalance characters

**Files:**
- Modify: `dist/V20260728/helper-calculator.js`
- Modify: `dist/V20260728/build.html`
- Modify: `dist/V20260728/external-status-bar.js`
- Modify: `dist/V20260728/mobile-phone.js`
- Create: `docs/migration/bond-ownership.md`
- Create: `tests/replacement-bonds.test.py`

**Interfaces:**
- Consumes: `REPLACEMENT_BONDS`.
- Produces: consistent character IDs and values in every active copy.

- [ ] **Step 1: Test retired IDs/names are absent from active character templates and every replacement has physiology**

```python
for character in replacements:
    self.assertTrue(character["生理档案"]["是否成年"])
    self.assertIn(character["世界归属"], {"vielsaen", "modern"})
```

- [ ] **Step 2: Run, replace templates at every call path, rerun, and commit**

```bash
python3 -m unittest tests/replacement-bonds.test.py -v
git add dist/V20260728 docs/migration/bond-ownership.md tests/replacement-bonds.test.py
git commit -m "feat: replace retired-world bond characters"
```

### Task 7: Status-bar, bond-detail, and mobile physiology UI

**Files:**
- Modify: `dist/V20260728/external-status-bar.js`
- Modify: `dist/V20260728/mobile-phone.js`
- Modify: `dist/V20260728/bootom-status-bar.html`
- Create: `tests/physiology-ui.test.py`

**Interfaces:**
- Consumes: `renderPhysiologySummary(profile)` and current world state.

- [ ] **Step 1: Assert the three required UI paths render all minimum fields and scope V/U state**

```python
for source in (status, mobile, bottom):
    self.assertIn("自然周期", source)
    self.assertIn("预计分娩日期", source)
```

- [ ] **Step 2: Implement a collapsed empty state and expanded active state**

```js
const reproductiveHtml = DNFFiveWorld.renderPhysiologySummary(profile);
```

- [ ] **Step 3: Run tests, syntax-check scripts, and commit**

```bash
python3 -m unittest tests/physiology-ui.test.py -v
git add dist/V20260728 tests/physiology-ui.test.py
git commit -m "feat: show physiology in desktop and mobile UI"
```

### Task 8: Replace both maps with state-driven original maps

**Files:**
- Create: `vielsaen_map.html`
- Create: `vielsaen_mapdata.js`
- Create: `modern_map.html`
- Create: `modern_mapdata.js`
- Delete: `amber_sword_worldmap.html`
- Delete: `amber_sword_mapdata.js`
- Delete: `dragon_map.html`
- Delete: `dragon_mapdata.js`
- Modify: active map links in `dist/V20260728/build.html` and scripts.
- Create: `tests/map-data.test.mjs`

**Interfaces:**
- Produces: `VIELSAEN_MAP` and `MODERN_MAP`; maps emit travel requests but do not advance story state.

- [ ] **Step 1: Test six nations/hotspots and global city/rift node schemas**

```js
assert.equal(new Set(VIELSAEN_MAP.nodes.map(x => x.nation)).size, 6);
assert.ok(MODERN_MAP.nodes.every(x => 'riftState' in x && Array.isArray(x.links)));
```

- [ ] **Step 2: Run, implement data and HTML renderers, rerun**

```bash
"/mnt/c/Program Files/nodejs/node.exe" --test tests/map-data.test.mjs
```

- [ ] **Step 3: Remove retired maps and commit**

```bash
git add -A
git commit -m "feat: replace retired-world maps"
```

### Task 9: Remove retired prompts, regex paths, and event fields

**Files:**
- Modify: `dist/V20260728/helper-calculator.js`
- Modify: `dist/V20260728/external-status-bar.js`
- Modify: `dist/V20260728/mobile-phone.js`
- Modify: `dist/V20260728/build.html`
- Modify: `dist/V20260728/bootom-status-bar.html`
- Create: `tests/retired-content-scan.py`

**Interfaces:**
- Produces: no active `amber`, `dragon`, Amber Sword, Dragon Raja, or Thriller Paradise runtime path.

- [ ] **Step 1: Write allowlist-based scan limited to migration documents/history**

```python
for path in ACTIVE_RUNTIME:
    for term in RETIRED_TERMS:
        self.assertNotIn(term, path.read_text(encoding="utf-8-sig"))
```

- [ ] **Step 2: Run, remove each reported active path, rerun, and commit**

```bash
python3 tests/retired-content-scan.py
git add dist/V20260728 tests/retired-content-scan.py
git commit -m "refactor: remove retired world runtime content"
```

### Task 10: Full regression and evidence audit

**Files:**
- Create: `tests/completion-audit.py`
- Create: `docs/migration/completion-report.md`

**Interfaces:**
- Consumes: every acceptance condition in the design specification.
- Produces: a requirement-by-requirement machine-readable result and human report.

- [ ] **Step 1: Run all behavior and static tests**

```bash
"/mnt/c/Program Files/nodejs/node.exe" --test tests/*.test.mjs
python3 -m unittest discover -s tests -p '*.test.py' -v
python3 tests/retired-content-scan.py
```

- [ ] **Step 2: Syntax-check all active JavaScript**

```bash
for file in dist/V20260728/*.js *_mapdata.js; do "/mnt/c/Program Files/nodejs/node.exe" --check "$file"; done
```

- [ ] **Step 3: Generate and inspect the completion report**

```bash
python3 tests/completion-audit.py
```

- [ ] **Step 4: Commit verified evidence**

```bash
git add tests/completion-audit.py docs/migration/completion-report.md
git commit -m "test: verify five-world migration acceptance"
```
