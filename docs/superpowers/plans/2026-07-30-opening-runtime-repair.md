# Opening Runtime Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Tavern opening loader mount Vue reliably and resolve all startup resources from the current repository.

**Architecture:** Keep the existing fetch-and-`document.write` loader. Resolve the current `main` SHA at runtime, establish an immutable CDN base from that SHA, then make the page consistently resolve URLs through `document.baseURI` and imported five-world configuration.

**Tech Stack:** JSON regex configuration, HTML, Vue 3 global build, ES modules, Python unittest, Playwright browser verification.

## Global Constraints

- Do not hardcode a commit SHA; resolve the current `main` SHA on every load.
- Do not modify unrelated dirty files.
- Apply only root-cause fixes identified by the browser reproduction.

---

### Task 1: Add startup regression coverage

**Files:**
- Create: `tests/opening-runtime.test.py`

**Interfaces:**
- Consumes: `dist/V20260728/build.html`, sibling `正则/regex-开局.json`, repository assets.
- Produces: static assertions for loader base, URL bases, species configuration, and assets.

- [ ] **Step 1: Write the failing tests**
- [ ] **Step 2: Run `python3 -m unittest tests/opening-runtime.test.py -v` and verify the expected failures**
- [ ] **Step 3: Keep the tests unchanged while applying Tasks 2-4**

### Task 2: Repair the opening loader

**Files:**
- Modify: `../正则/regex-开局.json`

**Interfaces:**
- Consumes: fetched `build.html` text.
- Produces: a dynamically resolved commit URL and injected CDN `<base>` before `document.write`.

- [ ] **Step 1: Resolve the current `main` SHA with the GitHub commits API**
- [ ] **Step 2: Inject that commit's `dist/V20260728/` CDN base into `<head>`**
- [ ] **Step 3: Re-run the focused test**

### Task 3: Repair opening-page initialization

**Files:**
- Modify: `dist/V20260728/build.html`

**Interfaces:**
- Consumes: `document.baseURI`, `NORMAL_SPECIES`, `MYTHIC_SPECIES`.
- Produces: valid map URLs and camp lookup data without legacy globals.

- [ ] **Step 1: Replace embedded URL bases with `document.baseURI`**
- [ ] **Step 2: Derive camp name sets from imported species dictionaries**
- [ ] **Step 3: Re-run the focused test**

### Task 4: Repair asset paths

**Files:**
- Modify: `dist/V20260728/build.html`

**Interfaces:**
- Consumes: repository-root `start_equipment_shop.json` and an existing visual asset.
- Produces: fetchable startup resources.

- [ ] **Step 1: Correct the equipment JSON relative path**
- [ ] **Step 2: Replace or remove the missing `bg.png` reference**
- [ ] **Step 3: Re-run the focused test**

### Task 5: Browser and repository verification

**Files:**
- Verify only.

**Interfaces:**
- Consumes: final loader and page.
- Produces: evidence that Vue mounts and the modal is closed.

- [ ] **Step 1: Run the browser reproduction**
- [ ] **Step 2: Run all Python and Node repository tests**
- [ ] **Step 3: Review the scoped diff and confirm unrelated dirty files were preserved**
