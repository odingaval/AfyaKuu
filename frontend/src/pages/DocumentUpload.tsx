// frontend/src/pages/DocumentUpload.tsx
import React, { useState } from 'react';
import { Box, Typography, Button, Paper, LinearProgress, Alert } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';
import api from '../services/api';

// Create a document service that uses the default api export
const documentService = {
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/documents/upload', formData); // Example endpoint
  },
};

const DocumentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      
      await documentService.uploadDocument(file);
      
      setSuccess(true);
      setFile(null);
      // Clear file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      setError('Upload failed. Please try again.');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Upload Document
      </Typography>

      <Paper
        variant="outlined"
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: 'divider',
          textAlign: 'center',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
          },
        }}
      >
        <input
          id="file-upload"
          type="file"
          accept=".pdf,.docx,.doc"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        <label htmlFor="file-upload">
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            p={3}
            sx={{ cursor: 'pointer' }}
          >
            <CloudUpload fontSize="large" color="action" sx={{ mb: 2 }} />
            <Typography variant="h6">
              {file ? file.name : 'Click to select a file or drag and drop'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              PDF, DOCX, or DOC files up to 10MB
            </Typography>
          </Box>
        </label>
      </Paper>

      {file && (
        <Box mt={2}>
          <Typography variant="subtitle1" gutterBottom>
            Selected file: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpload}
            disabled={uploading}
            fullWidth
            sx={{ mt: 2 }}
          >
            {uploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </Box>
      )}

      {uploading && <LinearProgress sx={{ mt: 2 }} />}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          Document uploaded successfully!
        </Alert>
      )}
    </Box>
  );
};

export default DocumentUpload;