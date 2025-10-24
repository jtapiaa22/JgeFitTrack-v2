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

exports.updatePagoAlumno = async (req, res) => {
  const { id } = req.params;
  const {
    id_alumno, id_profesor, fecha_pago,
    periodo_desde, periodo_hasta, monto,
    metodo_pago, observaciones
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE pagos_alumnos SET
        id_alumno=$1, id_profesor=$2, fecha_pago=$3,
        periodo_desde=$4, periodo_hasta=$5, monto=$6,
        metodo_pago=$7, observaciones=$8
      WHERE id=$9 RETURNING *`,
      [id_alumno, id_profesor, fecha_pago, periodo_desde, periodo_hasta, monto, metodo_pago, observaciones, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePagoAlumno = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM pagos_alumnos WHERE id=$1 RETURNING *', [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Eliminado correctamente", pago: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

