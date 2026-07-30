# 酒馆助手脚本仓库指向设计

状态：待实施  
日期：2026-07-30

## 目标

将工作区 `脚本/` 下四个生效加载器从旧仓库改为：

```text
https://cdn.jsdelivr.net/gh/MuLin1/worldview-coordination@main/
```

## 修改范围

- `酒馆助手脚本-辅助计算脚本.json`
- `酒馆助手脚本-格式修复.json`
- `酒馆助手脚本-外置状态栏.json`
- `酒馆助手脚本-小手机脚本.json`

仅替换仓库所有者、仓库名和引用 `@main`。保留 `dist/V20260728` 文件路径及 `?v=1`。MVU、变量更新和创意工坊脚本不修改。

## 验收

- 四个 JSON 均可解析。
- 四个 `content` 均指向 `MuLin1/worldview-coordination@main`。
- `脚本/` 下不存在仍指向 `tangquanghuy/dnf` 的酒馆助手加载器。
