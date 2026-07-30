from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def replace_once(path: str, old: str, new: str) -> None:
    file_path = ROOT / path
    text = file_path.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: expected one match, found {count}\n--- pattern ---\n{old[:500]}")
    file_path.write_text(text.replace(old, new, 1), encoding="utf-8")


def patch_approval_data() -> None:
    path = ROOT / "data/dual-world/companion-species-approval.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    profiles = {
        "V-C100": ("雄性", "可授精"),
        "V-C101": ("雌性", "可妊娠"),
        "V-C102": ("雄性", "可授精"),
        "V-C103": ("雄性", "可授精"),
        "V-C104": ("雌性", "可妊娠"),
        "V-C105": ("雄性", "可授精"),
        "V-C106": ("雌性", "可妊娠"),
        "V-C107": ("雄性", "可授精"),
        "V-C108": ("雌性", "可妊娠"),
        "V-C109": ("雄性", "可授精"),
        "V-C110": ("雌性", "可妊娠"),
        "V-C111": ("雄性", "可授精"),
        "U-C100": ("雌性", "可妊娠"),
        "U-C101": ("雄性", "可授精"),
        "U-C102": ("雌性", "可妊娠"),
        "U-C103": ("雄性", "可授精"),
        "U-C104": ("雄性", "可授精"),
        "U-C105": ("雌性", "可妊娠"),
        "U-C106": ("雄性", "可授精"),
        "U-C107": ("雌性", "可妊娠"),
        "U-C108": ("雄性", "可授精"),
        "U-C109": ("雄性", "可授精"),
        "U-C110": ("雌性", "可妊娠"),
        "U-C111": ("雌性", "可妊娠"),
    }
    seen = set()
    for choice in data.get("choices", []):
        role_id = choice.get("roleId")
        if role_id not in profiles:
            raise RuntimeError(f"missing explicit physiology mapping for {role_id}")
        choice["sex"], choice["capability"] = profiles[role_id]
        seen.add(role_id)
    missing = set(profiles) - seen
    if missing:
        raise RuntimeError(f"approval choices missing roles: {sorted(missing)}")
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def patch_data_loader_and_validation() -> None:
    replace_once(
        "scripts/dual-world-data.mjs",
        """  const [species, vielsaenMap, modernMap, levels, vielsaenRoles, modernRoles] = await Promise.all([\n    loadJson(join(dataDir, 'species.json')),\n    loadJson(join(dataDir, 'vielsaen-map.json')),\n    loadJson(join(dataDir, 'modern-map.json')),\n    loadJson(join(dataDir, 'opening-levels.json')),\n    loadJson(join(dataDir, 'companions-vielsaen.roles.json')),\n    loadJson(join(dataDir, 'companions-modern.roles.json')),\n  ]);\n  return {\n    species,\n    maps: { vielsaen: vielsaenMap, modern: modernMap },\n    levels,\n    roles: { vielsaen: vielsaenRoles, modern: modernRoles },\n  };\n""",
        """  const [species, vielsaenMap, modernMap, levels, vielsaenRoles, modernRoles, approvals] = await Promise.all([\n    loadJson(join(dataDir, 'species.json')),\n    loadJson(join(dataDir, 'vielsaen-map.json')),\n    loadJson(join(dataDir, 'modern-map.json')),\n    loadJson(join(dataDir, 'opening-levels.json')),\n    loadJson(join(dataDir, 'companions-vielsaen.roles.json')),\n    loadJson(join(dataDir, 'companions-modern.roles.json')),\n    loadJson(join(dataDir, 'companion-species-approval.json')),\n  ]);\n  return {\n    species,\n    maps: { vielsaen: vielsaenMap, modern: modernMap },\n    levels,\n    roles: { vielsaen: vielsaenRoles, modern: modernRoles },\n    approvals,\n  };\n""",
    )
    replace_once(
        "scripts/dual-world-data.mjs",
        """function validateFinalCompanions(data) {\n  const issues = [];\n  // Will be populated after Gate B\n  return issues;\n}\n""",
        """function validateFinalCompanions(data) {\n  const issues = [];\n  const validSexes = new Set(['雌性', '雄性', '双性', '无性', '可变']);\n  const validCapabilities = new Set(['可妊娠', '可授精', '双向', '无']);\n  const choices = data.approvals?.choices;\n  if (!Array.isArray(choices)) {\n    issues.push(issue('approvals.choices', 'approval_choices_array', '同伴审批条目必须是数组'));\n    return issues;\n  }\n\n  const allRoles = [...(data.roles?.vielsaen || []), ...(data.roles?.modern || [])];\n  const roleIds = new Set(allRoles.map(role => role.id));\n  const choiceByRole = new Map();\n  for (const [index, choice] of choices.entries()) {\n    const path = `approvals.choices[${index}]`;\n    if (!roleIds.has(choice.roleId)) {\n      issues.push(issue(`${path}.roleId`, 'unknown_approved_role', `审批角色不存在: ${choice.roleId}`));\n    }\n    if (choiceByRole.has(choice.roleId)) {\n      issues.push(issue(`${path}.roleId`, 'duplicate_approved_role', `审批角色重复: ${choice.roleId}`));\n    }\n    choiceByRole.set(choice.roleId, choice);\n    if (!validSexes.has(choice.sex)) {\n      issues.push(issue(`${path}.sex`, 'invalid_companion_sex', `生理性别无效: ${choice.sex}`));\n    }\n    if (!validCapabilities.has(choice.capability)) {\n      issues.push(issue(`${path}.capability`, 'invalid_companion_capability', `生殖能力无效: ${choice.capability}`));\n    }\n  }\n\n  for (const role of allRoles) {\n    if (!choiceByRole.has(role.id)) {\n      issues.push(issue(`approvals.${role.id}`, 'missing_companion_approval', `缺少角色审批: ${role.id}`));\n    }\n  }\n  return issues;\n}\n""",
    )
    replace_once(
        "scripts/dual-world-data.mjs",
        "/** @typedef {{ species: SpeciesData, maps: {vielsaen: MapData, modern: MapData}, levels: LevelsData, roles: {vielsaen: any[], modern: any[]} }} DualWorldData */",
        "/** @typedef {{ species: SpeciesData, maps: {vielsaen: MapData, modern: MapData}, levels: LevelsData, roles: {vielsaen: any[], modern: any[]}, approvals: {choices: any[]} }} DualWorldData */",
    )


