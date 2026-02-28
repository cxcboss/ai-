#!/usr/bin/env python3
"""
视频发布器 - 跨平台启动器
支持 Mac 和 Windows
"""

import http.server
import socketserver
import webbrowser
import subprocess
import os
import sys
import threading
import time

PORT = 3001
SERVER_PORT = 3000

HTML = '''<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>视频发布器</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; display: flex; justify-content: center; align-items: center; padding: 20px; }
    .container { background: white; border-radius: 20px; padding: 30px; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    .logo { text-align: center; margin-bottom: 20px; }
    .logo-icon { font-size: 50px; }
    h1 { text-align: center; color: #333; margin: 0 0 5px 0; }
    .subtitle { text-align: center; color: #888; font-size: 13px; }
    .status { background: #f8f9fa; border-radius: 15px; padding: 20px; text-align: center; margin-bottom: 20px; }
    .status-dot { width: 12px; height: 12px; border-radius: 50%; display: inline-block; margin-right: 8px; }
    .status-text { font-size: 16px; font-weight: 600; }
    .url { font-size: 13px; color: #666; margin-top: 10px; }
    .btn-group { display: flex; gap: 10px; margin-bottom: 10px; }
    .btn { flex: 1; padding: 12px; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600; }
    .btn-start { background: #4caf50; color: white; }
    .btn-stop { background: #f44336; color: white; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .links { display: flex; gap: 10px; }
    .link { flex: 1; padding: 10px; background: #f0f0f0; border: none; border-radius: 8px; cursor: pointer; }
    .footer { text-align: center; margin-top: 20px; color: #aaa; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo"><div class="logo-icon">🎬</div></div>
    <h1>视频发布器</h1>
    <p class="subtitle">启动和管理视频发布助手服务</p>
    <div class="status">
      <span class="status-dot" id="dot"></span>
      <span class="status-text" id="status">检查中...</span>
      <div class="url">http://localhost:3000/</div>
    </div>
    <div class="btn-group">
      <button class="btn btn-start" id="startBtn" onclick="startServer()">▶ 启动服务</button>
      <button class="btn btn-stop" id="stopBtn" onclick="stopServer()">⏹ 停止服务</button>
    </div>
    <div class="links">
      <button class="link" onclick="openExt()">🔧 扩展管理</button>
      <button class="link" onclick="openHist()">📋 发布历史</button>
    </div>
    <div class="footer">视频发布器 v1.0.0</div>
  </div>
  <script>
    function checkStatus() {
      fetch('http://localhost:3000/health').then(r => {
        if (r.ok) {
          document.getElementById('dot').style.background = '#4caf50';
          document.getElementById('status').textContent = '服务运行中';
          document.getElementById('startBtn').disabled = true;
          document.getElementById('stopBtn').disabled = false;
        } else {
          updateStopped();
        }
      }).catch(() => updateStopped());
    }
    function updateStopped() {
      document.getElementById('dot').style.background = '#999';
      document.getElementById('status').textContent = '服务已停止';
      document.getElementById('startBtn').disabled = false;
      document.getElementById('stopBtn').disabled = true;
    }
    function startServer() { fetch('/start'); setTimeout(() => location.reload(), 2000); }
    function stopServer() { fetch('/stop'); setTimeout(() => location.reload(), 1000); }
    function openExt() { window.open('chrome://extensions/'); }
    function openHist() { window.open('http://localhost:3000/'); }
    checkStatus();
    setInterval(checkStatus, 3000);
  </script>
</body>
</html>
'''

def check_server():
    """检查服务是否运行"""
    import urllib.request
    try:
        urllib.request.urlopen(f'http://localhost:{SERVER_PORT}/health', timeout=2)
        return True
    except:
        return False

def start_server():
    """启动服务"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    server_path = os.path.join(script_dir, 'local-server', 'server.js')
    
    if sys.platform == 'win32':
        subprocess.Popen(
            ['cmd', '/c', 'start', 'cmd', '/k', 'node', server_path],
            cwd=os.path.join(script_dir, 'local-server'),
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    else:
        script = f'''
        tell application "Terminal"
            activate
            do script "cd '{server_path.replace(os.path.sep, '/').rsplit('/', 1)[0]}' && node server.js"
        end tell
        '''
        subprocess.run(['osascript', '-e', script])

def stop_server():
    """停止服务"""
    if sys.platform == 'win32':
        subprocess.run(['taskkill', '/F', '/IM', 'node.exe'], capture_output=True)
    else:
        subprocess.run(['killall', '-9', 'node'], capture_output=True)

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/start':
            start_server()
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
        elif self.path == '/stop':
            stop_server()
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(HTML.encode('utf-8'))
    
    def log_message(self, format, *args):
        pass

def main():
    print(f"视频发布器启动中: http://localhost:{PORT}")
    print("按 Ctrl+C 停止")
    
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        webbrowser.open(f'http://localhost:{PORT}')
        httpd.serve_forever()

if __name__ == '__main__':
    main()
