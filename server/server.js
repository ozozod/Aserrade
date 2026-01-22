const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos (fotos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rutas
app.use('/api/clientes', require('./src/routes/clientes'));
app.use('/api/articulos', require('./src/routes/articulos'));
app.use('/api/remitos', require('./src/routes/remitos'));
app.use('/api/pagos', require('./src/routes/pagos'));
app.use('/api/reportes', require('./src/routes/reportes'));

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor API corriendo en puerto ${PORT}`);
  console.log(`📡 Endpoint de salud: http://localhost:${PORT}/api/health`);
});

