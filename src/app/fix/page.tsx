"use client"

import { useState, useCallback } from "react"
import { DropZone } from "@/components/DropZone"
import { ThemeToggle } from "@/components/ThemeToggle"
import {
  FileText,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Loader2,
  Trash2,
  Eye,
  SplitSquareHorizontal,
} from "lucide-react"
import Link from "next/link"

interface ProcessingOptions {
  removeHtml: boolean
  removeDuplicateChapterTitles: boolean
  fixFormat: boolean
  unifyParagraphs: boolean
}

interface ProcessingResult {
  originalText: string
  processedText: string
  processedFilename: string
  processingLog: string[]
  stats: {
    originalLength: number
    processedLength: number
    removedChars: number
  }
}

export default function ToolsPage() {
  const [originalText, setOriginalText] = useState("")
  const [filename, setFilename] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProcessingResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [activeTab, setActiveTab] = useState<"options" | "preview">("options")

  const [options, setOptions] = useState<ProcessingOptions>({
    removeHtml: false,
    removeDuplicateChapterTitles: false,
    fixFormat: false,
    unifyParagraphs: false,
  })

  const handleTextReady = useCallback((text: string, name: string) => {
    setOriginalText(text)
    setFilename(name)
    setResult(null)
    setShowPreview(false)
  }, [])

  const handleProcess = async () => {
    if (!originalText) return

    setLoading(true)
    setActiveTab("preview")

    try {
      const response = await fetch("/api/fix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: originalText,
          options,
          filename,
        }),
      })

      if (!response.ok) {
        throw new Error("处理失败")
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("处理失败:", error)
      alert("处理失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return

    const blob = new Blob([result.processedText], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = result.processedFilename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setOriginalText("")
    setFilename("")
    setResult(null)
    setShowPreview(false)
    setActiveTab("options")
    setOptions({
      removeHtml: false,
      removeDuplicateChapterTitles: false,
      fixFormat: false,
      unifyParagraphs: false,
    })
  }

  const toggleOption = (key: keyof ProcessingOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const hasAnyOptionSelected = Object.values(options).some(v => v)

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[var(--text-primary)]">TXT 小说工具箱</h1>
                <p className="text-xs text-[var(--text-muted)]">格式修复与文件拆分</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => window.location.href = "/split"}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              >
                <SplitSquareHorizontal className="h-4 w-4" />
                拆分文件
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {!originalText ? (
          // 上传阶段
          <div className="mx-auto max-w-2xl space-y-8">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">上传小说文件</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                支持 TXT 格式文件，系统将自动识别并修复格式问题
              </p>
            </div>
            <DropZone onTextReady={handleTextReady} />
          </div>
        ) : (
          // 处理阶段
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

            {/* Tab 切换 */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("options")}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  activeTab === "options"
                    ? "bg-[var(--accent-color)] text-white"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                }`}
              >
                <Wrench className="h-4 w-4" />
                处理选项
              </button>
              {result && (
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    activeTab === "preview"
                      ? "bg-[var(--accent-color)] text-white"
                      : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]"
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  预览结果
                </button>
              )}
            </div>

            {/* 处理选项 */}
            {activeTab === "options" && (
              <div className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* 去除 HTML */}
                  <button
                    onClick={() => toggleOption("removeHtml")}
                    className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                      options.removeHtml
                        ? "border-[var(--accent-color)] bg-[var(--accent-color-light)]"
                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-color-hover)]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                          options.removeHtml
                            ? "bg-[var(--accent-color)] text-white"
                            : "bg-[var(--bg-card)] text-[var(--text-secondary)] group-hover:bg-[var(--bg-card-hover)]"
                        }`}
                      >
                        <Trash2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--text-primary)]">去除 HTML</h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          移除文本中的 HTML 标签和实体代码
                        </p>
                      </div>
                      <div
                        className={`h-6 w-6 rounded-full border-2 transition-all ${
                          options.removeHtml
                            ? "border-[var(--accent-color)] bg-[var(--accent-color)]"
                            : "border-[var(--text-muted)]"
                        }`}
                      >
                        {options.removeHtml && (
                          <CheckCircle2 className="h-full w-full text-white" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* 删除双章节 */}
                  <button
                    onClick={() => toggleOption("removeDuplicateChapterTitles")}
                    className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                      options.removeDuplicateChapterTitles
                        ? "border-[var(--accent-color)] bg-[var(--accent-color-light)]"
                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-color-hover)]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                          options.removeDuplicateChapterTitles
                            ? "bg-[var(--accent-color)] text-white"
                            : "bg-[var(--bg-card)] text-[var(--text-secondary)] group-hover:bg-[var(--bg-card-hover)]"
                        }`}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--text-primary)]">删除双章节</h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          删除 TXT 文件中重复的章节标题（如连续两行"第一章"）
                        </p>
                      </div>
                      <div
                        className={`h-6 w-6 rounded-full border-2 transition-all ${
                          options.removeDuplicateChapterTitles
                            ? "border-[var(--accent-color)] bg-[var(--accent-color)]"
                            : "border-[var(--text-muted)]"
                        }`}
                      >
                        {options.removeDuplicateChapterTitles && (
                          <CheckCircle2 className="h-full w-full text-white" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* 修复格式 */}
                  <button
                    onClick={() => toggleOption("fixFormat")}
                    className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                      options.fixFormat
                        ? "border-[var(--accent-color)] bg-[var(--accent-color-light)]"
                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-color-hover)]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                          options.fixFormat
                            ? "bg-[var(--accent-color)] text-white"
                            : "bg-[var(--bg-card)] text-[var(--text-secondary)] group-hover:bg-[var(--bg-card-hover)]"
                        }`}
                      >
                        <Wrench className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--text-primary)]">修复格式</h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          统一换行符、清理多余空白、移除全角空格
                        </p>
                      </div>
                      <div
                        className={`h-6 w-6 rounded-full border-2 transition-all ${
                          options.fixFormat
                            ? "border-[var(--accent-color)] bg-[var(--accent-color)]"
                            : "border-[var(--text-muted)]"
                        }`}
                      >
                        {options.fixFormat && (
                          <CheckCircle2 className="h-full w-full text-white" />
                        )}
                      </div>
                    </div>
                  </button>

                  {/* 统一段落 */}
                  <button
                    onClick={() => toggleOption("unifyParagraphs")}
                    className={`group relative overflow-hidden rounded-2xl border p-6 text-left transition-all ${
                      options.unifyParagraphs
                        ? "border-[var(--accent-color)] bg-[var(--accent-color-light)]"
                        : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--border-color-hover)]"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                          options.unifyParagraphs
                            ? "bg-[var(--accent-color)] text-white"
                            : "bg-[var(--bg-card)] text-[var(--text-secondary)] group-hover:bg-[var(--bg-card-hover)]"
                        }`}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--text-primary)]">统一段落</h3>
                        <p className="mt-1 text-sm text-[var(--text-secondary)]">
                          中英文之间添加空格、清理多余空格
                        </p>
                      </div>
                      <div
                        className={`h-6 w-6 rounded-full border-2 transition-all ${
                          options.unifyParagraphs
                            ? "border-[var(--accent-color)] bg-[var(--accent-color)]"
                            : "border-[var(--text-muted)]"
                        }`}
                      >
                        {options.unifyParagraphs && (
                          <CheckCircle2 className="h-full w-full text-white" />
                        )}
                      </div>
                    </div>
                  </button>
                </div>

                {/* 处理按钮 */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleProcess}
                    disabled={!hasAnyOptionSelected || loading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-violet-500/20 transition-all hover:scale-[1.02] hover:shadow-violet-500/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        处理中...
                      </>
                    ) : (
                      <>
                        <Wrench className="h-5 w-5" />
                        开始处理
                      </>
                    )}
                  </button>
                </div>

                {!hasAnyOptionSelected && (
                  <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <AlertCircle className="h-4 w-4" />
                    请至少选择一个处理选项
                  </p>
                )}
              </div>
            )}

            {/* 预览结果 */}
            {activeTab === "preview" && result && (
              <div className="space-y-6">
                {/* 处理结果统计 */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center">
                    <p className="text-3xl font-bold text-[var(--text-primary)]">
                      {(result.stats.originalLength / 1000).toFixed(1)}K
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">原始字符</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center">
                    <p className="text-3xl font-bold text-violet-400">
                      {(result.stats.processedLength / 1000).toFixed(1)}K
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">处理后字符</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center">
                    <p className="text-3xl font-bold text-green-400">
                      -{result.stats.removedChars.toLocaleString()}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">移除字符</p>
                  </div>
                </div>

                {/* 处理日志 */}
                {result.processingLog.length > 0 && (
                  <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                    <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">处理日志</h3>
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                      {result.processingLog.map((log, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                          <span className="text-[var(--text-secondary)]">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 文本预览 */}
                <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--border-color)] px-4 py-3">
                    <h3 className="text-sm font-medium text-[var(--text-secondary)]">处理后文本预览</h3>
                    <span className="text-xs text-[var(--text-muted)]">
                      显示前 2000 字符
                    </span>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-4">
                    <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-mono">
                      {result.processedText.slice(0, 2000)}
                      {result.processedText.length > 2000 && "\n\n... (省略后续内容)"}
                    </pre>
                  </div>
                </div>

                {/* 下载按钮 */}
                <button
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 text-lg font-bold text-white shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02] hover:shadow-green-500/30"
                >
                  <Download className="h-5 w-5" />
                  下载处理后的文件
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