def patch_companion_generator() -> None:
    replace_once(
        "scripts/build-dual-world-assets.mjs",
        """  let approvals = [];\n  try {\n    const approvalData = JSON.parse(await readFile(join(DATA_DIR, 'companion-species-approval.json'), 'utf-8'));\n    approvals = approvalData.choices.filter(c => {\n      const role = roles.find(r => r.id === c.roleId);\n      return role && role.worldId === worldId;\n    });\n  } catch {\n    // approvals not yet available\n  }\n""",
        """  const approvals = (data.approvals?.choices || []).filter(choice => {\n    const role = roles.find(candidate => candidate.id === choice.roleId);\n    return role && role.worldId === worldId;\n  });\n""",
    )
    replace_once(
        "scripts/build-dual-world-assets.mjs",
        """    companion.physiology = {\n      adult: true,\n      system: species.system,\n      classificationId: approval.speciesId,\n      species: species.name,\n    };\n""",
        """    companion.physiology = {\n      adult: role.age >= 18,\n      sex: approval.sex,\n      capability: approval.capability,\n      system: species.system,\n      classificationId: approval.speciesId,\n      species: species.name,\n    };\n""",
    )


def patch_world_map_core() -> None:
    replace_once(
        "dist/V20260728/world-map-core.js",
        "const NS = 'http://www.w3.org/2000/svg';\n",
        """const NS = 'http://www.w3.org/2000/svg';\nconst MIN_MAP_ZOOM = 0.4;\nconst MAX_MAP_ZOOM = 6;\n\nconst finiteNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;\n\nexport function clampZoom(value) {\n  return Math.min(MAX_MAP_ZOOM, Math.max(MIN_MAP_ZOOM, finiteNumber(value, 1)));\n}\n\nexport function panViewport(viewport, deltaX, deltaY) {\n  return {\n    zoom: clampZoom(viewport?.zoom),\n    panX: finiteNumber(viewport?.panX) + finiteNumber(deltaX),\n    panY: finiteNumber(viewport?.panY) + finiteNumber(deltaY),\n  };\n}\n\nexport function zoomViewportAtPoint(viewport, nextZoom, pointX, pointY) {\n  const currentZoom = clampZoom(viewport?.zoom);\n  const zoom = clampZoom(nextZoom);\n  const panX = finiteNumber(viewport?.panX);\n  const panY = finiteNumber(viewport?.panY);\n  const x = finiteNumber(pointX);\n  const y = finiteNumber(pointY);\n  const ratio = zoom / currentZoom;\n  return {\n    zoom,\n    panX: x - (x - panX) * ratio,\n    panY: y - (y - panY) * ratio,\n  };\n}\n""",
    )
    replace_once(
        "dist/V20260728/world-map-core.js",
        """    zoom: 1,\n    panX: 0,\n    panY: 0,\n  };\n""",
        """    zoom: 1,\n    panX: 0,\n    panY: 0,\n    suppressClick: false,\n  };\n""",
    )
    replace_once(
        "dist/V20260728/world-map-core.js",
        """  svg.style.display = 'block';\n""",
        """  svg.style.display = 'block';\n  svg.style.touchAction = 'none';\n  svg.style.userSelect = 'none';\n  svg.style.cursor = 'grab';\n""",
    )
    replace_once(
        "dist/V20260728/world-map-core.js",
        """      g.addEventListener('click', (e) => {\n        if (detail) {\n          detail.innerHTML = renderNodeDetail(node);\n        }\n        if (node.spawnable && onSpawnSelected) {\n          onSpawnSelected(node.id);\n        }\n      });\n""",
        """      g.addEventListener('click', (event) => {\n        if (state.suppressClick) {\n          event.preventDefault();\n          event.stopPropagation();\n          return;\n        }\n        if (detail) {\n          detail.innerHTML = renderNodeDetail(node);\n        }\n        if (node.spawnable && onSpawnSelected) {\n          onSpawnSelected(node.id);\n        }\n      });\n""",
    )
    interaction_block = """\n  // ── 鼠标与触摸视口交互 ────────────────────────────────────\n\n  const activePointers = new Map();\n  const DRAG_THRESHOLD = 5;\n  let gestureTravel = 0;\n  let lastPinchDistance = 0;\n  let lastPinchCenter = null;\n  let suppressClickTimer = 0;\n\n  function eventToMapPoint(event) {\n    const rect = svg.getBoundingClientRect();\n    const width = Math.max(1, rect.width);\n    const height = Math.max(1, rect.height);\n    return {\n      x: ((event.clientX - rect.left) / width) * 100,\n      y: ((event.clientY - rect.top) / height) * 100,\n    };\n  }\n\n  function applyViewport(viewport) {\n    state.zoom = viewport.zoom;\n    state.panX = viewport.panX;\n    state.panY = viewport.panY;\n  }\n\n  function markGestureTravel(deltaX, deltaY, extra = 0) {\n    gestureTravel += Math.hypot(deltaX, deltaY) + Math.abs(extra);\n    if (gestureTravel > DRAG_THRESHOLD) state.suppressClick = true;\n  }\n\n  function currentPinch() {\n    const points = [...activePointers.values()].slice(0, 2);\n    if (points.length < 2) return null;\n    return {\n      distance: Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y),\n      center: {\n        x: (points[0].x + points[1].x) / 2,\n        y: (points[0].y + points[1].y) / 2,\n      },\n    };\n  }\n\n  function handlePointerDown(event) {\n    if (activePointers.size === 0) {\n      gestureTravel = 0;\n      state.suppressClick = false;\n      if (suppressClickTimer) clearTimeout(suppressClickTimer);\n    }\n    const point = eventToMapPoint(event);\n    activePointers.set(event.pointerId, point);\n    svg.style.cursor = 'grabbing';\n    try {\n      svg.setPointerCapture(event.pointerId);\n    } catch {\n      // Pointer capture is unavailable in a few embedded webviews.\n    }\n    const pinch = currentPinch();\n    lastPinchDistance = pinch?.distance || 0;\n    lastPinchCenter = pinch?.center || null;\n  }\n\n  function handlePointerMove(event) {\n    const previous = activePointers.get(event.pointerId);\n    if (!previous) return;\n    const point = eventToMapPoint(event);\n    activePointers.set(event.pointerId, point);\n\n    if (activePointers.size === 1) {\n      const deltaX = point.x - previous.x;\n      const deltaY = point.y - previous.y;\n      markGestureTravel(deltaX, deltaY);\n      applyViewport(panViewport(state, deltaX, deltaY));\n      refresh();\n      return;\n    }\n\n    const pinch = currentPinch();\n    if (!pinch) return;\n    if (lastPinchDistance > 0 && lastPinchCenter) {\n      const ratio = pinch.distance / lastPinchDistance;\n      let viewport = zoomViewportAtPoint(\n        state,\n        state.zoom * ratio,\n        lastPinchCenter.x,\n        lastPinchCenter.y,\n      );\n      const centerDeltaX = pinch.center.x - lastPinchCenter.x;\n      const centerDeltaY = pinch.center.y - lastPinchCenter.y;\n      viewport = panViewport(viewport, centerDeltaX, centerDeltaY);\n      markGestureTravel(centerDeltaX, centerDeltaY, pinch.distance - lastPinchDistance);\n      applyViewport(viewport);\n      refresh();\n    }\n    lastPinchDistance = pinch.distance;\n    lastPinchCenter = pinch.center;\n  }\n\n  function finishPointer(event) {\n    if (!activePointers.has(event.pointerId)) return;\n    activePointers.delete(event.pointerId);\n    try {\n      svg.releasePointerCapture(event.pointerId);\n    } catch {\n      // Ignore release errors from embedded webviews.\n    }\n    const pinch = currentPinch();\n    lastPinchDistance = pinch?.distance || 0;\n    lastPinchCenter = pinch?.center || null;\n    if (activePointers.size === 0) {\n      svg.style.cursor = 'grab';\n      if (state.suppressClick) {\n        suppressClickTimer = setTimeout(() => {\n          state.suppressClick = false;\n          suppressClickTimer = 0;\n        }, 0);\n      }\n    }\n  }\n\n  function handleWheel(event) {\n    event.preventDefault();\n    const point = eventToMapPoint(event);\n    const factor = Math.exp(-event.deltaY * 0.0015);\n    applyViewport(zoomViewportAtPoint(state, state.zoom * factor, point.x, point.y));\n    refresh();\n  }\n\n  svg.addEventListener('pointerdown', handlePointerDown);\n  svg.addEventListener('pointermove', handlePointerMove);\n  svg.addEventListener('pointerup', finishPointer);\n  svg.addEventListener('pointercancel', finishPointer);\n  svg.addEventListener('wheel', handleWheel, { passive: false });\n\n"""
    replace_once(
        "dist/V20260728/world-map-core.js",
        "  // ── 控制器 ───────────────────────────────────────────────\n",
        interaction_block + "  // ── 控制器 ───────────────────────────────────────────────\n",
    )
    replace_once(
        "dist/V20260728/world-map-core.js",
        """    destroy() {\n      container.removeChild(svg);\n    },\n""",
        """    destroy() {\n      svg.removeEventListener('pointerdown', handlePointerDown);\n      svg.removeEventListener('pointermove', handlePointerMove);\n      svg.removeEventListener('pointerup', finishPointer);\n      svg.removeEventListener('pointercancel', finishPointer);\n      svg.removeEventListener('wheel', handleWheel);\n      if (suppressClickTimer) clearTimeout(suppressClickTimer);\n      activePointers.clear();\n      if (svg.parentNode === container) container.removeChild(svg);\n    },\n""",
    )
    replace_once(
        "dist/V20260728/world-map-core.js",
        """    zoomIn() {\n      state.zoom = Math.min(state.zoom * 1.2, 4);\n      refresh();\n    },\n    zoomOut() {\n      state.zoom = Math.max(state.zoom / 1.2, 0.25);\n      refresh();\n    },\n""",
        """    zoomIn() {\n      applyViewport(zoomViewportAtPoint(state, state.zoom * 1.2, 50, 50));\n      refresh();\n    },\n    zoomOut() {\n      applyViewport(zoomViewportAtPoint(state, state.zoom / 1.2, 50, 50));\n      refresh();\n    },\n""",
    )


