import { ThemeToggle } from "@/components/ThemeToggle"
import { Wrench, SplitSquareHorizontal, FileText, BookOpen } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <Wrench className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[var(--text-primary)]">TXT 小说工具箱</h1>
                <p className="text-xs text-[var(--text-muted)]">格式修复与文件拆分</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-4xl px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">选择工具</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            上传 TXT 文件，选择需要的工具进行处理
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* 章节预览工具 */}
          <Link href="/preview" className="group">
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 transition-all hover:border-[var(--accent-color)] hover:shadow-lg hover:shadow-violet-500/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-violet-500/20 mb-6 group-hover:bg-violet-500/30 transition-all">
                <BookOpen className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">章节预览</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                预览章节列表，复制单个或范围章节内容
              </p>
            </div>
          </Link>

          {/* 格式修复工具 */}
          <Link href="/fix" className="group">
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 transition-all hover:border-[var(--accent-color)] hover:shadow-lg hover:shadow-violet-500/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-violet-500/20 mb-6 group-hover:bg-violet-500/30 transition-all">
                <FileText className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">格式修复</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                去除 HTML、删除重复章节、修复格式、统一段落
              </p>
            </div>
          </Link>

          {/* 文件拆分工具 */}
          <Link href="/split" className="group">
            <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-8 transition-all hover:border-[var(--accent-color)] hover:shadow-lg hover:shadow-violet-500/10">
              <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-violet-500/20 mb-6 group-hover:bg-violet-500/30 transition-all">
                <SplitSquareHorizontal className="h-8 w-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">文件拆分</h3>
              <p className="text-sm text-[var(--text-secondary)]">
                按章节、字数、段落拆分 TXT 文件
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
