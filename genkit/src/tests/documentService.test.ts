// src/services/documentService.ts
import winston from 'winston';
import * as genkit from '@genkit-ai/core';

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
import { Document as GenkitDocument } from 'genkit/retriever';
import weaviate from 'weaviate-ts-client';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export interface Document {
  id?: string;
  title: string;
  content: string;
  source: string;
  [key: string]: any;
}

class DocumentService {
  private client: ReturnType<typeof weaviate.client>;
  private className: string;

  constructor() {
    this.client = weaviate.client({
      scheme: 'https',
      host: process.env.WEAVIATE_URL!,
      apiKey: process.env.WEAVIATE_API_KEY!,
    });
    this.className = process.env.WEAVIATE_CLASS || 'MedicalDocument';
  }

  async initializeSchema() {
    const schemaConfig = {
      class: this.className,
      vectorizer: 'text2vec-openai',
      moduleConfig: {
        'text2vec-openai': {
          model: 'text-embedding-3-small',
          type: 'text'
        }
      },
      properties: [
        { name: 'title', dataType: ['text'] },
        { name: 'content', dataType: ['text'] },
        { name: 'source', dataType: ['text'] },
      ],
    };

    try {
      const schema = await this.client.schema.getter().do();
      const exists = schema.classes?.some((c: { class: string }) => c.class === this.className);
      
      if (!exists) {
        await this.client.schema.classCreator().withClass(schemaConfig).do();
        logger.info(`Created schema for class: ${this.className}`);
      }
    } catch (error) {
logger.error('Error initializing schema', { error });
      throw error;
    }
  }

  async ingestDocument(doc: Document): Promise<string> {
    try {
      const result = await this.client.data
        .creator()
        .withClassName(this.className)
        .withProperties(doc)
        .do();

      winston.info('Document ingested', { id: result.id });
      return result.id;
    } catch (error) {
      winston.error('Error ingesting document', { error, doc });
      throw error;
    }
  }

  async searchDocuments(query: string, limit: number = 5): Promise<Document[]> {
    try {
      const result = await this.client.graphql
        .get()
        .withClassName(this.className)
        .withFields('title content source _additional { distance }')
        .withNearText({ concepts: [query] })
        .withLimit(limit)
        .do();

      return result.data.Get[this.className]?.map((d: any) => ({
        id: d._additional.id,
        title: d.title,
        content: d.content,
        source: d.source,
        distance: d._additional.distance,
      })) || [];
    } catch (error) {
      logger.error('Error searching documents', { error, query });
      throw error;
    }
  }

  async getDocument(id: string): Promise<Document | null> {
    try {
      const result = await this.client.data
        .getterById()
        .withClassName(this.className)
        .withId(id)
        .do();

      if (!result) return null;
      
      return {
        id: result._additional?.id,
        ...result.properties,
      } as Document;
    } catch (error) {
      logger.error('Error getting document', { error, id });
      throw error;
    }
  }
}

export const documentService = new DocumentService();