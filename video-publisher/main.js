const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');
const log = require('electron-log');

let mainWindow;
let serverProcess = null;

log.transports.file.level = 'info';
log.info('应用启动...');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'icon.png'),
    title: '视频发布器'
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
  });

  log.info('窗口创建完成');
}

function getServerPath() {
  const isDev = !app.isPackaged;
  if (isDev) {
    return path.join(__dirname, '..', 'local-server', 'server.js');
  }
  return path.join(process.resourcesPath, 'app', 'local-server', 'server.js');
}

function startServer() {
  return new Promise((resolve, reject) => {
    const serverPath = getServerPath();
    log.info('启动服务，路径:', serverPath);

    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'node' : 'node';
    const args = [serverPath];

    serverProcess = spawn(command, args, {
      cwd: path.dirname(serverPath),
      detached: !isWindows,
      stdio: 'ignore'
    });

    if (!isWindows) {
      serverProcess.unref();
    }

    serverProcess.on('error', (err) => {
      log.error('服务启动失败:', err);
      reject(err);
    });

    serverProcess.on('spawn', () => {
      log.info('服务已启动');
      setTimeout(() => resolve(true), 1000);
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (!serverProcess) {
      const isWindows = process.platform === 'win32';
      const cmd = isWindows ? 'taskkill /F /IM node.exe' : 'pkill -f "node server.js"';
      exec(cmd, (err) => {
        log.info('服务已停止');
        resolve(true);
      });
    } else {
      serverProcess.kill();
      serverProcess = null;
      log.info('服务已停止');
      resolve(true);
    }
  });
}

function checkServerStatus() {
  return new Promise((resolve) => {
    exec('curl -s http://localhost:3000/health', (err) => {
      if (err) {
        resolve({ running: false });
      } else {
        resolve({ running: true });
      }
    });
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('start-server', async () => {
  try {
    await startServer();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('stop-server', async () => {
  try {
    await stopServer();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-status', async () => {
  return await checkServerStatus();
});

ipcMain.handle('open-chrome-extensions', () => {
  shell.openExternal('chrome://extensions/');
});

ipcMain.handle('open-history', () => {
  shell.openExternal('http://localhost:3000/');
});
