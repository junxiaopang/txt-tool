"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Upload, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DropZoneProps {
  onTextReady: (text: string, filename: string) => void
  loading?: boolean
}

export function DropZone({ onTextReady, loading }: DropZoneProps) {
  const [mode, setMode] = useState<"upload" | "paste">("upload")
  const [pastedText, setPastedText] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState("")

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return
      setSelectedFile(file)
      setError("")

      const buffer = await file.arrayBuffer()
      let text = ""
      try {
        text = new TextDecoder("utf-8").decode(buffer)
      } catch {
        text = new TextDecoder("gbk").decode(buffer)
      }
      onTextReady(text, file.name.replace(/\.[^/.]+$/, ""))
    },
    [onTextReady]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/plain": [".txt"] },
    multiple: false,
    disabled: loading,
  })

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) {
      setError("请输入小说文本内容")
      return
    }
    setError("")
    onTextReady(pastedText, "粘贴文本")
  }

  return (
    <div className="w-full space-y-4">
      {/* 模式切换 */}
      <div className="flex rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-1">
        {(["upload", "paste"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "flex-1 rounded-lg py-2 text-sm font-medium transition-all",
              mode === m
                ? "bg-[var(--accent-color)] text-white shadow"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {m === "upload" ? "📁 上传 TXT" : "📝 粘贴文本"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <div
          {...getRootProps()}
          className={cn(
            "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 transition-all cursor-pointer",
            isDragActive
              ? "border-violet-400 bg-violet-500/10"
              : "border-[var(--border-color)] bg-[var(--bg-card)] hover:border-violet-400/50 hover:bg-[var(--bg-card-hover)]",
            loading && "opacity-50 cursor-not-allowed"
          )}
        >
          <input {...getInputProps()} />
          {selectedFile ? (
            <div className="flex items-center gap-3 text-green-400">
              <FileText className="h-8 w-8" />
              <div>
                <p className="font-semibold text-[var(--text-primary)]">{selectedFile.name}</p>
                <p className="text-sm text-[var(--text-secondary)]">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedFile(null)
                }}
                className="ml-2 text-[var(--text-secondary)] hover:text-red-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/20">
                <Upload className="h-8 w-8 text-violet-400" />
              </div>
              <p className="text-lg font-medium text-[var(--text-primary)]">
                {isDragActive ? "释放以上传" : "拖拽 TXT 文件到此处"}
              </p>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">或点击选择文件</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">支持 UTF-8 / GBK 编码</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            placeholder="在此粘贴小说全文内容..."
            className="h-56 w-full resize-none rounded-2xl border border-[var(--border-color)] bg-[var(--bg-input)] p-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-violet-400/50 focus:ring-1 focus:ring-violet-400/30 transition-all"
            disabled={loading}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--text-muted)]">
              {pastedText.replace(/\s/g, "").length} 字
            </span>
            <button
              onClick={handlePasteSubmit}
              disabled={loading || !pastedText.trim()}
              className="rounded-xl bg-[var(--accent-color)] px-6 py-2 text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              确认
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
