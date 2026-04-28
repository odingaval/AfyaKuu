// src/routes/documentRoutes.ts
import * as fs from 'fs';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { documentService } from '../services/documentService.js';
import { documentProcessor } from '../services/documentProcessor.js';
import { ProcessedDocument } from '../services/documentProcessor.js';
import winston from 'winston';

const router = Router();
const upload = multer({ dest: 'uploads/' });

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Initialize document processor
documentProcessor.initialize().catch(err => {
  console.error('Failed to initialize document processor:', err);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', async () => {
  await documentProcessor.cleanup();
  process.exit(0);
});

// Upload and process document
router.post('/documents', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { title, source } = req.body;
    const filePath = req.file.path;

    try {
      // Process the document
      const processedDoc = await documentProcessor.processDocument(filePath, {
        title: title || req.file.originalname,
        source: source || 'file-upload'
      });

      // Store in Weaviate
      const docId = await documentService.ingestDocument(processedDoc);
      
      // Clean up the uploaded file
      fs.unlinkSync(filePath);

      res.status(201).json({
        id: docId,
        title: processedDoc.title,
        source: processedDoc.source,
        metadata: processedDoc.metadata
      });
    } catch (error) {
      // Clean up the uploaded file in case of error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error;
    }
  } catch (error) {
    winston.error('Error uploading document', { error });
    res.status(500).json({ error: 'Failed to process document', details: getErrorMessage(error) });
  }
});

// Get all documents
router.get('/documents', async (req: Request, res: Response) => {
  try {
    // This is a simplified example - you might want to add pagination
    const query = req.query.query as string;
    const documents = query 
      ? await documentService.searchDocuments(query)
      : await documentService.searchDocuments('', 100); // Get all documents if no query
    
    res.json(documents);
  } catch (error) {
    winston.error('Error fetching documents', { error });
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Get document by ID
router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const document = await documentService.getDocument(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error) {
    winston.error('Error fetching document', { id: req.params.id, error });
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// Delete document
router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    // Note: You'll need to implement deleteDocument in documentService
    await documentService.deleteDocument(req.params.id);
    res.status(204).send();
  } catch (error) {
    winston.error('Error deleting document', { id: req.params.id, error });
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// Search documents
router.post('/documents/search', async (req: Request, res: Response) => {
  try {
    const { query, limit = 10, filters } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const results = await documentService.searchDocuments(query, limit);
    res.json(results);
  } catch (error) {
    winston.error('Error searching documents', { error });
    res.status(500).json({ error: 'Search failed', details: getErrorMessage(error) });
  }
});

export default router;