// src/services/documentProcessor.ts
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import * as mime from 'mime-types';
import * as pdfjsLib from 'pdfjs-dist';
import * as mammoth from 'mammoth';
import * as ExcelJS from 'exceljs';
import { createWorker, PSM } from 'tesseract.js';
import winston from 'winston';
import { Document } from './documentService.js';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'document-processor' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

export interface ProcessedDocument extends Document {
  chunks: string[];
  title: string;
  metadata: {
    pages?: number;
    format: string;
    size: number;
    extractedTextLength: number;
  };
}

export class DocumentProcessor {
  private worker: any;

  constructor() {
    this.worker = null;
  }

  async initialize() {
    this.worker = await createWorker('eng');
  }

  async cleanup() {
    if (this.worker) {
      await this.worker.terminate();
    }
  }

private async extractTextFromPdf(filePath: string): Promise<string> {
  try {
    const data = new Uint8Array(fs.readFileSync(filePath));
  // In documentProcessor.ts, update the import to:
const pdfjs = await import('pdfjs-dist');
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url
).toString();
    const loadingTask = pdfjs.getDocument({ data });
    const pdf = await loadingTask.promise;
    let text = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(' ') + '\n';
    }
    
    return text;
  } catch (error) {
    logger.error('Error extracting text from PDF:', error);
    throw new Error(`Failed to extract text from PDF: ${getErrorMessage(error)}`);
  }
}


  private async extractTextFromDocx(filePath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      logger.error('Error extracting text from DOCX', { error });
      throw new Error(`DOCX text extraction failed: ${getErrorMessage(error)}`);
    }
  }

  private async extractTextFromXlsx(filePath: string): Promise<string> {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      let text = '';
      
      workbook.eachSheet((worksheet) => {
        worksheet.eachRow((row) => {
          row.eachCell((cell) => {
            if (cell.value) {
              text += `${cell.value} `;
            }
          });
        });
      });
      
      return text.trim();
    } catch (error) {
      logger.error('Error extracting text from XLSX', { error });
      throw new Error(`XLSX text extraction failed: ${getErrorMessage(error)}`);
    }
  }

  private async extractTextFromImage(filePath: string): Promise<string> {
    try {
      if (!this.worker) {
        throw new Error('Tesseract worker not initialized');
      }
      const { data: { text } } = await this.worker.recognize(filePath);
      return text;
    } catch (error) {
      logger.error('Error extracting text from image', { error });
      throw new Error(`Image text extraction failed: ${getErrorMessage(error)}`);
    }
  }

  private chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
    const chunks: string[] = [];
    let index = 0;
    
    while (index < text.length) {
      const end = Math.min(index + chunkSize, text.length);
      chunks.push(text.substring(index, end));
      
      if (end === text.length) break;
      
      // Move back by overlap to create overlapping chunks
      index = end - Math.min(overlap, Math.floor(chunkSize * 0.2));
    }
    
    return chunks;
  }

  async processDocument(filePath: string, metadata: Partial<Document> = {}): Promise<ProcessedDocument> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const stats = fs.statSync(filePath);
      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      
      let text = '';
      const extension = path.extname(filePath).toLowerCase();

      switch (extension) {
        case '.pdf':
          text = await this.extractTextFromPdf(filePath);
          break;
        case '.docx':
        case '.doc':
          text = await this.extractTextFromDocx(filePath);
          break;
        case '.xlsx':
        case '.xls':
          text = await this.extractTextFromXlsx(filePath);
          break;
        case '.jpg':
        case '.jpeg':
        case '.png':
          text = await this.extractTextFromImage(filePath);
          break;
        case '.txt':
          text = fs.readFileSync(filePath, 'utf-8');
          break;
        default:
          throw new Error(`Unsupported file format: ${extension}`);
      }

      const chunks = this.chunkText(text);
      
      return {
        title: metadata.title || path.basename(filePath),
        content: text,
        source: metadata.source || 'file-upload',
        chunks,
        metadata: {
          format: mimeType,
          size: stats.size,
          extractedTextLength: text.length,
          ...(extension === '.pdf' && { pages: (text.match(/\f/g) || []).length + 1 })
        }
      };
    } catch (error) {
      logger.error('Error processing document', { error, filePath });
      throw new Error(`Document processing failed: ${getErrorMessage(error)}`);
    }
  }
}

export const documentProcessor = new DocumentProcessor();