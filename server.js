HEAD
const jsonServer = require('json-server');
const cors = require('cors');
const path = require('path');

const server = jsonServer.create();
const router = jsonServer.router(path.join(__dirname, 'db.json'));
const middlewares = jsonServer.defaults();

server.use(cors());
server.use(middlewares);
server.use('/api', router);

// Export para Vercel
module.exports = server;

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Usa tu ID real de Google Drive
const DB_URL = 'https://drive.google.com/uc?export=download&id=1zMA50U_5IDNZjxxuert2egrZwkM3lQqp';

let dbData = null;
let lastUpdate = null;

// Función para cargar datos desde Google Drive
async function loadData() {
  try {
    console.log('📥 Cargando datos desde Google Drive...');
    const response = await axios.get(DB_URL);
    dbData = response.data;
    lastUpdate = new Date();
    console.log('✅ Datos cargados correctamente');
    console.log(`📊 Total de productos: ${dbData?.products?.length || 0}`);
  } catch (error) {
    console.error('❌ Error cargando datos:', error.message);
  }
}

// Cargar datos al iniciar el servidor
loadData();

// Recargar datos cada 30 minutos (opcional)
setInterval(loadData, 30 * 60 * 1000);

// Rutas de la API
app.get('/api/products', (req, res) => {
  if (!dbData) {
    return res.status(503).json({ 
      error: 'Los datos aún se están cargando, intenta en unos segundos' 
    });
  }
  res.json(dbData.products || []);
});

app.get('/api/products/:id', (req, res) => {
  if (!dbData) {
    return res.status(503).json({ 
      error: 'Los datos aún se están cargando' 
    });
  }
  
  const productId = parseInt(req.params.id);
  const product = dbData.products.find(p => p.id === productId);
  
  if (!product) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  res.json(product);
});

// Buscar productos por nombre
app.get('/api/search', (req, res) => {
  if (!dbData) {
    return res.status(503).json({ error: 'Datos no cargados' });
  }
  
  const query = req.query.q?.toLowerCase();
  if (!query) {
    return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
  }
  
  const results = dbData.products.filter(product =>
    product.name.toLowerCase().includes(query)
  );
  
  res.json(results);
});

// Ruta para ver el estado del servidor
app.get('/api/status', (req, res) => {
  res.json({
    status: dbData ? 'active' : 'loading',
    lastUpdate: lastUpdate,
    totalProducts: dbData?.products?.length || 0,
    dataSource: 'Google Drive'
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📊 API disponible en: http://localhost:${PORT}/api`);
});

module.exports = app;

