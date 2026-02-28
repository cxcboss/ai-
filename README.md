# 视频号/抖音发布助手

一个 Chrome 扩展，用于自动化视频号和抖音的视频发布流程。

## 功能特点

### 视频号发布
- ✅ 自动上传视频文件
- ✅ 自动填写描述和话题（支持 AI 生成）
- ✅ 自动选择活动（文件名包含"原创"则跳过）
- ✅ 自动设置定时发布
- ✅ 自动声明原创
- ✅ 多视频批量发布（第二个视频自动定时发布）
- ✅ 发布历史记录

### 抖音发布
- ✅ 自动上传视频文件
- ✅ 自动填写描述和话题

## 快速开始

### 1. 启动服务（Mac）

使用终端启动服务：

```bash
cd local-server
npm install
node server.js
```

或者双击运行 `start-mac.command`

### 2. 加载 Chrome 扩展

1. 打开 Chrome 浏览器
2. 地址栏输入 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `chrome-extension` 文件夹

### 3. 使用桌面应用（可选）

Mac 用户可以使用 Swift 原生编译的轻量级桌面应用：

1. 在 Xcode 中打开 `video-publisher-swift` 文件夹
2. 编译运行或导出为 .app
3. 使用应用启动/停止服务

## 使用说明

### 基本使用

1. 点击浏览器工具栏中的扩展图标
2. 选择发布平台（抖音/视频号）
3. 输入视频目录路径
4. 配置发布选项
5. 点击「开始发布」

### 文件命名规则

| 文件名格式 | 行为 |
|-----------|------|
| `游戏名-视频描述.mp4` | 使用 AI 生成文案 |
| `123-xxx.mp4` | 跳过 AI，使用默认话题 |
| `原创-xxx.mp4` | 跳过活动选择 |
| `test video.mp4` | 跳过 AI，使用默认话题 |

### 发布历史

访问 http://localhost:3000/ 查看发布历史记录

## 目录结构

```
chrome/
├── chrome-extension/          # Chrome 扩展
├── local-server/             # 本地服务
├── video-publisher-swift/    # Mac 原生应用 (Swift)
├── start-mac.command         # Mac 启动脚本
├── start-win.bat            # Windows 启动脚本
└── README.md                # 说明文档
```

## 许可证

MIT License
