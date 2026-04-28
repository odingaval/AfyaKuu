import React from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Typography, Divider, AppBar, Toolbar, Tooltip, Chip, Avatar, Paper } from '@mui/material';
import { MedicalServices, School, LibraryBooks } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 240;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Diagnostics', icon: <MedicalServices />, path: '/' },
    { text: 'Case Trainer', icon: <School />, path: '/training' },
    { text: 'Knowledge Base', icon: <LibraryBooks />, path: '/protocols' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center">
            <Typography variant="h5" component="div" sx={{ fontWeight: 800, color: 'primary.main', display: 'flex', alignItems: 'center' }}>
              AfyaKuu
              <Box component="span" sx={{ ml: 1, fontSize: '0.6rem', px: 1, py: 0.2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
                EDGE AI
              </Box>
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="Local Diagnostics Active">
              <Chip icon={<Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#4caf50', mr: 1 }} />} label="Offline Sync: ON" size="small" variant="outlined" />
            </Tooltip>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', fontSize: '0.8rem' }}>DR</Avatar>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(0,0,0,0.05)',
            bgcolor: 'background.default'
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', p: 2 }}>
          <List sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton 
                  onClick={() => navigate(item.path)}
                  selected={location.pathname === item.path}
                  sx={{
                    borderRadius: 2,
                    '&.Mui-selected': {
                      bgcolor: 'rgba(0, 121, 107, 0.08)',
                      color: 'primary.main',
                      '&:hover': { bgcolor: 'rgba(0, 121, 107, 0.12)' },
                      '& .MuiListItemIcon-root': { color: 'primary.main' }
                    },
                    py: 1.5
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ fontWeight: location.pathname === item.path ? 700 : 500 }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 3 }} />
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 3 }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={700}>System Health</Typography>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
              <Typography variant="caption">Ollama: Connected</Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main' }} />
              <Typography variant="caption">Model: Gemma 2B Active</Typography>
            </Box>
          </Paper>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;