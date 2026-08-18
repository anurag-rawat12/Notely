import { Fragment, type ReactNode } from "react";
import { extractTextContent } from "@/lib/utils";

function normalizeNewlines(text: string) {
    // Handle strings containing literal "\n" sequences as well as real newlines.
    return text.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
}

function InlineMarkdown({ text }: { text: string }) {
    const parts = text.split(
        /(`[^`\n]+`|\*\*\*[^*\n]+\*\*\*|\*\*[^*\n]+\*\*|\*[^*\n]+\*|~~[^~\n]+~~|\$[^$\n]+\$|\[[^\]\n]+\]\([^)]+\))/g
    );

    return (
        <>
            {parts.map((part, index) => {
                if (!part) return null;

                // Inline code
                if (part.startsWith("`") && part.endsWith("`")) {
                    return (
                        <code
                            key={index}
                            className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
                        >
                            {part.slice(1, -1)}
                        </code>
                    );
                }

                // Bold + italic
                if (part.startsWith("***") && part.endsWith("***")) {
                    return (
                        <strong key={index} className="font-semibold text-foreground">
                            <em>{part.slice(3, -3)}</em>
                        </strong>
                    );
                }

                // Bold
                if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                        <strong key={index} className="font-semibold text-foreground">
                            {part.slice(2, -2)}
                        </strong>
                    );
                }

                // Italic
                if (part.startsWith("*") && part.endsWith("*")) {
                    return <em key={index}>{part.slice(1, -1)}</em>;
                }

                // Strikethrough
                if (part.startsWith("~~") && part.endsWith("~~")) {
                    return (
                        <del key={index} className="text-muted-foreground">
                            {part.slice(2, -2)}
                        </del>
                    );
                }

                // Simple inline math
                if (part.startsWith("$") && part.endsWith("$")) {
                    return (
                        <span key={index} className="font-mono text-foreground">
                            {part.slice(1, -1)}
                        </span>
                    );
                }

                // Markdown link
                const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);

                if (link) {
                    const [, label, href] = link;

                    return (
                        <a
                            key={index}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-foreground underline underline-offset-2 hover:text-muted-foreground"
                        >
                            {label}
                        </a >
                    );
                }

                return <Fragment key={index}>{part}</Fragment>;
            })}
        </>
    );
}

/** Renders a fenced code block with a language label header, mimicking a syntax-highlighted panel. */
function CodeBlock({ language, code }: { language: string; code: string }) {
    return (
        <div className="my-4 overflow-hidden rounded-xl border border-border shadow-sm">
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/50 px-4 py-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    {language || "text"}
                </span>
            </div>
            <pre className="overflow-x-auto bg-primary p-4 text-sm leading-6 text-primary-foreground">
                <code data-language={language || undefined}>{code}</code>
            </pre>
        </div>
    );
}

/** Parses and renders a GitHub-flavored-markdown pipe table. */
function Table({ rows }: { rows: string[] }) {
    // rows[0] = header, rows[1] = separator (---|---), rows[2+] = body
    const parseRow = (row: string) =>
        row
            .trim()
            .replace(/^\|/, "")
            .replace(/\|$/, "")
            .split("|")
            .map((cell) => cell.trim());

    const header = parseRow(rows[0]);
    const body = rows.slice(2).map(parseRow);

    return (
        <div className="my-4 overflow-x-auto rounded-xl border border-border">
            <table className="w-full border-collapse text-sm">
                <thead>
                    <tr className="bg-muted/60">
                        {header.map((cell, i) => (
                            <th
                                key={i}
                                className="border-b border-border px-3 py-2 text-left font-semibold text-foreground"
                            >
                                <InlineMarkdown text={cell} />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {body.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            className={rowIndex % 2 === 1 ? "bg-muted/20" : undefined}
                        >
                            {row.map((cell, cellIndex) => (
                                <td
                                    key={cellIndex}
                                    className="border-b border-border/60 px-3 py-2 text-foreground"
                                >
                                    <InlineMarkdown text={cell} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

const TABLE_ROW_RE = /^\s*\|.*\|\s*$/;
const TABLE_SEPARATOR_RE = /^\s*\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?\s*$/;

/**
 * A small, safe Markdown renderer for assistant text.
 * It intentionally renders no raw HTML.
 */
export default function MarkdownContent({
    content,
}: {
    content?: string;
}) {
    const extracted = extractTextContent(content ?? "");
    const cleanContent = normalizeNewlines(extracted);
    const lines = cleanContent.split("\n");

    const blocks: ReactNode[] = [];
    let index = 0;

    while (index < lines.length) {
        const line = lines[index];

        // Empty line
        if (!line.trim()) {
            index += 1;
            continue;
        }

        // Fenced code block
        if (line.trimStart().startsWith("```")) {
            const startIndex = index;
            const language = line.trimStart().slice(3).trim();

            index += 1;

            const code: string[] = [];

            while (
                index < lines.length &&
                !lines[index].trimStart().startsWith("```")
            ) {
                code.push(lines[index]);
                index += 1;
            }

            if (
                index < lines.length &&
                lines[index].trimStart().startsWith("```")
            ) {
                index += 1;
            }

            blocks.push(
                <CodeBlock key={`code-${startIndex}`} language={language} code={code.join("\n")} />
            );

            continue;
        }

        // Table (header row + separator row)
        if (
            TABLE_ROW_RE.test(line) &&
            index + 1 < lines.length &&
            TABLE_SEPARATOR_RE.test(lines[index + 1])
        ) {
            const startIndex = index;
            const tableRows: string[] = [line, lines[index + 1]];
            index += 2;

            while (index < lines.length && TABLE_ROW_RE.test(lines[index])) {
                tableRows.push(lines[index]);
                index += 1;
            }

            blocks.push(<Table key={`table-${startIndex}`} rows={tableRows} />);
            continue;
        }

        // Heading
        const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);

        if (headingMatch) {
            const level = headingMatch[1].length;
            const text = headingMatch[2];

            const styles =
                level === 1
                    ? "mt-6 text-2xl font-semibold tracking-tight text-foreground"
                    : level === 2
                        ? "mt-5 text-xl font-semibold text-foreground"
                        : level === 3
                            ? "mt-4 text-lg font-semibold text-foreground"
                            : "mt-4 text-base font-semibold text-foreground";

            const HeadingTag = `h${Math.min(level, 6)}` as
                | "h1"
                | "h2"
                | "h3"
                | "h4"
                | "h5"
                | "h6";

            blocks.push(
                <HeadingTag key={`h-${index}`} className={styles}>
                    <InlineMarkdown text={text} />
                </HeadingTag>
            );

            index += 1;
            continue;
        }

        // Unordered list
        if (/^\s*[-*+]\s+/.test(line)) {
            const startIndex = index;
            const items: string[] = [];

            while (index < lines.length && /^\s*[-*+]\s+/.test(lines[index])) {
                items.push(lines[index].replace(/^\s*[-*+]\s+/, ""));
                index += 1;
            }

            blocks.push(
                <ul
                    key={`ul-${startIndex}`}
                    className="my-3 list-disc space-y-1.5 pl-5 text-foreground marker:text-muted-foreground"
                >
                    {items.map((item, itemIndex) => (
                        <li key={itemIndex}>
                            <InlineMarkdown text={item} />
                        </li>
                    ))}
                </ul>
            );

            continue;
        }

        // Ordered list
        if (/^\s*\d+\.\s+/.test(line)) {
            const startIndex = index;
            const items: string[] = [];

            while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index])) {
                items.push(lines[index].replace(/^\s*\d+\.\s+/, ""));
                index += 1;
            }

            blocks.push(
                <ol
                    key={`ol-${startIndex}`}
                    className="my-3 list-decimal space-y-1.5 pl-5 text-foreground marker:text-muted-foreground marker:font-medium"
                >
                    {items.map((item, itemIndex) => (
                        <li key={itemIndex}>
                            <InlineMarkdown text={item} />
                        </li>
                    ))}
                </ol>
            );

            continue;
        }

        // Blockquote
        if (/^\s*>\s?/.test(line)) {
            const startIndex = index;
            const quoteLines: string[] = [];

            while (index < lines.length && /^\s*>\s?/.test(lines[index])) {
                quoteLines.push(lines[index].replace(/^\s*>\s?/, ""));
                index += 1;
            }

            blocks.push(
                <blockquote
                    key={`bq-${startIndex}`}
                    className="my-3 rounded-r-lg border-l-2 border-primary/40 bg-muted/30 py-2 pl-4 pr-3 text-muted-foreground"
                >
                    {quoteLines.map((quoteLine, quoteIndex) => (
                        <div key={quoteIndex}>
                            <InlineMarkdown text={quoteLine} />
                        </div>
                    ))}
                </blockquote>
            );

            continue;
        }

        // Horizontal rule
        if (/^\s*(---+|\*\*\*+|___+)\s*$/.test(line)) {
            blocks.push(<hr key={`hr-${index}`} className="my-5 border-border" />);
            index += 1;
            continue;
        }

        // Normal paragraph.
        const paragraphLines: string[] = [];
        const startIndex = index;

        while (
            index < lines.length &&
            lines[index].trim() &&
            !lines[index].trimStart().startsWith("```") &&
            !/^(#{1,6})\s+/.test(lines[index]) &&
            !/^\s*[-*+]\s+/.test(lines[index]) &&
            !/^\s*\d+\.\s+/.test(lines[index]) &&
            !/^\s*>\s?/.test(lines[index]) &&
            !/^\s*(---+|\*\*\*+|___+)\s*$/.test(lines[index]) &&
            !(TABLE_ROW_RE.test(lines[index]) && index + 1 < lines.length && TABLE_SEPARATOR_RE.test(lines[index + 1]))
        ) {
            paragraphLines.push(lines[index].trim());
            index += 1;
        }

        blocks.push(
            <p key={`p-${startIndex}`} className="my-3 leading-relaxed text-foreground">
                {paragraphLines.map((paragraphLine, paragraphIndex) => (
                    <Fragment key={paragraphIndex}>
                        {paragraphIndex > 0 && <br />}
                        <InlineMarkdown text={paragraphLine} />
                    </Fragment>
                ))}
            </p>
        );
    }

    return <div className="text-[15px] text-foreground">{blocks}</div>;
}