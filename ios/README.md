# Wordloom 0.17.4 · iPhone 工程

此工程包含本地网页界面、单词本、计时场景及猫图。在 Mac 上解压，用 Xcode 打开 Wordloom.xcodeproj。选中 Wordloom 后，在 Signing & Capabilities 选择自己的 Team。再选择模拟器或连接 iPhone 运行。若 Xcode 提示 Bundle Identifier 已被占用，把它改成自己的唯一标识。

DeepSeek、英文朗读、导出和打印通过 iOS 包装层调用系统功能。需要联网的 DeepSeek 功能使用你配置的 Key，保存在本机钥匙串。

项目在 Windows 环境打包，未在 Xcode 编译或在 iPhone 真机运行。工程 ZIP 不能直接安装到手机。安装到真机需要在 Xcode 中完成签名。[Apple 的真机运行说明](https://developer.apple.com/documentation/Xcode/running-your-app-on-simulated-or-physical-devices)

