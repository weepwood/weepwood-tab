# 浏览器新标签页扩展

Weepwood Tab 可以同时构建为 GitHub Pages 网页和 Manifest V3 浏览器扩展。

## 本地构建

```bash
npm install
npm run build:extension
```

扩展文件会输出到 `dist-extension/`。

## Chrome 安装

1. 打开 `chrome://extensions/`。
2. 开启右上角“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择 `dist-extension` 文件夹。
5. 新建标签页，确认 Weepwood Tab 已接管新标签页。

## Edge 安装

1. 打开 `edge://extensions/`。
2. 开启“开发人员模式”。
3. 点击“加载解压缩的扩展”。
4. 选择 `dist-extension` 文件夹。

## GitHub Actions 产物

主分支更新后，`Build Browser Extension` 工作流会生成 `weepwood-tab-extension.zip`，并保留 30 天。

## 数据说明

当前网页版和扩展版都使用各自来源下的浏览器本地存储。由于网页域名和扩展来源不同，两者的数据不会自动共享，可以通过设置中心的 JSON 导出和导入迁移配置。
