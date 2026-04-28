import request from 'supertest';
import express from 'express';
import { DocumentService } from '../../services/documentService.js';
import { documentRoutes } from '../../routes/documentRoutes.js';

describe('Documents API', () => {
  let app: express.Express;
  let documentService: jest.Mocked<DocumentService>;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api', documentRoutes);
  });

  beforeEach(() => {
    documentService = {
      initializeSchema: jest.fn(),
      ingestDocument: jest.fn(),
      searchDocuments: jest.fn(),
      getDocument: jest.fn(),
      deleteDocument: jest.fn(),
    } as any;
  });

  describe('POST /api/documents', () => {
    it('should upload and process a document', async () => {
      const mockFile = {
        originalname: 'test.pdf',
        path: '/tmp/test.pdf',
        mimetype: 'application/pdf',
      };

      const mockResult = { id: 'test-id' };
      documentService.ingestDocument.mockResolvedValue(mockResult.id);

      const response = await request(app)
        .post('/api/documents')
        .attach('file', Buffer.from('test'), 'test.pdf')
        .expect(200);

      expect(response.body).toHaveProperty('id', mockResult.id);
    });
  });

  // Add more test cases for other endpoints...
});