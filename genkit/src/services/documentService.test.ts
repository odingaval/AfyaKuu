// src/services/documentService.ts
import winston from 'winston';
import * as genkit from '@genkit-ai/core';
import weaviate from 'weaviate-ts-client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables first
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Create a logger instance
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'document-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});

export interface Document {
  id?: string;
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

class DocumentService {
  private weaviateClient: any;
  private className: string;
  private logger: winston.Logger;

  constructor() {
    if (!process.env.WEAVIATE_URL) {
      throw new Error('WEAVIATE_URL is not defined in environment variables');
    }
    if (!process.env.WEAVIATE_API_KEY) {
      throw new Error('WEAVIATE_API_KEY is not defined in environment variables');
    }

    this.weaviateClient = weaviate.client({
      scheme: 'https',
      host: process.env.WEAVIATE_URL,
      apiKey: process.env.WEAVIATE_API_KEY,
    });
    this.className = process.env.WEAVIATE_CLASS || 'MedicalDocument';
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'document-service' },
      transports: [new winston.transports.Console()],
    });
  }

  // ... rest of the class implementation
}

// Export a function that creates the service instead of instantiating it directly
let _documentService: DocumentService | null = null;

export function getDocumentService(): DocumentService {
  if (!_documentService) {
    _documentService = new DocumentService();
  }
  return _documentService;
}

// For backward compatibility, but prefer using getDocumentService()
export const documentService = getDocumentService();