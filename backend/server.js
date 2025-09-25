const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// 🔧 Configuración COMPLETA de CORS - Esto soluciona los problemas de conexión
// En backend/server.js
const cors = require('cors');

// Configuración COMPLETA de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de dominios permitidos
    const allowedOrigins = [
      'https://code-2-diagram.vercel.app',
      'https://code-2-diagram.onrender.com',
      'http://localhost:8000',
      'http://localhost:3000',
      'http://127.0.0.1:8000',
      'http://127.0.0.1:3000'
    ];
    
    // Permitir requests sin origin (como curl, postman)
    if (!origin) return callback(null, true);
    
    // Verificar si el origin está permitido
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS bloqueado para:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 200
};

// Aplicar CORS
app.use(cors(corsOptions));

// Manejar preflight requests EXPLÍCITAMENTE
app.options('*', cors(corsOptions));

// Headers adicionales para CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://code-2-diagram.vercel.app');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Responder inmediatamente a preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// 📦 Middleware para parsing de datos
app.use(bodyParser.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(bodyParser.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// 🔍 Logger de requests para debugging
app.use((req, res, next) => {
  console.log(`📍 ${new Date().toISOString()} ${req.method} ${req.path}`);
  if (req.method === 'POST' && req.body) {
    console.log('📦 Body recibido:', JSON.stringify(req.body).substring(0, 200) + '...');
  }
  next();
});

// 📋 Manejar preflight requests (OPTIONS)
app.options('*', cors());

// 🛣️ Routes
app.use('/api', apiRoutes);

// 🏠 Ruta de raíz - Información de la API
app.get('/', (req, res) => {
  res.json({ 
    message: '🚀 Code2Diagram API - Backend funcionando', 
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      analyze: 'POST /api/analyze',
      health: 'GET /api/health',
      github: 'POST /api/github/content'
    },
    status: 'online',
    documentation: 'Ver consola para logs detallados'
  });
});

// ❌ Manejo de rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/analyze',
      'POST /api/github/content'
    ]
  });
});

// ⚠️ Manejo de errores global
app.use((error, req, res, next) => {
  console.error('💥 Error global:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 🎯 Inicialización del servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('='.repeat(60));
  console.log('🚀 CODECRAFT BACKEND INICIADO CORRECTAMENTE');
  console.log('='.repeat(60));
  console.log(`✅ Servidor ejecutándose en: http://localhost:${PORT}`);
  console.log(`✅ También disponible en: http://127.0.0.1:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Endpoint de análisis: http://localhost:${PORT}/api/analyze`);
  console.log('='.repeat(60));
  console.log('📋 Endpoints disponibles:');
  console.log('   GET  /              - Información de la API');
  console.log('   GET  /api/health    - Estado del servidor');
  console.log('   POST /api/analyze   - Analizar código');
  console.log('   POST /api/github/*  - Contenido de GitHub');
  console.log('='.repeat(60));
  console.log('🔍 Los requests se mostrarán aquí en tiempo real...');
  console.log('='.repeat(60));
});

// 🛑 Manejo graceful de shutdown
process.on('SIGINT', () => {
  console.log('\n🔻 Recibido SIGINT. Cerrando servidor gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🔻 Recibido SIGTERM. Cerrando servidor gracefully...');
  process.exit(0);
});

// 🎯 Export para testing
module.exports = app;