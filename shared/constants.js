const PLATFORMS = {
  DOUYIN: {
    name: '抖音',
    url: 'https://creator.douyin.com/creator-micro/content/publish',
    selectors: {
      uploadInput: 'input[type="file"]',
      description: '[contenteditable="true"], textarea[placeholder*="描述"]',
      publishButton: 'button:contains("发布")'
    }
  },
  WEIXIN: {
    name: '视频号',
    url: 'https://channels.weixin.qq.com/',
    selectors: {
      uploadInput: 'input[type="file"]',
      description: 'textarea[placeholder*="描述"], [contenteditable="true"]',
      publishButton: 'button:contains("发表")'
    }
  }
};

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.webm'];

const MAX_FILE_SIZE = 4 * 1024 * 1024 * 1024;

const DEFAULT_SETTINGS = {
  autoTopic: true,
  autoDesc: true,
  customPrompt: ''
};

const API_ENDPOINTS = {
  LOCAL_SERVER: 'http://localhost:3000',
  AI_API: 'https://ark.cn-beijing.volces.com/api/v3/responses'
};

module.exports = {
  PLATFORMS,
  VIDEO_EXTENSIONS,
  MAX_FILE_SIZE,
  DEFAULT_SETTINGS,
  API_ENDPOINTS
};
