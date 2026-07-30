# 双世界运行层接入说明

## 调用顺序

每次回合结算时，`helper-calculator.js` 的处理顺序如下：

1. **`ensureFiveWorldState(statData)`** — 确保状态根存在，链接角色档案
2. **`consumeReproductionRequests(statData)`** — 消费 `待处理请求` 队列，本回合新妊娠可被后续日期推进
3. **`advanceMvuState(statData, fiveWorldDate)`** — 推进日期、自然周期和妊娠天数
4. **`settlePendingBirths(statData)`** — 结算已达分娩日期的妊娠

## 事件桥接口

- **`consumeReproductionRequests(statData, random?)`** — 消费 `生殖系统.待处理请求` 中的受孕事件，每个事件调用 `processReproductionEvent`，结果写入 `事件结果`
- **`settlePendingBirths(statData, random?)`** — 处理 `生殖系统.待生育事件` 中的待分娩 ID，调用 `settleBirth`，结果写入 `生育记录`

## AI 权限

- AI 只能向 `生殖系统.待处理请求` 追加结构化受孕请求
- 请求格式见 R-X001
- 脚本只读字段（D100、受孕结果等）在桥接层被拒绝
- 结算账本、生育记录、妊娠参数快照由运行时内部维护

## 世界 ID

`WORLDBOOK_WORLD_IDS = ['vielsaen', 'modern']` 标记当前活跃世界。
`WORLD_REGISTRY` 保留所有五个世界定义以支持仓库兼容旧数据，但世界书只启用双世界。
