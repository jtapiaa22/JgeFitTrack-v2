const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { calcularFechaPrueba } = require('../utils/fechas');

// Obtener todos los clientes
exports.getClientes = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, dni, nombre, email, usuario, rol, activo, en_prueba, fecha_prueba_fin, fecha_registro FROM clientes ORDER BY fecha_registro DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// REGISTRO con período de prueba
exports.registroCliente = async (req, res) => {
  const { dni, nombre, email, usuario, contrasenia, rol = 'profesor', dias_prueba = 30 } = req.body;
  try {
    const hash = await bcrypt.hash(contrasenia, 10);
    
    // Si es profesor, activar período de prueba
    const enPrueba = rol === 'profesor';
    const fechaPruebaFin = enPrueba ? calcularFechaPrueba(dias_prueba) : null;
    
    const result = await pool.query(
      `INSERT INTO clientes 
        (dni, nombre, email, usuario, contrasenia, rol, activo, en_prueba, fecha_prueba_fin) 
        VALUES ($1, $2, $3, $4, $5, $6, true, $7, $8) 
        RETURNING id, dni, nombre, email, usuario, rol, activo, en_prueba, fecha_prueba_fin`,
      [dni, nombre, email, usuario, hash, rol, enPrueba, fechaPruebaFin]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// LOGIN con verificación de suscripción/prueba
exports.loginCliente = async (req, res) => {
  const { usuario, contrasenia } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM clientes WHERE usuario = $1',
      [usuario]
    );
    const cliente = result.rows[0];
    
    if (!cliente) return res.status(401).json({ error: "Usuario no existe" });
    
    // Verificar si está activo
    if (!cliente.activo) {
      return res.status(403).json({ error: "Tu cuenta ha sido deshabilitada. Contacta al administrador." });
    }
    
    // Verificar contraseña
    const match = await bcrypt.compare(contrasenia, cliente.contrasenia);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });
    
    // VERIFICACIÓN DE SUSCRIPCIÓN/PRUEBA (solo para profesores)
    if (cliente.rol === 'profesor') {
      // Verificar si está en período de prueba
      if (cliente.en_prueba) {
        const fechaPrueba = new Date(cliente.fecha_prueba_fin);
        const ahora = new Date();
        
        if (ahora > fechaPrueba) {
          // Prueba vencida - verificar si tiene suscripción activa
          const suscripcion = await pool.query(
            `SELECT * FROM pagos_suscripciones 
             WHERE id_cliente = $1 
             AND estado = 'activa' 
             AND fecha_fin >= CURRENT_DATE
             ORDER BY fecha_fin DESC LIMIT 1`,
            [cliente.id]
          );
          
          if (suscripcion.rows.length === 0) {
            // No tiene suscripción activa - desactivar automáticamente
            await pool.query(
              'UPDATE clientes SET activo = false, en_prueba = false WHERE id = $1',
              [cliente.id]
            );
            
            return res.status(403).json({ 
              error: "Tu período de prueba ha vencido y no tienes una suscripción activa. Contacta al administrador para renovar."
            });
          } else {
            // Tiene suscripción activa - quitar período de prueba
            await pool.query(
              'UPDATE clientes SET en_prueba = false WHERE id = $1',
              [cliente.id]
            );
          }
        }
      } else {
        // No está en prueba - verificar suscripción activa
        const suscripcion = await pool.query(
          `SELECT * FROM pagos_suscripciones 
           WHERE id_cliente = $1 
           AND estado = 'activa' 
           AND fecha_fin >= CURRENT_DATE
           ORDER BY fecha_fin DESC LIMIT 1`,
          [cliente.id]
        );
        
        if (suscripcion.rows.length === 0) {
          // No tiene suscripción activa - desactivar
          await pool.query(
            'UPDATE clientes SET activo = false WHERE id = $1',
            [cliente.id]
          );
          
          return res.status(403).json({ 
            error: "Tu suscripción ha vencido. Contacta al administrador para renovar."
          });
        }
      }
    }
    
    // Genera el token JWT con rol
    const token = jwt.sign(
      { id: cliente.id, usuario: cliente.usuario, rol: cliente.rol },
      'tu_clave_secreta_super_segura',
      { expiresIn: '2h' }
    );
    
    res.json({ 
      token, 
      cliente: { 
        id: cliente.id, 
        nombre: cliente.nombre, 
        usuario: cliente.usuario,
        rol: cliente.rol,
        email: cliente.email,
        en_prueba: cliente.en_prueba,
        fecha_prueba_fin: cliente.fecha_prueba_fin
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Editar cliente
exports.updateCliente = async (req, res) => {
  const { id } = req.params;
  const { dni, nombre, email, usuario, contrasenia, rol, activo, en_prueba, fecha_prueba_fin } = req.body;
  try {
    let query, params;
    
    if (contrasenia) {
      const hash = await bcrypt.hash(contrasenia, 10);
      query = `UPDATE clientes SET 
        dni=$1, nombre=$2, email=$3, usuario=$4, contrasenia=$5, 
        rol=$6, activo=$7, en_prueba=$8, fecha_prueba_fin=$9 
        WHERE id=$10 RETURNING *`;
      params = [dni, nombre, email, usuario, hash, rol, activo, en_prueba, fecha_prueba_fin, id];
    } else {
      query = `UPDATE clientes SET 
        dni=$1, nombre=$2, email=$3, usuario=$4, 
        rol=$5, activo=$6, en_prueba=$7, fecha_prueba_fin=$8 
        WHERE id=$9 RETURNING *`;
      params = [dni, nombre, email, usuario, rol, activo, en_prueba, fecha_prueba_fin, id];
    }
    
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    
    const { contrasenia: _, ...clienteSinPassword } = result.rows[0];
    res.json(clienteSinPassword);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Borrar cliente
exports.deleteCliente = async(req, res) => {
  const { id } = req.params;
  try{
    const result = await pool.query(
      'DELETE FROM clientes WHERE id=$1 RETURNING *', [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Eliminado correctamente", cliente: result.rows[0]});
  } catch (err){
    res.status(500).json({ error: err.message });
  }
};

// Activar/Desactivar profesor
exports.toggleActivoCliente = async (req, res) => {
  const { id } = req.params;
  const { activo } = req.body;
  try {
    const result = await pool.query(
      'UPDATE clientes SET activo=$1 WHERE id=$2 RETURNING id, nombre, usuario, activo',
      [activo, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Extender período de prueba
exports.extenderPrueba = async (req, res) => {
  const { id } = req.params;
  const { dias = 30 } = req.body;
  try {
    const nuevaFecha = calcularFechaPrueba(dias);
    const result = await pool.query(
      'UPDATE clientes SET en_prueba=true, fecha_prueba_fin=$1, activo=true WHERE id=$2 RETURNING *',
      [nuevaFecha, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    
    const { contrasenia: _, ...clienteSinPassword } = result.rows[0];
    res.json({ 
      mensaje: `Período de prueba extendido por ${dias} días`,
      cliente: clienteSinPassword 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Obtener estadísticas generales
exports.getEstadisticas = async (req, res) => {
  try {
    const profesores = await pool.query('SELECT COUNT(*) FROM clientes WHERE rol = $1', ['profesor']);
    const profesoresActivos = await pool.query('SELECT COUNT(*) FROM clientes WHERE rol = $1 AND activo = true', ['profesor']);
    const profesoresEnPrueba = await pool.query('SELECT COUNT(*) FROM clientes WHERE rol = $1 AND en_prueba = true AND fecha_prueba_fin >= CURRENT_TIMESTAMP', ['profesor']);
    const totalAlumnos = await pool.query('SELECT COUNT(*) FROM alumnos');
    const totalPagos = await pool.query('SELECT SUM(monto) FROM pagos_alumnos');
    
    res.json({
      totalProfesores: parseInt(profesores.rows[0].count),
      profesoresActivos: parseInt(profesoresActivos.rows[0].count),
      profesoresEnPrueba: parseInt(profesoresEnPrueba.rows[0].count),
      totalAlumnos: parseInt(totalAlumnos.rows[0].count),
      ingresosTotales: parseFloat(totalPagos.rows[0].sum || 0)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
