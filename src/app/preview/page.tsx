"use client"

import { useState, useCallback } from "react"
import { DropZone } from "@/components/DropZone"
import { ThemeToggle } from "@/components/ThemeToggle"
import Link from "next/link"
import {
  FileText,
  BookOpen,
  Copy,
  Check,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  List,
  Hash,
  Type,
  Eye,
  EyeOff,
  ClipboardCopy,
  Download,
} from "lucide-react"

interface Chapter {
  id: number
  title: string
  content: string
  wordCount: number
}

export default function PreviewPage() {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [filename, setFilename] = useState("")
  const [loading, setLoading] = useState(false)
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
  const [copiedId, setCopiedId] = useState<number | null>(null)
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number } | null>(null)
  const [rangeInput, setRangeInput] = useState({ start: "", end: "" })
  const [showAllContent, setShowAllContent] = useState(false)

  const parseChapters = (text: string): Chapter[] => {
    const lines = text.split("\n")
    const chapters: Chapter[] = []
    let currentChapter: Chapter | null = null
    const chapterPattern = /^第[一二三四五六七八九十百千万\d]+[章节部卷]/
    let chapterId = 0

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine && chapterPattern.test(trimmedLine)) {
        if (currentChapter) {
          chapters.push(currentChapter)
        }
        currentChapter = {
          id: chapterId++,
          title: trimmedLine,
          content: "",
          wordCount: 0,
        }
      } else if (currentChapter) {
        currentChapter.content += (currentChapter.content ? "\n" : "") + line
      }
    }

    if (currentChapter) {
      chapters.push(currentChapter)
    }

    // 如果没有识别到章节，按段落分割
    if (chapters.length <= 1) {
      const paragraphs = text.split(/\n\n+/)
      const newChapters: Chapter[] = []
      let currentContent = ""
      let paraIndex = 0

      for (const para of paragraphs) {
        if (para.trim()) {
          if (currentContent.length > 3000) {
            newChapters.push({
              id: paraIndex,
              title: `第${paraIndex + 1}段`,
              content: currentContent.trim(),
              wordCount: currentContent.length,
            })
            paraIndex++
            currentContent = ""
          }
          currentContent += (currentContent ? "\n\n" : "") + para
        }
      }

      if (currentContent.trim()) {
        newChapters.push({
          id: paraIndex,
          title: `第${paraIndex + 1}段`,
          content: currentContent.trim(),
          wordCount: currentContent.length,
        })
      }

      return newChapters
    }

    return chapters.map(ch => ({
      ...ch,
      wordCount: ch.content.length,
    }))
  }

  const handleTextReady = useCallback((text: string, name: string) => {
    setLoading(true)
    setFilename(name)
    
    setTimeout(() => {
      const parsedChapters = parseChapters(text)
      setChapters(parsedChapters)
      setExpandedChapters(new Set())
      setLoading(false)
    }, 100)
  }, [])

  const handleCopyChapter = async (chapter: Chapter) => {
    const fullText = `${chapter.title}\n\n${chapter.content}`
    try {
      await navigator.clipboard.writeText(fullText)
      setCopiedId(chapter.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error("复制失败:", err)
      alert("复制失败，请手动复制")
    }
  }

  const handleCopyRange = async () => {
    if (!selectedRange) return
    
    const start = Math.min(selectedRange.start, selectedRange.end)
    const end = Math.max(selectedRange.start, selectedRange.end)
    
    const selectedChapters = chapters.filter(ch => ch.id >= start && ch.id <= end)
    const fullText = selectedChapters.map(ch => `${ch.title}\n\n${ch.content}`).join("\n\n---\n\n")
    
    try {
      await navigator.clipboard.writeText(fullText)
      alert(`已复制第 ${start + 1} 章到第 ${end + 1} 章的内容`)
    } catch (err) {
      console.error("复制失败:", err)
      alert("复制失败，请手动复制")
    }
  }

  const handleApplyRange = () => {
    const start = parseInt(rangeInput.start) - 1
    const end = parseInt(rangeInput.end) - 1
    
    if (isNaN(start) || isNaN(end) || start < 0 || end >= chapters.length || start > end) {
      alert("请输入有效的章节范围")
      return
    }
    
    setSelectedRange({ start, end })
  }

  const toggleExpand = (id: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleReset = () => {
    setChapters([])
    setFilename("")
    setExpandedChapters(new Set())
    setSelectedRange(null)
    setRangeInput({ start: "", end: "" })
    setShowAllContent(false)
  }

  const totalWordCount = chapters.reduce((sum, ch) => sum + ch.wordCount, 0)

  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[var(--text-primary)]">TXT 小说工具箱</h1>
                <p className="text-xs text-[var(--text-muted)]">章节预览</p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => window.location.href = "/fix"}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              >
                <FileText className="h-4 w-4" />
                格式修复
              </button>
              <button
                onClick={() => window.location.href = "/split"}
                className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
              >
                <List className="h-4 w-4" />
                文件拆分
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {chapters.length === 0 ? (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">章节预览</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                上传 TXT 文件，预览和复制章节内容
              </p>
            </div>
            <DropZone onTextReady={handleTextReady} loading={loading} />
          </div>
        ) : (
          <div className="space-y-6">
            {/* 统计信息 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <BookOpen className="h-4 w-4" />
                  <span>共 {chapters.length} 章</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                  <Type className="h-4 w-4" />
                  <span>约 {totalWordCount.toLocaleString()} 字</span>
                </div>
                {filename && (
                  <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <FileText className="h-4 w-4" />
                    <span>{filename}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAllContent(!showAllContent)}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                >
                  {showAllContent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showAllContent ? "收起全部" : "展开全部"}
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-secondary)] transition-all hover:border-[var(--border-color-hover)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)]"
                >
                  <RotateCcw className="h-4 w-4" />
                  重新上传
                </button>
              </div>
            </div>

            {/* 范围复制 */}
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-sm font-medium text-[var(--text-primary)]">范围复制:</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-secondary)]">从第</span>
                  <input
                    type="number"
                    min={1}
                    max={chapters.length}
                    value={rangeInput.start || "1"}
                    onChange={(e) => setRangeInput(prev => ({ ...prev, start: e.target.value }))}
                    className="w-16 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-center text-sm text-[var(--text-primary)] focus:border-violet-400 focus:outline-none"
                    placeholder="1"
                  />
                  <span className="text-sm text-[var(--text-secondary)]">章到第</span>
                  <input
                    type="number"
                    min={1}
                    max={chapters.length}
                    value={rangeInput.end || String(chapters.length / 2)}
                    onChange={(e) => setRangeInput(prev => ({ ...prev, end: e.target.value }))}
                    className="w-16 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-2 py-1 text-center text-sm text-[var(--text-primary)] focus:border-violet-400 focus:outline-none"
                    placeholder={String(chapters.length)}
                  />
                  <span className="text-sm text-[var(--text-secondary)]">章</span>
                </div>
                <button
                  onClick={handleApplyRange}
                  className="rounded-lg bg-violet-500 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-violet-600"
                >
                  确认范围
                </button>
                {selectedRange && (
                  <button
                    onClick={handleCopyRange}
                    className="flex items-center gap-2 rounded-lg bg-green-500 px-4 py-1.5 text-sm font-medium text-white transition-all hover:bg-green-600"
                  >
                    <ClipboardCopy className="h-4 w-4" />
                    复制第 {selectedRange.start + 1}-{selectedRange.end + 1} 章
                  </button>
                )}
              </div>
            </div>

            {/* 章节列表 */}
            <div className="space-y-3">
              {chapters.map((chapter, index) => {
                const isExpanded = showAllContent || expandedChapters.has(chapter.id)
                const isInSelectedRange = selectedRange && 
                  chapter.id >= Math.min(selectedRange.start, selectedRange.end) && 
                  chapter.id <= Math.max(selectedRange.start, selectedRange.end)

                return (
                  <div
                    key={chapter.id}
                    className={`rounded-2xl border transition-all ${
                      isInSelectedRange 
                        ? "border-violet-400 bg-violet-500/5" 
                        : "border-[var(--border-color)] bg-[var(--bg-card)]"
                    }`}
                  >
                    {/* 章节标题栏 */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/20 text-sm font-medium text-violet-400">
                          {index + 1}
                        </span>
                        <div>
                          <h3 className="font-medium text-[var(--text-primary)]">{chapter.title}</h3>
                          <p className="text-xs text-[var(--text-muted)]">
                            约 {chapter.wordCount.toLocaleString()} 字
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyChapter(chapter)}
                          className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-all hover:border-violet-400 hover:text-violet-400"
                        >
                          {copiedId === chapter.id ? (
                            <>
                              <Check className="h-4 w-4 text-green-400" />
                              <span className="text-green-400">已复制</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>复制</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => toggleExpand(chapter.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] transition-all hover:border-violet-400 hover:text-violet-400"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* 章节内容 */}
                    {isExpanded && (
                      <div className="border-t border-[var(--border-color)] p-4">
                        <div className="max-h-96 overflow-y-auto rounded-xl bg-[var(--bg-primary)] p-4">
                          <pre className="whitespace-pre-wrap text-sm text-[var(--text-secondary)] font-normal">
                            {chapter.content}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
