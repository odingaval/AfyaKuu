
// src/services/documentService.ts
import winston from 'winston';
import * as genkit from '@genkit-ai/core';
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
  private weaviateClient: any;
  private className: string;
  private logger: winston.Logger;
  private isInitialized: boolean = false;
  private weaviateUrl: string | undefined;
  private weaviateApiKey: string | undefined;

  constructor() {
    this.weaviateUrl = process.env.WEAVIATE_URL;
    this.weaviateApiKey = process.env.WEAVIATE_API_KEY;
    this.className = process.env.WEAVIATE_CLASS || 'MedicalDocument';
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'document-service' },
      transports: [new winston.transports.Console()],
    });

    // Only initialize Weaviate client if URL is provided
    if (this.weaviateUrl) {
      try {
        this.weaviateClient = weaviate.client({
          scheme: 'https',
          host: this.weaviateUrl,
          apiKey: this.weaviateApiKey,
        });
        this.isInitialized = true;
        this.logger.info('DocumentService initialized with Weaviate');
      } catch (error) {
        this.logger.warn('Failed to initialize Weaviate client', { error });
        this.isInitialized = false;
      }
    } else {
      this.logger.warn('WEAVIATE_URL not provided, document service will run in limited mode');
    }
  }


  async initializeSchema() {
    if (!this.isInitialized || !this.weaviateClient) {
      this.logger.warn('Weaviate not initialized, skipping schema initialization');
      return;
    }

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
      const schema = await this.weaviateClient.schema.getter().do();
      const exists = schema.classes?.some((c: { class: string }) => c.class === this.className);

      if (!exists) {
        await this.weaviateClient.schema.classCreator().withClass(schemaConfig).do();
        this.logger.info(`Created schema for class: ${this.className}`);
      }
    } catch (error) {
      this.logger.error('Error initializing schema', { error });
      throw error;
    }
  }


  async ingestDocument(doc: Document): Promise<string> {
    if (!this.isInitialized || !this.weaviateClient) {
      this.logger.warn('Weaviate not initialized, cannot ingest document');
      throw new Error('Document service not available');
    }

    try {
      const result = await this.weaviateClient.data
        .creator()
        .withClassName(this.className)
        .withProperties(doc)
        .do();

      this.logger.info('Document ingested', { id: result.id });
      return result.id;
    } catch (error) {
      this.logger.error('Error ingesting document', { error, doc });
      throw error;
    }
  }


  async searchDocuments(query: string, limit: number = 5): Promise<Document[]> {
    if (!this.isInitialized || !this.weaviateClient) {
      this.logger.warn('Weaviate not initialized, cannot search documents');
      return [];
    }

    try {
      const result = await this.weaviateClient.graphql
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
      this.logger.error('Error searching documents', { error, query });
      throw error;
    }
  }


  async getDocument(id: string): Promise<Document | null> {
    if (!this.isInitialized || !this.weaviateClient) {
      this.logger.warn('Weaviate not initialized, cannot get document');
      return null;
    }

    try {
      const result = await this.weaviateClient.data
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
      this.logger.error('Error getting document', { error, id });
      throw error;
    }
  }


  async deleteDocument(id: string): Promise<boolean> {
    if (!this.isInitialized || !this.weaviateClient) {
      this.logger.warn('Weaviate not initialized, cannot delete document');
      return false;
    }

    try {
      await this.weaviateClient.data
        .deleter()
        .withClassName(this.className)
        .withId(id)
        .do();
      return true;
    } catch (error) {
      this.logger.error('Error deleting document', { error, id });
      throw error;
    }
  }

  // Check if document service is available
  isAvailable(): boolean {
    return this.isInitialized && this.weaviateClient !== null;
  }
}

export const documentService = new DocumentService();
