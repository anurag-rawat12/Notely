import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractTextContent(input: unknown): string {
  if (input === null || input === undefined) return "";

  if (typeof input === "string") {
    const trimmed = input.trim();
    // Check if string looks like a JSON or Python list/dict string
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        return extractTextContent(parsed);
      } catch {
        // If JSON parse fails (e.g. Python repr with single quotes like [{'type': 'text', 'text': '...'}]):
        const textMatch = trimmed.match(/['"]text['"]\s*:\s*['"]((?:\\['"]|[^'"])+)['"]/);
        if (textMatch && textMatch[1]) {
          return textMatch[1].replace(/\\'/g, "'").replace(/\\"/g, '"');
        }
      }
    }
    return input;
  }

  if (Array.isArray(input)) {
    return input
      .map((item) => extractTextContent(item))
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof input === "object") {
    const obj = input as Record<string, unknown>;
    if ("text" in obj && obj.text !== undefined) return extractTextContent(obj.text);
    if ("content" in obj && obj.content !== undefined) return extractTextContent(obj.content);
    if ("answer" in obj && obj.answer !== undefined) return extractTextContent(obj.answer);
    if ("message" in obj && obj.message !== undefined) return extractTextContent(obj.message);
    if ("response" in obj && obj.response !== undefined) return extractTextContent(obj.response);
  }

  return String(input);
}