def patch_opening_page() -> None:
    replace_once(
        "dist/V20260728/build.html",
        """                                    <!-- 性别 -->\n                                    <div style=\"width:80px; flex-shrink:0;\" :class=\"{'field-locked': isPresetChar}\">\n                                        <label class=\"form-label\"\n                                            style=\"font-size:0.75rem; margin-bottom:4px;\">性别</label>\n                                        <select v-model=\"character.gender\" class=\"form-select\"\n                                            style=\"padding:10px 8px; font-size:0.9rem;\"\n                                            :class=\"{'locked-input': isPresetChar}\" :disabled=\"isPresetChar\">\n                                            <option>男性</option>\n                                            <option>女性</option>\n                                            <option>无</option>\n                                        </select>\n                                    </div>\n\n                                    <!-- 年龄 -->\n                                    <div style=\"width:60px; flex-shrink:0;\" :class=\"{'field-locked': isPresetChar}\">\n                                        <label class=\"form-label\"\n                                            style=\"font-size:0.75rem; margin-bottom:4px;\">年龄</label>\n                                        <input type=\"number\" v-model.number=\"character.age\" class=\"form-input\" min=\"1\"\n                                            style=\"text-align:center; padding:10px 8px; font-size:0.9rem;\"\n                                            :class=\"{'locked-input': isPresetChar}\" :readonly=\"isPresetChar\">\n                                    </div>\n""",
        """                                    <!-- 身份性别 -->\n                                    <div style=\"width:120px; flex-shrink:0;\" :class=\"{'field-locked': isPresetChar}\">\n                                        <label class=\"form-label\"\n                                            style=\"font-size:0.75rem; margin-bottom:4px;\">身份性别</label>\n                                        <select v-model=\"character.gender\" class=\"form-select\"\n                                            style=\"padding:10px 8px; font-size:0.9rem;\"\n                                            :class=\"{'locked-input': isPresetChar}\" :disabled=\"isPresetChar\">\n                                            <option>男性</option>\n                                            <option>女性</option>\n                                            <option>非二元</option>\n                                            <option>无性别</option>\n                                            <option>无</option>\n                                            <option>自定义</option>\n                                        </select>\n                                        <input v-if=\"character.gender === '自定义'\" v-model=\"character.customGender\"\n                                            class=\"form-input\" maxlength=\"30\" placeholder=\"输入性别描述...\"\n                                            style=\"margin-top:6px; padding:8px; font-size:0.8rem;\"\n                                            :class=\"{'locked-input': isPresetChar}\" :readonly=\"isPresetChar\">\n                                    </div>\n\n                                    <!-- 年龄 -->\n                                    <div style=\"width:60px; flex-shrink:0;\" :class=\"{'field-locked': isPresetChar}\">\n                                        <label class=\"form-label\"\n                                            style=\"font-size:0.75rem; margin-bottom:4px;\">年龄</label>\n                                        <input type=\"number\" v-model.number=\"character.age\" class=\"form-input\" min=\"1\"\n                                            style=\"text-align:center; padding:10px 8px; font-size:0.9rem;\"\n                                            :class=\"{'locked-input': isPresetChar}\" :readonly=\"isPresetChar\">\n                                    </div>\n\n                                    <template v-if=\"isVielsaenWorldview || isModernWorldview\">\n                                        <div style=\"width:100px; flex-shrink:0;\" :class=\"{'field-locked': isPresetChar}\">\n                                            <label class=\"form-label\"\n                                                style=\"font-size:0.75rem; margin-bottom:4px;\">生理性别</label>\n                                            <select v-model=\"character.biologicalSex\" class=\"form-select\"\n                                                style=\"padding:10px 8px; font-size:0.85rem;\"\n                                                :class=\"{'locked-input': isPresetChar}\" :disabled=\"isPresetChar\">\n                                                <option>雄性</option>\n                                                <option>雌性</option>\n                                                <option>双性</option>\n                                                <option>无性</option>\n                                                <option>可变</option>\n                                            </select>\n                                        </div>\n                                        <div style=\"width:105px; flex-shrink:0;\" :class=\"{'field-locked': isPresetChar}\">\n                                            <label class=\"form-label\"\n                                                style=\"font-size:0.75rem; margin-bottom:4px;\">生殖能力</label>\n                                            <select v-model=\"character.reproductiveCapability\" class=\"form-select\"\n                                                style=\"padding:10px 8px; font-size:0.85rem;\"\n                                                :class=\"{'locked-input': isPresetChar}\" :disabled=\"isPresetChar\">\n                                                <option>可授精</option>\n                                                <option>可妊娠</option>\n                                                <option>双向</option>\n                                                <option>无</option>\n                                            </select>\n                                        </div>\n                                    </template>\n""",
    )
    replace_once(
        "dist/V20260728/build.html",
        """                    name: '',\n                    gender: '男性',\n                    age: 18,\n""",
        """                    name: '',\n                    gender: '男性',\n                    customGender: '',\n                    biologicalSex: '雄性',\n                    reproductiveCapability: '可授精',\n                    age: 18,\n""",
    )
    replace_once(
        "dist/V20260728/build.html",
        """                });\n\n                const TEAMMATE_IMAGE_TIMEOUT_STEPS = [12000, 18000, 26000, 36000, 50000];\n""",
        """                });\n\n                const PHYSIOLOGY_DEFAULTS_BY_IDENTITY = Object.freeze({\n                    男性: Object.freeze({ sex: '雄性', capability: '可授精' }),\n                    女性: Object.freeze({ sex: '雌性', capability: '可妊娠' }),\n                    非二元: Object.freeze({ sex: '双性', capability: '双向' }),\n                    无性别: Object.freeze({ sex: '无性', capability: '无' }),\n                    无: Object.freeze({ sex: '无性', capability: '无' })\n                });\n                watch(() => character.gender, (gender) => {\n                    const defaults = PHYSIOLOGY_DEFAULTS_BY_IDENTITY[gender];\n                    if (!defaults) return;\n                    character.biologicalSex = defaults.sex;\n                    character.reproductiveCapability = defaults.capability;\n                }, { immediate: true });\n\n                const TEAMMATE_IMAGE_TIMEOUT_STEPS = [12000, 18000, 26000, 36000, 50000];\n""",
    )
    replace_once(
        "dist/V20260728/build.html",
        """                        // 7. 构建人物数据\n                        mvuData.stat_data.人物 = {\n                            ...(mvuData.stat_data.人物 || {}),\n                            名称: character.name || '冒险者',\n                            种族: actualRaceName,\n""",
        """                        // 7. 构建人物数据\n                        const resolvedGenderIdentity = character.gender === '自定义'\n                            ? (String(character.customGender || '').trim() || '未指定')\n                            : (String(character.gender || '').trim() || '未指定');\n                        mvuData.stat_data.人物 = {\n                            ...(mvuData.stat_data.人物 || {}),\n                            名称: character.name || '冒险者',\n                            性别: resolvedGenderIdentity,\n                            种族: actualRaceName,\n""",
    )
    replace_once(
        "dist/V20260728/build.html",
        """                        if (isVielsaenWorldview.value || isModernWorldview.value) {\n                            const selectedSpecies = availableRaces.value.find(item => item.name === actualRaceName);\n                            const normalizedSex = String(character.gender || '').includes('男')\n                                ? '雄性'\n                                : String(character.gender || '').includes('女')\n                                    ? '雌性'\n                                    : '双性';\n                            const capability = normalizedSex === '雄性'\n                                ? '可授精'\n                                : normalizedSex === '雌性'\n                                    ? '可妊娠'\n                                    : '双向';\n                            const worldPrefix = isVielsaenWorldview.value ? 'V' : 'U';\n                            mvuData.stat_data.人物.生理档案 = createPhysiologyProfile({\n                                adult: Number(character.age) >= 18,\n                                sex: normalizedSex,\n                                capability,\n                                system: selectedSpecies?.system || '普通',\n""",
        """                        if (isVielsaenWorldview.value || isModernWorldview.value) {\n                            const selectedSpecies = availableRaces.value.find(item => item.name === actualRaceName);\n                            const worldPrefix = isVielsaenWorldview.value ? 'V' : 'U';\n                            mvuData.stat_data.人物.生理档案 = createPhysiologyProfile({\n                                adult: Number(character.age) >= 18,\n                                sex: character.biologicalSex,\n                                capability: character.reproductiveCapability,\n                                system: selectedSpecies?.system || '普通',\n""",
    )
    replace_once(
        "dist/V20260728/build.html",
        """                            teammateFullData[characterConfig.name] = {\n                                角色ID: characterConfig.id,\n                                世界归属: characterConfig.worldId,\n                                性别: characterConfig.physiology.sex,\n""",
        """                            const physiology = characterConfig.physiology || {};\n                            const hasValidPhysiology = ['雌性', '雄性', '双性', '无性', '可变'].includes(physiology.sex)\n                                && ['可妊娠', '可授精', '双向', '无'].includes(physiology.capability);\n                            const companionPhysiology = hasValidPhysiology\n                                ? createPhysiologyProfile({\n                                    adult: physiology.adult,\n                                    sex: physiology.sex,\n                                    capability: physiology.capability,\n                                    system: physiology.system,\n                                    classificationId: physiology.classificationId,\n                                    species: characterConfig.species,\n                                    heritableTraits: characterConfig.heritableTraits || [],\n                                    cycleEnabled: true,\n                                    cycleStartDate: ''\n                                })\n                                : null;\n                            if (!hasValidPhysiology) {\n                                console.error('[RPG开局] 同伴生理配置无效，已跳过生理档案:', characterConfig.id, physiology);\n                            }\n                            teammateFullData[characterConfig.name] = {\n                                角色ID: characterConfig.id,\n                                世界归属: characterConfig.worldId,\n                                性别: physiology.sex || '未知',\n""",
    )
    replace_once(
        "dist/V20260728/build.html",
        """                                生理档案: createPhysiologyProfile({\n                                    adult: characterConfig.physiology.adult,\n                                    sex: characterConfig.physiology.sex,\n                                    capability: characterConfig.physiology.capability,\n                                    system: characterConfig.physiology.system,\n                                    classificationId: characterConfig.physiology.classificationId,\n                                    species: characterConfig.species,\n                                    heritableTraits: characterConfig.heritableTraits,\n                                    cycleEnabled: true,\n                                    cycleStartDate: ''\n                                }),\n""",
        """                                生理档案: companionPhysiology,\n""",
    )
    replace_once(
        "dist/V20260728/build.html",
        """                            性别: character.gender,\n""",
        """                            性别: character.gender === '自定义'\n                                ? (String(character.customGender || '').trim() || '未指定')\n                                : (String(character.gender || '').trim() || '未指定'),\n""",
    )


def main() -> None:
    patch_approval_data()
    patch_data_loader_and_validation()
    patch_companion_generator()
    patch_world_map_core()
    patch_opening_page()
    print("Applied map, companion physiology, and custom gender fixes.")


if __name__ == "__main__":
    main()
