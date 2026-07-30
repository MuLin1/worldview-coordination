// 世界地图核心：图归一化、状态感知路由、SVG 渲染
// 无外部依赖，纯 ESM 模块

// ─── 图归一化 ──────────────────────────────────────────────

/**
 * 将地图数据转换为路由可用的归一化图。
 * @param {{nodes:{id:string}[], edges:{from:string,to:string,bidirectional:boolean}[]}} map
 * @returns {NormalizedGraph}
 */
export function normalizeGraph(map) {
  const nodeIndex = new Map();
  const adjacency = new Map();
  const nodeById = new Map();

  for (const node of map.nodes) {
    nodeById.set(node.id, node);
    nodeIndex.set(node.id, nodeIndex.size);
  }

  for (const node of map.nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of map.edges) {
    if (!nodeById.has(edge.from) || !nodeById.has(edge.to)) continue;
    adjacency.get(edge.from).push({
      to: edge.to,
      edge: edge,
      weight: {},
    });
    if (edge.bidirectional) {
      adjacency.get(edge.to).push({
        to: edge.from,
        edge: edge,
        weight: {},
      });
    }
  }

  return { nodeIndex, adjacency, nodeById };
}

// ─── 状态感知边检测 ────────────────────────────────────────

const BLOCKED_VALUES = new Set([true, '封锁', '关闭', 'blocked', 'closed']);

/**
 * 检查一条边在当前世界状态下是否开放。
 * @param {{stateKey:string}} edge
 * @param {object} state - 形如 {blocked:{ac:true}} 或 {test:{key:'封锁'}} 的嵌套状态对象
 * @returns {boolean}
 */
export function isEdgeOpen(edge, state = {}) {
  if (!edge.stateKey) return true;
  const keys = edge.stateKey.split('.');
  let current = state;
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return true;
    current = current[key];
  }
  if (current === undefined || current === null) return true;
  if (typeof current === 'boolean') return !current;
  if (typeof current === 'string') return !BLOCKED_VALUES.has(current);
  return true;
}

// ─── Dijkstra 路由 ─────────────────────────────────────────

/**
 * 使用 Dijkstra 算法查找最短路径。
 * @param {object} map - 原始地图数据
 * @param {string} fromId - 起点节点 ID
 * @param {string} toId - 终点节点 ID
 * @param {'time'|'cost'|'risk'} criterion - 优化标准
 * @param {object} state - 世界状态
 * @returns {RouteResult|null}
 */
export function findRoute(map, fromId, toId, criterion = 'time', state = {}) {
  const graph = normalizeGraph(map);

  if (!graph.nodeById.has(fromId) || !graph.nodeById.has(toId)) return null;
  if (fromId === toId) return { nodeIds: [fromId], edges: [], totalWeight: 0, criterion };

  const dist = new Map();
  const prev = new Map();
  const prevEdge = new Map();
  const visited = new Set();
  const unvisited = new Set();

  for (const nodeId of graph.nodeById.keys()) {
    dist.set(nodeId, Infinity);
    unvisited.add(nodeId);
  }
  dist.set(fromId, 0);

  while (unvisited.size > 0) {
    // 找到距离最小的未访问节点
    let minDist = Infinity;
    let current = null;
    for (const nodeId of unvisited) {
      const d = dist.get(nodeId);
      if (d < minDist) {
        minDist = d;
        current = nodeId;
      }
    }

    if (current === null || minDist === Infinity) break;
    if (current === toId) break;

    unvisited.delete(current);
    visited.add(current);

    for (const neighbor of graph.adjacency.get(current) || []) {
      if (visited.has(neighbor.to)) continue;
      if (!isEdgeOpen(neighbor.edge, state)) continue;

      const weight = Number(neighbor.edge[criterion] ?? 0);
      if (isNaN(weight)) continue;

      const alt = dist.get(current) + weight;
      if (alt < dist.get(neighbor.to)) {
        dist.set(neighbor.to, alt);
        prev.set(neighbor.to, current);
        prevEdge.set(neighbor.to, neighbor.edge);
      }
    }
  }

  if (!prev.has(toId) && fromId !== toId) return null;
  if (dist.get(toId) === Infinity) return null;

  // 重建路径
  const nodeIds = [];
  const edges = [];
  let current = toId;
  while (current !== fromId) {
    nodeIds.unshift(current);
    const edge = prevEdge.get(current);
    if (edge) edges.unshift(edge);
    current = prev.get(current);
    if (!current) return null; // 防护
  }
  nodeIds.unshift(fromId);

  return {
    nodeIds,
    edges,
    totalWeight: dist.get(toId),
    criterion,
  };
}

