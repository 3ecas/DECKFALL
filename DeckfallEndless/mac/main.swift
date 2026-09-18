// Deckfall Endless — native macOS wrapper.
// A single window hosting the game in WebKit (part of macOS, nothing to install).
// Saves are persisted to ~/Library/Application Support/Deckfall Endless/store.json via a tiny JS bridge.
import Cocoa
import WebKit

final class StoreHandler: NSObject, WKScriptMessageHandler {
    let url: URL
    var data: [String: String]
    init(url: URL) {
        self.url = url
        if let d = try? Data(contentsOf: url), let obj = try? JSONSerialization.jsonObject(with: d) as? [String: String] {
            self.data = obj
        } else {
            self.data = [:]
        }
        super.init()
    }
    func userContentController(_ c: WKUserContentController, didReceive m: WKScriptMessage) {
        guard let body = m.body as? [String: Any], let key = body["key"] as? String else { return }
        if let v = body["value"] as? String { data[key] = v } else { data.removeValue(forKey: key) }
        if let d = try? JSONSerialization.data(withJSONObject: data) { try? d.write(to: url, options: .atomic) }
    }
    var bootstrap: String {
        let d = (try? JSONSerialization.data(withJSONObject: data)) ?? Data("{}".utf8)
        return "window.__NATIVE_STORE__ = " + String(decoding: d, as: UTF8.self) + ";"
    }
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKUIDelegate {
    var window: NSWindow!
    var web: WKWebView!
    func applicationDidFinishLaunching(_ n: Notification) {
        let support = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("Deckfall Endless", isDirectory: true)
        try? FileManager.default.createDirectory(at: support, withIntermediateDirectories: true)
        let store = StoreHandler(url: support.appendingPathComponent("store.json"))

        let cfg = WKWebViewConfiguration()
        cfg.userContentController.add(store, name: "store")
        cfg.userContentController.addUserScript(WKUserScript(source: store.bootstrap, injectionTime: .atDocumentStart, forMainFrameOnly: true))
        cfg.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        cfg.mediaTypesRequiringUserActionForPlayback = []

        web = WKWebView(frame: .zero, configuration: cfg)
        web.uiDelegate = self
        web.setValue(false, forKey: "drawsBackground")

        let rect = NSRect(x: 0, y: 0, width: 1120, height: 780)
        window = NSWindow(contentRect: rect, styleMask: [.titled, .closable, .miniaturizable, .resizable], backing: .buffered, defer: false)
        window.title = "Deckfall Endless"
        window.minSize = NSSize(width: 420, height: 620)
        window.backgroundColor = NSColor(red: 0.07, green: 0.06, blue: 0.09, alpha: 1)
        window.contentView = web
        window.setFrameAutosaveName("DeckfallMainWindow")
        if !window.setFrameUsingName("DeckfallMainWindow") { window.center() }
        window.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)

        let game = Bundle.main.resourceURL!.appendingPathComponent("game", isDirectory: true)
        web.loadFileURL(game.appendingPathComponent("index.html"), allowingReadAccessTo: game)
    }
    func applicationShouldTerminateAfterLastWindowClosed(_ s: NSApplication) -> Bool { true }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
let menubar = NSMenu()
let appItem = NSMenuItem(); menubar.addItem(appItem)
let appMenu = NSMenu()
appMenu.addItem(withTitle: "Hide Deckfall Endless", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
appMenu.addItem(withTitle: "Quit Deckfall Endless", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
appItem.submenu = appMenu
let windowItem = NSMenuItem(); menubar.addItem(windowItem)
let windowMenu = NSMenu(title: "Window")
windowMenu.addItem(withTitle: "Minimize", action: #selector(NSWindow.miniaturize(_:)), keyEquivalent: "m")
windowMenu.addItem(withTitle: "Close", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
windowItem.submenu = windowMenu
app.mainMenu = menubar
app.run()
