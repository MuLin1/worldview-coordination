const regions = [
  ['valkain', '瓦尔凯恩帝国', '铁冠城', 30, 30],
  ['serantia', '瑟兰提亚海盟', '潮门港', 15, 62],
  ['bresia', '布雷西亚王国', '白槲城', 43, 70],
  ['oseran', '奥瑟兰学邦', '星塔城', 58, 24],
  ['kardros', '卡德罗斯山国', '炉脊堡', 77, 40],
  ['visalin', '维萨林城邦联盟', '七桥城', 72, 72],
].map(([id, name, capital, x, y]) => ({ id, name, capital, x, y }));

export const VIELSAEN_MAP = Object.freeze({
  worldId: 'vielsaen',
  title: '维尔萨恩 · 艾沃兰大陆',
  regions,
  nodes: [
    { id: 'aivoran', name: '艾沃兰大陆', type: 'continent', x: 49, y: 48 },
    { id: 'sereya', name: '瑟雷亚海', type: 'sea', x: 8, y: 48 },
    ...regions.map(region => ({
      id: `${region.id}-capital`, name: region.capital, type: 'capital',
      regionId: region.id, x: region.x, y: region.y,
    })),
    { id: 'granville', name: '格兰维尔河谷', type: 'route', regionId: 'bresia', x: 38, y: 56 },
    { id: 'helcape', name: '赫尔岬', type: 'port', regionId: 'serantia', x: 10, y: 72 },
    { id: 'first-sanctuary', name: '初火圣地', type: 'sanctuary', regionId: 'oseran', x: 62, y: 14, eventKey: '维尔萨恩.圣地.初火圣地' },
    { id: 'demon-rift', name: '魔王裂谷', type: 'hotspot', regionId: 'kardros', x: 88, y: 51, eventKey: '维尔萨恩.魔王.状态' },
  ],
  edges: [
    ['valkain-capital', 'granville'], ['granville', 'bresia-capital'],
    ['bresia-capital', 'serantia-capital'], ['serantia-capital', 'helcape'],
    ['valkain-capital', 'oseran-capital'], ['oseran-capital', 'first-sanctuary'],
    ['oseran-capital', 'kardros-capital'], ['kardros-capital', 'demon-rift'],
    ['kardros-capital', 'visalin-capital'], ['visalin-capital', 'bresia-capital'],
  ].map(([from, to]) => ({ from, to })),
});

globalThis.VIELSAEN_MAP = VIELSAEN_MAP;
