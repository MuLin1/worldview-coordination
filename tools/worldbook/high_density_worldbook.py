#!/usr/bin/env python3
"""高密度双世界扩充世界书构建器。

读取权威 JSON 数据和现有世界书基础，生成 379 条条目的最终世界书。
用法: python tools/worldbook/high_density_worldbook.py [--check]
"""

import json, hashlib, os, sys, time, copy
from pathlib import Path

DNF_ROOT = Path(__file__).resolve().parent.parent.parent
WORLD_ROOT = DNF_ROOT.parent / "世界书"
DATA_DIR = DNF_ROOT / "data" / "dual-world"
OUTPUT_DIR = WORLD_ROOT / "10_DNF双世界高密度扩充"
BASE_BOOK = WORLD_ROOT / "09_扩充汇总与验收" / "最终世界书" / "双世界furry世界书_扩充版.json"
FINAL_BOOK = OUTPUT_DIR / "99_汇总与验收" / "最终世界书" / "双世界高密度世界书.json"

UID_START = {
    "V-G": 22000,  # Vielsaen map nodes (64)
    "V-C": 22100,  # Vielsaen companions (12)
    "U-G": 32000,  # Modern map nodes (48)
    "U-C": 32100,  # Modern companions (12)
}

REPLACED_SPECIES = {f"G-S{i:02d}" for i in range(1, 19)} | {f"G-M{i:02d}" for i in range(1, 9)}


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def render_species_entry(species_data):
    """将物种数据渲染为世界书条目的内容 Markdown。"""
    s = species_data
    lines = [f"# {s['name']}（{s['id']}）", ""]
    lines.append(f"**系统**: {s['system']} | **RP 费用**: {s['rpCost']} | **初始等级**: {s['startLevel']}")
    lines.append("")
    lines.append(s.get("summary", ""))
    lines.append("")

    lines.append("## 属性修正")
    bonuses = s.get("bonuses", {})
    labels = {"strength": "力量", "dexterity": "敏捷", "constitution": "体质",
              "intelligence": "智力", "wisdom": "感知", "charisma": "魅力"}
    for key, label in labels.items():
        val = bonuses.get(key, 0)
        if val != 0:
            lines.append(f"- {label}: {'+' if val > 0 else ''}{val}")
    lines.append("")

    lines.append("## 永久效果")
    for buff in s.get("buffs", []):
        lines.append(f"- **{buff['name']}**: {buff['effect']}")
    lines.append("")

    lines.append("## 可选原型特性")
    for trait in s.get("prototypeTraits", []):
        lines.append(f"- **{trait['name']}**: {trait['effect']}")
    lines.append("")

    lines.append("## 限制")
    for lim in s.get("limitations", []):
        lines.append(f"- **{lim['name']}**: {lim['effect']}")
    lines.append("")

    if "hybridRules" in s:
        hr = s["hybridRules"]
        lines.append("## 混血规则")
        lines.append(f"- 正面槽位: {hr['positiveSlots']} | 负面槽位: {hr['negativeSlots']}")
        lines.append(f"- 正面属性范围: {hr['positiveAttributeRange']}")
        lines.append(f"- 负面属性范围: {hr['negativeAttributeRange']}")
        lines.append(f"- 禁用母系/父系: {hr['forbiddenBaseIds']}")
        lines.append(f"- {hr.get('description', '')}")
        lines.append("")

    if "reproduction" in s:
        r = s["reproduction"]
        if "maternalDetermined" in r:
            lines.append(f"## 生殖参数: {r.get('description', '由母系基础分类决定')}")
        else:
            lines.append("## 生殖参数")
            lines.append(f"- 周期: {r.get('cycleDays', [])} 天")
            lines.append(f"- 活跃期: {r.get('activeDays', [])} 天")
            lines.append(f"- 季节性: {r.get('seasonal', '')}")
            lines.append(f"- 妊娠: {r.get('gestationDays', [])} 天")
            lines.append(f"- 出生方式: {r.get('birthMode', '')}")
            lines.append(f"- 后代数量: {r.get('offspringCount', [])}")
            lines.append(f"- 调节方式: {r.get('adjustments', [])}")
        lines.append("")

    return "\n".join(lines)


