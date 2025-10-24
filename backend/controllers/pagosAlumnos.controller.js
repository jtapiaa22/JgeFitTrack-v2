const pool = require('../db/pool');

// Listar pagos de un alumno
exports.getPagosByAlumno = async (req, res) => {
  const { id_alumno } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM pagos_alumnos WHERE id_alumno = $1 ORDER BY fecha_pago DESC',
      [id_alumno]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear pago de alumno
exports.createPagoAlumno = async (req, res) => {
  const {
    id_alumno, id_profesor, fecha_pago,
    periodo_desde, periodo_hasta, monto,
    metodo_pago, observaciones
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pagos_alumnos
        (id_alumno, id_profesor, fecha_pago, periodo_desde, periodo_hasta, monto, metodo_pago, observaciones)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id_alumno, id_profesor, fecha_pago, periodo_desde, periodo_hasta, monto, metodo_pago, observaciones]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
