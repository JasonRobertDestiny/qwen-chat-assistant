# 🤖 智能聊天助手

基于通义千问 Qwen-VL-Plus 的智能聊天助手，支持语音输入、文字聊天和图片识别功能。

## ✨ 功能特性

- 🎤 **语音输入**: 点击麦克风按钮进行语音输入，自动转换为文字
- 💬 **文字聊天**: 支持文字输入和AI对话
- 📷 **图片识别**:
  - 📸 拍照上传：直接使用摄像头拍照
  - 🖼️ 相册选择：从设备相册选择图片
  - AI可以分析图片内容并回答相关问题
- 📱 **移动端适配**: 响应式设计，支持手机和平板访问
- 🎨 **现代UI**: 美观的聊天界面，打字机效果，动态Loading提示
- ⚡ **性能优化**: 30秒超时检测，更好的用户体验

## 🚀 快速部署（推荐）

### 一键部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/JasonRobertDestiny/qwen-chat-assistant)

部署后需要配置环境变量：
1. 在 Vercel 项目设置中添加环境变量
2. 变量名：`QWEN_API_KEY`
3. 变量值：你的通义千问 API 密钥

### 手动部署到 Vercel

1. Fork 本仓库到你的 GitHub
2. 登录 [Vercel](https://vercel.com)
3. 点击 "Import Project"
4. 选择你 Fork 的仓库
5. 配置环境变量 `QWEN_API_KEY`
6. 点击 Deploy

## 💻 本地运行

### 方式1: 纯静态（前端开发）

```bash
# Python
python3 -m http.server 8888

# Node.js
npx http-server -p 8888
```

访问: `http://localhost:8888`

### 方式2: 带后端代理（完整功能）

#### Node.js 版本
```bash
npm install
npm start
```

#### Python 版本
```bash
python3 proxy.py
```

访问: `http://localhost:3000`

## 📋 技术栈

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **AI模型**: 通义千问 Qwen-VL-Plus (支持文本+图片)
- **后端**: Vercel Serverless Functions
- **部署**: Vercel
- **PWA**: Service Worker 支持

## 🔧 配置说明

### API密钥配置

**Vercel部署（推荐）**:
- 在 Vercel 环境变量中设置 `QWEN_API_KEY`
- API密钥不会暴露在前端代码中

**本地开发**:
- 修改 `api/chat.js` 中的 `API_KEY` 默认值
- 或设置环境变量 `QWEN_API_KEY`

### 模型配置

当前使用 `qwen-vl-plus` 模型，支持：
- 文本理解和生成
- 图片识别和分析
- 多模态对话

可选模型：
- `qwen-plus`: 纯文本模型（更快，更便宜）
- `qwen-vl-max`: 更强的视觉理解能力
- `qwen3-omni-flash`: 支持音频输入

修改模型：编辑 `api/chat.js` 中的 `MODEL` 常量

## 🎯 使用说明

### 文字聊天
1. 在底部输入框中输入文字
2. 点击发送按钮或按 Enter 键

### 语音输入
1. 点击红色麦克风按钮
2. 对着设备说话
3. 语音自动转换为文字
4. 点击发送按钮

**注意**: 语音识别仅支持 Chrome 和 Edge 浏览器

### 图片识别

#### 方式1: 拍照上传
1. 点击蓝色相机按钮
2. 允许浏览器访问摄像头
3. 拍摄照片
4. 可选：添加描述文字
5. 点击发送，AI会分析图片

#### 方式2: 从相册选择
1. 点击图片上传按钮
2. 从设备选择图片文件
3. 预览图片
4. 可选：添加描述文字
5. 点击发送，AI会分析图片

## 📱 浏览器兼容性

| 功能 | Chrome | Safari | Firefox | Edge |
|------|--------|--------|---------|------|
| 基础聊天 | ✅ | ✅ | ✅ | ✅ |
| 语音识别 | ✅ | ❌ | ❌ | ✅ |
| 摄像头 | ✅ | ✅ | ✅ | ✅ |
| 图片上传 | ✅ | ✅ | ✅ | ✅ |
| PWA | ✅ | ✅ | ✅ | ✅ |

## 🔒 安全说明

- ✅ API密钥存储在后端环境变量中（Vercel部署）
- ✅ 后端代理保护API密钥不被暴露
- ✅ HTTPS加密传输（Vercel自动提供）
- ⚠️ 本地开发时API密钥在代码中，仅限测试使用

## 📂 项目结构

```
qwen-chat-assistant/
├── api/
│   └── chat.js          # Vercel Serverless Function
├── index.html           # 主页面
├── style.css            # 样式文件
├── script.js            # 前端逻辑
├── manifest.json        # PWA配置
├── sw.js               # Service Worker
├── vercel.json         # Vercel配置
├── server.js           # Node.js本地服务器（可选）
├── proxy.py            # Python本地服务器（可选）
├── CLAUDE.md           # Claude Code工作指南
└── README.md           # 说明文档
```

## 🐛 常见问题

### 图片上传失败
- 检查图片大小（限制10MB）
- 确认图片格式（支持 jpg, png, gif, webp）
- HTTPS环境下才能使用摄像头

### 语音识别不工作
- 使用 Chrome 或 Edge 浏览器
- 允许麦克风权限
- HTTPS环境（或localhost）

### API调用失败
- 检查 Vercel 环境变量配置
- 确认API密钥有效
- 查看浏览器控制台错误信息

## 📄 许可证

MIT License

## 👨‍💻 开发

本项目使用 Claude Code 辅助开发。详见 `CLAUDE.md` 了解开发指南。