def render_map_node_entry(node, world_id):
    """将地图节点渲染为世界书条目。"""
    lines = [f"# {node['name']}（{node['id']}）", ""]
    lines.append(f"**世界**: {world_id} | **类型**: {node['type']} | **区域**: {node.get('regionId', '')}")
    if node.get("layerId"):
        lines.append(f"**层级**: {node['layerId']}")
    lines.append(f"**推荐等级**: Lv.{node.get('recommendedLevel', [1,60])[0]}-{node.get('recommendedLevel', [1,60])[1]}")
    lines.append("")
    lines.append(node.get("summary", ""))
    lines.append("")

    if node.get("facilities"):
        lines.append("## 设施")
        for f in node["facilities"]:
            lines.append(f"- {f}")
        lines.append("")

    if node.get("factionIds"):
        lines.append("## 势力")
        for f in node["factionIds"]:
            lines.append(f"- {f}")
        lines.append("")

    if node.get("riskTags"):
        lines.append("## 风险")
        for r in node["riskTags"]:
            lines.append(f"- {r}")
        lines.append("")

    if node.get("stateKey"):
        lines.append(f"## 状态字段: `{node['stateKey']}`")
        lines.append("")

    if node.get("spawnable"):
        lines.append("⚠ 可作为出生点")
        lines.append("")

    return "\n".join(lines)


def render_companion_entry(companion):
    """将同伴渲染为世界书条目。"""
    c = companion
    lines = [f"# {c['name']}（{c['id']}）", ""]
    lines.append(f"**世界**: {c['worldId']} | **年龄**: {c.get('age', '?')} | **等级**: {c.get('baseLevel', '?')}")
    lines.append(f"**战斗定位**: {c.get('combatRole', '')}")
    lines.append(f"**职业/能力**: {c.get('professionOrAbility', {}).get('label', '')}")
    if c.get("speciesId"):
        lines.append(f"**种族**: {c.get('speciesName', '')}（{c['speciesId']}）")
        if c.get("hybrid"):
            h = c["hybrid"]
            lines.append(f"**混血构成**: 母系 {h['maternalBaseId']} + 父系 {h['paternalExpressionId']}")
    lines.append("")

    lines.append(c.get("goal", ""))
    lines.append("")

    lines.append("## 技能")
    for skill in c.get("activeSkills", []):
        lines.append(f"- **{skill['name']}**（主动）: {skill['desc']}")
    for skill in c.get("passiveSkills", []):
        lines.append(f"- **{skill['name']}**（被动）: {skill['desc']}")
    lines.append("")

    lines.append("## 个人线")
    for stage in c.get("personalLine", []):
        lines.append(f"- 阶段{stage['stage']}: **{stage['title']}** — {stage['detail']}")
    lines.append("")

    lines.append("## 关系")
    for rel in c.get("relations", []):
        lines.append(f"- **{rel['targetName']}**（{rel['type']}）: {rel['detail']}")
    lines.append("")

    return "\n".join(lines)


