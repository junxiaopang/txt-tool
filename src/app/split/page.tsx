"use client"

import { useState, useCallback } from "react"
import { DropZone } from "@/components/DropZone"
import { ThemeToggle } from "@/components/ThemeToggle"
import JSZip from "jszip"
import { saveAs } from "file-saver"
import Link from "next/link"
import {
  FileText,
  SplitSquareHorizontal,
  CheckCircle2,
  Download,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  File,
  Layers,
  Settings2,
  Type,
  Hash,
  FileDigit,
  Bookmark,
  ListOrdered,
  Archive,
  BookOpen,
} from "lucide-react"

interface SplitFile {
  filename: string
  content: string
  chapterRange: string
  wordCount: number
}

type SplitMode = "chapters" | "words" | "paragraphs" | "custom"
type NamingPattern = "index_chapters" | "index_range" | "index_only"
type Encoding = "utf8" | "gbk"
type TitleMode = "keep" | "remove" | "custom"

interface SplitSettings {
  mode: SplitMode
  chaptersPerFile: number
  wordsPerFile: number
  paragraphsPerFile: number
  customBreaks: string
  namingPattern: NamingPattern
  reservedChapters: number
  titleMode: TitleMode
  customTitle: string
  encoding: Encoding
  separator: string
  outputPrefix: string
  outputSuffix: string
}

const defaultSettings: SplitSettings = {
  mode: "chapters",
  chaptersPerFile: 10,
  wordsPerFile: 100000,
  paragraphsPerFile: 50,
  customBreaks: "",
  namingPattern: "index_range",
  reservedChapters: 0,
  titleMode: "keep",
  customTitle: "",
  encoding: "utf8",
  separator: "\n\n",
  outputPrefix: "",
  outputSuffix: "",
}

