import AVFoundation
import Security
import SwiftUI
import UIKit
import WebKit

@main
struct WordloomApp: App {
    var body: some Scene {
        WindowGroup {
            WordloomView()
        }
    }
}

struct WordloomView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> WordloomController {
        WordloomController()
    }

    func updateUIViewController(_ controller: WordloomController, context: Context) {}
}

final class WordloomController: UIViewController, WKNavigationDelegate, WKUIDelegate {
    private let bridge = WordloomBridge()

    override func loadView() {
        let config = WKWebViewConfiguration()
        config.websiteDataStore = .default()
        let initialScript = """
        window.WordloomIOS = {
          request(method, args = {}) {
            return window.webkit.messageHandlers.wordloom.postMessage({method, ...args});
          }
        };
        """
        config.userContentController.addUserScript(
            WKUserScript(source: initialScript, injectionTime: .atDocumentStart, forMainFrameOnly: true)
        )
        config.userContentController.addScriptMessageHandler(bridge, contentWorld: .page, name: "wordloom")
        let web = WKWebView(frame: .zero, configuration: config)
        web.navigationDelegate = self
        web.uiDelegate = self
        web.scrollView.contentInsetAdjustmentBehavior = .never
        web.backgroundColor = .systemBackground
        view = web
        bridge.presenter = self

        guard let page = Bundle.main.url(forResource: "Wordloom", withExtension: "html", subdirectory: "Web") else {
            let message = UILabel()
            message.text = "无法读取 Wordloom 的本地资源。"
            message.textAlignment = .center
            view = message
            return
        }
        web.loadFileURL(page, allowingReadAccessTo: page.deletingLastPathComponent())
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        decisionHandler(action.request.url?.isFileURL == true || action.targetFrame?.isMainFrame == false ? .allow : .cancel)
    }

    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "Wordloom", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "确定", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }
}

final class WordloomBridge: NSObject, WKScriptMessageHandlerWithReply {
    weak var presenter: UIViewController?
    private let speaker = AVSpeechSynthesizer()
    private let credentials: [String: Any] = [
        kSecClass as String: kSecClassGenericPassword,
        kSecAttrService as String: "app.wordloom.vocabulary",
        kSecAttrAccount as String: "DeepSeek API key"
    ]

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage,
                               replyHandler reply: @escaping (Any?, String?) -> Void) {
        guard message.frameInfo.isMainFrame, message.frameInfo.request.url?.isFileURL == true,
              let body = message.body as? [String: Any], let method = body["method"] as? String else {
            reply(nil, "此页面无法调用 Wordloom。")
            return
        }
        switch method {
        case "readKey":
            var query = credentials
            query[kSecReturnData as String] = true
            var value: CFTypeRef?
            let status = SecItemCopyMatching(query as CFDictionary, &value)
            let key = status == errSecSuccess ? (value as? Data).flatMap { String(data: $0, encoding: .utf8) } : nil
            reply(key ?? "", nil)
        case "saveKey":
            guard let key = body["key"] as? String else { reply(nil, "密钥格式错误。"); return }
            let status: OSStatus
            if key.isEmpty {
                let removed = SecItemDelete(credentials as CFDictionary)
                status = removed == errSecItemNotFound ? errSecSuccess : removed
            } else {
                let data = Data(key.utf8)
                let updated = SecItemUpdate(credentials as CFDictionary, [kSecValueData as String: data] as CFDictionary)
                if updated == errSecItemNotFound {
                    var item = credentials
                    item[kSecValueData as String] = data
                    item[kSecAttrAccessible as String] = kSecAttrAccessibleWhenUnlockedThisDeviceOnly
                    status = SecItemAdd(item as CFDictionary, nil)
                } else {
                    status = updated
                }
            }
            reply(status == errSecSuccess ? true : nil, status == errSecSuccess ? nil : "钥匙串保存失败。")
        case "deepseek":
            generate(body, reply: reply)
        case "speak":
            guard let text = body["text"] as? String else { reply(nil, "没有朗读内容。"); return }
            speaker.stopSpeaking(at: .immediate)
            let utterance = AVSpeechUtterance(string: text)
            utterance.voice = AVSpeechSynthesisVoice.speechVoices().first {
                $0.language == "en-US" && $0.gender == .male
            } ?? AVSpeechSynthesisVoice(language: "en-US")
            speaker.speak(utterance)
            reply(true, nil)
        case "keepAwake":
            UIApplication.shared.isIdleTimerDisabled = body["on"] as? Bool ?? false
            reply(true, nil)
        case "share":
            share(body, reply: reply)
        case "print":
            guard let html = body["html"] as? String, let controller = presenter else {
                reply(nil, "无法打开打印。")
                return
            }
            let print = UIPrintInteractionController.shared
            print.printFormatter = UIMarkupTextPrintFormatter(markupText: html)
            print.present(from: controller.view.bounds, in: controller.view, animated: true, completionHandler: nil)
            reply(true, nil)
        default:
            reply(nil, "不支持此操作。")
        }
    }

    private func generate(_ payload: [String: Any], reply: @escaping (Any?, String?) -> Void) {
        guard let key = payload["key"] as? String, !key.isEmpty,
              let body = payload["request"] as? [String: Any],
              let data = try? JSONSerialization.data(withJSONObject: body),
              let endpoint = URL(string: "https://api.deepseek.com/chat/completions") else {
            reply(nil, "请先配置 DeepSeek Key。")
            return
        }
        var request = URLRequest(url: endpoint, timeoutInterval: 100)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer " + key, forHTTPHeaderField: "Authorization")
        request.httpBody = data
        URLSession.shared.dataTask(with: request) { data, response, error in
            DispatchQueue.main.async {
                guard error == nil, let http = response as? HTTPURLResponse else {
                    reply(nil, "DeepSeek 连接失败，请检查网络。")
                    return
                }
                let result = data.flatMap { try? JSONSerialization.jsonObject(with: $0) } ?? [:]
                reply(["status": http.statusCode, "data": result], nil)
            }
        }.resume()
    }

    private func share(_ body: [String: Any], reply: @escaping (Any?, String?) -> Void) {
        guard let controller = presenter, let name = body["name"] as? String,
              URL(fileURLWithPath: name).lastPathComponent == name,
              name != ".", name != "..",
              let data = (body["base64"] as? String).flatMap({ Data(base64Encoded: $0) })
                ?? (body["text"] as? String).map({ Data($0.utf8) }) else {
            reply(nil, "无法生成导出文件。")
            return
        }
        let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString, isDirectory: true)
        do {
            try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
            let file = directory.appendingPathComponent(name)
            try data.write(to: file, options: .atomic)
            let share = UIActivityViewController(activityItems: [file], applicationActivities: nil)
            share.popoverPresentationController?.sourceView = controller.view
            share.popoverPresentationController?.sourceRect = CGRect(x: controller.view.bounds.midX, y: controller.view.bounds.midY, width: 1, height: 1)
            share.completionWithItemsHandler = { _, _, _, _ in try? FileManager.default.removeItem(at: directory) }
            controller.present(share, animated: true)
            reply(true, nil)
        } catch {
            reply(nil, "无法保存导出文件。")
        }
    }
}

