const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express()
const pool = require('./db/pool');
const clientesRoutes = require('./routes/clientes.routes');
const alumnosRoutes = require('./routes/alumnos.routes');
const medicionesRoutes = require('./routes/mediciones.routes');
const pagosSuscripcionesRoutes = require('./routes/pagosSuscripciones.routes');
const pagosAlumnosRoutes = require('./routes/pagosAlumnos.routes');


app.use(cors());
app.use(express.json());
app.use('/api/clientes', clientesRoutes);
app.use('/api/alumnos', alumnosRoutes);
app.use('/api/mediciones', medicionesRoutes);
app.use('/api/pagos-suscripciones', pagosSuscripcionesRoutes);
app.use('/api/pagos-alumnos', pagosAlumnosRoutes);


//hacemos endpoint de prueba - modo test
app.get("/", (req, res) => {
    res.send("JgeFiTrack Backend funciona");
});
 
// Test de conexión a la DB
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ dbTime: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Escucha
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend JgeFiTrack escuchando en puerto ${PORT}`);
});