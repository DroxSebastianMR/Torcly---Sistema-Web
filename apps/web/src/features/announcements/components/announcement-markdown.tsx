import { type ReactNode } from 'react'

interface AnnouncementMarkdownProps {
  content: string
  className?: string
}

function renderInline(text: string): ReactNode[] {
  const elements: ReactNode[] = []
  // Matches **bold**, *italic*, `code`, [label](url)
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      elements.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    if (token.startsWith('**') && token.endsWith('**')) {
      elements.push(
        <strong key={match.index} className="font-semibold text-brand-forest">
          {token.slice(2, -2)}
        </strong>,
      )
    } else if (token.startsWith('*') && token.endsWith('*')) {
      elements.push(
        <em key={match.index} className="italic text-foreground">
          {token.slice(1, -1)}
        </em>,
      )
    } else if (token.startsWith('`') && token.endsWith('`')) {
      elements.push(
        <code
          key={match.index}
          className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono text-emerald-800"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('[')) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token)
      if (linkMatch) {
        elements.push(
          <a
            key={match.index}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
          >
            {linkMatch[1]}
          </a>,
        )
      } else {
        elements.push(token)
      }
    }

    lastIndex = regex.lastIndex
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex))
  }

  return elements
}

interface Block {
  type: 'heading' | 'list' | 'paragraph'
  headingText?: string
  headingLevel?: number
  items?: string[]
  paragraphText?: string
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split(/\r?\n/)
  const blocks: Block[] = []
  let currentList: string[] | null = null

  const flushList = () => {
    if (currentList && currentList.length > 0) {
      blocks.push({ type: 'list', items: [...currentList] })
      currentList = null
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    const trimmed = rawLine.trim()

    if (!trimmed) {
      flushList()
      continue
    }

    // Heading: ### Title or # # # Title or ## Title or # Title
    const headingMatch = /^(#[\s#]*)\s+(.+)$/.exec(trimmed)
    if (headingMatch) {
      flushList()
      const hashesCount = headingMatch[1].replace(/\s+/g, '').length
      const level = Math.min(6, Math.max(1, hashesCount))
      blocks.push({
        type: 'heading',
        headingLevel: level,
        headingText: headingMatch[2],
      })
      continue
    }

    // List item: - item, * item, 1. item
    const listMatch = /^([-*]|\d+\.)\s+(.+)$/.exec(trimmed)
    if (listMatch) {
      if (!currentList) currentList = []
      currentList.push(listMatch[2])
      continue
    }

    // Regular line
    flushList()
    blocks.push({
      type: 'paragraph',
      paragraphText: trimmed,
    })
  }

  flushList()
  return blocks
}

export function AnnouncementMarkdown({
  content,
  className = '',
}: AnnouncementMarkdownProps) {
  if (!content) return null

  const blocks = parseBlocks(content)

  return (
    <div className={`space-y-3.5 text-sm leading-relaxed ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <div
              key={index}
              className="mt-4 mb-2 flex items-center gap-2.5 border-b border-border/50 pb-2"
            >
              <span
                aria-hidden="true"
                className="h-4 w-1 shrink-0 rounded-full bg-emerald-600"
              />
              <h3 className="text-base font-bold tracking-tight text-brand-forest sm:text-lg">
                {renderInline(block.headingText ?? '')}
              </h3>
            </div>
          )
        }

        if (block.type === 'list' && block.items) {
          return (
            <ol
              key={index}
              className="my-3 space-y-2.5 rounded-xl border border-border/60 bg-muted/20 p-3 sm:p-4"
            >
              {block.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground/90"
                >
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex size-5 shrink-0 select-none items-center justify-center rounded-full border border-emerald-300 bg-emerald-50 text-[10px] font-bold text-emerald-800 shadow-2xs"
                  >
                    {itemIdx + 1}
                  </span>
                  <div className="min-w-0 flex-1">{renderInline(item)}</div>
                </li>
              ))}
            </ol>
          )
        }

        return (
          <p key={index} className="text-sm leading-relaxed text-foreground/90">
            {renderInline(block.paragraphText ?? '')}
          </p>
        )
      })}
    </div>
  )
}
