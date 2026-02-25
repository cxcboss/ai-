class DouyinPublisher {
  constructor() {
    this.isReady = false;
    this.init();
  }

  init() {
    console.log('[抖音发布助手] 初始化中...');
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      console.log('[抖音发布助手] 收到消息:', message.action);
      
      if (message.action === 'startPublish') {
        this.publishSingleVideo(message.videos[0], message.settings, message.videoPath, message.videoIndex, message.totalVideos)
          .then(() => {
            this.notifyProgress(message.videoIndex + 1, message.totalVideos, message.videos[0].name, 'done');
            sendResponse({ success: true });
          })
          .catch(error => {
            console.error('[抖音发布助手] 发布失败:', error);
            this.notifyProgress(message.videoIndex + 1, message.totalVideos, message.videos[0].name, 'error');
            sendResponse({ success: false, error: error.message });
          });
        return true;
      }
      
      if (message.action === 'ping') {
        sendResponse({ ready: true });
        return true;
      }
    });
    
    this.isReady = true;
    console.log('[抖音发布助手] 初始化完成');
  }

  async publishSingleVideo(video, settings, videoPath, videoIndex, totalVideos) {
    console.log(`[抖音发布助手] 发布视频 ${videoIndex + 1}/${totalVideos}: ${video.name}`);
    console.log('[抖音发布助手] 等待页面加载...');
    
    await this.waitForPageReady();
    await this.delay(2000);

    console.log('[抖音发布助手] 查找上传入口...');
    const uploadInput = await this.findUploadInput();
    if (!uploadInput) {
      throw new Error('未找到上传入口，请确保在正确的发布页面');
    }
    console.log('[抖音发布助手] 找到上传入口');

    console.log('[抖音发布助手] 获取视频文件...');
    const file = await this.getVideoFile(videoPath, video.name);
    if (!file) {
      throw new Error('无法获取视频文件');
    }
    console.log('[抖音发布助手] 视频文件获取成功，大小:', file.size);

    console.log('[抖音发布助手] 上传视频...');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(new File([file], video.name, { type: 'video/mp4' }));
    uploadInput.files = dataTransfer.files;
    uploadInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    console.log('[抖音发布助手] 等待视频上传和处理（约15秒）...');
    await this.delay(15000);

    console.log('[抖音发布助手] 等待发布表单加载...');
    await this.waitForPublishForm();
    await this.delay(2000);

    let aiContent = { topics: [], description: '' };
    if (settings.autoTopic || settings.autoDesc) {
      console.log('[抖音发布助手] 生成AI内容...');
      aiContent = await this.generateAIContent(video.name, settings);
      console.log('[抖音发布助手] AI内容:', JSON.stringify(aiContent));
      
      if (aiContent.error) {
        console.error('[抖音发布助手] AI生成错误:', aiContent.error);
      }
    }

    if (settings.autoDesc && aiContent.description) {
      console.log('[抖音发布助手] 填写描述:', aiContent.description);
      const descResult = await this.fillDescription(aiContent.description);
      console.log('[抖音发布助手] 描述填写结果:', descResult);
      await this.delay(500);
    }
    
    if (settings.autoTopic && aiContent.topics && aiContent.topics.length > 0) {
      console.log('[抖音发布助手] 填写话题:', aiContent.topics);
      const topicResult = await this.fillTopics(aiContent.topics);
      console.log('[抖音发布助手] 话题填写结果:', topicResult);
      await this.delay(500);
    }

    await this.delay(1000);
    console.log('[抖音发布助手] 点击发布按钮...');
    const publishResult = await this.clickPublish();
    console.log('[抖音发布助手] 发布按钮点击结果:', publishResult);
    
    await this.delay(2000);
    console.log('[抖音发布助手] 视频发布完成');
  }

  async waitForPageReady() {
    return new Promise((resolve) => {
      if (document.readyState === 'complete') {
        resolve();
      } else {
        window.addEventListener('load', resolve);
      }
    });
  }

  async waitForPublishForm() {
    console.log('[抖音发布助手] 等待发布表单出现...');
    
    for (let i = 0; i < 30; i++) {
      const formElements = document.querySelectorAll([
        '[class*="editor"]',
        '[class*="Editor"]',
        '[contenteditable="true"]',
        'textarea'
      ].join(', '));
      
      if (formElements.length > 0) {
        console.log('[抖音发布助手] 找到表单元素:', formElements.length);
        return true;
      }
      
      await this.delay(500);
    }
    
    console.log('[抖音发布助手] 等待表单超时，继续尝试...');
    return false;
  }

  async findUploadInput() {
    const selectors = [
      'input[type="file"][accept*="video"]',
      'input[type="file"][accept*=".mp4"]',
      'input[type="file"]'
    ];

    for (let attempt = 0; attempt < 10; attempt++) {
      for (const selector of selectors) {
        const inputs = document.querySelectorAll(selector);
        for (const input of inputs) {
          if (input && input.type === 'file') {
            console.log('[抖音发布助手] 找到上传输入框:', selector);
            return input;
          }
        }
      }
      await this.delay(500);
    }

    return null;
  }

  async getVideoFile(videoPath, videoName) {
    const fullPath = videoPath.endsWith('/') 
      ? `${videoPath}${videoName}` 
      : `${videoPath}/${videoName}`;
    
    console.log('[抖音发布助手] 获取视频文件:', fullPath);
    
    try {
      const response = await fetch(`http://localhost:3000/api/video/file?path=${encodeURIComponent(fullPath)}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const blob = await response.blob();
      return blob;
    } catch (error) {
      console.error('[抖音发布助手] 获取视频文件失败:', error);
      return null;
    }
  }

  async generateAIContent(videoName, settings) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({
        action: 'generateContent',
        videoName: videoName,
        settings: settings
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[抖音发布助手] AI生成错误:', chrome.runtime.lastError);
          resolve({ topics: [], description: '', error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { topics: [], description: '' });
        }
      });
    });
  }

  async fillDescription(description) {
    console.log('[抖音发布助手] 尝试填写描述...');
    
    const allEditable = document.querySelectorAll('[contenteditable="true"]');
    console.log('[抖音发布助手] 找到可编辑元素数量:', allEditable.length);
    
    for (const element of allEditable) {
      const className = element.className || '';
      const parent = element.parentElement;
      const parentClass = parent?.className || '';
      
      if (this.isElementVisible(element)) {
        const isEditor = className.includes('editor') || className.includes('Editor') ||
                        className.includes('content') || className.includes('Content') ||
                        parentClass.includes('editor') || parentClass.includes('Editor');
        
        if (isEditor || element.getAttribute('data-placeholder')) {
          console.log('[抖音发布助手] 找到描述输入框，准备填写');
          
          element.focus();
          await this.delay(100);
          element.click();
          await this.delay(100);
          
          element.innerHTML = '';
          
          document.execCommand('insertText', false, description);
          
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          
          console.log('[抖音发布助手] 描述填写完成');
          return true;
        }
      }
    }
    
    const textareas = document.querySelectorAll('textarea');
    for (const textarea of textareas) {
      if (this.isElementVisible(textarea)) {
        console.log('[抖音发布助手] 找到textarea，尝试填写');
        textarea.focus();
        textarea.value = description;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      }
    }
    
    console.log('[抖音发布助手] 未找到描述输入框');
    return false;
  }

  async fillTopics(topics) {
    console.log('[抖音发布助手] 尝试填写话题:', topics);
    
    const topicText = topics.map(t => t.startsWith('#') ? t : `#${t}`).join(' ');
    
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    
    for (const element of editableElements) {
      if (this.isElementVisible(element)) {
        const currentText = element.textContent || '';
        
        if (currentText.length > 0 || element.className.includes('editor')) {
          console.log('[抖音发布助手] 在编辑器中添加话题');
          
          element.focus();
          await this.delay(100);
          
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(element);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          
          document.execCommand('insertText', false, '\n' + topicText + ' ');
          element.dispatchEvent(new Event('input', { bubbles: true }));
          
          console.log('[抖音发布助手] 话题添加完成');
          return true;
        }
      }
    }
    
    console.log('[抖音发布助手] 未找到合适的位置添加话题');
    return false;
  }

  isElementVisible(element) {
    if (!element) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetWidth > 0 && 
           element.offsetHeight > 0;
  }

  async clickPublish() {
    console.log('[抖音发布助手] 查找发布按钮...');
    
    const allButtons = document.querySelectorAll('button');
    console.log('[抖音发布助手] 找到按钮数量:', allButtons.length);
    
    const publishButtons = [];
    
    for (const btn of allButtons) {
      const text = (btn.textContent || '').trim();
      
      if (this.isElementVisible(btn) && !btn.disabled) {
        if (text === '发布' || text === '发表') {
          publishButtons.push({ btn, text, priority: 1 });
        } else if (text === '立即发布' || text === '立即发表') {
          publishButtons.push({ btn, text, priority: 2 });
        } else if (text.includes('发布') && !text.includes('高清') && !text.includes('定时')) {
          publishButtons.push({ btn, text, priority: 3 });
        }
      }
    }
    
    publishButtons.sort((a, b) => a.priority - b.priority);
    
    if (publishButtons.length > 0) {
      const { btn, text } = publishButtons[0];
      console.log('[抖音发布助手] 找到发布按钮:', text);
      btn.click();
      return true;
    }
    
    console.log('[抖音发布助手] 未找到合适的发布按钮');
    return false;
  }

  notifyProgress(current, total, videoName, status) {
    try {
      chrome.runtime.sendMessage({
        action: 'publishProgress',
        current: current,
        total: total,
        videoName: videoName,
        status: status
      });
    } catch (e) {
      console.log('[抖音发布助手] 通知进度失败:', e);
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

console.log('[抖音发布助手] 脚本加载');
const publisher = new DouyinPublisher();
