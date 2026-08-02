# Weepwood Tab

一个本地优先、可自定义的浏览器起始页。首版以 Infinity New Tab 的简洁入口与 WeTab 的组件化工作台为参考，先验证首页布局、工作区和本地数据体验。

## 在线预览

GitHub Pages：`https://weepwood.github.io/weepwood-tab/`

## 已实现

- 多工作区：专注、工作、学习、生活
- Bing / Google / 百度 / DuckDuckGo 搜索
- 快捷方式添加、删除、拖拽排序
- 今日待办、专注计时、月历和工作区便签
- 深夜蓝、极光、纸张三套主题
- 本地持久化、JSON 导入导出和恢复默认
- 响应式桌面与移动端布局
- GitHub Actions 自动部署 GitHub Pages

## 技术栈

- React 19
- TypeScript
- Vite 8
- CSS Variables + 原生 CSS
- localStorage（MVP，本地优先）

## 本地开发

```bash
npm install
npm run dev
```

生产构建：

```bash
npm run build
npm run preview
```

## 架构方向

当前版本保持依赖轻量，优先验证产品交互。后续将逐步拆分：

```text
src/
├─ components/     # UI 与内置组件
├─ core/           # 领域类型和模型
├─ data/           # 默认数据
├─ hooks/          # 本地存储与运行时能力
└─ styles/         # 设计系统与响应式样式
```

计划中的下一阶段：

1. Widget Registry 与可调整尺寸的网格布局
2. IndexedDB 数据层和数据迁移
3. WXT 浏览器扩展版本
4. 壁纸、文件夹、快捷方式编辑和撤销/重做
5. 可选的端到端加密多设备同步

## 隐私

当前版本不要求登录。快捷方式、任务、便签和设置仅保存在当前浏览器本地，除用户主动导出外不会上传。

## License

MIT
