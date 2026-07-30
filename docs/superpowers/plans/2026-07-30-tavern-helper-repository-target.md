# Tavern Helper Repository Target Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Point the four active Tavern Helper loaders at `MuLin1/worldview-coordination@main`.

**Architecture:** Keep each JSON wrapper unchanged except for its jsDelivr import URL. Validate all JSON files and scan the loader directory for the retired repository URL.

**Tech Stack:** JSON, Python standard library.

## Global Constraints

- Preserve `dist/V20260728` paths.
- Preserve `?v=1`.
- Do not modify MVU, variable-update, or creative-workshop scripts.
- Add no dependencies.

---

### Task 1: Replace and verify loader URLs

**Files:**
- Modify: `../脚本/酒馆助手脚本-辅助计算脚本.json`
- Modify: `../脚本/酒馆助手脚本-格式修复.json`
- Modify: `../脚本/酒馆助手脚本-外置状态栏.json`
- Modify: `../脚本/酒馆助手脚本-小手机脚本.json`

**Interfaces:**
- Consumes: jsDelivr repository path and existing runtime filenames.
- Produces: four valid JSON loaders importing from `MuLin1/worldview-coordination@main`.

- [ ] **Step 1: Verify the old repository is present**

```bash
rg -l "tangquanghuy/dnf@latest" ../脚本/酒馆助手脚本-*.json
```

Expected: exactly the four files listed above.

- [ ] **Step 2: Apply the minimal replacement**

Replace:

```text
https://cdn.jsdelivr.net/gh/tangquanghuy/dnf@latest/
```

with:

```text
https://cdn.jsdelivr.net/gh/MuLin1/worldview-coordination@main/
```

- [ ] **Step 3: Validate JSON and exact URLs**

```bash
python3 - <<'PY'
import json
from pathlib import Path

root = Path("../脚本")
targets = {
    "酒馆助手脚本-辅助计算脚本.json": "helper-calculator.js",
    "酒馆助手脚本-格式修复.json": "auto-fix.js",
    "酒馆助手脚本-外置状态栏.json": "external-status-bar.js",
    "酒馆助手脚本-小手机脚本.json": "mobile-phone.js",
}
prefix = "import 'https://cdn.jsdelivr.net/gh/MuLin1/worldview-coordination@main/dist/V20260728/"
for name, script in targets.items():
    data = json.loads((root / name).read_text(encoding="utf-8"))
    assert data["content"] == f"{prefix}{script}?v=1'"
PY
```

Expected: exit code 0.

- [ ] **Step 4: Verify no retired loader URL remains**

```bash
! rg "tangquanghuy/dnf" ../脚本/酒馆助手脚本-*.json
```

Expected: exit code 0.
