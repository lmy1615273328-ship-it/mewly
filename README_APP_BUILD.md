# Mewly Beta 手机内测说明

Mewly 当前是一个移动端优先的 Web App / PWA，并已接入 Capacitor，方便后续打包成 Android / iOS Beta 测试版本。

## 1. 本地 Web 运行

```bash
npm install --cache ./work/.npm-cache
npm run dev -- --port 5173
```

浏览器打开：

```text
http://127.0.0.1:5173/
```

如果要让同一局域网手机访问，可以把 Vite host 改为本机局域网 IP，例如：

```bash
npm run dev -- --host 0.0.0.0 --port 5173
```

然后在手机浏览器打开电脑的局域网地址，例如：

```text
http://你的电脑局域网IP:5173/
```

## 2. PWA 添加到手机主屏幕

先构建并启动预览：

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

手机浏览器打开预览地址后：

- iPhone Safari：点击分享按钮，选择“添加到主屏幕”。
- Android Chrome：点击菜单，选择“添加到主屏幕”或“安装应用”。

PWA 名称、启动页名称和 manifest 名称均为 `Mewly`。

## 3. Capacitor 同步

每次修改 Web 代码后，先同步到原生项目：

```bash
npm run cap:sync
```

这会执行：

```bash
npm run build
cap sync
```

## 4. Android Beta 测试

项目已生成 Android 工程：

```text
android/
```

打开 Android Studio：

```bash
npm run android:open
```

在 Android Studio 中可以：

- 连接 Android 手机，直接 Run 到真机。
- 生成调试 APK：Build > Build Bundle(s) / APK(s) > Build APK(s)。
- 生成 AAB：Build > Generate Signed Bundle / APK，选择 Android App Bundle。

给朋友内测：

- 少量朋友测试可以发送 Debug APK，但对方需要允许安装未知来源应用。
- 更正式的 Beta 建议使用 Google Play Internal testing / Closed testing 分发 AAB。
- 不要在公开渠道分发未审核版本。

## 5. iOS Beta 测试

项目已生成 iOS 工程：

```text
ios/
```

打开 Xcode：

```bash
npm run ios:open
```

iPhone 测试限制：

- iOS 不建议也不能承诺“随便安装 ipa”。
- 个人真机调试需要 Apple ID、Xcode、开发者签名和受信任设备。
- 分享给朋友测试，推荐使用 Apple Developer Program + TestFlight。
- TestFlight 需要在 App Store Connect 创建应用、上传构建、邀请测试者。

## 6. 当前 Beta 数据说明

- 用户、猫咪资料、相册、行为分析、异常记录、论坛和流浪猫记录暂存在浏览器 localStorage。
- 上传图片 / 视频 / 音频以本地预览数据保存，适合原型测试，不适合长期云端备份。
- 后续可接 Supabase / Firebase 做账号、云存储、数据库和鉴权。
- 行为分析预留入口：`analyzeCatMedia(file, metadata)`。
- 健康风险规则入口：`analyzeHealthRisk(record)`。
- 地图服务可接高德地图、Google Maps 或 Mapbox，并继续保留位置模糊化与审核机制。

## 7. Beta 测试重点

请朋友重点体验：

- 注册 / 登录与猫咪资料创建。
- 首页是否是状态总览，而不是功能按钮堆叠。
- 猫咪行为分析 Insight 是否和异常记录 Notes 分开。
- 相册上传、备注和趋势卡片。
- 咪记事异常记录和风险提示。
- 喵圈发布、点赞、评论、收藏、举报入口。
- 流浪猫地图是否按条件解锁。
- 设置页语言切换：默认简体中文，可切换 English。
