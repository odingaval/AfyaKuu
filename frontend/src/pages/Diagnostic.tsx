import React, { useState, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  IconButton,
  Fade,
  Zoom,
} from '@mui/material';
import { CloudUpload, CameraAlt, Search, History, CheckCircle, Warning, Info, DeleteOutline } from '@mui/icons-material';
import Grid from '@mui/material/Grid2';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import CameraCapture from '../components/CameraCapture';

interface Source {
  id: string;
  title: string;
  content: string;
  distance?: number;
}

interface DiagnosticResult {
  finding: string;
  confidence: number;
  groundedAdvice: string;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  followUpRequired: boolean;
  sources: Source[];
  processingTime: number;
  disclaimer: string;
}

const Diagnostic: React.FC = () => {
  
  const [query, setQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = (image: string) => {
    setSelectedImage(image);
  };

  const handleAnalyze = async () => {
    if (!query.trim()) {
      setError('Please enter a diagnostic query');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post('/diagnostic/analyze', {
        query: query.trim(),
        imageBase64: selectedImage,
      });

      setResult(response.data);
    } catch (err: any) {
      console.error('Diagnostic analysis error:', err);
      setError(err.response?.data?.error || 'Analysis failed. Please check if local LLM is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={6} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
        <Typography variant="h2" className="gradient-text" sx={{ fontWeight: 900, mb: 1, letterSpacing: '-0.02em' }}>
          Diagnostic Intelligence
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, fontWeight: 400 }}>
          Offline-first clinical decision support powered by Gemma 2B and local medical protocols.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Input Section */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 4, 
              borderRadius: 6, 
              bgcolor: 'white', 
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.05)'
            }}
          >
            <Box display="flex" alignItems="center" gap={1.5} mb={4}>
              <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 2, display: 'flex' }}>
                <Search sx={{ color: 'primary.main' }} />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>New Case Analysis</Typography>
            </Box>

            <TextField
              label="Patient Symptoms & History"
              multiline
              rows={6}
              variant="outlined"
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 45yo male, high fever for 3 days, cough, chest pain..."
              sx={{ 
                mb: 4, 
                '& .MuiOutlinedInput-root': { 
                  borderRadius: 4,
                  bgcolor: '#fcfcfd',
                  '&:hover fieldset': { borderColor: 'primary.main' }
                } 
              }}
            />

            {/* Enhanced File Upload / Drag & Drop */}
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={isDragging ? 'drop-zone-active' : ''}
              sx={{
                border: '2px dashed',
                borderColor: isDragging ? 'primary.main' : 'rgba(0,0,0,0.1)',
                borderRadius: 4,
                p: selectedImage ? 2 : 4,
                textAlign: 'center',
                mb: 4,
                transition: 'all 0.2s ease-in-out',
                bgcolor: isDragging ? 'rgba(37, 99, 235, 0.02)' : 'transparent',
                cursor: 'pointer',
                position: 'relative'
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileChange}
              />

              {!selectedImage ? (
                <Box onClick={() => fileInputRef.current?.click()}>
                  <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Drop lab results or photos here
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    or click to browse files
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ position: 'relative' }}>
                  <img 
                    src={selectedImage} 
                    alt="Clinical data" 
                    style={{ width: '100%', borderRadius: '12px', maxHeight: 250, objectFit: 'contain' }} 
                  />
                  <IconButton 
                    onClick={() => setSelectedImage(null)}
                    sx={{ 
                      position: 'absolute', top: 8, right: 8, 
                      bgcolor: 'rgba(255,255,255,0.9)', 
                      '&:hover': { bgcolor: 'error.main', color: 'white' } 
                    }}
                  >
                    <DeleteOutline />
                  </IconButton>
                </Box>
              )}
            </Box>

            <Box display="flex" gap={2} mb={4}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<CameraAlt />}
                onClick={() => setIsCameraOpen(true)}
                sx={{ borderRadius: 4, py: 1.5, bgcolor: '#f1f5f9', color: '#475569', fontWeight: 600, border: 'none' }}
              >
                Use Camera
              </Button>
            </Box>

            <Button 
              variant="contained" 
              fullWidth 
              size="large"
              startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <Search sx={{ fontSize: 28 }} />} 
              onClick={handleAnalyze} 
              disabled={loading || !query}
              sx={{ 
                py: 2.5, 
                borderRadius: 4, 
                fontSize: '1.2rem', 
                fontWeight: 800,
                boxShadow: '0 12px 24px -6px rgba(37, 99, 235, 0.4)',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 15px 30px -6px rgba(37, 99, 235, 0.5)' },
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'AI Inference in Progress...' : 'Run Diagnostics'}
            </Button>

            {error && (
              <Fade in>
                <Alert 
                  severity="error" 
                  variant="filled"
                  sx={{ mt: 3, borderRadius: 3, fontWeight: 600 }}
                >
                  {error}
                </Alert>
              </Fade>
            )}
          </Paper>
        </Grid>

        {/* Results Section */}
        <Grid size={{ xs: 12, lg: 7 }}>
          {loading && !result && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 8 }}>
              <Box className="animate-pulse-slow" sx={{ position: 'relative', mb: 4 }}>
                <CircularProgress size={100} thickness={2} sx={{ color: 'primary.light' }} />
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                  <Search sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>
              </Box>
              <Typography variant="h5" fontWeight={700} gutterBottom>Consulting Local RAG...</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Processing query through offline Gemma 2B model using localized MoH protocols.
              </Typography>
            </Box>
          )}

          {result ? (
            <Zoom in>
              <Paper elevation={0} sx={{ p: 5, borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 20px 50px -10px rgba(0,0,0,0.1)', position: 'relative', overflow: 'hidden' }}>
                <Box 
                  sx={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: 8,
                    bgcolor: result.severity === 'critical' ? '#ef4444' : 
                             result.severity === 'high' ? '#f59e0b' : 
                             result.severity === 'medium' ? '#3b82f6' : '#10b981'
                  }} 
                />
                
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={5}>
                  <Box>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <History sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="overline" color="text.secondary" fontWeight={800} letterSpacing="0.1em">
                        ANALYSIS REPORT
                      </Typography>
                    </Box>
                    <Typography variant="h3" color="text.primary" fontWeight={900} sx={{ letterSpacing: '-0.03em' }}>
                      {result.finding}
                    </Typography>
                  </Box>
                  <Chip 
                    label={result.severity.toUpperCase()} 
                    icon={result.severity === 'critical' ? <Warning /> : <CheckCircle />}
                    sx={{ 
                      fontWeight: 900, px: 2, py: 3, borderRadius: 3,
                      bgcolor: result.severity === 'critical' ? '#fee2e2' : 
                               result.severity === 'high' ? '#fef3c7' : 
                               result.severity === 'medium' ? '#dbeafe' : '#d1fae5',
                      color: result.severity === 'critical' ? '#b91c1c' : 
                             result.severity === 'high' ? '#b45309' : 
                             result.severity === 'medium' ? '#1d4ed8' : '#047857',
                    }} 
                  />
                </Box>

                <Grid container spacing={4} sx={{ mb: 5 }}>
                  <Grid size={{ xs: 12, md: 4 }}>
                    <Box sx={{ p: 3, textAlign: 'center', borderRadius: 4, bgcolor: '#f8fafc', border: '1px inset rgba(0,0,0,0.02)' }}>
                      <Typography variant="h2" color="primary" fontWeight={900} sx={{ mb: -1 }}>{result.confidence}%</Typography>
                      <Typography variant="caption" color="text.secondary" fontWeight={800}>CONFIDENCE SCORE</Typography>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12, md: 8 }}>
                    <Typography variant="h6" gutterBottom fontWeight={800} display="flex" alignItems="center" gap={1}>
                      <Info sx={{ color: 'primary.main', fontSize: 20 }} />
                      Clinical Reasoning
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#334155', lineHeight: 1.8, fontSize: '1.05rem' }}>
                      {result.groundedAdvice}
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4, opacity: 0.6 }} />

                <Box mb={5}>
                  <Typography variant="h6" gutterBottom fontWeight={800} sx={{ mb: 3 }}>
                    Recommended Interventions
                  </Typography>
                  <Grid container spacing={2}>
                    {result.recommendations.map((rec, index) => (
                      <Grid size={{ xs: 12, md: 6 }} key={index}>
                        <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderStyle: 'dashed', height: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 900 }}>
                            {index + 1}
                          </Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                            {rec}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                <Box sx={{ p: 3, bgcolor: '#f1f5f9', borderRadius: 4, border: '1px solid rgba(0,0,0,0.05)' }}>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1, fontWeight: 800 }}>
                    GROUNDING SOURCES:
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {result.sources.map((source, i) => (
                      <Chip 
                        key={i} 
                        label={source.id} 
                        size="small" 
                        sx={{ bgcolor: 'white', fontWeight: 600, border: '1px solid rgba(0,0,0,0.1)' }} 
                      />
                    ))}
                    <Chip 
                      label="MoH Guidelines 2024" 
                      size="small" 
                      color="primary"
                      sx={{ fontWeight: 600 }} 
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block', fontStyle: 'italic', opacity: 0.7 }}>
                    {result.disclaimer}
                  </Typography>
                </Box>
              </Paper>
            </Zoom>
          ) : !loading && (
            <Fade in>
              <Paper 
                variant="outlined"
                sx={{ 
                  p: 10, 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  borderRadius: 6,
                  border: '2px dashed rgba(0,0,0,0.08)',
                  bgcolor: 'rgba(0,0,0,0.01)',
                  textAlign: 'center'
                }}
              >
                <Box sx={{ p: 4, borderRadius: '50%', bgcolor: 'white', mb: 3, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)' }}>
                  <Search sx={{ fontSize: 64, color: '#94a3b8' }} />
                </Box>
                <Typography variant="h4" color="text.primary" fontWeight={900} gutterBottom>Ready for Triage</Typography>
                <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400 }}>
                  Enter symptoms above or upload a clinical photo to generate a protocol-grounded diagnostic hypothesis.
                </Typography>
              </Paper>
            </Fade>
          )}
        </Grid>
      </Grid>

      <CameraCapture 
        open={isCameraOpen} 
        onClose={() => setIsCameraOpen(false)} 
        onCapture={handleCapture} 
      />
    </Container>
  );
};

export default Diagnostic;