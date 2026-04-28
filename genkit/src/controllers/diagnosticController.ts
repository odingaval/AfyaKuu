// src/controllers/diagnosticController.ts
import { Request, Response } from 'express';
import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { documentService } from '../services/documentService.js';

const inputSchema = z.object({
  query: z.string(),
  imageBase64: z.string().optional(),
});

const outputSchema = z.object({
  finding: z.string(),
  confidence: z.number(),
  groundedAdvice: z.string(),
  sources: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    distance: z.number().optional(),
  })),
});

export const analyzeDiagnostic = async (req: Request, res: Response) => {
  try {
    const { query, imageBase64 } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query is required and must be a string'
      });
    }

    // Search for relevant documents
    const retrieved = await documentService.searchDocuments(query, 3);

    // For now, return a simple response since we don't have the full AI integration set up
    const result = {
      finding: 'Analysis completed',
      confidence: 0.8,
      groundedAdvice: `Based on the query "${query}", I recommend consulting with a healthcare professional. The retrieved medical context suggests: ${retrieved.map(doc => doc.title).join(', ')}`,
      sources: retrieved.map(doc => ({
        id: doc.id || '',
        title: doc.title,
        content: doc.content,
        distance: doc.distance,
      })),
      recommendations: [
        'Consult with a qualified healthcare professional',
        'Follow local health ministry guidelines',
        'Consider additional diagnostic tests if available'
      ],
      severity: 'medium',
      followUpRequired: true,
      processingTime: Date.now() % 1000 + 500, // Mock processing time
      disclaimer: 'This is clinical decision support only. Not a final diagnosis. Always consult qualified medical personnel.'
    };

    res.json(result);
  } catch (error) {
    console.error('Diagnostic analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze diagnostic query',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getDiagnosticStatus = async (req: Request, res: Response) => {
  try {
    // Check if diagnostic services are available
    const isDocumentServiceAvailable = documentService.isAvailable();

    res.json({
      status: 'operational',
      services: {
        documentService: isDocumentServiceAvailable,
        vertexAI: false, // Not yet implemented
        ragPipeline: isDocumentServiceAvailable
      },
      version: '1.0.0'
    });
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      error: 'Failed to check diagnostic status'
    });
  }
};
