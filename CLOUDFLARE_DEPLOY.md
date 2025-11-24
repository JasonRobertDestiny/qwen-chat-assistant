# Cloudflare Pages 部署指南

## 一、准备工作

1. 注册Cloudflare账号（完全免费）: https://dash.cloudflare.com/sign-up
2. GitHub账号（已有）

## 二、部署步骤

### 方法1: 通过Cloudflare Dashboard（推荐，最简单）

1. **登录Cloudflare Dashboard**
   - 访问: https://dash.cloudflare.com
   - 登录你的账号

2. **创建Pages项目**
   - 左侧菜单选择 "Workers & Pages"
   - 点击 "Create application"
   - 选择 "Pages" 标签
   - 点击 "Connect to Git"

3. **连接GitHub仓库**
   - 授权Cloudflare访问GitHub
   - 选择仓库: `JasonRobertDestiny/qwen-chat`
   - 点击 "Begin setup"

4. **配置构建设置**（⚠️ 重要）
   ```
   Project name: qwen-chat（或自定义）
   Production branch: main

   Framework preset: None（不选择任何框架）

   Build command: 留空（或删除默认值）
   Build output directory: /（填一个斜杠）
   Root directory: /（留空）
   ```

   **关键配置说明**：
   - ✅ Framework preset 选择 **None** 或不选择
   - ✅ Build command **必须留空**，不要填任何命令
   - ✅ Build output directory 填 **/**（一个斜杠）
   - ❌ 不要填 `npm run build` 或其他构建命令
   - ❌ 不要填 `npx wrangler deploy`（这是Workers命令，不是Pages）

   **为什么**：
   - 这是纯静态项目，没有构建步骤
   - Cloudflare Pages会自动识别 `functions/` 目录
   - 不需要wrangler.toml配置文件

5. **设置环境变量**
   - 点击 "Environment variables (advanced)"
   - 添加变量:
     ```
     Variable name: QWEN_API_KEY
     Value: sk-5eca33a68f2d499fa09953b9b308ed0f
     ```
   - 环境选择: Production

6. **开始部署**
   - 点击 "Save and Deploy"
   - 等待1-2分钟
   - 部署完成后会得到一个 `.pages.dev` 域名

### 方法2: 使用Wrangler CLI（高级用户）

```bash
# 安装Wrangler
npm install -g wrangler

# 登录Cloudflare
wrangler login

# 部署项目
wrangler pages deploy . --project-name=qwen-chat

# 设置环境变量
wrangler pages secret put QWEN_API_KEY
# 输入: sk-5eca33a68f2d499fa09953b9b308ed0f
```

## 三、验证部署

部署完成后访问: `https://qwen-chat.pages.dev`（替换为你的实际域名）

测试功能：
1. 文字聊天
2. 图片识别
3. 语音输入

## 四、绑定自定义域名（可选）

如果你有域名：

1. Cloudflare Pages控制台 → 项目 → Custom domains
2. 点击 "Set up a custom domain"
3. 输入域名（如 chat.yourdomain.com）
4. 按提示添加DNS记录
5. 等待DNS生效（5-30分钟）

## 五、国内访问说明

**Cloudflare Pages优势**:
- `.pages.dev` 域名国内访问比 `.vercel.app` 稳定
- Cloudflare在国内有CDN节点（部分地区）
- 完全免费，无限流量
- 支持Serverless Functions

**访问对比**:
- Vercel (.vercel.app): ⭐⭐ 国内访问不稳定
- Cloudflare Pages (.pages.dev): ⭐⭐⭐⭐ 国内访问较好
- 自定义域名 + Cloudflare CDN: ⭐⭐⭐⭐⭐ 最佳

## 六、自动部署

部署完成后，每次推送到GitHub main分支，Cloudflare会自动重新部署。

## 七、故障排查

### 1. 部署失败：`Missing entry-point to Worker script`

**错误信息**：
```
✘ [ERROR] Missing entry-point to Worker script or to assets directory
Executing user deploy command: npx wrangler deploy
```

**原因**：配置了错误的部署命令或框架preset

**解决方法**：
1. 进入Cloudflare Dashboard → 你的项目 → Settings → Builds & deployments
2. 检查配置：
   ```
   Framework preset: None
   Build command: （留空）
   Build output directory: /
   ```
3. **删除任何deploy command配置**
4. 点击 "Retry deployment"

**或者重新创建项目**：
1. 删除现有项目
2. 按照正确配置重新创建（见上面步骤4）

### 2. API调用失败
- 确认环境变量 `QWEN_API_KEY` 已设置
- 查看Functions日志: Pages项目 → Functions → Real-time logs

### 3. 国内访问慢
- 尝试绑定自定义域名
- 或使用VPN/代理测试

## 八、费用说明

Cloudflare Pages **完全免费**，包括：
- 无限带宽
- 无限请求次数
- Serverless Functions（每月10万次请求）
- 自定义域名
- 自动HTTPS

## 九、与Vercel对比

| 功能 | Cloudflare Pages | Vercel |
|------|------------------|--------|
| 免费额度 | 无限 | 100GB/月 |
| Functions超时 | 30秒 | 10秒（免费版） |
| 国内访问 | 较好 | 不稳定 |
| 自定义域名 | 免费 | 免费 |
| CDN节点 | 全球+部分国内 | 全球 |

## 十、下一步

1. 现在就去Cloudflare Dashboard部署
2. 部署成功后测试功能
3. 如有问题查看Functions日志排查
