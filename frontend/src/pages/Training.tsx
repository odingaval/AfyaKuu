import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  List,
  Divider,
  Avatar,
  Chip,
  Alert,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
} from '@mui/material';
import { School, Send, Person, LocalHospital, Assignment, TrendingUp, CheckCircle, Warning } from '@mui/icons-material';
import Grid from '@mui/material/Grid2';
import api from '../services/api';

interface Message {
  text: string;
  sender: 'nurse' | 'patient' | 'system';
}

interface Evaluation {
  score: number;
  feedback: string;
  missedSteps: string[];
  strengths: string[];
}

interface Case {
  id: string;
  title: string;
  description: string;
}

const Training: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [evaluating, setEvaluating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const cases: Case[] = [
    { id: 'malaria_01', title: 'Fever in Taita Taveta', description: 'A 28-year-old farmer with severe fatigue and high fever.' },
    { id: 'pneumonia_child', title: 'Pediatric Distress', description: 'A 3-year-old child with persistent cough and fast breathing.' },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const startTraining = (caseId: string) => {
    setSelectedCase(caseId);
    setMessages([
      { text: `SYSTEM: Virtual Case ${caseId.toUpperCase()} Initialized. Proceed with triage.`, sender: 'system' },
      { text: "Jambo nurse. I am not feeling very well today...", sender: 'patient' }
    ]);
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !selectedCase) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { text: userMessage, sender: 'nurse' }]);
    setLoading(true);

    try {
      const response = await api.post('/train/chat', { message: userMessage, caseId: selectedCase });
      setMessages(prev => [...prev, { text: response.data.reply, sender: 'patient' }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "Connection error with training engine.", sender: 'system' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async () => {
    setEvaluating(true);
    try {
      const response = await api.post('/train/evaluate', {
        history: messages,
        notes: notes,
        caseId: selectedCase
      });
      setEvaluation(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, height: 'calc(100vh - 100px)' }}>
      <Box mb={4}>
        <Typography variant="h3" className="gradient-text" sx={{ fontWeight: 900 }}>Clinical Trainer</Typography>
        <Typography variant="body1" color="text.secondary">Master localized triage protocols through simulated patient interactions.</Typography>
      </Box>

      {!selectedCase ? (
        <Fade in>
          <Box>
            <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>Select a Training Scenario</Typography>
            <Grid container spacing={3}>
              {cases.map((c) => (
                <Grid size={{ xs: 12, md: 6 }} key={c.id}>
                  <Paper 
                    sx={{ 
                      p: 4, borderRadius: 4, cursor: 'pointer', transition: 'all 0.2s',
                      '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' }
                    }}
                    onClick={() => startTraining(c.id)}
                  >
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar sx={{ bgcolor: 'primary.light' }}><LocalHospital /></Avatar>
                      <Typography variant="h6" fontWeight={700}>{c.title}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>{c.description}</Typography>
                    <Button variant="outlined" fullWidth sx={{ borderRadius: 3 }}>Start Case</Button>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        </Fade>
      ) : (
        <Grid container spacing={4} sx={{ height: 'calc(100% - 100px)' }}>
          {/* Chat Panel */}
          <Grid size={{ xs: 12, lg: 8 }} sx={{ height: '100%' }}>
            <Paper elevation={0} sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
              <Box sx={{ p: 3, bgcolor: 'white', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main' }}><Person /></Avatar>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800}>{cases.find(c => c.id === selectedCase)?.title}</Typography>
                    <Typography variant="caption" color="success.main" fontWeight={800}>LIVE SIMULATION</Typography>
                  </Box>
                </Box>
                <Button size="small" color="error" onClick={() => setSelectedCase(null)}>End Session</Button>
              </Box>

              <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 4, bgcolor: '#fcfcfd' }}>
                <List sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {messages.map((msg, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        alignSelf: msg.sender === 'nurse' ? 'flex-end' : msg.sender === 'system' ? 'center' : 'flex-start',
                        maxWidth: msg.sender === 'system' ? '100%' : '80%',
                      }}
                    >
                      {msg.sender === 'system' ? (
                        <Alert severity="info" sx={{ borderRadius: 3, py: 0.5, border: 'none', bgcolor: 'rgba(0,0,0,0.03)' }}>{msg.text}</Alert>
                      ) : (
                        <Box sx={{ 
                          p: 2.5, 
                          borderRadius: msg.sender === 'nurse' ? '24px 24px 4px 24px' : '24px 24px 24px 4px',
                          bgcolor: msg.sender === 'nurse' ? 'primary.main' : 'white',
                          color: msg.sender === 'nurse' ? 'white' : 'text.primary',
                          boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
                          border: msg.sender === 'nurse' ? 'none' : '1px solid rgba(0,0,0,0.03)'
                        }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>{msg.text}</Typography>
                        </Box>
                      )}
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </List>
              </Box>

              <Box sx={{ p: 3, bgcolor: 'white', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <Box display="flex" gap={2}>
                  <TextField
                    fullWidth
                    placeholder="Interview the patient..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    disabled={loading}
                    variant="outlined"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4, bgcolor: '#f8fafc' } }}
                  />
                  <Button 
                    variant="contained" 
                    onClick={handleSend} 
                    disabled={loading || !input}
                    sx={{ borderRadius: 4, px: 4, minWidth: 100 }}
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : <Send />}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Clinical Workspace */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box display="flex" alignItems="center" gap={1} mb={3}>
                <Assignment color="primary" />
                <Typography variant="h6" fontWeight={800}>Clinical Observation</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Document your findings here. These will be used for your final performance evaluation.
              </Typography>
              <TextField 
                multiline 
                rows={12} 
                fullWidth 
                placeholder="E.g. Fever 38.5C, Respiratory rate elevated, Patient reports chills..." 
                variant="outlined" 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3, bgcolor: '#fcfcfd' }, flexGrow: 1, mb: 3 }} 
              />
              <Button 
                fullWidth 
                variant="contained" 
                size="large"
                startIcon={evaluating ? <CircularProgress size={20} color="inherit" /> : <TrendingUp />}
                onClick={handleEvaluate}
                disabled={evaluating || messages.length < 4}
                sx={{ py: 2, borderRadius: 4, fontWeight: 800, bgcolor: 'primary.dark' }}
              >
                {evaluating ? 'Analyzing Performance...' : 'Submit Case for Review'}
              </Button>
              {messages.length < 4 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Complete more of the interview before submitting.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Evaluation Results Modal */}
      <Dialog open={!!evaluation} onClose={() => setEvaluation(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 6 } }}>
        <DialogTitle sx={{ p: 4, pb: 0 }}>
          <Typography variant="h4" fontWeight={900}>Simulation Result</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {evaluation && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h2" color="primary" fontWeight={900}>{evaluation.score}%</Typography>
                <Typography variant="overline" color="text.secondary" fontWeight={800}>OVERALL COMPETENCY</Typography>
                <LinearProgress variant="determinate" value={evaluation.score} sx={{ height: 10, borderRadius: 5, mt: 2 }} />
              </Box>

              <Typography variant="h6" fontWeight={800} gutterBottom>Supervisor Feedback</Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'text.secondary', lineHeight: 1.6 }}>{evaluation.feedback}</Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="success.main" fontWeight={800} sx={{ mb: 1 }}>STRENGTHS</Typography>
                  <List dense>
                    {evaluation.strengths.map((s, i) => (
                      <Box key={i} display="flex" gap={1} mb={1}>
                        <CheckCircle sx={{ fontSize: 16, color: 'success.main', mt: 0.3 }} />
                        <Typography variant="caption" fontWeight={600}>{s}</Typography>
                      </Box>
                    ))}
                  </List>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" color="warning.main" fontWeight={800} sx={{ mb: 1 }}>AREAS FOR IMPROVEMENT</Typography>
                  <List dense>
                    {evaluation.missedSteps.map((m, i) => (
                      <Box key={i} display="flex" gap={1} mb={1}>
                        <Warning sx={{ fontSize: 16, color: 'warning.main', mt: 0.3 }} />
                        <Typography variant="caption" fontWeight={600}>{m}</Typography>
                      </Box>
                    ))}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 4, pt: 0 }}>
          <Button fullWidth variant="contained" size="large" sx={{ borderRadius: 4, py: 1.5 }} onClick={() => { setEvaluation(null); setSelectedCase(null); setMessages([]); setNotes(''); }}>
            Finish Training
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Training;
