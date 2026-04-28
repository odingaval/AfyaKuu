// frontend/src/pages/DocumentView.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Chip,
  IconButton,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import api from '../services/api';

interface Document {
  id: string;
  title: string;
  content: string;
  source: string;
  createdAt: string;
  updatedAt: string;
  metadata: {
    pages?: number;
    format: string;
    size: number;
  };
}

const DocumentView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        const response = await api.get(`/documents/${id}`);
        setDocument(response.data);
      } catch (err) {
        setError('Failed to load document');
        console.error('Error fetching document:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !document) {
    return (
      <Box textAlign="center" mt={4}>
        <Typography color="error">{error || 'Document not found'}</Typography>
        <Button variant="contained" onClick={() => navigate('/')} sx={{ mt: 2 }}>
          Back to Dashboard
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4">{document.title}</Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" gap={2} mb={2} flexWrap="wrap">
          <Chip
            label={`Source: ${document.source}`}
            variant="outlined"
            size="small"
          />
          <Chip
            label={`Format: ${document.metadata.format.toUpperCase()}`}
            variant="outlined"
            size="small"
          />
          {document.metadata.pages && (
            <Chip
              label={`${document.metadata.pages} pages`}
              variant="outlined"
              size="small"
            />
          )}
          <Chip
            label={`${(document.metadata.size / 1024).toFixed(2)} KB`}
            variant="outlined"
            size="small"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box
          component="pre"
          sx={{
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            p: 2,
            bgcolor: 'background.default',
            borderRadius: 1,
            maxHeight: '60vh',
            overflow: 'auto',
          }}
        >
          {document.content}
        </Box>

        <Box mt={2} display="flex" justifyContent="space-between">
          <Typography variant="caption" color="textSecondary">
            Created: {new Date(document.createdAt).toLocaleString()}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            Updated: {new Date(document.updatedAt).toLocaleString()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default DocumentView;