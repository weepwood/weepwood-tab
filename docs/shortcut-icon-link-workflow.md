# 快捷方式、用户图标与自定义外链

## 单个链接

“添加内容”默认打开快捷方式页面。可以直接粘贴以下类型：

- 普通网页：`https://example.com`
- 未填写协议的域名：`example.com`
- 邮件：`mailto:name@example.com`
- 电话：`tel:+8613800000000`
- Obsidian：`obsidian://open?vault=Notes`
- VS Code：`vscode://file/path/to/project`
- 其他安全的应用自定义协议

`javascript:`、`data:` 和 `vbscript:` 会被拦截。

## 打开方式

每个快捷方式可以分别设置：

- 当前标签页打开
- 新标签页打开

设置会统一应用于桌面、文件夹、Dock、搜索建议和右键菜单。

## 自动图标

自动模式会依次尝试：

1. 用户固定的优先图标
2. 最近一次成功缓存
3. Chrome/Edge 扩展原生 favicon API
4. Google favicon 服务
5. DuckDuckGo 图标服务
6. Apple Touch Icon
7. 站点常见 PNG 和 ICO 路径

可以点击任一候选固定优先来源，也可以清除缓存后重新探测。

## 自定义图标

支持四种模式：

- 自动获取
- 上传本地图片
- 使用远程图片网址
- 文字与颜色图标

图片模式支持完整显示或铺满裁切、0—20px 留白以及自定义或透明背景。

## 批量导入

支持每行一个链接，以及以下格式：

```text
GitHub | https://github.com
ChatGPT	https://chatgpt.com
语雀, https://www.yuque.com
obsidian://open?vault=Notes
```

导入前会识别无效链接、当前浏览器内已有链接和同一批次中的重复链接。
