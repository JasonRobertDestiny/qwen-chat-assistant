# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

基于通义千问多模态API的智能聊天助手，纯前端PWA应用，支持音频录制、文字聊天和图片识别。

核心架构：
- **前端**: 纯静态HTML/CSS/JavaScript，无构建步骤
- **API集成**: 阿里云通义千问 `qwen3-omni-flash` (文本+图片+音频多模态)
- **三种运行模式**:
  1. Vercel Serverless (`api/chat.js`) - 推荐生产环境
  2. Node.js本地代理 (`server.js:3000`) - 本地开发/测试
  3. Python本地代理 (`proxy.py:3000`) - 备选方案

**关键架构决策**：
- 前端动态检测后端地址（script.js `getApiBaseUrl()`）：8888端口时转发到3000，其他情况用`/api/chat`
- 音频录制用MediaRecorder API（所有现代浏览器），不依赖语音识别API
- 图片支持Base64编码直接传输，无需单独存储

## 常用命令

### 本地开发

```bash
# 前端UI开发（静态服务器）
npm run static                  # Python http.server:8888
# 或
python3 -m http.server 8888

# 完整功能测试（含API代理）
npm install                     # 首次安装依赖
npm start                       # Node.js服务器:3000
# 或
python3 proxy.py                # Python代理:3000
```

### Vercel部署

```bash
# 方式1: Vercel CLI
npm i -g vercel                 # 首次安装
vercel --prod

# 方式2: GitHub集成
# 推送到main分支自动部署
git push origin main

# 环境变量配置（必须）
# Vercel控制台 → 项目设置 → Environment Variables
# 添加：QWEN_API_KEY = sk-your-key-here
```

### 测试

```bash
# API连接测试
# 1. 启动服务器（npm start 或 python3 proxy.py）
# 2. 访问 http://localhost:3000/api/test
# 或打开 test-api.html

# 功能测试页面
open test-features.html         # 语音、摄像头权限测试
```

## 技术架构

### API调用流程

```
用户输入（文本/图片/音频）
    ↓
script.js 构建多模态content数组
    ↓
POST 到后端（动态地址检测）
    ├─ 本地8888端口 → http://localhost:3000/api/chat (跨端口转发)
    ├─ 本地3000端口 → /api/chat (同源)
    └─ Vercel部署 → /api/chat (Serverless Function)
    ↓
后端代理（server.js / api/chat.js）
    ├─ 从环境变量读取API_KEY（生产）
    ├─ 或使用硬编码密钥（本地测试）
    └─ 构建OpenAI兼容格式请求
    ↓
通义千问API (dashscope.aliyuncs.com)
    ├─ 模型: qwen3-omni-flash
    └─ 支持: text, image_url, input_audio
    ↓
解析响应 → cleanText() → 前端打字机渲染
```

**关键实现细节**：

1. **动态后端地址检测** (script.js `getApiBaseUrl()`):
   ```javascript
   function getApiBaseUrl() {
       const currentPort = window.location.port;
       // 8888端口(静态服务器)转发到3000端口API服务器
       if (currentPort === '8888') {
           return 'http://localhost:3000/api/chat';
       }
       // 其他情况（3000本地 / Vercel部署）使用相对路径
       return '/api/chat';
   }
   ```

2. **多模态输入处理** (server.js:25-52, api/chat.js:23-56):
   - 文本: `{ type: 'text', text: message }`
   - 图片: `{ type: 'image_url', image_url: { url: base64_data } }`
   - 音频: `{ type: 'input_audio', input_audio: { data: base64_with_prefix, format: 'wav' } }`

3. **音频录制** (script.js MediaRecorder):
   - 格式: audio/webm;codecs=opus (Chrome/Edge) 或 audio/mp4 (Safari)
   - 转Base64: FileReader.readAsDataURL()
   - 大小限制: 20MB (server.js:20, api/chat.js body-parser)

4. **Vercel Serverless部署**:
   - 路由: `vercel.json` rewrites `/api/*` → `api/chat.js`
   - 环境变量: `process.env.QWEN_API_KEY` (api/chat.js:59)
   - Fallback: 硬编码密钥仅用于本地测试

### 关键文件职责

| 文件 | 职责 | 行数参考 |
|------|------|----------|
| `index.html` | DOM结构：聊天界面、模态框、按钮 | - |
| `script.js` | 核心逻辑：MediaRecorder、摄像头、API调用、消息渲染、打字机效果 | 1-600+ |
| `style.css` | 移动优先响应式样式，类微信UI | 1-500+ |
| `server.js` | Node.js本地代理：CORS、API封装、OpenAI兼容格式 | 1-120 |
| `api/chat.js` | Vercel Serverless Function：环境变量、请求代理 | 1-156 |
| `proxy.py` | Python备选代理：DashScope SDK或HTTP请求 | - |
| `manifest.json` + `sw.js` | PWA配置：Service Worker缓存、离线支持 | - |
| `vercel.json` | Vercel路由配置、CORS头、rewrites规则 | 1-25 |

## 代码修改指南