// ─── 可达节点 ──────────────────────────────────────────────

/**
 * 从指定节点出发，通过 BFS 找到所有可达节点。
 * @param {object} map
 * @param {string} fromId
 * @param {object} state
 * @returns {Set<string>}
 */
export function getReachableNodeIds(map, fromId, state = {}) {
  const graph = normalizeGraph(map);
  const reachable = new Set();
  const queue = [fromId];
  reachable.add(fromId);

  while (queue.length > 0) {
    const current = queue.shift();
    for (const neighbor of graph.adjacency.get(current) || []) {
      if (reachable.has(neighbor.to)) continue;
      if (!isEdgeOpen(neighbor.edge, state)) continue;
      reachable.add(neighbor.to);
      queue.push(neighbor.to);
    }
  }

  return reachable;
}

// ─── SVG 地图渲染 ──────────────────────────────────────────

const NS = 'http://www.w3.org/2000/svg';

/**
 * 在指定容器中挂载交互式世界地图。
 * @param {{container: HTMLElement, detail: HTMLElement, map: object, getState?: ()=>object, onSpawnSelected?: (nodeId:string)=>void}} opts
 * @returns {MapController}
 */
export function mountWorldMap({ container, detail, map, getState = (() => ({})), onSpawnSelected = (() => {}) }) {
  const state = {
    currentNodeId: null,
    criterion: 'time',
    routeFrom: null,
    routeTo: null,
    showHidden: false,
    typeFilter: new Set(),
    zoom: 1,
    panX: 0,
    panY: 0,
  };

  // 创建 SVG 元素
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.style.display = 'block';

  const defs = document.createElementNS(NS, 'defs');
  svg.appendChild(defs);

  // 箭头标记
  const marker = document.createElementNS(NS, 'marker');
  marker.setAttribute('id', 'arrow');
  marker.setAttribute('markerWidth', '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX', '9');
  marker.setAttribute('refY', '3');
  marker.setAttribute('orient', 'auto');
  const arrowPath = document.createElementNS(NS, 'path');
  arrowPath.setAttribute('d', 'M0,0 L0,6 L9,3 z');
  arrowPath.setAttribute('fill', '#666');
  marker.appendChild(arrowPath);
  defs.appendChild(marker);

  // 图层组
  const gEdges = document.createElementNS(NS, 'g');
  gEdges.setAttribute('id', 'edges-layer');
  svg.appendChild(gEdges);

  const gNodes = document.createElementNS(NS, 'g');
  gNodes.setAttribute('id', 'nodes-layer');
  svg.appendChild(gNodes);

  const gRoute = document.createElementNS(NS, 'g');
  gRoute.setAttribute('id', 'route-layer');
  svg.appendChild(gRoute);

  container.appendChild(svg);

  // ── 渲染函数 ─────────────────────────────────────────────

  function currentState() {
    return getState();
  }

  function refresh() {
    const { zoom, panX, panY } = state;
    const gTransform = `translate(${panX},${panY}) scale(${zoom})`;

    // 渲染边
    gEdges.innerHTML = '';
    gEdges.setAttribute('transform', gTransform);
    for (const edge of map.edges) {
      const fromNode = map.nodes.find(n => n.id === edge.from);
      const toNode = map.nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) continue;

      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', fromNode.x);
      line.setAttribute('y1', fromNode.y);
      line.setAttribute('x2', toNode.x);
      line.setAttribute('y2', toNode.y);
      line.setAttribute('data-edge-id', edge.id);
      line.setAttribute('data-from', edge.from);
      line.setAttribute('data-to', edge.to);
      line.classList.add('map-edge');

      const open = isEdgeOpen(edge, currentState());
      if (!open) {
        line.classList.add('edge-blocked');
        line.setAttribute('stroke', 'red');
        line.setAttribute('stroke-dasharray', '4,4');
      } else {
        const criterion = state.criterion;
        const w = edge[criterion] ?? 1;
        const hue = criterion === 'risk' ? 0 : criterion === 'cost' ? 240 : 120;
        const lightness = Math.max(30, 80 - (w / Math.max(...map.edges.map(e => e[criterion] || 1))) * 50);
        line.setAttribute('stroke', `hsl(${hue}, 60%, ${lightness}%)`);
      }
      line.setAttribute('stroke-width', '0.8');
      line.setAttribute('stroke-opacity', '0.82');
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      if (!edge.bidirectional) {
        line.setAttribute('marker-end', 'url(#arrow)');
      }

      const title = document.createElementNS(NS, 'title');
      title.textContent = `${fromNode.name} → ${toNode.name} (${edge.mode || '?'})`;
      line.appendChild(title);
      gEdges.appendChild(line);
    }

    // 渲染节点
    gNodes.innerHTML = '';
    gNodes.setAttribute('transform', gTransform);
    for (const node of map.nodes) {
      // 隐藏节点过滤
      if (node.layerId === 'hidden' && !state.showHidden) {
        const revealKey = node.stateKey;
        if (revealKey) {
          const keys = revealKey.split('.');
          let current = currentState();
          for (const k of keys) {
            current = current?.[k];
          }
          if (!current) continue;
        } else {
          continue;
        }
      }

      // 类型过滤
      if (state.typeFilter.size > 0 && !state.typeFilter.has(node.type)) continue;

      const g = document.createElementNS(NS, 'g');
      g.setAttribute('data-node-id', node.id);
      g.classList.add('map-node');
      g.classList.add(`node-${node.type}`);
      if (node.spawnable) g.classList.add('node-spawnable');
      if (state.currentNodeId === node.id) g.classList.add('node-current');

      // 节点底板
      const el = document.createElementNS(NS, 'circle');
      el.setAttribute('cx', node.x);
      el.setAttribute('cy', node.y);
      el.setAttribute('r', nodeRadius(node.type));
      el.setAttribute('fill', nodeColor(node.type, node.spawnable));
      el.setAttribute('stroke', '#333');
      el.setAttribute('stroke-width', '0.5');
      g.appendChild(el);

      // 类型图标
      const icon = document.createElementNS(NS, 'text');
      icon.setAttribute('x', node.x);
      icon.setAttribute('y', node.y);
      icon.setAttribute('text-anchor', 'middle');
      icon.setAttribute('dominant-baseline', 'central');
      icon.setAttribute('font-size', Math.max(2.2, nodeRadius(node.type) * 1.15));
      icon.setAttribute('fill', '#fff');
      icon.setAttribute('class', 'node-icon');
      icon.setAttribute('pointer-events', 'none');
      icon.textContent = getNodeIcon(node.type);
      g.appendChild(icon);

      // 标签
      const text = document.createElementNS(NS, 'text');
      text.setAttribute('x', node.x);
      text.setAttribute('y', node.y + nodeRadius(node.type) + 3);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-size', '2.5');
      text.setAttribute('fill', 'currentColor');
      text.setAttribute('paint-order', 'stroke');
      text.setAttribute('stroke', 'rgba(0,0,0,0.75)');
      text.setAttribute('stroke-width', '0.35');
      text.setAttribute('class', 'node-label');
      text.textContent = node.name;
      g.appendChild(text);

      // 悬停标题
      const title = document.createElementNS(NS, 'title');
      title.textContent = `${node.name} [${node.type}] Lv.${node.recommendedLevel?.[0] || '?'}-${node.recommendedLevel?.[1] || '?'}`;
      g.appendChild(title);

      // 点击事件
      g.style.cursor = node.spawnable ? 'pointer' : 'default';
      g.addEventListener('click', (e) => {
        if (detail) {
          detail.innerHTML = renderNodeDetail(node);
        }
        if (node.spawnable && onSpawnSelected) {
          onSpawnSelected(node.id);
        }
      });

      gNodes.appendChild(g);
    }

    // 渲染路线
    gRoute.innerHTML = '';
    gRoute.setAttribute('transform', gTransform);
    if (state.routeFrom && state.routeTo) {
      const result = findRoute(map, state.routeFrom, state.routeTo, state.criterion, currentState());
      if (result) {
        for (const edge of result.edges) {
          const fromNode = map.nodes.find(n => n.id === edge.from);
          const toNode = map.nodes.find(n => n.id === edge.to);
          if (!fromNode || !toNode) continue;
          const line = document.createElementNS(NS, 'line');
          line.setAttribute('x1', fromNode.x);
          line.setAttribute('y1', fromNode.y);
          line.setAttribute('x2', toNode.x);
          line.setAttribute('y2', toNode.y);
          line.setAttribute('stroke', '#ff6600');
          line.setAttribute('stroke-width', '2');
          line.setAttribute('stroke-linecap', 'round');
          line.setAttribute('vector-effect', 'non-scaling-stroke');
          gRoute.appendChild(line);
        }
      }
    }

    // 可达节点高亮
    if (state.currentNodeId) {
      const reachable = getReachableNodeIds(map, state.currentNodeId, currentState());
      for (const el of gNodes.children) {
        const nodeId = el.getAttribute('data-node-id');
        if (reachable.has(nodeId) && nodeId !== state.currentNodeId) {
          el.classList.add('node-reachable');
          const circle = el.querySelector('circle, rect');
          if (circle) {
            circle.setAttribute('stroke', '#00aa00');
            circle.setAttribute('stroke-width', '1.5');
          }
        }
      }
    }
  }

  // ── 控制器 ───────────────────────────────────────────────

  const controller = {
    destroy() {
      container.removeChild(svg);
    },
    setCurrentNode(nodeId) {
      state.currentNodeId = nodeId;
      refresh();
    },
    setCriterion(criterion) {
      state.criterion = criterion;
      refresh();
    },
    setRoute(fromId, toId) {
      state.routeFrom = fromId;
      state.routeTo = toId;
      refresh();
    },
    refreshState() {
      refresh();
    },
    setFilter(types) {
      state.typeFilter = new Set(types);
      refresh();
    },
    toggleHidden(show) {
      state.showHidden = show;
      refresh();
    },
    zoomIn() {
      state.zoom = Math.min(state.zoom * 1.2, 4);
      refresh();
    },
    zoomOut() {
      state.zoom = Math.max(state.zoom / 1.2, 0.25);
      refresh();
    },
    resetView() {
      state.zoom = 1;
      state.panX = 0;
      state.panY = 0;
      refresh();
    },
  };

  // 初始渲染
  refresh();

  return controller;
}

