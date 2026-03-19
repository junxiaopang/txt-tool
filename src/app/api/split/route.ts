import { NextRequest, NextResponse } from "next/server"

interface SplitSettings {
  mode: "chapters" | "words" | "paragraphs" | "custom"
  chaptersPerFile: number
  wordsPerFile: number
  paragraphsPerFile: number
  customBreaks: string
  namingPattern: "index_chapters" | "index_range" | "index_only"
  reservedChapters: number
  titleMode: "keep" | "remove" | "custom"
  customTitle: string
  encoding: "utf8" | "gbk"
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, filename, settings } = body
    const config: SplitSettings = { ...defaultSettings, ...settings }

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "无效的文本内容" }, { status: 400 })
    }

    const baseName = (filename || "novel").replace(/\.[^/.]+$/, "")
    const prefix = config.outputPrefix || ""
    const suffix = config.outputSuffix || ""

    const reservedCount = Math.min(config.reservedChapters, 100)

    const chapters: { title: string; content: string; index: number }[] = []
    const lines = text.split("\n")
    let currentChapter = { title: "", content: "", index: 0 }
    const chapterPattern = /^第[一二三四五六七八九十百千万\d]+[章节部卷]/

    for (const line of lines) {
      const trimmedLine = line.trim()
      if (trimmedLine && chapterPattern.test(trimmedLine)) {
        if (currentChapter.content || chapters.length > 0) {
          chapters.push(currentChapter)
        }
        currentChapter = { title: trimmedLine, content: "", index: chapters.length }
      } else {
        currentChapter.content += (currentChapter.content ? "\n" : "") + line
      }
    }

    if (currentChapter.content) {
      chapters.push(currentChapter)
    }

    if (chapters.length <= 1) {
      const paragraphs = text.split(/\n\n+/)
      chapters.length = 0
      let chapterIndex = 0
      let currentContent = ""

      for (const para of paragraphs) {
        if (para.trim()) {
          if (currentContent.length > 3000) {
            chapters.push({
              title: `第${chapterIndex + 1}段`,
              content: currentContent.trim(),
              index: chapterIndex
            })
            chapterIndex++
            currentContent = ""
          }
          currentContent += (currentContent ? "\n\n" : "") + para
        }
      }

      if (currentContent.trim()) {
        chapters.push({
          title: `第${chapterIndex + 1}段`,
          content: currentContent.trim(),
          index: chapterIndex
        })
      }
    }

    const reservedChapters = reservedCount > 0 ? chapters.slice(0, reservedCount) : []
    const mainChapters = reservedCount > 0 ? chapters.slice(reservedCount) : chapters

    const files: { filename: string; content: string; chapterRange: string; wordCount: number }[] = []

    if (reservedCount > 0 && reservedChapters.length > 0) {
      const reservedContent = reservedChapters.map(ch => {
        const processed = processChapterTitle(ch, config)
        return processed
      }).join(config.separator)

      files.push({
        filename: `${prefix}${baseName}${suffix}_00_预留${reservedChapters.length}章.txt`,
        content: reservedContent,
        chapterRange: `预留第 1 - ${reservedChapters.length} 章`,
        wordCount: reservedContent.length
      })
    }

    if (mainChapters.length === 0) {
      return NextResponse.json({
        success: true,
        totalChapters: chapters.length,
        chaptersPerFile: config.chaptersPerFile,
        totalFiles: files.length,
        baseFilename: baseName,
        files
      })
    }

    const processChapterTitle = (ch: { title: string; content: string; index: number }, cfg: SplitSettings): string => {
      if (cfg.titleMode === "remove") {
        return ch.content
      }
      if (cfg.titleMode === "custom" && cfg.customTitle) {
        let title = cfg.customTitle
          .replace("{index}", String(ch.index + 1))
          .replace("{title}", ch.title || "")
        return `${title}\n\n${ch.content}`
      }
      return ch.title ? `${ch.title}\n\n${ch.content}` : ch.content
    }

    if (config.mode === "chapters") {
      const chaptersPerFile = Math.max(1, config.chaptersPerFile)
      const totalMain = mainChapters.length
      const filesNeeded = Math.ceil(totalMain / chaptersPerFile)

      for (let i = 0; i < filesNeeded; i++) {
        const start = i * chaptersPerFile
        const end = Math.min(start + chaptersPerFile, totalMain)
        const fileChapters = mainChapters.slice(start, end)

        const content = fileChapters.map(ch => processChapterTitle(ch, config)).join(config.separator)

        const fileNum = i + 1
        let fileName: string
        let rangeStr: string

        switch (config.namingPattern) {
          case "index_only":
            fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(3, "0")}.txt`
            rangeStr = `第 ${start + 1} 章`
            break
          case "index_chapters":
            fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(2, "0")}_${chaptersPerFile}章.txt`
            rangeStr = `第 ${start + 1} - ${end} 章`
            break
          case "index_range":
          default:
            fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(2, "0")}_${end}章.txt`
            rangeStr = `第 ${start + 1} - ${end} 章`
            break
        }

        files.push({
          filename: fileName,
          content,
          chapterRange: rangeStr,
          wordCount: content.length
        })
      }
    } else if (config.mode === "words") {
      const wordsPerFile = Math.max(1000, config.wordsPerFile)
      let currentFileContent = ""
      let currentFileChapters: typeof mainChapters = []
      let fileIndex = 1

      for (const ch of mainChapters) {
        const processed = processChapterTitle(ch, config)
        currentFileContent += (currentFileContent ? config.separator : "") + processed
        currentFileChapters.push(ch)

        if (currentFileContent.length >= wordsPerFile) {
          const fileNum = fileIndex
          let fileName: string

          switch (config.namingPattern) {
            case "index_only":
              fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(3, "0")}.txt`
              break
            case "index_chapters":
              fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(2, "0")}_${currentFileChapters.length}章.txt`
              break
            case "index_range":
            default:
              const endCh = currentFileChapters[currentFileChapters.length - 1].index + 1
              fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(2, "0")}_${endCh}章.txt`
              break
          }

          files.push({
            filename: fileName,
            content: currentFileContent,
            chapterRange: `第 ${currentFileChapters[0].index + 1} - ${currentFileChapters[currentFileChapters.length - 1].index + 1} 章`,
            wordCount: currentFileContent.length
          })

          currentFileContent = ""
          currentFileChapters = []
          fileIndex++
        }
      }

      if (currentFileContent) {
        const fileNum = fileIndex
        let fileName: string

        switch (config.namingPattern) {
          case "index_only":
            fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(3, "0")}.txt`
            break
          case "index_chapters":
            fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(2, "0")}_${currentFileChapters.length}章.txt`
            break
          case "index_range":
          default:
            const endCh = currentFileChapters.length > 0 ? currentFileChapters[currentFileChapters.length - 1].index + 1 : 1
            fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(2, "0")}_${endCh}章.txt`
            break
        }

        files.push({
          filename: fileName,
          content: currentFileContent,
          chapterRange: currentFileChapters.length > 0 
            ? `第 ${currentFileChapters[0].index + 1} - ${currentFileChapters[currentFileChapters.length - 1].index + 1} 章`
            : `第 ${fileIndex} 节`,
          wordCount: currentFileContent.length
        })
      }
    } else if (config.mode === "paragraphs") {
      const paragraphsPerFile = Math.max(1, config.paragraphsPerFile)
      const allParagraphs: { title: string; content: string; paraIndex: number }[] = []
      
      for (const ch of mainChapters) {
        const chParagraphs = ch.content.split(/\n+/).filter(p => p.trim())
        let currentParaIndex = 0
        
        for (const para of chParagraphs) {
          if (para.trim()) {
            allParagraphs.push({
              title: ch.title,
              content: para,
              paraIndex: currentParaIndex++
            })
          }
        }
      }

      const totalParagraphs = allParagraphs.length
      const filesNeeded = Math.ceil(totalParagraphs / paragraphsPerFile)

      for (let i = 0; i < filesNeeded; i++) {
        const start = i * paragraphsPerFile
        const end = Math.min(start + paragraphsPerFile, totalParagraphs)
        const fileParagraphs = allParagraphs.slice(start, end)

        const firstPara = fileParagraphs[0]
        const lastPara = fileParagraphs[fileParagraphs.length - 1]

        let content = ""
        for (const para of fileParagraphs) {
          const header = (para.title && para.paraIndex === 0) ? `${para.title}\n\n` : ""
          content += (content ? "\n" : "") + header + para.content
        }

        const fileNum = i + 1
        let fileName: string

        switch (config.namingPattern) {
          case "index_only":
            fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(3, "0")}.txt`
            break
          case "index_chapters":
            fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(2, "0")}_${paragraphsPerFile}段.txt`
            break
          case "index_range":
          default:
            fileName = `${prefix}${baseName}${suffix}_${fileNum.toString().padStart(2, "0")}_${end}段.txt`
            break
        }

        files.push({
          filename: fileName,
          content,
          chapterRange: `第 ${start + 1} - ${end} 段`,
          wordCount: content.length
        })
      }
    } else if (config.mode === "custom") {
      const breakStr = config.customBreaks || ""
      const breakPoints = breakStr
        .split(",")
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n) && n > 0)
        .sort((a, b) => a - b)
      
      if (breakPoints.length === 0) {
        const allContent = mainChapters.map(ch => processChapterTitle(ch, config)).join(config.separator)
        files.push({
          filename: `${prefix}${baseName}${suffix}_001_${mainChapters.length}章.txt`,
          content: allContent,
          chapterRange: `第 1 - ${mainChapters.length} 章`,
          wordCount: allContent.length
        })
      } else {
        let fileIndex = 1
        let currentFileChapters: typeof mainChapters = []
        let currentBreakIndex = 0

        for (let i = 0; i < mainChapters.length; i++) {
          currentFileChapters.push(mainChapters[i])
          const chapterNum = i + reservedCount + 1

          if (currentBreakIndex < breakPoints.length && chapterNum >= breakPoints[currentBreakIndex]) {
            const content = currentFileChapters.map(ch => processChapterTitle(ch, config)).join(config.separator)
            const startCh = reservedCount + (fileIndex === 1 ? 1 : breakPoints[currentBreakIndex - 1] || 1)
            const endCh = chapterNum

            files.push({
              filename: `${prefix}${baseName}${suffix}_${fileIndex.toString().padStart(2, "0")}_${endCh}章.txt`,
              content,
              chapterRange: `第 ${startCh} - ${endCh} 章`,
              wordCount: content.length
            })

            currentFileChapters = []
            fileIndex++
            currentBreakIndex++
          }
        }

        if (currentFileChapters.length > 0) {
          const content = currentFileChapters.map(ch => processChapterTitle(ch, config)).join(config.separator)
          const lastBreak = breakPoints[breakPoints.length - 1] || 0
          const startCh = lastBreak + 1
          const endCh = mainChapters.length + reservedCount

          files.push({
            filename: `${prefix}${baseName}${suffix}_${fileIndex.toString().padStart(2, "0")}_${endCh}章.txt`,
            content,
            chapterRange: `第 ${startCh} - ${endCh} 章`,
            wordCount: content.length
          })
        }
      }
    }

    const customBreaksCount = config.mode === "custom" 
      ? (config.customBreaks?.split(",").filter(s => s.trim()).length || 0) + 1 
      : 0

    return NextResponse.json({
      success: true,
      totalChapters: chapters.length,
      chaptersPerFile: config.mode === "custom" ? customBreaksCount : config.chaptersPerFile,
      totalFiles: files.length,
      baseFilename: baseName,
      files
    })
  } catch (error) {
    console.error("拆分文件时出错:", error)
    return NextResponse.json(
      { error: "拆分失败", details: error instanceof Error ? error.message : "未知错误" },
      { status: 500 }
    )
  }
}