### 修改API密钥和模型

**生产环境（Vercel）**:
```bash
# Vercel控制台设置环境变量
QWEN_API_KEY = sk-your-actual-key

# api/chat.js 会自动读取：
# const API_KEY = process.env.QWEN_API_KEY || 'fallback-key';
```

**本地开发（临时测试）**:
```javascript
// server.js:12 或 api/chat.js:59
apiKey: 'sk-your-test-key'

// script.js:13 (仅当不用后端代理时)
apiKey: 'sk-your-test-key'
```

**切换模型** (同时修改以下3处):
```javascript
// script.js:14
model: 'qwen-plus'              // 纯文本，更快更便宜
// 或 'qwen-vl-plus'            // 文本+图片
// 或 'qwen3-omni-flash'        // 文本+图片+音频（当前）

// server.js:14
model: 'qwen3-omni-flash'

// api/chat.js:61
const MODEL = 'qwen3-omni-flash';
```

### 添加新消息类型

示例：添加"系统提示"消息

1. **前端渲染** (script.js `addMessage()` 函数):
   ```javascript
   function addMessage(content, isUser = false, isSystem = false) {
       const messageDiv = document.createElement('div');
       messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'} ${isSystem ? 'system-message' : ''}`;
       // ... 其他逻辑
   }
   ```

2. **样式定义** (style.css):
   ```css
   .system-message {
       background: #f0f0f0;
       color: #666;
       font-style: italic;
       margin: 10px auto;
       text-align: center;
   }
   ```

3. **API处理** (如需传递到后端):
   ```javascript
   // server.js:66 或 api/chat.js:66
   messages: [
       { role: 'system', content: '你是一个有帮助的助手' },
       { role: 'user', content: contentBlocks }
   ]
   ```

### 调整UI样式

**常见修改位置**:

```css
/* style.css 关键样式区域 */

/* 聊天气泡 */
.user-message { ... }           /* ~200行：用户消息样式 */
.ai-message { ... }             /* ~220行：AI回复样式 */

/* 底部输入栏 */
.input-container { ... }        /* ~400行：高度、背景、边框 */
#textInput { ... }              /* ~420行：输入框样式 */

/* 按钮 */
.icon-btn { ... }               /* ~450行：基础按钮样式 */
.send-btn { ... }               /* ~470行：发送按钮 */
.voice-btn.recording { ... }    /* ~490行：录音中动画 */

/* 移动端适配 */
@media (max-width: 768px) { ... } /* ~500行：响应式断点 */
```

**打字机效果调整** (script.js:250-280):
```javascript
// 修改打字速度
const delay = 30;  // 毫秒/字符，越小越快

// 修改加载提示更新间隔
if (elapsedSeconds % 5 === 0) { ... }  // 每5秒更新一次提示
```

## 常见问题排查

### API调用失败

**症状**: 控制台显示"Failed to fetch"或500错误

**排查步骤**:
1. 检查后端是否运行（`npm start` 或 `python3 proxy.py`）
2. 验证端口匹配：
   - 8888端口访问 → 需要3000端口后端同时运行
   - 3000端口访问 → 后端已包含
   - Vercel部署 → 检查环境变量`QWEN_API_KEY`
3. 打开浏览器DevTools → Network → 检查`/api/chat`请求：
   - 400: 请求格式错误，检查contentBlocks构建
   - 401: API密钥无效或过期
   - 500: 后端错误，查看服务器日志
4. 验证API密钥有效：
   ```bash
   curl https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions \
     -H "Authorization: Bearer sk-your-key" \
     -H "Content-Type: application/json" \
     -d '{"model":"qwen-plus","messages":[{"role":"user","content":"hi"}]}'
   ```

### 音频录制问题

**症状**: 点击麦克风无反应或录音失败

**原因和解决**:
1. **权限未授予**: 浏览器提示允许麦克风访问，必须点击"允许"
2. **非HTTPS环境**: MediaRecorder要求HTTPS（localhost除外）
   - 本地开发用`localhost`而非`127.0.0.1`或IP地址
3. **浏览器不支持**: 检查`navigator.mediaDevices`是否存在
4. **音频格式不支持**:
   - Chrome/Edge: audio/webm;codecs=opus
   - Safari: audio/mp4
   - 后端已自动处理格式检测（script.js:150-170）

**调试**:
```javascript
// 浏览器控制台测试
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => console.log('麦克风访问成功', stream))
  .catch(err => console.error('麦克风访问失败', err));
