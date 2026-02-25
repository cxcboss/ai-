class PopupController {
  constructor() {
    this.selectedPlatform = null;
    this.selectedVideos = [];
    this.videoPath = '';
    this.isPublishing = false;
    this.videos = [];
    this.loadTimeout = null;
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadSettings();
    this.checkServerStatus();
    this.pollPublishState();
  }

  bindEvents() {
    document.getElementById('douyin-btn').addEventListener('click', () => this.selectPlatform('douyin'));
    document.getElementById('weixin-btn').addEventListener('click', () => this.selectPlatform('weixin'));
    document.getElementById('browse-btn').addEventListener('click', () => this.browseFolder());
    document.getElementById('start-btn').addEventListener('click', () => this.startPublish());
    document.getElementById('stop-btn').addEventListener('click', () => this.stopPublish());
    
    const pathInput = document.getElementById('video-path');
    pathInput.addEventListener('input', (e) => {
      this.videoPath = e.target.value;
      
      if (this.loadTimeout) {
        clearTimeout(this.loadTimeout);
      }
      
      this.loadTimeout = setTimeout(() => {
        if (e.target.value.trim()) {
          this.loadVideos(e.target.value.trim());
        }
      }, 500);
    });
    pathInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        if (this.loadTimeout) {
          clearTimeout(this.loadTimeout);
        }
        this.loadVideos(e.target.value);
      }
    });
  }

  async checkServerStatus() {
    try {
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        this.updateStatus('服务已连接，请输入视频目录路径');
      }
    } catch (error) {
      this.updateStatus('⚠️ 本地服务未启动，请先运行: cd local-server && npm start');
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['videoPath', 'autoTopic', 'autoDesc', 'customPrompt', 'scheduledPublish', 'scheduleTime']);
      if (result.videoPath) {
        document.getElementById('video-path').value = result.videoPath;
        this.videoPath = result.videoPath;
      }
      if (result.autoTopic !== undefined) {
        document.getElementById('auto-topic').checked = result.autoTopic;
      }
      if (result.autoDesc !== undefined) {
        document.getElementById('auto-desc').checked = result.autoDesc;
      }
      if (result.scheduledPublish !== undefined) {
        document.getElementById('scheduled-publish').checked = result.scheduledPublish;
      }
      if (result.scheduleTime) {
        document.getElementById('schedule-time').value = result.scheduleTime;
      } else {
        this.setDefaultScheduleTime();
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  }

  setDefaultScheduleTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    document.getElementById('schedule-time').value = `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  async saveSettings() {
    try {
      await chrome.storage.local.set({
        videoPath: this.videoPath,
        autoTopic: document.getElementById('auto-topic').checked,
        autoDesc: document.getElementById('auto-desc').checked,
        customPrompt: document.getElementById('custom-prompt').value,
        scheduledPublish: document.getElementById('scheduled-publish').checked,
        scheduleTime: document.getElementById('schedule-time').value
      });
    } catch (error) {
      console.error('Save settings error:', error);
    }
  }

  selectPlatform(platform) {
    this.selectedPlatform = platform;
    document.querySelectorAll('.platform-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${platform}-btn`).classList.add('active');
    this.updateStatus(`已选择${platform === 'douyin' ? '抖音' : '视频号'}平台`);
  }

  async browseFolder() {
    const path = document.getElementById('video-path').value.trim();
    if (path) {
      await this.loadVideos(path);
    } else {
      this.updateStatus('请输入视频目录路径，例如: /Users/xxx/Videos');
    }
  }

  async loadVideos(path) {
    if (!path || !path.trim()) {
      this.updateStatus('请输入视频目录路径');
      return;
    }
    
    path = path.trim();
    this.videoPath = path;
    this.updateStatus('正在加载视频列表...');
    
    try {
      const response = await fetch(`http://localhost:3000/api/videos?path=${encodeURIComponent(path)}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `服务器错误: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.videos && data.videos.length > 0) {
        this.videos = data.videos;
        this.selectedVideos = [...data.videos];
        this.renderVideoList(data.videos);
        this.renderPublishQueue();
        this.updateStatus(`✓ 已选择 ${data.videos.length} 个视频`);
      } else if (data.error) {
        this.updateStatus(`错误: ${data.error}`);
        this.clearVideoList();
      } else {
        this.updateStatus('未找到视频文件，请检查目录路径是否正确');
        this.clearVideoList();
      }
    } catch (error) {
      if (error.message.includes('Failed to fetch')) {
        this.updateStatus('⚠️ 无法连接本地服务，请确保服务已启动 (npm start)');
      } else {
        this.updateStatus(`错误: ${error.message}`);
      }
      this.clearVideoList();
      console.error('Load videos error:', error);
    }
  }

  clearVideoList() {
    document.getElementById('video-list').innerHTML = '';
    this.videos = [];
    this.selectedVideos = [];
    this.renderPublishQueue();
  }

  renderVideoList(videos) {
    const container = document.getElementById('video-list');
    container.innerHTML = videos.map((video, index) => `
      <div class="video-item" data-index="${index}">
        <input type="checkbox" id="video-${index}" checked>
        <span class="name" title="${video.name}">${video.name}</span>
        <span class="size">${this.formatSize(video.size)}</span>
      </div>
    `).join('');

    container.querySelectorAll('.video-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.tagName !== 'INPUT') {
          const checkbox = item.querySelector('input');
          checkbox.checked = !checkbox.checked;
        }
        this.updateSelectedVideos();
      });
      
      const checkbox = item.querySelector('input');
      checkbox.addEventListener('change', () => {
        this.updateSelectedVideos();
      });
    });
  }

  updateSelectedVideos() {
    const checkboxes = document.querySelectorAll('#video-list input:checked');
    this.selectedVideos = Array.from(checkboxes).map(cb => {
      const index = parseInt(cb.id.replace('video-', ''));
      return this.videos[index];
    }).filter(v => v !== undefined);
    this.renderPublishQueue();
  }

  renderPublishQueue() {
    const container = document.getElementById('publish-queue');
    if (this.selectedVideos.length === 0) {
      container.innerHTML = '<div style="color: #999; font-size: 12px; text-align: center;">未选择视频</div>';
      return;
    }
    container.innerHTML = `
      <div style="color: #666; font-size: 12px; margin-bottom: 8px;">共 ${this.selectedVideos.length} 个视频待发布</div>
      ${this.selectedVideos.map(video => `
        <div class="queue-item">
          <span class="status pending"></span>
          <span>${video.name}</span>
        </div>
      `).join('')}
    `;
  }

  formatSize(bytes) {
    if (!bytes || bytes < 0) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }

  async startPublish() {
    if (!this.selectedPlatform) {
      this.updateStatus('⚠️ 请先选择发布平台');
      return;
    }

    if (this.selectedVideos.length === 0) {
      this.updateStatus('⚠️ 请选择要发布的视频');
      return;
    }

    await this.saveSettings();
    this.isPublishing = true;
    
    document.getElementById('start-btn').disabled = true;
    document.getElementById('stop-btn').disabled = false;

    const settings = {
      autoTopic: document.getElementById('auto-topic').checked,
      autoDesc: document.getElementById('auto-desc').checked,
      customPrompt: document.getElementById('custom-prompt').value,
      scheduledPublish: document.getElementById('scheduled-publish').checked,
      scheduleTime: document.getElementById('schedule-time').value
    };

    this.updateStatus('正在启动发布流程...');

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'startPublishFlow',
        videos: this.selectedVideos,
        settings: settings,
        videoPath: this.videoPath,
        platform: this.selectedPlatform
      });
      
      if (response && response.success) {
        this.updateStatus('发布流程已启动，请查看新打开的页面...');
      } else {
        throw new Error('启动失败');
      }
    } catch (error) {
      this.updateStatus(`启动失败: ${error.message}`);
      this.isPublishing = false;
      document.getElementById('start-btn').disabled = false;
      document.getElementById('stop-btn').disabled = true;
    }
  }

  async stopPublish() {
    await chrome.runtime.sendMessage({ action: 'stopPublish' });
    this.isPublishing = false;
    document.getElementById('start-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
    this.updateStatus('已停止发布');
  }

  async pollPublishState() {
    setInterval(async () => {
      try {
        const state = await chrome.runtime.sendMessage({ action: 'getPublishState' });
        if (state && state.isPublishing) {
          this.updateStatus(`正在发布: ${state.currentIndex}/${state.videos.length}`);
          document.getElementById('start-btn').disabled = true;
          document.getElementById('stop-btn').disabled = false;
        }
      } catch (error) {
        // 忽略错误
      }
    }, 2000);
  }

  updateStatus(text) {
    const statusEl = document.getElementById('status-text');
    if (statusEl) {
      statusEl.textContent = text;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});
