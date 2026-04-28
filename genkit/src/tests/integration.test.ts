// src/tests/integration.test.ts
import { documentService } from '../services/documentService.js';
import { ingestDocumentFlow } from '../flows/ingestDocument.js';
import { diagnosticAnalysisFlow } from '../flows/diagnostic.js';
import { runFlow } from '@genkit-ai/flow';

async function testIntegration() {
  try {
    console.log('Initializing document service...');
    await documentService.initializeSchema();

    console.log('\nTesting document ingestion...');
    const testDoc = {
      title: 'Malaria Diagnosis Guidelines',
      content: `Malaria is diagnosed through microscopic examination of blood films or with antigen-based rapid diagnostic tests. 
                The presence of Plasmodium parasites in the blood indicates infection. Treatment depends on the species and severity.`,
      source: 'WHO Guidelines 2023',
    };
   
    console.log('\nTesting diagnostic flow...');
    const result = await runFlow(diagnosticAnalysisFlow, {
      query: 'How is malaria diagnosed?',
      // Remove or add imageBase64 if you have an image
    });

    console.log('\nDiagnostic result:');
    console.log('Finding:', result.finding);
    console.log('Confidence:', result.confidence);
    console.log('Advice:', result.groundedAdvice);
    console.log('Sources:', result.sources.map((s: { title: string }) => s.title));

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testIntegration();
