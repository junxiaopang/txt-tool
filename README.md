# TXT 小说工具箱

一个功能强大的 TXT 小说文件处理工具，支持格式修复和文件拆分等功能。

## ✨ 功能特点

### 1. 格式修复
- **去除 HTML**：移除文本中的 HTML 标签和实体代码
- **删除重复章节**：自动检测并删除重复的章节标题
- **修复格式**：统一换行符、清理多余空白、移除全角空格
- **统一段落**：中英文之间添加空格、清理多余空格

### 2. 文件拆分
- **按章节数拆分**：将大文件按指定章节数拆分为多个小文件
- **按字数拆分**：根据指定的字数拆分文件
- **按段落数拆分**：根据段落数量拆分文件
- **自定义拆分**：支持手动指定章节断点进行拆分
- **高级设置**：自定义文件命名格式、编码、分隔符等

## 🚀 快速开始

### 环境要求
- Node.js 18.0 或更高版本
- pnpm 7.0 或更高版本

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd txt-tool
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```

4. **构建生产版本**
   ```bash
   pnpm build
   ```

5. **运行生产服务器**
   ```bash
   pnpm start
   ```

## 📖 使用指南

### 格式修复
1. 访问 `http://localhost:3000/fix`
2. 上传 TXT 文件或粘贴文本内容
3. 选择需要的修复选项
4. 点击「开始处理」按钮
5. 预览处理结果并下载修复后的文件

### 文件拆分
1. 访问 `http://localhost:3000/split`
2. 上传 TXT 文件或粘贴文本内容
3. 选择拆分方式（按章节、字数、段落或自定义）
4. 调整拆分参数和高级设置
5. 点击「开始拆分」按钮
6. 预览拆分结果并下载单个文件或压缩包

## 📁 项目结构

```
src/
├── app/             # Next.js App Router
│   ├── api/         # API 路由
│   │   ├── fix/     # 格式修复 API
│   │   └── split/   # 文件拆分 API
│   ├── fix/         # 格式修复页面
│   ├── split/       # 文件拆分页面
│   ├── page.tsx     # 首页
│   └── layout.tsx   # 全局布局
├── components/      # 组件
│   ├── DropZone.tsx         # 文件上传组件
│   ├── ThemeProvider.tsx    # 主题提供者
│   └── ThemeToggle.tsx      # 主题切换组件
└── lib/             # 工具库
    └── utils.ts     # 工具函数
```

## 🔧 API 端点

### 格式修复 API
- **路径**：`/api/fix`
- **方法**：POST
- **请求体**：
  ```json
  {
    "text": "原始文本",
    "options": {
      "removeHtml": true,
      "removeDuplicateChapterTitles": true,
      "fixFormat": true,
      "unifyParagraphs": true
    },
    "filename": "文件名"
  }
  ```
- **响应**：处理后的文本、统计信息和日志

### 文件拆分 API
- **路径**：`/api/split`
- **方法**：POST
- **请求体**：
  ```json
  {
    "text": "原始文本",
    "settings": {
      "mode": "chapters",
      "chaptersPerFile": 10,
      "namingPattern": "index_range",
      "encoding": "utf8"
    },
    "filename": "文件名"
  }
  ```
- **响应**：拆分后的文件列表、统计信息

## 🛠️ 技术栈

- **前端框架**：Next.js 16
- **UI 组件**：React 19
- **样式方案**：Tailwind CSS 4
- **图标库**：Lucide React
- **文件处理**：JSZip、file-saver
- **类型系统**：TypeScript

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📞 联系方式

如果您有任何问题或建议，请随时联系我们。

---

**享受使用 TXT 小说工具箱！** 🎉
