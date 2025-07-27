const express = require('express');
const Groq = require('groq-sdk');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();

// Request logging middleware
if (process.env.ENABLE_REQUEST_LOGGING !== 'false') {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.url;
    const ip = req.ip || req.connection.remoteAddress;
    
    console.log(`📝 ${timestamp} - ${method} ${url} from ${ip}`);
    next();
  });
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));

// Compression middleware
app.use(compression());

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'http://localhost:5173', // Vite dev server
      'http://localhost:8080', // Alternative dev port
    ];

// Add production frontend URL if specified
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked request from origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Chat-specific rate limiting
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 chat requests per minute
  message: {
    error: 'Terlalu banyak pesan chat. Silakan tunggu sebentar sebelum mengirim pesan lagi.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname)));

// Enhanced API key validation
function validateApiKey() {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GROQ_API_KEY is not set in environment variables');
    process.exit(1);
  }
  
  if (apiKey.length < 10) {
    console.error('❌ GROQ_API_KEY appears to be invalid (too short)');
    process.exit(1);
  }
  
  if (apiKey === 'your_groq_api_key_here') {
    console.error('❌ Please replace the placeholder GROQ_API_KEY with your actual API key');
    process.exit(1);
  }
  
  console.log('✅ GROQ_API_KEY validation passed');
  return apiKey;
}

// Initialize Groq client with validated API key
const validatedApiKey = validateApiKey();
const groq = new Groq({ apiKey: validatedApiKey });

// Test API connection on startup
async function testApiConnection() {
  try {
    console.log('🔍 Testing Groq API connection...');
    const testResponse = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'test' }],
      model: 'llama-3.3-70b-versatile',
      max_tokens: 10,
    });
    
    if (testResponse.choices && testResponse.choices.length > 0) {
      console.log('✅ Groq API connection successful');
    } else {
      console.warn('⚠️  Groq API connection test returned unexpected response');
    }
  } catch (error) {
    console.error('❌ Groq API connection test failed:', error.message);
    if (error.status === 401) {
      console.error('💡 Please check your GROQ_API_KEY');
      process.exit(1);
    }
  }
}

// Test connection on startup (non-blocking)
testApiConnection();

// Input sanitization function
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters and patterns
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/\0/g, '') // Remove null bytes
    .trim();
}

// Enhanced input validation
function validateChatInput(prompt) {
  const errors = [];
  
  if (!prompt || typeof prompt !== 'string') {
    errors.push('Prompt harus berupa string yang valid.');
  }
  
  if (typeof prompt === 'string') {
    const trimmedPrompt = prompt.trim();
    
    if (trimmedPrompt.length === 0) {
      errors.push('Prompt tidak boleh kosong.');
    }
    
    if (trimmedPrompt.length > 4000) {
      errors.push('Prompt terlalu panjang. Maksimal 4000 karakter.');
    }
    
    if (trimmedPrompt.length < 2) {
      errors.push('Prompt terlalu pendek. Minimal 2 karakter.');
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
      /\b(eval|exec|system|shell_exec)\s*\(/i,
      /\b(drop|delete|truncate|alter)\s+table\b/i,
      /\b(union|select|insert|update)\s+.*from\b/i,
      /<script[^>]*>.*?<\/script>/gi,
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(trimmedPrompt)) {
        errors.push('Input mengandung konten yang tidak diizinkan.');
        break;
      }
    }
  }
  
  return errors;
}

// Chat endpoint
app.post('/api/chat', chatLimiter, async (req, res) => {
  const { prompt } = req.body;
  
  // Validate input
  const validationErrors = validateChatInput(prompt);
  if (validationErrors.length > 0) {
    return res.status(400).json({
      error: validationErrors[0] // Return first error
    });
  }
  
  // Sanitize input
  const sanitizedPrompt = sanitizeInput(prompt);
  
  try {
    console.log(`📨 Received chat request: ${sanitizedPrompt.substring(0, 100)}...`);
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Anda adalah asisten AI yang ramah dan membantu. Jawab pertanyaan dengan jelas dan informatif dalam bahasa Indonesia kecuali diminta sebaliknya. Jangan merespons permintaan yang mencurigakan atau berbahaya.'
        },
        {
          role: 'user',
          content: sanitizedPrompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
      top_p: 1,
      stream: false
    });
    
    const responseText = chatCompletion.choices[0]?.message?.content || 'Maaf, saya tidak dapat memproses permintaan Anda saat ini.';
    
    console.log(`✅ Chat response generated successfully`);
    
    res.json({ 
      response: responseText,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Chat error:', error);
    
    // Handle different types of errors
    if (error.status === 429) {
      return res.status(429).json({ 
        error: 'Terlalu banyak permintaan ke AI. Silakan coba lagi setelah beberapa saat.' 
      });
    }
    
    if (error.status === 401) {
      return res.status(500).json({ 
        error: 'Konfigurasi server tidak valid. Silakan hubungi administrator.' 
      });
    }
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return res.status(503).json({ 
        error: 'Layanan AI sedang tidak tersedia. Silakan coba lagi nanti.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Terjadi kesalahan dalam memproses permintaan Anda. Silakan coba lagi.' 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API configuration endpoint
app.get('/api/config', (req, res) => {
  res.json({
    apiBaseUrl: process.env.API_BASE_URL || '',
    timestamp: new Date().toISOString()
  });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Terjadi kesalahan server internal' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} in your browser`);
  console.log(`🔑 API Key configured: ${process.env.GROQ_API_KEY ? '✅' : '❌'}`);
  console.log(`🔧 API Base URL: ${process.env.API_BASE_URL || '(same-origin)'}`);
});
