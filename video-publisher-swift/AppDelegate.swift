//
//  AppDelegate.swift
//  VideoPublisher
//

import Cocoa

class AppDelegate: NSObject, NSApplicationDelegate {

    var window: NSWindow!
    var statusLabel: NSTextField!
    var statusDot: NSView!
    var startButton: NSButton!
    var stopButton: NSButton!
    var statusTimer: Timer?
    
    func applicationDidFinishLaunching(_ aNotification: Notification) {
        setupWindow()
        checkServerStatus()
        statusTimer = Timer.scheduledTimer(withTimeInterval: 3.0, repeats: true) { [weak self] _ in
            self?.checkServerStatus()
        }
    }
    
    func applicationWillTerminate(_ aNotification: Notification) {
        stopServer()
        statusTimer?.invalidate()
    }
    
    func setupWindow() {
        window = NSWindow(
            contentRect: NSRect(x: 0, y: 0, width: 420, height: 380),
            styleMask: [.titled, .closable, .miniaturizable],
            backing: .buffered,
            defer: false
        )
        window.title = "视频发布器"
        window.center()
        window.isReleasedWhenClosed = false
        
        let contentView = NSView(frame: NSRect(x: 0, y: 0, width: 420, height: 380))
        contentView.wantsLayer = true
        contentView.layer?.backgroundColor = NSColor.white.cgColor
        
        let gradientLayer = CAGradientLayer()
        gradientLayer.frame = NSRect(x: 0, y: 280, width: 420, height: 100)
        gradientLayer.colors = [
            NSColor(red: 0.4, green: 0.494, blue: 0.918, alpha: 1).cgColor,
            NSColor(red: 0.463, green: 0.294, blue: 0.635, alpha: 1).cgColor
        ]
        gradientLayer.startPoint = CGPoint(x: 0, y: 0)
        gradientLayer.endPoint = CGPoint(x: 1, y: 1)
        contentView.layer?.addSublayer(gradientLayer)
        
        let logoLabel = NSTextField(labelWithString: "🎬")
        logoLabel.font = NSFont.systemFont(ofSize: 50)
        logoLabel.frame = NSRect(x: 170, y: 295, width: 80, height: 60)
        contentView.addSubview(logoLabel)
        
        let titleLabel = NSTextField(labelWithString: "视频发布器")
        titleLabel.font = NSFont.systemFont(ofSize: 22, weight: .bold)
        titleLabel.textColor = .white
        titleLabel.frame = NSRect(x: 0, y: 265, width: 420, height: 30)
        titleLabel.alignment = .center
        contentView.addSubview(titleLabel)
        
        let subtitleLabel = NSTextField(labelWithString: "启动和管理视频发布助手服务")
        subtitleLabel.font = NSFont.systemFont(ofSize: 13)
        subtitleLabel.textColor = NSColor.white.withAlphaComponent(0.8)
        subtitleLabel.frame = NSRect(x: 0, y: 245, width: 420, height: 20)
        subtitleLabel.alignment = .center
        contentView.addSubview(subtitleLabel)
        
        let statusCard = NSView(frame: NSRect(x: 30, y: 140, width: 360, height: 90))
        statusCard.wantsLayer = true
        statusCard.layer?.backgroundColor = NSColor(red: 0.97, green: 0.97, blue: 0.97, alpha: 1).cgColor
        statusCard.layer?.cornerRadius = 15
        contentView.addSubview(statusCard)
        
        statusDot = NSView(frame: NSRect(x: 30, y: 195, width: 12, height: 12))
        statusDot.wantsLayer = true
        statusDot.layer?.backgroundColor = NSColor.gray.cgColor
        statusDot.layer?.cornerRadius = 6
        contentView.addSubview(statusDot)
        
        statusLabel = NSTextField(labelWithString: "检查中...")
        statusLabel.font = NSFont.systemFont(ofSize: 16, weight: .semibold)
        statusLabel.textColor = .black
        statusLabel.frame = NSRect(x: 50, y: 192, width: 200, height: 20)
        contentView.addSubview(statusLabel)
        
        let urlLabel = NSTextField(labelWithString: "http://localhost:3000/")
        urlLabel.font = NSFont.systemFont(ofSize: 13)
        urlLabel.textColor = .gray
        urlLabel.frame = NSRect(x: 30, y: 155, width: 360, height: 20)
        urlLabel.alignment = .center
        urlLabel.isBezeled = false
        urlLabel.drawsBackground = false
        urlLabel.isEditable = false
        contentView.addSubview(urlLabel)
        
        startButton = NSButton(frame: NSRect(x: 30, y: 100, width: 170, height: 30))
        startButton.title = "▶ 启动服务"
        startButton.bezelStyle = .rounded
        startButton.isBordered = true
        startButton.wantsLayer = true
        startButton.layer?.backgroundColor = NSColor(red: 0.298, green: 0.686, blue: 0.314, alpha: 1).cgColor
        startButton.layer?.cornerRadius = 8
        startButton.contentTintColor = .white
        startButton.target = self
        startButton.action = #selector(startServerClicked)
        contentView.addSubview(startButton)
        
        stopButton = NSButton(frame: NSRect(x: 220, y: 100, width: 170, height: 30))
        stopButton.title = "⏹ 停止服务"
        stopButton.bezelStyle = .rounded
        stopButton.isBordered = true
        stopButton.wantsLayer = true
        stopButton.layer?.backgroundColor = NSColor(red: 0.957, green: 0.263, blue: 0.212, alpha: 1).cgColor
        stopButton.layer?.cornerRadius = 8
        stopButton.contentTintColor = .white
        stopButton.target = self
        stopButton.action = #selector(stopServerClicked)
        stopButton.isEnabled = false
        contentView.addSubview(stopButton)
        
        let extensionsButton = NSButton(frame: NSRect(x: 30, y: 60, width: 170, height: 30))
        extensionsButton.title = "🔧 扩展管理"
        extensionsButton.bezelStyle = .rounded
        extensionsButton.target = self
        extensionsButton.action = #selector(openExtensions)
        contentView.addSubview(extensionsButton)
        
        let historyButton = NSButton(frame: NSRect(x: 220, y: 60, width: 170, height: 30))
        historyButton.title = "📋 发布历史"
        historyButton.bezelStyle = .rounded
        historyButton.target = self
        historyButton.action = #selector(openHistory)
        contentView.addSubview(historyButton)
        
        let versionLabel = NSTextField(labelWithString: "视频发布器 v1.0.0")
        versionLabel.font = NSFont.systemFont(ofSize: 11)
        versionLabel.textColor = .lightGray
        versionLabel.frame = NSRect(x: 0, y: 15, width: 420, height: 15)
        versionLabel.alignment = .center
        contentView.addSubview(versionLabel)
        
        window.contentView = contentView
        window.makeKeyAndOrderFront(nil)
    }
    
