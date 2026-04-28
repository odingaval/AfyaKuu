import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Article } from '@mui/icons-material';
import Grid from '@mui/material/Grid2';

const Protocols: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [selectedProtocol, setSelectedProtocol] = React.useState<any>(null);

  const defaultProtocols = [
    { 
      title: "Malaria Protocol (Uncomplicated)", 
      content: "Artemether-Lumefantrine first-line for suspected uncomplicated malaria. Dosing twice daily for 3 days.", 
      fullContent: "Artemether-Lumefantrine (AL) is the first-line treatment for uncomplicated malaria in Kenya. Treatment should be administered over 3 days. Patient should be advised to take the second dose after 8 hours, then subsequent doses every 12 hours. If vomiting occurs within 30 minutes of taking the drug, a full dose should be repeated. Side effects include dizziness and headache.",
      category: "Infectious" 
    },
    { 
      title: "Tuberculosis Protocol", 
      content: "Chronic cough > 2 weeks. Collect sputum for GeneXpert. If positive, initiate 6-month intensive therapy.", 
      fullContent: "The standard treatment for drug-susceptible TB is a 6-month regimen: 2 months of Rifampicin, Isoniazid, Pyrazinamide, and Ethambutol (2RHZE), followed by 4 months of Rifampicin and Isoniazid (4RH). Monthly follow-ups are mandatory to monitor adherence and side effects such as peripheral neuropathy (provide Vitamin B6).",
      category: "Respiratory" 
    },
    { 
      title: "Pediatric Pneumonia", 
      content: "Identify fast breathing (RR > 50). Treat with Amoxicillin DT 250mg. Advise on red flags.", 
      fullContent: "Pneumonia in children should be classified as 'Severe' or 'Non-Severe'. Children with fast breathing but no chest indrawing should receive oral Amoxicillin (25mg/kg twice daily for 5 days). Review after 2 days. If condition worsens or danger signs (lethargy, inability to drink) appear, refer immediately.",
      category: "Pediatrics" 
    },
    { 
      title: "Cholera Management", 
      content: "Aggressive rehydration with ORS. If signs of shock, IV fluid resuscitation (RL). Zip of Zinc.", 
      fullContent: "Cholera treatment focuses on rapid rehydration. Plan A (Mild): ORS at home. Plan B (Moderate): 75ml/kg ORS over 4 hours in facility. Plan C (Severe): IV Ringer's Lactate 100ml/kg over 3-6 hours. Zinc 20mg daily for children for 10-14 days.",
      category: "Emergency" 
    }
  ];

  const handleOpen = (protocol: any) => {
    setSelectedProtocol(protocol);
    setOpen(true);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box mb={6} textAlign="center">
        <Typography variant="h2" color="primary.dark" fontWeight={800} gutterBottom>Medical Library</Typography>
        <Typography variant="h6" color="text.secondary">Access clinical guidelines and MoH updates offline.</Typography>
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 1 }}>
          <Chip label="All Guidelines" color="primary" />
          <Chip label="Emergency" variant="outlined" />
          <Chip label="Pediatrics" variant="outlined" />
        </Box>
      </Box>

      <Grid container spacing={4}>
        {defaultProtocols.map((protocol, index) => (
          <Grid key={index} size={{ xs: 12, md: 6, lg: 4 }}>
            <Paper 
              elevation={0} 
              sx={{ 
                p: 4, 
                height: '100%', 
                borderRadius: 4, 
                border: '1px solid rgba(0,0,0,0.05)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.05)'
                }
              }}
            >
              <Chip label={protocol.category} size="small" sx={{ mb: 2, bgcolor: 'rgba(0, 121, 107, 0.05)', color: 'primary.main', fontWeight: 700 }} />
              <Typography variant="h5" fontWeight={800} gutterBottom>{protocol.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {protocol.content}
              </Typography>
              <Button 
                endIcon={<Article />} 
                sx={{ fontWeight: 700, p: 0 }}
                onClick={() => handleOpen(protocol)}
              >
                View Full Protocol
              </Button>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Protocol Detail Modal */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
      >
        {selectedProtocol && (
          <>
            <DialogTitle sx={{ fontWeight: 800, color: 'primary.main' }}>
              {selectedProtocol.title}
            </DialogTitle>
            <DialogContent>
              <Chip label={selectedProtocol.category} size="small" sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ lineHeight: 1.8, color: '#334155' }}>
                {selectedProtocol.fullContent}
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button onClick={() => setOpen(false)} variant="contained" sx={{ borderRadius: 3 }}>
                Got it, Thanks
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};

export default Protocols;
