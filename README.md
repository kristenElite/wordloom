# Wordloom

一个自己做来背单词、读故事、记学习时间的小软件。

以前用 Timing 的时候，我最喜欢它的计时画面。一开始是宇宙，后来是海洋、森林和城市。读书读到一半抬头看，有时候已经换了一幕，才发现自己学了多久。做 Wordloom 的时候，我就想把这种感觉留住，再把平时背英语会用到的东西也加进去。

## 更新历程

从最早做的词本和 Timing，到后来加的故事、例句和备份，我挑了几个变化比较大的版本记下来。最近的 0.19.8 把「我的阅读」和故事历史做得更好找，也把晚安卡片做成了能保存的图片。

[查看更新历程](CHANGELOG.md)

## 我平时怎么用

- **词本**　看到生词就收进去，可以按课、按书分开建词本。词能查释义、听发音、复习，也可以批量导入和导出备份。
- **故事**　从词本勾几个词，让 DeepSeek 用这些词写一篇英文故事。中文译文可以逐句展开，有不认识的词就点一下，能查、能听，也能直接收进自己的词本。
- **计时**　可以设一个目标，也可以直接开始。有全屏背景、慢慢往外扩的光圈和随时间走的进度环。背景会左右移动，到下一幕时淡入，按暂停就一起停住。
- **Moments 和作息**　随手发点文字和照片。晚上点「睡觉了」，Timing 会记下当天最后一次点的时间。

## 关于 Timing 的图

Wordloom **沿用了原版 Timing 的计时图和演化场景**。36 张图的整理、编号和出场顺序参考了 water0523 的 **RestoreTimingTimer** 扩展模式，里面也有他后来补充的图片。这里的横移、光圈、淡入换图和暂停效果，是根据参考项目和手机演示重新做进 Wordloom 的。

我把一轮设成 19 小时，36 幕每 **31 分 40 秒**换一次。想看看后面的画面，可以在计时页点「预览宇宙旅程」，直接拖到喜欢的阶段。

[RestoreTimingTimer 源码与图片来源](https://github.com/water0523/RestoreTimingTimer) · [B 站的手机计时演示](https://www.bilibili.com/video/BV1MsSCBfEki/)

## 想跑起来的话

电脑需要 Node.js 22 或更新版本。下载或克隆仓库后，在项目目录运行：

```sh
npm run setup
npm run artwork
npm start
```

浏览器打开 `http://127.0.0.1:4173`。第一条命令准备文档导入用的库，第二条从参考项目下载计时图。只想先试普通词本或计时，可以只跑最后一条。

- **Mac**　准备好依赖后可以双击 `启动 Wordloom.command`。在「我的 → 美式男声朗读」可以选语音再试听。
- **联网查词和写故事**　在「我的 → DeepSeek 联网配置」填自己的 API Key。词本、计时和 Moments 的数据存在本机。
- **Android 和 iPhone**　用 `npm run build` 准备本地资源。仓库有 Android 工程代码和 iPhone 的 Xcode 工程，iPhone 版需要在 Mac 上用 Xcode 签名。

跑测试用 `npm test`。文档导入用到了 [PDF.js](https://github.com/mozilla/pdf.js)、[SheetJS CE](https://docs.sheetjs.com/) 和 [Mammoth.js](https://github.com/mwilliamson/mammoth.js)。
