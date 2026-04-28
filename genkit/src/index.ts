import mongoose from 'mongoose';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import documentRoutes from './routes/documentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import diagnosticRoutes from './routes/diagnosticRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error(`Missing required environment variables: ${missingVars.join(', ')}`);
  process.exit(1);
}

const app = express();
const port = 3001; // Changed to 3001 to avoid conflicts

// Middleware
const corsOptions = {
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', documentRoutes);
app.use('/api/diagnostic', diagnosticRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handling middleware
app.use(errorHandler);

// Initialize services
async function initializeApp() {
  try {
    // MongoDB connection options
    const mongooseOptions = {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000
    };

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!, mongooseOptions as any);
    console.log('Connected to MongoDB');

    // Start the server
    const server = app.listen(port, () => {
      console.log(`Server running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.syscall !== 'listen') {
        throw error;
      }

      switch (error.code) {
        case 'EACCES':
          console.error(`Port ${port} requires elevated privileges`);
          process.exit(1);
        case 'EADDRINUSE':
          console.error(`Port ${port} is already in use`);
          process.exit(1);
        default:
          throw error;
      }
    });

    // Graceful shutdown
    const gracefulShutdown = async () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      
      // Close the server first
      server.close(async () => {
        console.log('Server closed');
        
        try {
          // Close MongoDB connection
          await mongoose.connection.close();
          console.log('MongoDB connection closed');
          process.exit(0);
        } catch (err) {
          console.error('Error closing MongoDB connection:', err);
          process.exit(1);
        }
      });
    };

    // Handle termination signals
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

  } catch (error) {
    console.error('Failed to start the application:', error);
    process.exit(1);
  }
}

initializeApp();

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Consider whether to exit here or not
  // process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Consider whether to exit here or not
  // process.exit(1);
});