import type { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';

export const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)'
];

export interface ScrapedMetadata {
  type?: string;
  title?: string;
  description?: string;
  links?: string[];
  statusCode?: number;
  contentLength?: number;
  lastModified?: string;
}

export interface ScrapedContent {
  content: string;
  contentType: 'html' | 'json' | 'text';
  metadata: ScrapedMetadata;
  success: boolean;
  error?: string;
}

function validateContent(content: string): boolean {
  return content.length > 0 && content.length < 10_000_000; // Reasonable size limit
}

export async function detectAndHandleContentType(response: AxiosResponse): Promise<ScrapedContent> {
  try {
    const contentType = response.headers['content-type'];
    const baseMetadata = {
      statusCode: response.status,
      contentLength: parseInt(response.headers['content-length'] || '0'),
      lastModified: response.headers['last-modified'],
    };
    
    if (!response.data) {
      return {
        content: '',
        contentType: 'text',
        metadata: { ...baseMetadata, type: 'empty' },
        success: false,
        error: 'Empty response data'
      };
    }
    
    if (contentType?.includes('application/json')) {
      const content = JSON.stringify(response.data);
      if (!validateContent(content)) {
        return {
          content: '',
          contentType: 'json',
          metadata: { ...baseMetadata, type: 'json' },
          success: false,
          error: 'Invalid JSON content size'
        };
      }
      return {
        content,
        contentType: 'json',
        metadata: { ...baseMetadata, type: 'json' },
        success: true
      };
    }
    
    if (contentType?.includes('text/html')) {
      const $ = cheerio.load(response.data);
      $("script, style, iframe, noscript, meta").remove(); // Remove non-content elements
      
      const content = $("body").text().replace(/\s+/g, " ").trim();
      if (!validateContent(content)) {
        return {
          content: '',
          contentType: 'html',
          metadata: { ...baseMetadata, type: 'html' },
          success: false,
          error: 'Invalid HTML content size'
        };
      }
      
      return {
        content,
        contentType: 'html',
        metadata: {
          ...baseMetadata,
          title: $("title").text().trim(),
          description: $('meta[name="description"]').attr("content")?.trim(),
          links: $('a[href^="http"]').map((_, el) => $(el).attr('href')).get()
        },
        success: true
      };
    }
    
    const content = response.data.toString();
    if (!validateContent(content)) {
      return {
        content: '',
        contentType: 'text',
        metadata: { ...baseMetadata, type: 'text' },
        success: false,
        error: 'Invalid text content size'
      };
    }
    
    return {
      content,
      contentType: 'text',
      metadata: { ...baseMetadata, type: 'text' },
      success: true
    };
  } catch (error) {
    return {
      content: '',
      contentType: 'text',
      metadata: { type: 'error' },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during content processing'
    };
  }
} 