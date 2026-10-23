# 推理系统源码笔记

Yuli-yx 的个人学习网站：vLLM、vLLM-Ascend、MRV2、KV cache。

网站：https://yuli-yx.github.io/

## 内容

- MRV2 四个实现跟读单元、原导览和参考表。
- KV cache 概念地图：tensor、block、group、padding、生命周期。
- KV cache 初始化源码链：Attention spec、Engine 规划、Worker 分配、Scheduler BlockPool。
- 12 个主题的学习路线，规划章节明确标注。

## 维护

纯静态 HTML/CSS/JavaScript，无 npm 依赖。

```sh
npm run build
npm run check
npm run preview
```

修改 `content/kv-*.html` 和 `assets/`，运行构建后提交 `docs/`。GitHub Pages 从 `main` 分支的 `/docs` 发布。

`content/sources.json` 保存已核对源码节选、commit、行号和源文件 SHA256。更新源码证据时，先确认新版本接口与正文一致，再运行 `node scripts/snapshot.mjs <workspace>`；不要只替换版本号。

`content/mrv2/` 是独立快照，保留原版本语境。原个人课程目录继续保留；本仓库仅包含公开阅读内容。

## 验证边界

静态链接、页面交互和教学演算检查不等于 NPU 正确性、兼容性或性能验证。阅读记录不作掌握程度声明。

源码节选的归属与许可见 `THIRD_PARTY_NOTICES.txt`。
