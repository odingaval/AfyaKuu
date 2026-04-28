// src/flows/ingestDocument.ts
import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { documentService } from '../services/documentService.js';

const inputSchema = z.object({
  title: z.string(),
  content: z.string(),
  source: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export const ingestDocumentFlow = defineFlow(
  {
    name: 'ingestDocument',
    inputSchema,
    outputSchema: z.object({ id: z.string() }),
  },
  async (input) => {
    try {
      const doc = {
        title: input.title,
        content: input.content,
        source: input.source || 'unknown',
        ...input.metadata,
      };

      const id = await documentService.ingestDocument(doc);
      return { id };
    } catch (error) {
      throw new Error(`Failed to ingest document: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);