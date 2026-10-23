import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export async function renderContent(content: string, format: 'html' | 'markdown' = 'html') {
  if (!content) return '';
  if (format === 'markdown') {
    return await marked.parse(content);
  }
  return content;
}

export function plainText(content: string) {
  return (content ?? '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
