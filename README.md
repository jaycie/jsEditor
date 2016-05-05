
# 1. 介绍

**JEditor**——轻量级web富文本编辑器，配置方便，使用简单</b>。
**支持常见的文字字体大小 样式 加粗 前／背景色 居中 添加图片、链接等富文本编辑工作
**支持表单 红包等新型活动玩法，通过拖动、拉伸等操作自定义生成静态页面
**部分html5属性，支持IE8+浏览器。

![](http://images2015.cnblogs.com/blog/381372/201605/381372-20160505150001294-447083237.png)

# 2. 使用

引用`jquery.js`和`editor.js`之后，即可简单生成富文本编辑器，简单易用。
```js
var $editor = $('#JEditor').JEditor()
```

# 3. 本地运行demo

 - 确定本机安装了 `nodejs`，可使用 `node -v` 验证
 - 下载源码、解压，或者 `git clone https://github.com/jaycie/jsEditor.git` 
 - 配置index.html中的siteConfig.url变量，主要是当前项目url及node的url
 - 进入源码目录，找到 `node/index.js` 命令行中运行 `node index.js`
 - 打开浏览器访问 `http://localhost/jsEditor/index.html?lId=68&aId=228&tId=1` 
 - nodejs根据url传递的参数生成相应的文件夹／文件名,规则poster/lID/aId/tId.html

# 4. 交流

交流QQ：**469212503**
