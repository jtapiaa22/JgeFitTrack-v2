const pool = require('../db/pool');

// Listar suscripciones de un profesor
exports.getPagosByCliente = async (req, res) => {
  const { id_cliente } = req.params;
  try {
    const result = await pool.query(
      `SELECT *, 
        CASE 
          WHEN fecha_fin >= CURRENT_DATE AND estado != 'cancelada' THEN 'activa'
          WHEN fecha_fin < CURRENT_DATE AND estado != 'cancelada' THEN 'vencida'
          ELSE estado
        END as estado_calculado
       FROM pagos_suscripciones 
       WHERE id_cliente = $1 
       ORDER BY fecha_inicio DESC`,
      [id_cliente]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Listar TODAS las suscripciones (para admin) CON ESTADO CALCULADO
exports.getAllSuscripciones = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ps.*, c.nombre as nombre_profesor, c.usuario, c.email,
        CASE 
          WHEN ps.fecha_fin >= CURRENT_DATE AND ps.estado != 'cancelada' THEN 'activa'
          WHEN ps.fecha_fin < CURRENT_DATE AND ps.estado != 'cancelada' THEN 'vencida'
          ELSE ps.estado
        END as estado_calculado
       FROM pagos_suscripciones ps
       JOIN clientes c ON ps.id_cliente = c.id
       WHERE c.rol = 'profesor'
       ORDER BY ps.fecha_inicio DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear pago de suscripción
exports.createPagoSuscripcion = async (req, res) => {
  const {
    id_cliente, fecha_inicio, fecha_fin, estado,
    monto, metodo_pago, comprobante, notas
  } = req.body;
  try {
    // Calcular estado basado en fechas
    const estadoReal = new Date(fecha_fin) >= new Date() ? 'activa' : 'vencida';
    
    const result = await pool.query(
      `INSERT INTO pagos_suscripciones
        (id_cliente, fecha_inicio, fecha_fin, estado, monto, metodo_pago, comprobante, notas)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id_cliente, fecha_inicio, fecha_fin, estadoReal, monto, metodo_pago, comprobante, notas]
    );

    if (estadoReal == 'activa'){
      await pool.query(
        `UPDATE clientes
        SET activo = true, en_prueba = false
        WHERE id = $1`, [id_cliente]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Editar pago de suscripción CON LÓGICA COMPLETA
exports.updatePagoSuscripcion = async (req, res) => {
  const { id } = req.params;
  const {
    fecha_inicio, fecha_fin, estado, monto,
    metodo_pago, comprobante, notas
  } = req.body;
  try {
    // Obtener el estado anterior
    const anterior = await pool.query(
      'SELECT * FROM pagos_suscripciones WHERE id=$1',
      [id]
    );
    
    if (anterior.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }
    
    const estadoAnterior = anterior.rows[0].estado;
    const idProfesor = anterior.rows[0].id_cliente;
    
    // Actualizar la suscripción
    const result = await pool.query(
      `UPDATE pagos_suscripciones SET
        fecha_inicio=$1, fecha_fin=$2, estado=$3, monto=$4,
        metodo_pago=$5, comprobante=$6, notas=$7
      WHERE id=$8 RETURNING *`,
      [fecha_inicio, fecha_fin, estado, monto, metodo_pago, comprobante, notas, id]
    );
    
    // CASO 1: Cambió de inactiva/vencida a ACTIVA
    if ((estadoAnterior !== 'activa') && (estado === 'activa') && (new Date(fecha_fin) >= new Date())) {
      await pool.query(
        `UPDATE clientes 
         SET activo = true, en_prueba = false 
         WHERE id = $1`,
        [idProfesor]
      );
    }
    
    // CASO 2: Cambió de ACTIVA a vencida/cancelada
    if ((estadoAnterior === 'activa') && (estado === 'vencida' || estado === 'cancelada')) {
      // Verificar si hay otras suscripciones activas
      const otrasSubs = await pool.query(
        `SELECT * FROM pagos_suscripciones 
         WHERE id_cliente = $1 
         AND estado = 'activa' 
         AND fecha_fin >= CURRENT_DATE 
         AND id != $2`,
        [idProfesor, id]
      );
      
      // Si no hay otras activas, desactivar (excepto si tiene prueba válida)
      if (otrasSubs.rows.length === 0) {
        const profesor = await pool.query(
          `SELECT en_prueba, fecha_prueba_fin 
           FROM clientes 
           WHERE id = $1`,
          [idProfesor]
        );
        
        const enPruebaValida = profesor.rows[0]?.en_prueba && 
                               new Date(profesor.rows[0].fecha_prueba_fin) > new Date();
        
        if (!enPruebaValida) {
          await pool.query(
            'UPDATE clientes SET activo = false WHERE id = $1',
            [idProfesor]
          );
        }
      }
    }
    
    // CASO 3: Sigue activa pero cambió la fecha_fin a una pasada
    if (estado === 'activa' && new Date(fecha_fin) < new Date()) {
      // Auto-marcar como vencida
      await pool.query(
        `UPDATE pagos_suscripciones SET estado = 'vencida' WHERE id = $1`,
        [id]
      );
      
      // Verificar si desactivar profesor
      const otrasSubs = await pool.query(
        `SELECT * FROM pagos_suscripciones 
         WHERE id_cliente = $1 
         AND estado = 'activa' 
         AND fecha_fin >= CURRENT_DATE`,
        [idProfesor]
      );
      
      if (otrasSubs.rows.length === 0) {
        const profesor = await pool.query(
          `SELECT en_prueba, fecha_prueba_fin FROM clientes WHERE id = $1`,
          [idProfesor]
        );
        
        const enPruebaValida = profesor.rows[0]?.en_prueba && 
                               new Date(profesor.rows[0].fecha_prueba_fin) > new Date();
        
        if (!enPruebaValida) {
          await pool.query('UPDATE clientes SET activo = false WHERE id = $1', [idProfesor]);
        }
      }
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Borrar pago de suscripción Y VERIFICAR SI DESACTIVAR PROFESOR
exports.deletePagoSuscripcion = async (req, res) => {
  const { id } = req.params;
  try {
    // Primero obtener la suscripción antes de eliminarla
    const suscripcionAEliminar = await pool.query(
      'SELECT * FROM pagos_suscripciones WHERE id=$1',
      [id]
    );
    
    if (suscripcionAEliminar.rows.length === 0) {
      return res.status(404).json({ error: "No encontrado" });
    }
    
    const idProfesor = suscripcionAEliminar.rows[0].id_cliente;
    const estadoEliminada = suscripcionAEliminar.rows[0].estado;
    
    // Eliminar la suscripción
    const result = await pool.query(
      'DELETE FROM pagos_suscripciones WHERE id=$1 RETURNING *', 
      [id]
    );
    
    // Si la suscripción eliminada estaba activa, verificar si hay otras activas
    if (estadoEliminada === 'activa') {
      const otrasSubs = await pool.query(
        `SELECT * FROM pagos_suscripciones 
         WHERE id_cliente = $1 
         AND estado = 'activa' 
         AND fecha_fin >= CURRENT_DATE`,
        [idProfesor]
      );
      
      // Si no hay otras suscripciones activas, desactivar al profesor
      if (otrasSubs.rows.length === 0) {
        // Verificar si tampoco está en período de prueba válido
        const profesor = await pool.query(
          `SELECT en_prueba, fecha_prueba_fin 
           FROM clientes 
           WHERE id = $1`,
          [idProfesor]
        );
        
        const enPruebaValida = profesor.rows[0]?.en_prueba && 
                               new Date(profesor.rows[0].fecha_prueba_fin) > new Date();
        
        // Solo desactivar si no tiene prueba válida
        if (!enPruebaValida) {
          await pool.query(
            'UPDATE clientes SET activo = false WHERE id = $1',
            [idProfesor]
          );
        }
      }
    }
    
    res.json({ 
      mensaje: "Suscripción eliminada correctamente", 
      pago: result.rows[0],
      profesorDesactivado: estadoEliminada === 'activa'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Obtener suscripción activa de un profesor
exports.getSuscripcionActiva = async (req, res) => {
  const { id_cliente } = req.params;
  try {
    const result = await pool.query(
      `SELECT * FROM pagos_suscripciones 
       WHERE id_cliente = $1 
       AND estado = 'activa' 
       AND fecha_fin >= CURRENT_DATE
       ORDER BY fecha_fin DESC LIMIT 1`,
      [id_cliente]
    );
    if (result.rows.length === 0) {
      return res.json({ activa: false, mensaje: "No hay suscripción activa" });
    }
    res.json({ activa: true, suscripcion: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
