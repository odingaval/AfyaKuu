// src/services/vertexAIService.ts
import { ImageAnnotatorClient } from '@google-cloud/vision';
import { VertexAI } from '@google-cloud/vertexai';
import winston from 'winston';

export interface DiagnosticAnalysis {
  finding: string;
  confidence: number;
  description: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  followUpRequired: boolean;
  confidenceReasons: string[];
}

export interface ImageAnalysisResult {
  rawAnnotations: any;
  diagnostic: DiagnosticAnalysis;
  processingTime: number;
}

class VertexAIService {
  private visionClient: ImageAnnotatorClient;
  private vertexClient: VertexAI;
  private logger: winston.Logger;
  private isInitialized: boolean = false;

  constructor() {
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      defaultMeta: { service: 'vertex-ai-service' },
      transports: [new winston.transports.Console()],
    });

    try {
      this.visionClient = new ImageAnnotatorClient();
      this.vertexClient = new VertexAI({
        project: process.env.GOOGLE_CLOUD_PROJECT_ID,
        location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      });

      this.isInitialized = true;
      this.logger.info('Vertex AI service initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Vertex AI service', { error });
      this.isInitialized = false;
    }
  }

  async analyzeMedicalImage(imageBase64: string, query: string = ''): Promise<ImageAnalysisResult> {
    if (!this.isInitialized) {
      throw new Error('Vertex AI service not initialized');
    }

    const startTime = Date.now();

    try {
      const [visionResult] = await this.visionClient.annotateImage({
        image: { content: imageBase64 },
        features: [
          { type: 'LABEL_DETECTION', maxResults: 10 },
          { type: 'TEXT_DETECTION', maxResults: 10 },
          { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          { type: 'IMAGE_PROPERTIES' }
        ],
      });

      const diagnosticAnalysis = await this.performMedicalAnalysis(
        visionResult,
        query,
        imageBase64
      );

      const processingTime = Date.now() - startTime;

      return {
        rawAnnotations: visionResult,
        diagnostic: diagnosticAnalysis,
        processingTime,
      };
    } catch (error) {
      this.logger.error('Error analyzing medical image', { error, query });
      throw new Error(`Medical image analysis failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async performMedicalAnalysis(
    visionResult: any,
    query: string,
    imageBase64: string
  ): Promise<DiagnosticAnalysis> {
    try {
      const medicalPrompt = this.buildMedicalPrompt(visionResult, query);
      const model = this.vertexClient.getGenerativeModel({ model: 'gemini-pro-vision' });

      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: medicalPrompt }, { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }] }],
        generationConfig: { temperature: 0.1, topK: 32, topP: 1, maxOutputTokens: 1024 }
      });

      const responseText = response.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return this.parseMedicalResponse(responseText, visionResult);
    } catch (error) {
      this.logger.error('Error in medical analysis', { error });
      return this.performFallbackAnalysis(visionResult, query);
    }
  }

  private buildMedicalPrompt(visionResult: any, query: string): string {
    const labels = visionResult.labelAnnotations?.map((label: any) => 
      `${label.description} (${Math.round(label.score * 100)}%)`
    ).join(', ') || 'No labels detected';

    return `You are an AI clinical decision support system for healthcare workers in rural African clinics.

IMPORTANT MEDICAL DISCLAIMERS:
- This is NOT a final diagnosis
- Always confirm with clinical expertise
- Consider local epidemiological factors
- Follow WHO/MoH guidelines

Clinical Query: ${query || 'General diagnostic assistance'}
Detected Labels: ${labels}

Provide analysis in JSON format with finding, confidence, description, recommendations, severity, followUpRequired, confidenceReasons.`;
  }

  private parseMedicalResponse(responseText: string, visionResult: any): DiagnosticAnalysis {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          finding: parsed.finding || 'Analysis completed',
          confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
          description: parsed.description || 'Detailed analysis not available',
          recommendations: parsed.recommendations || [],
          severity: parsed.severity || 'medium',
          followUpRequired: parsed.followUpRequired !== false,
          confidenceReasons: parsed.confidenceReasons || [],
        };
      }
    } catch (error) {
      this.logger.warn('Failed to parse AI response, using fallback', { error });
    }
    return this.performFallbackAnalysis(visionResult, '');
  }

  private performFallbackAnalysis(visionResult: any, query: string): DiagnosticAnalysis {
    const labels = visionResult.labelAnnotations || [];
    const bloodRelatedTerms = ['blood', 'red blood cells', 'rbc', 'parasite', 'malaria', 'sickle'];
    const hasBloodRelatedContent = labels.some((label: any) =>
      bloodRelatedTerms.some(term => label.description.toLowerCase().includes(term.toLowerCase()))
    );

    let finding = 'Image analysis completed';
    let confidence = 0.6;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let recommendations = ['Consult with healthcare professional'];
    let followUpRequired = true;

    if (hasBloodRelatedContent) {
      finding = 'Blood smear image detected - requires microscopic examination';
      confidence = 0.7;
      recommendations = [
        'Perform microscopic examination',
        'Check for malaria parasites',
        'Consider local disease prevalence',
        'Follow WHO malaria diagnostic guidelines'
      ];
    }

    if (query.toLowerCase().includes('malaria')) {
      finding = 'Malaria diagnostic analysis requested';
      recommendations = [
        'Perform rapid diagnostic test (RDT)',
        'Examine blood smear under microscope',
        'Check parasite density',
        'Consider patient symptoms and travel history'
      ];
      severity = 'high';
    }

    return { 
      finding, 
      confidence, 
      description: `Based on image analysis: ${labels.map((l: any) => l.description).join(', ')}`, 
      recommendations, 
      severity, 
      followUpRequired, 
      confidenceReasons: ['Rule-based analysis applied', 'Image labels processed', 'Clinical context considered'] 
    };
  }

  isAvailable(): boolean { 
    return this.isInitialized; 
  }

  getStatus() { 
    return { 
      isInitialized: this.isInitialized, 
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID, 
      location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1' 
    }; 
  }
}

export const vertexAIService = new VertexAIService();
