const pool = require('../db/pool');

// Listar pagos de suscripción de un cliente/profesor
exports.getPagosByCliente = async (req, res) => {
  const { id_cliente } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM pagos_suscripciones WHERE id_cliente = $1 ORDER BY fecha_inicio DESC',
      [id_cliente]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear pago de suscripción
exports.createPagoSuscripcion = async (req, res) => {
  const {
    id_cliente, fecha_inicio, fecha_fin,
    estado, monto, metodo_pago, comprobante, notas
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO pagos_suscripciones
        (id_cliente, fecha_inicio, fecha_fin, estado, monto, metodo_pago, comprobante, notas)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id_cliente, fecha_inicio, fecha_fin, estado, monto, metodo_pago, comprobante, notas]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Editar pago de suscripción
exports.updatePagoSuscripcion = async (req, res) => {
  const { id } = req.params;
  const {
    fecha_inicio, fecha_fin, estado, monto,
    metodo_pago, comprobante, notas
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE pagos_suscripciones SET
        fecha_inicio=$1, fecha_fin=$2, estado=$3, monto=$4,
        metodo_pago=$5, comprobante=$6, notas=$7
      WHERE id=$8 RETURNING *`,
      [fecha_inicio, fecha_fin, estado, monto, metodo_pago, comprobante, notas, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Borrar pago de suscripción
exports.deletePagoSuscripcion = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM pagos_suscripciones WHERE id=$1 RETURNING *', [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Eliminado correctamente", pago: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

