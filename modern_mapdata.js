const city = (id, cityName, region, x, y, agency) => ({
  id, city: cityName, name: cityName, region, x, y, agency,
  riftStateKey: `现代都市.裂隙.${id}`,
  invasionStateKey: `现代都市.异界魔物.${id}`,
  plotStageKey: '现代都市.主线.阶段',
});

export const MODERN_MAP = Object.freeze({
  worldId: 'modern',
  title: '现代都市 · 全球异常节点',
  nodes: [
    city('shanghai', '上海', '东亚', 76, 44, '东亚异常事务协调局'),
    city('tokyo', '东京', '东亚', 85, 42, '首都圈异能管理署'),
    city('singapore', '新加坡', '东南亚', 76, 65, '海峡异常联络中心'),
    city('delhi', '新德里', '南亚', 62, 49, '南亚裂隙监测局'),
    city('dubai', '迪拜', '西亚', 52, 51, '海湾异能事务厅'),
    city('nairobi', '内罗毕', '非洲', 51, 69, '东非异常生态站'),
    city('london', '伦敦', '欧洲', 42, 29, '欧洲异常协调署'),
    city('newyork', '纽约', '北美', 22, 38, '联邦异常事件局'),
    city('mexico', '墨西哥城', '中美洲', 16, 57, '中美洲裂隙联防处'),
    city('saopaulo', '圣保罗', '南美洲', 28, 76, '南美异常事务联盟'),
    city('sydney', '悉尼', '大洋洲', 91, 78, '大洋洲异能登记署'),
  ],
  edges: [
    ['shanghai', 'tokyo'], ['shanghai', 'singapore'], ['shanghai', 'delhi'],
    ['delhi', 'dubai'], ['dubai', 'london'], ['dubai', 'nairobi'],
    ['london', 'newyork'], ['newyork', 'mexico'], ['mexico', 'saopaulo'],
    ['singapore', 'sydney'], ['nairobi', 'saopaulo'],
  ].map(([from, to]) => ({ from, to })),
});

globalThis.MODERN_MAP = MODERN_MAP;