export default function SplitToolsPage() {
  const [originalText, setOriginalText] = useState("")
  const [filename, setFilename] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    totalChapters: number
    chaptersPerFile: number
    totalFiles: number
    baseFilename: string
    files: SplitFile[]
  } | null>(null)
  const [settings, setSettings] = useState<SplitSettings>(defaultSettings)
  const [expandedFiles, setExpandedFiles] = useState<Set<number>>(new Set())
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleTextReady = useCallback((text: string, name: string) => {
    setOriginalText(text)
    setFilename(name)
    setResult(null)
  }, [])

  const handleSplit = async () => {
    if (!originalText) return

    setLoading(true)

    try {
      const response = await fetch("/api/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: originalText,
          settings,
          filename,
        }),
      })

      if (!response.ok) {
        throw new Error("拆分失败")
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("拆分失败:", error)
      alert("拆分失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadSingle = (file: SplitFile) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = file.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadAll = async () => {
    if (!result) return

    const zip = new JSZip()
    const folder = zip.folder(result.baseFilename) || zip

    result.files.forEach((file) => {
      folder.file(file.filename, file.content)
    })

    const blob = await zip.generateAsync({ type: "blob" })
    saveAs(blob, `${result.baseFilename}.zip`)
  }

  const handleReset = () => {
    setOriginalText("")
    setFilename("")
    setResult(null)
    setExpandedFiles(new Set())
    setSettings(defaultSettings)
  }

  const updateSetting = <K extends keyof SplitSettings>(key: K, value: SplitSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const toggleExpand = (index: number) => {
    setExpandedFiles(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <SplitSquareHorizontal className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[var(--text-primary)]">TXT 小说工具箱</h1>
                <p className="text-xs text-[var(--text-muted)]">按章节数拆分 TXT 文件</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => window.location.href = "/preview"}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              >
                <BookOpen className="h-4 w-4" />
                章节预览
              </button>
              <button
                onClick={() => window.location.href = "/fix"}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              >
                <FileText className="h-4 w-4" />
                格式修复
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        {!originalText ? (
          <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">拆分小说文件</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                将大文件按指定章节数拆分为多个 TXT 文件
              </p>
            </div>
            <DropZone onTextReady={handleTextReady} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 已上传文件信息 */}
            <div className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20">
                  <FileText className="h-6 w-6 text-violet-400" />
                </div>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">{filename}.txt</p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {originalText.length.toLocaleString()} 字
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              >
                <RotateCcw className="h-4 w-4" />
                重新上传
              </button>
            </div>

            {/* 拆分设置 */}
            {!result && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                  <h3 className="mb-6 flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                    <Settings2 className="h-4 w-4" />
                    拆分设置
                  </h3>
                  
                  <div className="space-y-6">
                    {/* 拆分方式 */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <SplitSquareHorizontal className="h-4 w-4" />
                        拆分方式
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { value: "chapters", label: "按章节数", icon: Hash },
                          { value: "words", label: "按字数", icon: Type },
                          { value: "paragraphs", label: "按段落数", icon: FileDigit },
                          { value: "custom", label: "自定义", icon: ListOrdered },
                        ].map((item) => {
                          const Icon = item.icon
                          return (
                            <button
                              key={item.value}
                              onClick={() => updateSetting("mode", item.value as SplitMode)}
                              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all ${
                                settings.mode === item.value
                                  ? "bg-[var(--accent-color-light)] text-[var(--accent-color)] border border-[var(--accent-color-border)]"
                                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                              }`}
                            >
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* 拆分数值 */}
                    <div className="space-y-3">
                      {settings.mode === "chapters" && (
                        <div className="flex items-center gap-4">
                          <label className="text-sm text-[var(--text-secondary)] w-24">每份章节数</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={settings.chaptersPerFile}
                            onChange={(e) => updateSetting("chaptersPerFile", Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-28 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2 text-center text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)]"
                          />
                          <span className="text-xs text-[var(--text-muted)]">章</span>
                        </div>
                      )}
                      {settings.mode === "words" && (
                        <div className="flex items-center gap-4">
                          <label className="text-sm text-[var(--text-secondary)] w-24">每份字数</label>
                          <input
                            type="number"
                            min="1000"
                            max="1000000"
                            step="1000"
                            value={settings.wordsPerFile}
                            onChange={(e) => updateSetting("wordsPerFile", Math.max(1000, parseInt(e.target.value) || 1000))}
                            className="w-28 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2 text-center text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)]"
                          />
                          <span className="text-xs text-[var(--text-muted)]">字</span>
                        </div>
                      )}
                      {settings.mode === "paragraphs" && (
                        <div className="flex items-center gap-4">
                          <label className="text-sm text-[var(--text-secondary)] w-24">每份段落数</label>
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={settings.paragraphsPerFile}
                            onChange={(e) => updateSetting("paragraphsPerFile", Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-28 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2 text-center text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)]"
                          />
                          <span className="text-xs text-[var(--text-muted)]">段</span>
                        </div>
                      )}
                      {settings.mode === "custom" && (
                        <div className="space-y-3">
                          <div className="flex items-start gap-4">
                            <label className="text-sm text-[var(--text-secondary)] w-24 pt-2">章节断点</label>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={settings.customBreaks}
                                onChange={(e) => updateSetting("customBreaks", e.target.value)}
                                placeholder="例如: 3, 7, 15, 20"
                                className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2 text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] placeholder:text-[var(--text-muted)]"
                              />
                              <p className="mt-1 text-xs text-[var(--text-muted)]">
                                输入章节号，用逗号分隔，表示在这些章节后拆分文件
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 高级设置展开按钮 */}
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center justify-between w-full py-3 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        高级设置
                      </div>
                      {showAdvanced ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    {/* 高级设置内容 */}
                    {showAdvanced && (
                      <div className="space-y-6">
                        <div className="border-t border-[var(--border-color)] pt-6" />

                        {/* 文件命名格式 */}
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <File className="h-4 w-4" />
                            文件命名格式
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: "index_range", label: "序号_区间", example: "novel_01_10章.txt" },
                              { value: "index_chapters", label: "序号_章数", example: "novel_01_10章.txt" },
                              { value: "index_only", label: "纯序号", example: "novel_001.txt" },
                            ].map((item) => (
                              <button
                                key={item.value}
                                onClick={() => updateSetting("namingPattern", item.value as NamingPattern)}
                                className={`rounded-xl px-4 py-2.5 text-sm transition-all ${
                                  settings.namingPattern === item.value
                                    ? "bg-[var(--accent-color-light)] text-[var(--accent-color)] border border-[var(--accent-color-border)]"
                                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 输出前缀后缀 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-xs text-[var(--text-muted)]">文件名前缀</label>
                            <input
                              type="text"
                              value={settings.outputPrefix}
                              onChange={(e) => updateSetting("outputPrefix", e.target.value)}
                              placeholder="例: volume_"
                              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] placeholder:text-[var(--text-muted)]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs text-[var(--text-muted)]">文件名后缀</label>
                            <input
                              type="text"
                              value={settings.outputSuffix}
                              onChange={(e) => updateSetting("outputSuffix", e.target.value)}
                              placeholder="例: _part"
                              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] placeholder:text-[var(--text-muted)]"
                            />
                          </div>
                        </div>

                        <div className="border-t border-[var(--border-color)]" />

                        {/* 预留章节 */}
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <Bookmark className="h-4 w-4" />
                            预留章节（不拆分，保留在开头）
                          </label>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={settings.reservedChapters}
                              onChange={(e) => updateSetting("reservedChapters", Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-24 rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2 text-center text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)]"
                            />
                            <span className="text-xs text-[var(--text-muted)]">章（设为0则不预留）</span>
                          </div>
                        </div>

                        {/* 章节标题处理 */}
                        <div className="space-y-3">
                          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <Type className="h-4 w-4" />
                            章节标题处理
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { value: "keep", label: "保留标题" },
                              { value: "remove", label: "移除标题" },
                              { value: "custom", label: "自定义格式" },
                            ].map((item) => (
                              <button
                                key={item.value}
                                onClick={() => updateSetting("titleMode", item.value as TitleMode)}
                                className={`rounded-xl px-4 py-2.5 text-sm transition-all ${
                                  settings.titleMode === item.value
                                    ? "bg-[var(--accent-color-light)] text-[var(--accent-color)] border border-[var(--accent-color-border)]"
                                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                          {settings.titleMode === "custom" && (
                            <input
                              type="text"
                              value={settings.customTitle}
                              onChange={(e) => updateSetting("customTitle", e.target.value)}
                              placeholder="例: 第{index}章 {title}"
                              className="mt-2 w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)] placeholder:text-[var(--text-muted)]"
                            />
                          )}
                        </div>

                        <div className="border-t border-[var(--border-color)]" />

                        {/* 编码和分隔符 */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <label className="text-sm text-[var(--text-secondary)]">输出编码</label>
                            <div className="flex gap-2">
                              {[
                                { value: "utf8", label: "UTF-8" },
                                { value: "gbk", label: "GBK" },
                              ].map((item) => (
                                <button
                                  key={item.value}
                                  onClick={() => updateSetting("encoding", item.value as Encoding)}
                                  className={`flex-1 rounded-xl px-4 py-2 text-sm transition-all ${
                                    settings.encoding === item.value
                                      ? "bg-[var(--accent-color-light)] text-[var(--accent-color)] border border-[var(--accent-color-border)]"
                                      : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                                  }`}
                                >
                                  {item.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm text-[var(--text-secondary)]">章节分隔符</label>
                            <select
                              value={settings.separator}
                              onChange={(e) => updateSetting("separator", e.target.value)}
                              className="w-full rounded-xl border border-[var(--border-color)] bg-[var(--bg-input)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-color)]"
                            >
                              <option value="\n\n">两个换行 (标准)</option>
                              <option value="\n">一个换行</option>
                              <option value="---">三个横线 ---</option>
                              <option value="===">三个等号 ===</option>
                              <option value="#####">五个井号 #####</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleSplit}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      拆分中...
                    </>
                  ) : (
                    <>
                      <SplitSquareHorizontal className="h-5 w-5" />
                      开始拆分
                    </>
                  )}
                </button>
              </div>
            )}

            {/* 拆分结果 */}
            {result && (
              <div className="space-y-6">
                {/* 统计卡片 */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center">
                    <p className="text-3xl font-bold text-[var(--text-primary)]">{result.totalChapters}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">识别章节数</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center">
                    <p className="text-3xl font-bold text-violet-400">{result.totalFiles}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">生成文件数</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center">
                    <p className="text-3xl font-bold text-green-400">{result.chaptersPerFile}</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">每文件章节数</p>
                  </div>
                </div>

                {/* 文件列表 */}
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
                    <h3 className="text-sm font-medium text-[var(--text-secondary)]">文件列表</h3>
                    <button
                      onClick={handleDownloadAll}
                      className="flex items-center gap-2 rounded-xl bg-green-500/20 px-4 py-2 text-sm text-green-400 transition-all hover:bg-green-500/30"
                    >
                      <Archive className="h-4 w-4" />
                      下载压缩包
                    </button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {result.files.map((file, index) => (
                      <div
                        key={index}
                        className="border-b border-[var(--border-color)] last:border-b-0"
                      >
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-[var(--bg-card-hover)]">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <File className="h-5 w-5 text-[var(--text-muted)] shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-[var(--text-primary)] truncate">{file.filename}</p>
                              <p className="text-xs text-[var(--text-muted)]">{file.chapterRange}</p>
                            </div>
                            <span className="text-xs text-[var(--text-muted)] shrink-0">
                              {(file.wordCount / 1000).toFixed(1)}K
                            </span>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <button
                              onClick={() => toggleExpand(index)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-all"
                            >
                              {expandedFiles.has(index) ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDownloadSingle(file)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {expandedFiles.has(index) && (
                          <div className="px-4 pb-3">
                            <pre className="max-h-48 overflow-y-auto rounded-lg bg-black/30 p-3 text-xs text-[var(--text-secondary)] whitespace-pre-wrap">
                              {file.content.slice(0, 1000)}
                              {file.content.length > 1000 && "\n\n... (省略后续内容)"}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 重新拆分 */}
                <button
                  onClick={handleReset}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-3 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                >
                  <RotateCcw className="h-4 w-4" />
                  重新拆分
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
