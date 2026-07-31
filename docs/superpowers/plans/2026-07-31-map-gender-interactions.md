# Map and Gender Interaction Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 修复地图平移缩放、同伴生理档案保存失败，并支持自定义身份性别及独立生理字段。

**Architecture:** 地图交互继续集中在 `world-map-core.js`，将视口数学抽成纯函数后由 Pointer Events 和 wheel 事件调用。角色数据修复从源数据与生成器入手，页面仅提供防御性隔离；展示性别与运行时生理字段在开局页拆分。

**Tech Stack:** 原生 JavaScript ESM、Vue 3 全局构建、SVG、Node.js `node:test`、Python `unittest`。

## Global Constraints

- 不引入新的运行时依赖。
- 自动生成文件的结构性修复必须同步修改源数据和生成器。
- 地图缩放范围为 0.4–6，拖动阈值为 5 像素。
- 生理性别仅允许 `雌性/雄性/双性/无性/可变`。
- 生殖能力仅允许 `可妊娠/可授精/双向/无`。
- 自定义身份性别为空时保存为 `未指定`。

---

### Task 1: 同伴生理数据契约

**Files:**
- Modify: `data/dual-world/companion-species-approval.json`
- Modify: `scripts/build-dual-world-assets.mjs`
- Modify: `scripts/dual-world-data.mjs`
- Modify: `tests/opening-companion-compat.test.mjs`
- Regenerate: `dist/V20260728/generated/vielsaen-companions.js`
- Regenerate: `dist/V20260728/generated/modern-companions.js`

**Interfaces:**
- Consumes: approval choice `{ roleId, speciesId, sex, capability }`.
- Produces: generated companion `physiology` with `adult/system/classificationId/species/sex/capability`.

- [ ] **Step 1: Extend the failing compatibility test**

Add assertions that every replacement companion has a valid physiology sex and capability, then call:

```js
createPhysiologyProfile({
  ...companion.physiology,
  heritableTraits: companion.heritableTraits,
  cycleEnabled: true,
  cycleStartDate: '',
});
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/opening-companion-compat.test.mjs`
Expected: FAIL because generated companions have `physiology.sex === undefined`.

- [ ] **Step 3: Add source data fields**

For each approved companion, add explicit `sex` and `capability`. Use role presentation and existing names only to select the intended values; do not infer at runtime.

- [ ] **Step 4: Update generation and validation**

Write `approval.sex` and `approval.capability` into `companion.physiology`. Implement `validateFinalCompanions()` to reject missing or invalid values before generation.

- [ ] **Step 5: Regenerate and run tests**

Run:

```bash
node scripts/build-dual-world-assets.mjs --phase final
node --test tests/opening-companion-compat.test.mjs
```

Expected: both commands PASS.

### Task 2: 地图视口纯函数与交互

**Files:**
- Modify: `dist/V20260728/world-map-core.js`
- Modify: `tests/world-map-core.test.mjs`

**Interfaces:**
- Produces: `clampZoom(value)`, `panViewport(viewport, dx, dy)`, `zoomViewportAtPoint(viewport, nextZoom, pointX, pointY)`.
- `mountWorldMap()` consumes these helpers for pointer, wheel, and controller operations.

- [ ] **Step 1: Add failing viewport tests**

Test that panning adds deltas, zoom clamps to 0.4–6, and zooming at a point keeps that world point under the same screen coordinate.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/world-map-core.test.mjs`
Expected: FAIL because viewport helpers are not exported.

- [ ] **Step 3: Implement viewport helpers**

Use immutable return objects and finite-number normalization. The center-preserving formula is:

```js
const ratio = nextZoom / viewport.zoom;
return {
  zoom: nextZoom,
  panX: pointX - (pointX - viewport.panX) * ratio,
  panY: pointY - (pointY - viewport.panY) * ratio,
};
```

- [ ] **Step 4: Bind Pointer Events and wheel**

Track active pointers in a `Map`, use pointer capture, update pan for one pointer, update distance and center for two pointers, suppress node click after movement above 5 pixels, and set `svg.style.touchAction = 'none'`.

- [ ] **Step 5: Clean up listeners in destroy**

Remove all named listeners before removing the SVG.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/world-map-core.test.mjs`
Expected: PASS.

### Task 3: 自定义身份性别与独立生理字段

**Files:**
- Modify: `dist/V20260728/build.html`
- Modify: `tests/opening_ui_regression_test.py`

**Interfaces:**
- Produces reactive fields `customGender`, `biologicalSex`, `reproductiveCapability`.
- Produces computed `resolvedGenderIdentity` used for `人物.性别`.

- [ ] **Step 1: Add failing static regression tests**

Assert the build contains custom gender UI, separate biological sex and capability bindings, and does not contain the old `String(character.gender || '').includes('男')` inference.

- [ ] **Step 2: Run focused test and verify failure**

Run: `python -m unittest tests/opening_ui_regression_test.py`
Expected: FAIL on missing controls and legacy inference.

- [ ] **Step 3: Extend the reactive character model**

Add:

```js
customGender: '',
biologicalSex: '雄性',
reproductiveCapability: '可授精',
```

Add a computed identity value returning custom text or `未指定`.

- [ ] **Step 4: Replace the identity UI**

Use options `男性/女性/非二元/无性别/自定义`; conditionally render a text input for custom identity. Add select controls for biological sex and reproductive capability in the two active worlds.

- [ ] **Step 5: Update save flow**

Write `人物.性别 = resolvedGenderIdentity.value`. Pass `character.biologicalSex` and `character.reproductiveCapability` directly to `createPhysiologyProfile()`.

- [ ] **Step 6: Add companion save isolation**

Before creating each companion physiology profile, validate its fields. Invalid data logs an ID-specific error and omits `生理档案`, but does not abort saving.

- [ ] **Step 7: Run focused tests**

Run:

```bash
python -m unittest tests/opening_ui_regression_test.py
node --test tests/opening-companion-compat.test.mjs
```

Expected: PASS.

### Task 4: Full verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run JavaScript tests**

Run: `node --test tests/*.test.mjs`
Expected: PASS.

- [ ] **Step 2: Run Python tests**

Run: `python -m unittest discover -s tests -p '*test.py'`
Expected: PASS.

- [ ] **Step 3: Run generator drift check**

Run: `node scripts/build-dual-world-assets.mjs --phase final --check`
Expected: PASS with no validation errors.

- [ ] **Step 4: Review diff**

Confirm no generated file was edited without matching source/generator changes, no legacy inference remains, and all event listeners have cleanup paths.
