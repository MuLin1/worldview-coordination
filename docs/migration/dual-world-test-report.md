# 双世界自动化测试报告

日期：2026-07-30
操作系统：Windows 10
Python：3.12
Node：22.x

## 测试范围

| 类型 | 命令 | 通过 | 失败 | 跳过 |
|------|------|------|------|------|
| 世界书 Python 测试 | `python -m unittest discover -s 世界书 -p 'test_*.py'` | 137 | 0 | 0 |
| DNF JavaScript 测试 | `node --test dnf/tests/*.test.mjs` | 30 | 0 | 1* |
| DNF Python 集成测试 | `python dnf/tests/runtime-integration.test.py` | 4 | 0 | 0 |

*config-worldbook-sync 因 `dnf候选角色审核.json` 尚未生成而跳过，属预期行为。

## 测试类型

- **静态检查**：哈希比对、来源路径存在性、ID 唯一性、目录结构
- **单元测试**：validate 系列函数、simulate_context_load、runtime 引擎函数、事件桥
- **集成测试**：MVU 状态初始化、世界切换、回合结算顺序、生殖请求桥接
- **未执行**：实际 SillyTavern 导入与长对话稳定性验证

## 关键结论

- 146 条原世界书逐字段等于冻结基线
- 原《创世回廊5.1》哈希未变
- 两个世界模块隔离：无专属条目反向串载
- 成人条目在未成年/无状态条件下 0 加载
- 受孕 D100 只在 `submitConception` 内产生
- 重复事件幂等：同事件 ID 不重复写入
- 事件桥拒绝外部骰点和脚本只读字段
