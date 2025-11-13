const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ USA TU ID REAL de Google Drive
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
    console.log(`📊 Total de productos: ${dbData?.productos?.length || 0}`);
  } catch (error) {
    console.error('❌ Error cargando datos:', error.message);
    console.error('Detalles del error:', error.response?.data || error.message);
  }
}

// Cargar datos al iniciar el servidor
loadData();

// Recargar datos cada 30 minutos (opcional)
setInterval(loadData, 30 * 60 * 1000);

// ✅ RUTAS ACTUALIZADAS - usa "productos" en lugar de "products"
app.get('/api/productos', (req, res) => {
  if (!dbData) {
    return res.status(503).json({ 
      error: 'Los datos aún se están cargando, intenta en unos segundos' 
    });
  }
  res.json(dbData.productos || []);
});

app.get('/api/productos/:id', (req, res) => {
  if (!dbData) {
    return res.status(503).json({ 
      error: 'Los datos aún se están cargando' 
    });
  }
  
  const productId = parseInt(req.params.id);
  const producto = dbData.productos.find(p => p.IdProducto === productId);
  
  if (!producto) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }
  res.json(producto);
});

// Buscar productos por categoría
app.get('/api/productos/categoria/:categoria', (req, res) => {
  if (!dbData) {
    return res.status(503).json({ error: 'Datos no cargados' });
  }
  
  const categoria = req.params.categoria.toLowerCase();
  const resultados = dbData.productos.filter(producto =>
    producto.Categoria.toLowerCase().includes(categoria)
  );
  
  res.json(resultados);
});

// Buscar productos por nombre
app.get('/api/buscar', (req, res) => {
  if (!dbData) {
    return res.status(503).json({ error: 'Datos no cargados' });
  }
  
  const query = req.query.q?.toLowerCase();
  if (!query) {
    return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
  }
  
  const resultados = dbData.productos.filter(producto =>
    producto.NombreArchivo.toLowerCase().includes(query) ||
    producto.Categoria.toLowerCase().includes(query)
  );
  
  res.json(resultados);
});

// Obtener todas las categorías únicas
app.get('/api/categorias', (req, res) => {
  if (!dbData) {
    return res.status(503).json({ error: 'Datos no cargados' });
  }
  
  const categorias = [...new Set(dbData.productos.map(p => p.Categoria))];
  res.json(categorias);
});

// Ruta para ver el estado del servidor
app.get('/api/status', (req, res) => {
  res.json({
    status: dbData ? 'active' : 'loading',
    lastUpdate: lastUpdate,
    totalProductos: dbData?.productos?.length || 0,
    dataSource: 'Google Drive'
  });
});

// Ruta de salud
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Ruta principal
app.get('/', (req, res) => {
  res.json({
    message: 'API de Productos funcionando',
    endpoints: {
      productos: '/api/productos',
      categorias: '/api/categorias',
      buscar: '/api/buscar?q=texto',
      status: '/api/status'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`📊 API disponible en: http://localhost:${PORT}/api`);
  console.log(`🔗 Datos cargados desde: ${DB_URL}`);
});

module.exports = app;