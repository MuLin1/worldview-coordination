from pathlib import Path

CORE = Path('dist/V20260728/world-map-core.js')
MODERN_PAGE = Path('modern_map.html')


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: expected exactly one match, found {count}')
    return text.replace(old, new, 1)


core = CORE.read_text(encoding='utf-8')

core = replace_once(
    core,
    """}\n\n/**\n * 在指定容器中挂载交互式世界地图。\n * @param {{container: HTMLElement, detail: HTMLElement, map: object, getState?: ()=>object, onSpawnSelected?: (nodeId:string)=>void}} opts\n * @returns {MapController}\n */\nexport function mountWorldMap({ container, detail, map, getState = (() => ({})), onSpawnSelected = (() => {}) }) {\n""",
    """}\n\nexport function isNodeSpawnSelectable(node, isSpawnSelectable) {\n  if (typeof isSpawnSelectable === 'function') {\n    return Boolean(isSpawnSelectable(node));\n  }\n  return Boolean(node?.spawnable);\n}\n\n/**\n * 在指定容器中挂载交互式世界地图。\n * @param {{container: HTMLElement, detail: HTMLElement, map: object, getState?: ()=>object, isSpawnSelectable?: (node:object)=>boolean, onSpawnSelected?: (nodeId:string)=>void}} opts\n * @returns {MapController}\n */\nexport function mountWorldMap({ container, detail, map, getState = (() => ({})), isSpawnSelectable, onSpawnSelected = (() => {}) }) {\n""",
    'add page-level spawn selection policy',
)

core = replace_once(
    core,
    """      const g = document.createElementNS(NS, 'g');\n      g.setAttribute('data-node-id', node.id);\n      g.classList.add('map-node');\n      g.classList.add(`node-${node.type}`);\n      if (node.spawnable) g.classList.add('node-spawnable');\n      if (state.currentNodeId === node.id) g.classList.add('node-current');\n""",
    """      const spawnSelectable = isNodeSpawnSelectable(node, isSpawnSelectable);\n      const g = document.createElementNS(NS, 'g');\n      g.setAttribute('data-node-id', node.id);\n      g.classList.add('map-node');\n      g.classList.add(`node-${node.type}`);\n      if (spawnSelectable) g.classList.add('node-spawnable');\n      if (state.currentNodeId === node.id) g.classList.add('node-current');\n""",
    'use resolved selection policy for node styling',
)

core = replace_once(
    core,
    """      g.style.cursor = node.spawnable ? 'pointer' : 'default';\n""",
    """      g.style.cursor = spawnSelectable ? 'pointer' : 'default';\n""",
    'use resolved selection policy for cursor',
)

core = replace_once(
    core,
    """        if (node.spawnable && onSpawnSelected) {\n          onSpawnSelected(node.id);\n        }\n""",
    """        if (spawnSelectable && onSpawnSelected) {\n          onSpawnSelected(node.id);\n        }\n""",
    'use resolved selection policy for callback',
)

CORE.write_text(core, encoding='utf-8')

page = MODERN_PAGE.read_text(encoding='utf-8')
page = replace_once(
    page,
    """  getState: readWorldState,\n  onSpawnSelected(nodeId) {\n""",
    """  getState: readWorldState,\n  // 现代地图由开始页统一校验禁用地点；普通城市和城区都应能提交为候选出生点。\n  isSpawnSelectable: () => true,\n  onSpawnSelected(nodeId) {\n""",
    'enable modern page node selection delegation',
)
MODERN_PAGE.write_text(page, encoding='utf-8')

print('updated modern map node selection policy')
