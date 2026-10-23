import { describe, it, expect } from 'vitest';
import { renderContent, plainText } from './content-render';

describe('renderContent', () => {
  it('should return empty string for empty content', async () => {
    expect(await renderContent('')).toBe('');
  });

  it('should return HTML as-is when format is html', async () => {
    const html = '<p>Hello <strong>World</strong></p>';
    const result = await renderContent(html, 'html');
    expect(result).toBe(html);
  });

  it('should convert markdown to HTML', async () => {
    const md = '# Heading\n\nThis is **bold** text.';
    const result = await renderContent(md, 'markdown');
    expect(result).toContain('<h1>Heading</h1>');
    expect(result).toContain('<strong>bold</strong>');
  });

  it('should convert markdown list to HTML', async () => {
    const md = '- Item 1\n- Item 2\n- Item 3';
    const result = await renderContent(md, 'markdown');
    expect(result).toContain('<li>Item 1</li>');
    expect(result).toContain('<li>Item 3</li>');
  });

  it('should convert markdown blockquote to HTML', async () => {
    const md = '> This is a quote';
    const result = await renderContent(md, 'markdown');
    expect(result).toContain('<blockquote>');
    expect(result).toContain('This is a quote');
  });
});

describe('plainText', () => {
  it('should strip HTML tags', () => {
    expect(plainText('<p>Hello <strong>World</strong></p>')).toBe('Hello World');
  });

  it('should remove script tags and content', () => {
    expect(plainText('<script>alert(1)</script><p>visible</p>')).toBe('visible');
  });

  it('should remove style tags and content', () => {
    expect(plainText('<style>.x{}</style><p>text</p>')).toBe('text');
  });

  it('should collapse whitespace', () => {
    expect(plainText('<p>multiple   spaces</p>\n\n')).toBe('multiple spaces');
  });

  it('should handle empty input', () => {
    expect(plainText('')).toBe('');
    expect(plainText(null as unknown as string)).toBe('');
  });
});