```

### 图片上传失败

**症状**: 选择图片后无响应或发送失败

**排查**:
1. **文件大小**: 图片Base64后大小<20MB限制
   - 检查：`image.size / 1024 / 1024` MB
   - 压缩大图片或降低分辨率
2. **格式问题**:
   - 支持: jpg, jpeg, png, gif, webp
   - 不支持: bmp, tiff, svg
3. **Base64编码错误**:
   ```javascript
   // 检查是否包含正确前缀
   imageData.startsWith('data:image/')  // 应为true
   ```
4. **API响应400**: 通义千问API对图片有限制
   - 分辨率不超过4096x4096
   - 某些特殊格式可能不支持

### Vercel部署404错误

**原因**: Vercel路由配置或环境变量问题

**解决**:
1. 确认`vercel.json`存在且格式正确
2. 检查环境变量设置：
   - Vercel控制台 → Settings → Environment Variables
   - 变量名必须完全匹配：`QWEN_API_KEY`（区分大小写）
   - 确认勾选了Production环境
3. 重新部署：
   ```bash
   vercel --prod --force
   ```
4. 查看Vercel部署日志：
   - Vercel控制台 → Deployments → 点击最新部署 → Function Logs

### Service Worker缓存问题

**症状**: 代码更新后页面仍显示旧版本

**清除缓存**:
1. 强制刷新：`Ctrl+Shift+R` (Windows) 或 `Cmd+Shift+R` (Mac)
2. 开发者工具：
   - F12 → Application → Service Workers → Unregister
   - Application → Storage → Clear storage
3. 无痕模式测试：验证是否为缓存问题
4. 临时禁用SW（开发时）：
   ```javascript
   // sw.js:1 临时注释整个文件
   ```

### 打字机效果卡顿

**优化**:
```javascript
// script.js typeWriterEffect() 函数
const delay = 20;  // 降低延迟（当前30ms）

// 或禁用打字机效果（即时显示）
messageDiv.textContent = text;  // 替换整个typeWriterEffect调用
```

## 安全注意事项

**生产环境部署检查清单**:
- [ ] Vercel环境变量已配置`QWEN_API_KEY`
- [ ] 前端代码中**没有**硬编码API密钥（或仅作为fallback）
- [ ] `api/chat.js`使用`process.env.QWEN_API_KEY`
- [ ] HTTPS已启用（Vercel自动提供）
- [ ] CORS头配置正确（vercel.json:12-23）
- [ ] 定期轮换API密钥（建议每3-6个月）

**本地开发注意**:
- 硬编码密钥仅限测试，不要提交到公开仓库
- 使用`.env`文件管理敏感信息（添加到`.gitignore`）
- 本地测试时使用低额度的测试密钥

## 浏览器兼容性

| 功能 | Chrome | Safari | Firefox | Edge | 实现技术 |
|------|--------|--------|---------|------|----------|
| 基础聊天 | ✅ | ✅ | ✅ | ✅ | fetch API |
| 音频录制 | ✅ | ✅ | ✅ | ✅ | MediaRecorder |
| 摄像头 | ✅ | ✅ | ✅ | ✅ | getUserMedia |
| 图片上传 | ✅ | ✅ | ✅ | ✅ | FileReader |
| PWA | ✅ | ✅ | ✅ | ✅ | Service Worker |
| 打字机效果 | ✅ | ✅ | ✅ | ✅ | requestAnimationFrame |

**注意**:
- MediaRecorder音频格式：Chrome/Edge用webm，Safari用mp4
- HTTPS要求：摄像头和麦克风访问需要HTTPS（localhost除外）
- iOS Safari：PWA添加到主屏幕体验最佳

## 性能优化要点

1. **API响应超时处理** (script.js:350-380):
   - 30秒超时检测，避免无限等待
   - 动态Loading消息（每5秒更新提示）
   - 自动错误恢复和用户提示

2. **打字机效果** (script.js:250-280):
   - 30ms/字符延迟，平衡流畅度和速度
   - Markdown渲染支持：加粗、代码块、列表
   - 用`requestAnimationFrame`优化性能

3. **Service Worker缓存策略** (sw.js):
   - 静态资源：Cache First（CSS/JS/HTML/图标）
   - API请求：Network Only（实时性优先）
   - 离线Fallback页面

4. **图片和音频优化**:
   - Base64编码后大小限制20MB（前后端一致）
   - 前端不做额外压缩（保留原始质量）
   - 后端20MB body-parser限制防止内存溢出

## 典型开发场景

### 场景1: 前端UI调整（无API调用）

```bash
# 只需静态服务器
python3 -m http.server 8888

# 修改 style.css 或 index.html
# 刷新浏览器即可看到效果
```

### 场景2: 测试新功能（需API）

```bash
# 终端1: 启动后端
npm start

# 终端2: 可选，或直接访问 localhost:3000
# python3 -m http.server 8888  # 访问 localhost:8888

# 修改 script.js 中的功能逻辑
# 刷新浏览器测试
```

### 场景3: 切换到新模型

```bash
# 1. 同时修改3个文件中的model配置
#    script.js:14, server.js:14, api/chat.js:61
# 2. 重启后端服务器
# 3. 清除浏览器缓存（Ctrl+Shift+R）
# 4. 测试新模型功能
```

### 场景4: Vercel部署前测试

```bash
# 1. 模拟Vercel环境变量
export QWEN_API_KEY="sk-your-prod-key"

# 2. 启动本地服务器
npm start

# 3. 验证环境变量读取
# 检查控制台日志：api/chat.js 应使用 process.env.QWEN_API_KEY

# 4. 无问题后部署
vercel --prod
```