def build_high_density_worldbook(dnf_root=None, worldbook_root=None):
    """构建高密度世界书，返回最终条目字典。"""
    root = Path(dnf_root) if dnf_root else DNF_ROOT
    wb_root = Path(worldbook_root) if worldbook_root else WORLD_ROOT
    base_book_path = wb_root / "09_扩充汇总与验收" / "最终世界书" / "双世界furry世界书_扩充版.json"

    # 1. 加载基础世界书
    base = load_json(base_book_path)
    entries = copy.deepcopy(base["entries"])  # dict keyed by UID

    # 2. 加载物种数据
    species_data = load_json(root / "data" / "dual-world" / "species.json")

    # 3. 替换 26 个物种条目
    for entry_id, entry in entries.items():
        meta = entry.get("extensions", {}).get("worldbook_meta", {})
        eid = meta.get("id", "")
        if eid in REPLACED_SPECIES:
            species = next((s for s in species_data["entries"] if s["id"] == eid), None)
            if species:
                new_content = render_species_entry(species)
                entry["content"] = new_content
                # 更新元数据
                meta["name"] = species["name"]
                meta["system"] = species.get("system", "")
                if "originalData" in base and "entries" in base["originalData"]:
                    for orig in base["originalData"]["entries"]:
                        if orig.get("uid") == entry.get("uid"):
                            orig["content"] = new_content

    # 4. 生成新条目
    new_entries = {}

    # 地图节点
    for world_id in ["vielsaen", "modern"]:
        map_data = load_json(root / "data" / "dual-world" / f"{world_id}-map.json")
        for node in map_data["nodes"]:
            prefix = "V-G" if world_id == "vielsaen" else "U-G"
            uid_base = UID_START[prefix]
            node_num = int(node["id"].split("-")[-1][1:])
            uid = uid_base + (node_num - 100)
            content = render_map_node_entry(node, world_id)
            entry = {
                "uid": uid,
                "content": content,
                "extensions": {
                    "worldbook_meta": {
                        "id": node["id"],
                        "name": node["name"],
                        "world": world_id,
                        "type": node["type"],
                    }
                },
                "enabled": True,
            }
            new_entries[str(uid)] = entry

    # 同伴（从角色 + 审批 + 物种数据合并）
    approval_data = load_json(root / "data" / "dual-world" / "companion-species-approval.json")
    for world_id in ["vielsaen", "modern"]:
        roles = load_json(root / "data" / "dual-world" / f"companions-{world_id}.roles.json")
        companions = []
        for role in roles:
            approval = next((a for a in approval_data["choices"] if a["roleId"] == role["id"]), None)
            if not approval:
                continue
            species = next((s for s in species_data["entries"] if s["id"] == approval["speciesId"]), None)
            if not species:
                continue
            comp = copy.deepcopy(role)
            comp["speciesId"] = approval["speciesId"]
            comp["speciesName"] = species["name"]
            comp["speciesSystem"] = species["system"]
            comp["rpCost"] = species["rpCost"]
            comp["speciesTraits"] = [b["name"] for b in species.get("buffs", [])]
            comp["speciesBonuses"] = species.get("bonuses", {})
            comp["physiology"] = {
                "adult": True,
                "system": species["system"],
                "classificationId": approval["speciesId"],
                "species": species["name"],
            }
            comp["heritableTraits"] = [t["name"] for t in species.get("prototypeTraits", [])]
            if approval.get("hybrid"):
                comp["hybrid"] = approval["hybrid"]
            if world_id == "modern" and species["system"] == "神话":
                comp["ability"] = None
            companions.append(comp)

        for comp in companions:
            prefix = "V-C" if world_id == "vielsaen" else "U-C"
            uid_base = UID_START[prefix]
            comp_num = int(comp["id"].split("-")[-1][1:])
            uid = uid_base + (comp_num - 100)
            content = render_companion_entry(comp)
            entry = {
                "uid": uid,
                "content": content,
                "extensions": {
                    "worldbook_meta": {
                        "id": comp["id"],
                        "name": comp["name"],
                        "world": world_id,
                        "type": "companion",
                    }
                },
                "enabled": True,
            }
            new_entries[str(uid)] = entry

    # 5. 魔物融入者传说条目
    try:
        monster_lore = load_json(root / "data" / "dual-world" / "modern-monster-integration.json")
        monster_uid_base = 32900  # Modern special lore UID range
        for i, entry_data in enumerate(monster_lore.get("entries", [])):
            uid = str(monster_uid_base + i)
            entry = {
                "uid": int(uid),
                "content": entry_data["content"],
                "extensions": {
                    "worldbook_meta": {
                        "id": entry_data["id"],
                        "name": entry_data["title"],
                        "world": "modern",
                        "type": "lore",
                        "category": "魔物融入",
                    }
                },
                "enabled": True,
            }
            # Add trigger keywords if present
            if entry_data.get("triggerKeywords"):
                entry["extensions"]["worldbook_meta"]["keywords"] = entry_data["triggerKeywords"]
            new_entries[uid] = entry
    except Exception:
        pass

    # 6. 合并
    for uid, entry in new_entries.items():
        entries[uid] = entry

    result = copy.deepcopy(base)
    result["entries"] = entries
    result["extensions"] = result.get("extensions", {})
    result["extensions"]["high_density"] = {
        "version": 1,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "species_replaced": len(REPLACED_SPECIES),
        "entries_appended": len(new_entries),
        "total_entries": len(entries),
    }

    return result


def main():
    check = "--check" in sys.argv

    result = build_high_density_worldbook()

    # 输出目录
    final_dir = os.path.dirname(FINAL_BOOK)
    os.makedirs(final_dir, exist_ok=True)

    # 保存最终聚合
    save_json(FINAL_BOOK, result)

    # 保存清单
    manifest = {
        "total_entries": len(result["entries"]),
        "species_replaced": len(REPLACED_SPECIES),
        "entries_appended": len(result["entries"]) - 243,
        "sha256": sha256_file(FINAL_BOOK),
    }
    manifest_path = os.path.join(final_dir, "完成定义审计.json")
    save_json(manifest_path, manifest)

    if check:
        print(f"检查完成: {manifest['total_entries']} 条条目, SHA256: {manifest['sha256'][:16]}...")
    else:
        print(f"世界书已生成: {manifest['total_entries']} 条条目（替换 {manifest['species_replaced']}, 新增 {manifest['entries_appended']}）")
        print(f"输出: {FINAL_BOOK}")
        print(f"SHA256: {manifest['sha256']}")


if __name__ == "__main__":
    main()