// ─── 辅助函数 ──────────────────────────────────────────────

function nodeRadius(type) {
  switch (type) {
    case 'capital': return 3;
    case 'city': case 'port': return 2.2;
    case 'hidden': case 'dungeon': return 2;
    default: return 1.5;
  }
}

export function getNodeIcon(type) {
  const icons = {
    capital: '♜',
    city: '◆',
    port: '⚓',
    settlement: '⌂',
    gate: '⬡',
    wilderness: '♠',
    dungeon: '☠',
    hub: '◎',
    hidden: '✦',
    'local-daily': '⌂',
    'local-anomaly': '⚠',
  };
  return icons[type] || '•';
}

function nodeColor(type, spawnable) {
  const colors = {
    capital: '#e74c3c',
    city: '#3498db',
    port: '#1abc9c',
    settlement: '#2ecc71',
    gate: '#95a5a6',
    wilderness: '#27ae60',
    dungeon: '#8e44ad',
    hub: '#f39c12',
    hidden: '#2c3e50',
    'local-daily': '#3498db',
    'local-anomaly': '#e74c3c',
  };
  return colors[type] || '#999';
}

function renderNodeDetail(node) {
  return `<div class="node-detail">
    <h3>${node.name} <small>[${node.type}]</small></h3>
    <p>${node.summary || ''}</p>
    <p>等级: Lv.${node.recommendedLevel?.[0] || '?'}–${node.recommendedLevel?.[1] || '?'}</p>
    ${node.facilities?.length ? `<p>设施: ${node.facilities.join('、')}</p>` : ''}
    ${node.riskTags?.length ? `<p>风险: ${node.riskTags.join('、')}</p>` : ''}
    ${node.spawnable ? '<p>✅ 可作为出生点</p>' : ''}
    ${node.agency ? `<p>管辖: ${node.agency}</p>` : ''}
  </div>`;
}

/** @typedef {{nodeIndex: Map<string,number>, adjacency: Map<string,{to:string,edge:object,weight:object}[]>, nodeById: Map<string,object>}} NormalizedGraph */
/** @typedef {{nodeIds: string[], edges: object[], totalWeight: number, criterion: string}} RouteResult */
/** @typedef {{destroy: ()=>void, setCurrentNode: (id:string)=>void, setCriterion: (c:string)=>void, setRoute: (f:string,t:string)=>void, refreshState: ()=>void}} MapController */
