import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, options, filename } = body

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "无效的文本内容" }, { status: 400 })
    }

    if (!options || typeof options !== "object") {
      return NextResponse.json({ error: "无效的处理选项" }, { status: 400 })
    }

    let processedText = text
    const processingLog: string[] = []

    // 1. 去除 HTML 标签
    if (options.removeHtml) {
      const htmlBefore = processedText.length
      // 去除 HTML 标签
      processedText = processedText.replace(/<[^>]*>/g, "")
      // 去除 HTML 实体
      processedText = processedText
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#[0-9]+;/g, (match) => {
          const code = parseInt(match.slice(2, -1))
          return isNaN(code) ? "" : String.fromCharCode(code)
        })
      // 清理多余的空白
      processedText = processedText.replace(/[\r\n]+/g, "\n").replace(/[ \t]+/g, " ")
      const htmlAfter = processedText.length
      processingLog.push(`去除 HTML 标签 (移除 ${htmlBefore - htmlAfter} 字符)`)
    }

    // 2. 删除双章节标题
    if (options.removeDuplicateChapterTitles) {
      const lines = processedText.split("\n")
      const newLines: string[] = []
      let duplicateCount = 0

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const trimmedLine = line.trim()

        // 检测章节标题模式
        const chapterPattern = /^第[一二三四五六七八九十百千万\d]+[章节部卷]/
        const isChapterTitle = chapterPattern.test(trimmedLine)

        if (isChapterTitle && i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim()

          // 检查下一个非空行是否是完全相同或几乎相同的章节标题
          // 只比较章节编号部分
          const chapterNumMatch = trimmedLine.match(/^(第[一二三四五六七八九十百千万\d]+)/)
          if (chapterNumMatch) {
            const chapterNum = chapterNumMatch[1]
            // 检查下一个非空行是否以相同的章节编号开头
            if (nextLine.startsWith(chapterNum)) {
              // 检查是否真的重复（可能是标题 + 副标题的情况）
              // 如果两行几乎完全相同（忽略空格），则删除重复
              const cleanCurrent = trimmedLine.replace(/\s+/g, "")
              const cleanNext = nextLine.replace(/\s+/g, "")

              if (cleanCurrent === cleanNext ||
                  (cleanNext.startsWith(cleanCurrent) && cleanNext.length < cleanCurrent.length + 10)) {
                duplicateCount++
                processingLog.push(`删除重复章节标题: "${trimmedLine}"`)
                continue // 跳过这个重复行
              }
            }
          }
        }

        newLines.push(line)
      }

      if (duplicateCount > 0) {
        processedText = newLines.join("\n")
        processingLog.push(`删除 ${duplicateCount} 个重复章节标题`)
      } else {
        processingLog.push("未发现重复章节标题")
      }
    }

    // 3. 修复常见格式问题
    if (options.fixFormat) {
      const before = processedText.length

      // 移除首尾空白
      processedText = processedText.trim()

      // 统一换行符
      processedText = processedText.replace(/\r\n/g, "\n").replace(/\r/g, "\n")

      // 移除连续的空行（保留最多2个换行用于分段）
      processedText = processedText.replace(/\n{3,}/g, "\n\n")

      // 移除行首行尾的空格
      processedText = processedText.split("\n").map(line => line.trim()).join("\n")

      // 移除全角空格
      processedText = processedText.replace(/[\u3000]/g, "")

      // 修复常见错误字符
      processedText = processedText
        .replace(/"/g, '"')
        .replace(/"/g, '"')
        .replace(/'/g, "'")
        .replace(/'/g, "'")

      const after = processedText.length
      if (before !== after) {
        processingLog.push(`修复格式问题 (清理 ${before - after} 字符)`)
      }
    }

    // 4. 统一段落格式
    if (options.unifyParagraphs) {
      const before = processedText.length

      // 将多个空格替换为单个空格
      processedText = processedText.replace(/[ \t]+/g, " ")

      // 确保中文和英文/数字之间有空格
      processedText = processedText.replace(/([a-zA-Z0-9])([\u4e00-\u9fa5])/g, "$1 $2")
      processedText = processedText.replace(/([\u4e00-\u9fa5])([a-zA-Z0-9])/g, "$1 $2")

      const after = processedText.length
      if (before !== after) {
        processingLog.push(`统一段落格式 (修改 ${after - before} 字符)`)
      }
    }

    // 生成处理后的文件名
    const baseName = (filename || "novel").replace(/\.[^/.]+$/, "")
    const processedFilename = `${baseName}_处理后.txt`

    return NextResponse.json({
      success: true,
      originalText: text,
      processedText,
      processedFilename,
      processingLog,
      stats: {
        originalLength: text.length,
        processedLength: processedText.length,
        removedChars: text.length - processedText.length,
      }
    })
  } catch (error) {
    console.error("处理文本时出错:", error)
    return NextResponse.json(
      { error: "处理失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    )
  }
}
