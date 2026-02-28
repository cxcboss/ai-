# 视频号/抖音发布助手

一个 Chrome 扩展，用于自动化视频号和抖音的视频发布流程。

## 快速开始

### Mac 用户

**方式一：使用编译好的 App（推荐）**
1. 下载仓库
2. 双击运行 `VideoPublisher` 应用

**方式二：使用 Python 启动器**
```bash
python3 video-publisher-launcher.py
```

**方式三：手动启动服务**
```bash
cd local-server
npm install
node server.js
```

### Windows 用户

**使用 Python 启动器**
1. 安装 Python: https://www.python.org/
2. 运行：
```cmd
python video-publisher-launcher.py
```

或双击 `start-win.bat`

### 加载 Chrome 扩展

1. 打开 Chrome 浏览器
2. 地址栏输入 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择 `chrome-extension` 文件夹

## 使用说明

### 基本使用

1. 启动服务后，点击「扩展管理」按钮
2. 点击浏览器工具栏中的扩展图标
3. 选择发布平台（抖音/视频号）
4. 输入视频目录路径
5. 配置发布选项
6. 点击「开始发布」

### 文件命名规则

| 文件名格式 | 行为 |
|-----------|------|
| `游戏名-视频描述.mp4` | 使用 AI 生成文案 |
| `123-xxx.mp4` | 跳过 AI，使用默认话题 |
| `原创-xxx.mp4` | 跳过活动选择 |
| `test video.mp4` | 跳过 AI，使用默认话题 |

## 目录结构

```
chrome/
├── chrome-extension/          # Chrome 扩展
├── local-server/            # 本地服务
├── VideoPublisher           # Mac 编译好的 App
├── video-publisher-launcher.py  # 跨平台启动器
├── start-win.bat            # Windows 启动脚本
├── start-mac.command        # Mac 启动脚本
└── README.md               # 说明文档
```

## 许可证

MIT License
