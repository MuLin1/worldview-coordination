# 地图与性别交互修复设计

## 目标

修复角色创建与地图页面的三个缺陷：地图支持鼠标/单指拖动、滚轮和双指缩放；开始游戏不再因同伴生理字段缺失而报错；角色性别支持自定义显示文本，并与生理性别、生殖能力解耦。

## 地图交互

`dist/V20260728/world-map-core.js` 保留现有 `zoom/panX/panY` 状态和 SVG transform 渲染，新增 Pointer Events 驱动的视口控制。单指或鼠标拖动更新平移；两个活动指针根据距离和中心点更新缩放与平移；滚轮围绕鼠标位置缩放。SVG 设置 `touch-action: none`，缩放范围固定为 0.4–6。拖动距离超过 5 像素后，节点点击在本次手势结束前被抑制，避免拖动误选出生点。`destroy()` 必须解除事件监听。

视口数学提取为可测试纯函数：`clampZoom`、`zoomViewportAtPoint`、`panViewport`。地图控制器继续暴露 `zoomIn/zoomOut/resetView`，并统一调用纯函数。

## 同伴生理数据

根因是生成的同伴 `physiology` 只有 `adult/system/classificationId/species`，保存流程却读取 `sex/capability`。在 `data/dual-world/companion-species-approval.json` 的每个选择项中补充 `sex` 与 `capability`，由 `scripts/build-dual-world-assets.mjs` 写入生成同伴的 `physiology`。

`validateFinalCompanions()` 增加最终阶段校验：性别必须属于 `雌性/雄性/双性/无性/可变`，生殖能力必须属于 `可妊娠/可授精/双向/无`。开局兼容测试必须逐个调用 `createPhysiologyProfile()`，确保所有生成同伴都能构建档案。

保存页面增加防御性检查：同伴生理配置无效时记录带角色 ID 的错误，并跳过该同伴档案，而不是阻断主角保存。数据源修复后正常路径不会触发该分支。

## 自定义性别

`character.gender` 保留为展示性别字段以兼容现有代码，选项调整为 `男性/女性/非二元/无性别/自定义`。选择自定义时显示 `character.customGender` 输入框。另新增严格运行时字段：

- `character.biologicalSex`：`雄性/雌性/双性/无性/可变`
- `character.reproductiveCapability`：`可授精/可妊娠/双向/无`

身份性别只写入 `人物.性别`，不得再通过包含“男/女”的字符串推导生理字段。生理档案直接使用上述两个严格字段。切换生理性别时只在能力仍等于旧默认值时自动更新能力，保留用户手动覆盖。

## 兼容与错误处理

预设角色继续锁定身份字段，但其生理字段若已有明确配置则直接使用；旧存档不做破坏性迁移。自定义性别为空时保存为“未指定”。所有运行时枚举在 UI 和构建脚本中使用同一组值。

## 测试

1. 地图纯函数测试覆盖平移、中心点缩放、缩放边界。
2. 地图页面测试检查 Pointer Events、wheel 和 `touchAction` 绑定存在。
3. 同伴兼容测试验证每个同伴的 `sex/capability` 并成功调用 `createPhysiologyProfile()`。
4. 开局页面静态回归测试检查自定义性别输入、生理性别和生殖能力控件，以及保存逻辑不再从展示文本推导生理性别。
