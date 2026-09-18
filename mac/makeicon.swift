// Draws the app icon (a gold card on ink) and writes AppIcon.icns next to this file. Run by build via: swift mac/makeicon.swift
import Cocoa
let sizes: [(Int, String)] = [(16,"16x16"),(32,"16x16@2x"),(32,"32x32"),(64,"32x32@2x"),(128,"128x128"),(256,"128x128@2x"),(256,"256x256"),(512,"256x256@2x"),(512,"512x512"),(1024,"512x512@2x")]
let dir = URL(fileURLWithPath: CommandLine.arguments[0]).deletingLastPathComponent()
let set = dir.appendingPathComponent("AppIcon.iconset", isDirectory: true)
try? FileManager.default.removeItem(at: set)
try! FileManager.default.createDirectory(at: set, withIntermediateDirectories: true)
for (px, name) in sizes {
    let s = CGFloat(px)
    let img = NSImage(size: NSSize(width: s, height: s))
    img.lockFocus()
    let bg = NSBezierPath(roundedRect: NSRect(x: s*0.06, y: s*0.06, width: s*0.88, height: s*0.88), xRadius: s*0.2, yRadius: s*0.2)
    NSColor(red: 0.07, green: 0.06, blue: 0.09, alpha: 1).setFill(); bg.fill()
    let card = NSBezierPath(roundedRect: NSRect(x: s*0.3, y: s*0.2, width: s*0.4, height: s*0.6), xRadius: s*0.06, yRadius: s*0.06)
    NSColor(red: 0.89, green: 0.73, blue: 0.36, alpha: 1).setFill(); card.fill()
    NSColor(red: 0.07, green: 0.06, blue: 0.09, alpha: 1).setStroke(); card.lineWidth = max(1, s*0.02); card.stroke()
    let para = NSMutableParagraphStyle(); para.alignment = .center
    let attrs: [NSAttributedString.Key: Any] = [.font: NSFont.boldSystemFont(ofSize: s*0.34), .foregroundColor: NSColor(red: 0.07, green: 0.06, blue: 0.09, alpha: 1), .paragraphStyle: para]
    ("D" as NSString).draw(in: NSRect(x: s*0.3, y: s*0.28, width: s*0.4, height: s*0.5), withAttributes: attrs)
    img.unlockFocus()
    let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
    rep.size = NSSize(width: s, height: s)
    let png = rep.representation(using: .png, properties: [:])!
    try! png.write(to: set.appendingPathComponent("icon_\(name).png"))
}
let task = Process(); task.launchPath = "/usr/bin/iconutil"; task.arguments = ["-c", "icns", set.path, "-o", dir.appendingPathComponent("AppIcon.icns").path]
task.launch(); task.waitUntilExit()
try? FileManager.default.removeItem(at: set)
print("icon written")
