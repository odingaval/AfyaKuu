// frontend/src/pages/Dashboard.tsx
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, 
  Typography, 
  Button, 
  Container, 
  Paper, 
  Avatar, 
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import { 
  Logout as LogoutIcon,
  Email as EmailIcon,
  Person as PersonIcon,
  MedicalServices as MedicalServicesIcon,
  Dashboard as DashboardIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h6">Loading user data...</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* User Profile Card */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={3}>
            <CardContent sx={{ textAlign: 'center', p: 4 }}>
              <Avatar 
                sx={{ 
                  width: 100, 
                  height: 100, 
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2.5rem'
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </Avatar>
              <Typography variant="h5" component="h1" gutterBottom>
                {user.name || 'User'}
              </Typography>
              <Typography color="text.secondary" gutterBottom>
                {user.role || 'User'}
              </Typography>
              
              <List sx={{ mt: 2, textAlign: 'left' }}>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <EmailIcon color="action" />
                  </ListItemIcon>
                  <ListItemText primary={user.email} />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <PersonIcon color="action" />
                  </ListItemIcon>
                  <ListItemText primary={`@${user.username || 'user'}`} />
                </ListItem>
              </List>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                fullWidth
                sx={{ mt: 2 }}
              >
                Logout
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Main Content */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
            <Box display="flex" alignItems="center" mb={3}>
              <DashboardIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" component="h2">
                Dashboard Overview
              </Typography>
            </Box>
            
            <Typography variant="body1" paragraph>
              Welcome back to your AfyaLens dashboard. Here you can manage your health records, 
              schedule appointments, and access medical services.
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <MedicalServicesIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="div">
                        Health Records
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      View and manage your medical history and test results.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <MedicalServicesIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="div">
                        Appointments
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Schedule and manage your doctor appointments.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={1}>
                      <MedicalServicesIcon color="primary" sx={{ mr: 1 }} />
                      <Typography variant="h6" component="div">
                        Prescriptions
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      View and refill your prescriptions.
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Recent Activity Section */}
          <Paper elevation={3} sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Typography color="text.secondary">
              No recent activity to display.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;