    @objc func startServerClicked(_ sender: NSButton) {
        startButton.isEnabled = false
        startButton.title = "启动中..."
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.startServer()
            
            DispatchQueue.main.async {
                self?.checkServerStatus()
            }
        }
    }
    
    @objc func stopServerClicked(_ sender: NSButton) {
        stopButton.isEnabled = false
        stopButton.title = "停止中..."
        
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.stopServer()
            
            DispatchQueue.main.async {
                self?.checkServerStatus()
            }
        }
    }
    
    func startServer() {
        let homeDir = NSHomeDirectory()
        let script = """
        tell application "Terminal"
            activate
            do script "cd '\(homeDir)/Desktop/my/Develop/aiapp/chrome/local-server' && node server.js"
        end tell
        """
        
        var error: NSDictionary?
        if let appleScript = NSAppleScript(source: script) {
            appleScript.executeAndReturnError(&error)
        }
        
        if error != nil {
            let task = Process()
            task.launchPath = "/bin/bash"
            task.arguments = ["-c", "open -a Terminal.app"]
            
            do {
                try task.run()
            } catch {
                print("Error: \(error)")
            }
        }
    }
    
    func stopServer() {
        let task = Process()
        task.launchPath = "/bin/bash"
        task.arguments = ["-c", "killall -9 node 2>/dev/null || true"]
        
        do {
            try task.run()
            task.waitUntilExit()
        } catch {
            print("Error: \(error)")
        }
    }
    
    func checkServerStatus() {
        let task = Process()
        task.launchPath = "/bin/bash"
        task.arguments = ["-c", "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/health 2>/dev/null"]
        
        let pipe = Pipe()
        task.standardOutput = pipe
        task.standardError = pipe
        
        do {
            try task.run()
            task.waitUntilExit()
            
            let data = pipe.fileHandleForReading.readDataToEndOfFile()
            let output = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
            
            let isRunning = output == "200"
            
            DispatchQueue.main.async { [weak self] in
                self?.updateUI(isRunning: isRunning)
            }
        } catch {
            DispatchQueue.main.async { [weak self] in
                self?.updateUI(isRunning: false)
            }
        }
    }
    
    func updateUI(isRunning: Bool) {
        if isRunning {
            statusDot.layer?.backgroundColor = NSColor(red: 0.298, green: 0.686, blue: 0.314, alpha: 1).cgColor
            statusLabel.stringValue = "服务运行中"
            startButton.isEnabled = false
            stopButton.isEnabled = true
            startButton.title = "▶ 启动服务"
            stopButton.title = "⏹ 停止服务"
        } else {
            statusDot.layer?.backgroundColor = NSColor.gray.cgColor
            statusLabel.stringValue = "服务已停止"
            startButton.isEnabled = true
            stopButton.isEnabled = false
            startButton.title = "▶ 启动服务"
            stopButton.title = "⏹ 停止服务"
        }
    }
    
    @objc func openExtensions() {
        if let url = URL(string: "chrome://extensions/") {
            NSWorkspace.shared.open(url)
        }
    }
    
    @objc func openHistory() {
        if let url = URL(string: "http://localhost:3000/") {
            NSWorkspace.shared.open(url)
        }
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.run()
