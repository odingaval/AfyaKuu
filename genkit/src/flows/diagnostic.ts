// src/flows/diagnostic.ts
import { defineFlow } from '@genkit-ai/flow';
import { z } from 'zod';
import { documentService } from '../services/documentService.js';
import { vertexAIService } from '../services/vertexAIService.js';

const inputSchema = z.object({
  query: z.string(),
  imageBase64: z.string().optional(),
});

const outputSchema = z.object({
  finding: z.string(),
  confidence: z.number(),
  groundedAdvice: z.string(),
  recommendations: z.array(z.string()),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  followUpRequired: z.boolean(),
  sources: z.array(z.object({
    id: z.string(),
    title: z.string(),
    content: z.string(),
    distance: z.number().optional(),
  })),
  processingTime: z.number(),
  disclaimer: z.string(),
});

type FlowSteps = {
  analyzeImage: {
    input: { imageBase64?: string; query: string };
    output: { finding: string; confidence: number; recommendations: string[]; severity: string; followUpRequired: boolean };
  };
  retrieveContext: {
    input: { query: string };
    output: Array<{ id: string; title: string; content: string; distance?: number }>;
  };
  generateGroundedAdvice: {
    input: { analysis: any; context: any[]; query: string };
    output: { advice: string; confidenceReasons: string[] };
  };
};

export const diagnosticAnalysisFlow = defineFlow(
  {
    name: 'diagnosticAnalysisFlow',
    inputSchema,
    outputSchema,
  },
  async (input) => {
    const startTime = Date.now();

    try {
      // Step 1: Analyze image if provided
      let imageAnalysis = null;
      if (input.imageBase64) {
        imageAnalysis = await vertexAIService.analyzeMedicalImage(input.imageBase64, input.query);
      }

      // Step 2: Retrieve relevant medical context from vector store
      const retrieved = await documentService.searchDocuments(input.query, 5);

      // Step 3: Generate grounded advice combining image analysis and medical context
      const groundedAdvice = await generateGroundedAdvice(input.query, imageAnalysis, retrieved);

      const processingTime = Date.now() - startTime;

      return {
        finding: imageAnalysis?.diagnostic.finding || 'No image analysis available',
        confidence: imageAnalysis?.diagnostic.confidence || 0.5,
        groundedAdvice: groundedAdvice.advice,
        recommendations: imageAnalysis?.diagnostic.recommendations || ['Consult healthcare professional'],
        severity: imageAnalysis?.diagnostic.severity || 'medium',
        followUpRequired: imageAnalysis?.diagnostic.followUpRequired ?? true,
        sources: retrieved.map(doc => ({
          id: doc.id || '',
          title: doc.title,
          content: doc.content,
          distance: doc.distance,
        })),
        processingTime,
        disclaimer: 'This is clinical decision support, not a final diagnosis. Always consult with qualified healthcare professionals and follow local medical guidelines.',
      };
    } catch (error) {
      console.error('Diagnostic flow error:', error);
      throw new Error(`Diagnostic analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
);

async function generateGroundedAdvice(
  query: string,
  imageAnalysis: any,
  retrievedDocuments: any[]
): Promise<{ advice: string; confidenceReasons: string[] }> {
  try {
    // Combine image analysis with medical context
    const medicalContext = retrievedDocuments
      .map(doc => `${doc.title}: ${doc.content.substring(0, 300)}...`)
      .join('\n\n');

    const imageFindings = imageAnalysis?.diagnostic ?
      `Image Analysis: ${imageAnalysis.diagnostic.finding} (Confidence: ${Math.round(imageAnalysis.diagnostic.confidence * 100)}%)` :
      'No image analysis available';

    const advice = `Based on the clinical query "${query}":

${imageFindings}

Medical Context from Guidelines:
${medicalContext}

Clinical Recommendations:
${imageAnalysis?.diagnostic.recommendations?.map((rec: string) => `• ${rec}`).join('\n') || '• Consult healthcare professional'}

Important: This analysis is for clinical decision support only. Final diagnosis requires professional medical examination.`;

    const confidenceReasons = imageAnalysis?.diagnostic.confidenceReasons || [
      'Medical context retrieved from knowledge base',
      'Clinical guidelines considered',
      'Image analysis performed (if applicable)'
    ];

    return { advice, confidenceReasons };
  } catch (error) {
    console.error('Error generating grounded advice:', error);
    return {
      advice: `Clinical query: ${query}. Please consult healthcare professional for proper diagnosis.`,
      confidenceReasons: ['Fallback analysis applied due to processing error']
    };
  }
}
