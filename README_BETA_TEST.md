# Mewly Beta 远程内测说明

Mewly 是一个移动端优先的 React / TypeScript PWA。当前 Beta 版本可以部署到 Vercel、Netlify 或 Cloudflare Pages，然后把 HTTPS 链接发给朋友在不同设备、不同网络下试用。

## 当前 Beta 能力

- 支持手机浏览器访问。
- 支持添加到手机主屏幕，PWA 名称为 `Mewly`。
- 支持注册 / 登录、猫咪资料、首页状态总览、猫咪行为分析、相册、咪记事、喵圈、流浪猫地图解锁流程。
- 猫咪行为分析支持“上传照片 / 视频关键帧 + 视觉 AI 分析”。用户选择的标签只作为辅助上下文。
- 数据使用本机 `localStorage`，朋友打开链接后会在自己的设备上生成独立数据。
- 已配置 Capacitor，后续可以打包 Android / iOS。

## 重要数据说明

当前项目还没有真实后端：

- `localStorage` 数据只保存在当前设备和当前浏览器。
- 不同用户之间暂时不能同步数据。
- 论坛、评论、上传图片目前是本地 mock 体验，朋友之间看不到彼此发布的内容。
- 如果要真实共享论坛、评论、图片、用户资料，需要接 Supabase、Firebase 或自建后端。
- 照片 / 视频分析需要服务端环境变量 `OPENAI_API_KEY`。如果没有配置，页面会明确提示“还没有配置视觉 AI”，不会假装分析上传内容。

## 本地运行

安装依赖：

```bash
npm install
```

开发运行：

```bash
npm run dev
```

默认会监听局域网地址。电脑浏览器可打开终端显示的 Local 地址，手机同 Wi-Fi 可打开 Network 地址。

生产构建：

```bash
npm run build
```

本地预览生产包：

```bash
npm run preview
```

## 部署到 Vercel

项目已包含 `vercel.json`，刷新页面不会 404。

方式一：Vercel 网页导入仓库

1. 把项目推到 GitHub / GitLab / Bitbucket。
2. 打开 Vercel，新建 Project。
3. 选择该仓库。
4. Framework Preset 选择 `Vite`。
5. Build Command 使用：
   ```bash
   npm run build
   ```
6. Output Directory 使用：
   ```text
   dist
   ```
7. 在 Vercel Project Settings > Environment Variables 中添加：
   ```text
   OPENAI_API_KEY=你的 OpenAI API Key
   ```
   可选模型变量：
   ```text
   OPENAI_VISION_MODEL=gpt-4.1-mini
   ```
8. 重新部署后，把 Vercel 生成的 HTTPS 链接发给朋友。

注意：当前真正的照片 / 视频视觉分析接口使用 Vercel Serverless Function：`/api/analyze-media`。如果部署到 Netlify 或 Cloudflare Pages，需要另外改成对应平台的 Functions / Workers，否则只能使用行为标签辅助分析。

方式二：Vercel CLI

```bash
npm install -g vercel
vercel
vercel --prod
```

## 部署到 Netlify

项目已包含 `netlify.toml` 和 `public/_redirects`，刷新页面不会 404。

方式一：Netlify 网页导入仓库

1. 把项目推到 GitHub / GitLab / Bitbucket。
2. 打开 Netlify，新建 Site。
3. 选择该仓库。
4. Build command 使用：
   ```bash
   npm run build
   ```
5. Publish directory 使用：
   ```text
   dist
   ```
6. 部署完成后，把 Netlify 生成的 HTTPS 链接发给朋友。

方式二：Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy --dir=dist
netlify deploy --prod --dir=dist
```

## 部署到 Cloudflare Pages

Cloudflare Pages 支持 Vite 静态站点。项目已包含 `public/_redirects`，部署后刷新页面不会 404。

1. 把项目推到 GitHub / GitLab。
2. 打开 Cloudflare Pages，创建项目并选择仓库。
3. Framework preset 选择 `Vite`。
4. Build command 使用：
   ```bash
   npm run build
   ```
5. Build output directory 使用：
   ```text
   dist
   ```
6. 部署完成后，把 Cloudflare Pages 的 HTTPS 链接发给朋友。

## 如何把链接发给朋友测试

推荐发送部署后的 HTTPS 链接，例如：

```text
https://你的项目名.vercel.app
https://你的项目名.netlify.app
https://你的项目名.pages.dev
```

朋友打开链接后可以直接体验。每个朋友的数据会保存在自己的手机或电脑浏览器里，不会同步到其他人设备。

## 朋友如何添加到手机主屏幕

iPhone Safari：

1. 用 Safari 打开 Mewly 测试链接。
2. 点击底部分享按钮。
3. 选择“添加到主屏幕”。
4. 名称显示为 `Mewly`。

Android Chrome：

1. 用 Chrome 打开 Mewly 测试链接。
2. 点击右上角菜单。
3. 选择“添加到主屏幕”或“安装应用”。
4. 名称显示为 `Mewly`。

## Android 后续打包 APK

项目已接入 Capacitor，并已生成 `android/` 工程。

同步最新 Web 代码：

```bash
npm run cap:sync
```

打开 Android Studio：

```bash
npm run android:open
```

在 Android Studio 中：

- 连接 Android 手机可直接 Run 到真机。
- 生成 APK：Build > Build Bundle(s) / APK(s) > Build APK(s)。
- 更正式的测试可生成 AAB 并使用 Google Play Internal testing。

少量朋友内测可以发送 APK，但对方需要允许安装未知来源应用。更正式的外部测试建议用 Google Play 测试轨道。

## iPhone 为什么建议先用 PWA 或 TestFlight

iPhone 不适合直接给朋友发送 ipa 文件安装：

- iOS 安装需要签名、设备信任和开发者账号限制。
- 临时 ipa 分发不稳定，也不适合普通朋友内测。
- 当前阶段建议先用 PWA HTTPS 链接测试。
- 如果要做真正 iOS Beta，建议加入 Apple Developer Program 并通过 TestFlight 分发。

## 刷新页面 404 说明

Mewly 当前是单页应用，平台需要把未知路径回退到 `index.html`。项目已配置：

- Vercel：`vercel.json`
- Netlify：`netlify.toml` 和 `public/_redirects`
- Cloudflare Pages：`public/_redirects`

因此部署后刷新页面或从主屏幕打开都应回到 App。
