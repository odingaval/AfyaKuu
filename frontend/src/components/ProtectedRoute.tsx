// frontend/src/components/ProtectedRoute.tsx

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute - User:', user, 'Loading:', loading);

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 2 }}>
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    console.log('No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('User authenticated, showing protected content');
  return <Outlet />;
};

export default ProtectedRoute;
