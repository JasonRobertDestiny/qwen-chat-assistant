# Repository Guidelines

## 项目结构与模块组织
- 根目录即前端与服务端：`index.html`/`style.css`/`script.js` 为 UI 与交互，`server.js` 提供本地代理与静态资源，`sw.js` 与 `manifest.json` 支撑 PWA。
- 手动验证页面：`test-api.html`、`test-features.html` 可用于快速检查接口与多模态功能。
- 配置与部署：`package.json` 定义脚本，`vercel.json` 为托管配置；`proxy.py` 仅用于简单转发场景，遵循 PEP8。

## 开发、构建与运行命令
- 初始化依赖：`npm install`（仅需 express、cors）。
- 本地代理+前端：`npm run start` 或 `npm run dev`，默认 http://localhost:3000 ，前端静态文件直接由 Express 提供。
- 纯静态预览：`npm run static` （Python 简易服务器，端口 8888）。
- 构建：`npm run build` 当前为占位脚本，确认静态资源已就绪即可。
- 部署：`npm run deploy` 触发 Vercel 生产部署，需提前登录 `vercel`。

## 编码风格与命名约定
- JavaScript：使用 ES6+，四空格缩进；常量大写下划线，函数单一职责，避免超过三层嵌套；魔法数字提为常量；关键逻辑以中文注释说明。
- Python（如 `proxy.py`）：严格遵循 PEP8，同样使用中文注释标注关键流程。
- 文件命名采用小写连字符，资源/组件保持与页面功能一致的前缀（例：`camera-*.js`）。

## 测试指南
- 目前无自动化测试，修改前后需手动验证：
  - `npm run start` 后访问 `/api/test` 确认代理正常。
  - 打开 `test-api.html` 发送文本与图片，确认返回消息。
  - 打开 `test-features.html` 检查语音、摄像头与 PWA 离线缓存。
- 若新增测试文件，建议命名 `*.spec.js` 并放在 `tests/`（需自行创建）。

## 提交与 Pull Request
- 建议使用 Conventional Commits（例：`feat: add camera preview overlay`）。
- PR 描述需包含：变更摘要、测试结果（含手动步骤）、影响范围、相关 Issue 链接；前端改动请附关键界面截图或录屏。
- 确认未提交真实密钥与个人数据，必要时将 API 密钥改为环境变量并在描述中注明。

## 安全与配置提示
- 当前示例密钥仅供演示，生产请改为后端环境变量并在前端移除明文。
- DashScope 调用由本地 `/api/chat` 代理转发，若部署到公网请限制来源域名并开启 HTTPS。
- 提交前检查日志输出，避免在控制台打印敏感内容。
