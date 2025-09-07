const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const adminRoutes = require('./routes/admin');
const uploadRoutes = require('./routes/upload');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.log('MongoDB URI not provided, skipping database connection');
      return;
    }
    await mongoose.connect(mongoURI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    console.log('Continuing without database connection...');
  }
};

// Connect to database
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  // Development: Serve frontend via Vite
  const { createServer } = require('vite');
  const fs = require('fs');
  
  const setupVite = async () => {
    try {
      const vite = await createServer({
        server: { 
          middlewareMode: true,
          hmr: {
            port: 24678,
            host: '0.0.0.0'
          }
        },
        appType: 'spa',
        root: path.join(__dirname, '../client'),
        resolve: {
          alias: {
            "@": path.resolve(__dirname, "../client/src"),
            "@shared": path.resolve(__dirname, "../shared"),
            "@assets": path.resolve(__dirname, "../attached_assets"),
          },
        },
        define: {
          'process.env.NODE_ENV': '"development"'
        }
      });
      
      // Handle all non-API routes with React app BEFORE Vite middleware
      app.get('*', async (req, res, next) => {
        const url = req.originalUrl;
        
        // Skip API routes and static assets
        if (url.startsWith('/api') || url.startsWith('/uploads')) {
          return next();
        }
        
        try {
          // Read the index.html template
          let template = fs.readFileSync(
            path.resolve(__dirname, '../client/index.html'),
            'utf-8'
          );
          
          // Transform the template using Vite
          template = await vite.transformIndexHtml(url, template);
          
          res.status(200).set({ 'Content-Type': 'text/html' }).send(template);
        } catch (e) {
          console.error('Vite transform error:', e);
          vite.ssrFixStacktrace(e);
          next(e);
        }
      });
      
      app.use(vite.middlewares);
      
      console.log('Vite dev server middleware setup complete');
    } catch (error) {
      console.error('Failed to setup Vite:', error);
    }
  };
  
  setupVite();
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});