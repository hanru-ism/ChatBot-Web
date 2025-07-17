const express = require('express');
const Groq = require('groq-sdk');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL 
    : ['http://localhost:3000', 'http://localhost:3005', 'http://127.0.0.1:3000', 'http://127.0.0.1:3005', 'http://10.176.120.164:3005', 'http://10.176.120.164:3000'],
  credentials: false
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

// Initialize Groq client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Validate API key
if (!process.env.GROQ_API_KEY) {
  console.error('❌ GROQ_API_KEY is not set in environment variables');
  process.exit(1);
}

// Chat endpoint
app.post('/chat', chatLimiter, async (req, res) => {
  const { prompt } = req.body;
  
  // Validate input
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ 
      error: 'Prompt harus berupa string yang valid.' 
    });
  }
  
  if (prompt.trim().length === 0) {
    return res.status(400).json({ 
      error: 'Prompt tidak boleh kosong.' 
    });
  }
  
  if (prompt.length > 4000) {
    return res.status(400).json({ 
      error: 'Prompt terlalu panjang. Maksimal 4000 karakter.' 
    });
  }
  
  try {
    console.log(`📨 Received chat request: ${prompt.substring(0, 100)}...`);
    
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Anda adalah asisten AI yang ramah dan membantu. Jawab pertanyaan dengan jelas dan informatif dalam bahasa Indonesia kecuali diminta sebaliknya.'
        },
        { 
          role: 'user', 
          content: prompt 
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
});
