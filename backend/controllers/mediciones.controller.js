const pool = require('../db/pool');

// Listar mediciones de un alumno
exports.getMedicionesByAlumno = async (req, res) => {
  const { id_alumno } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM mediciones WHERE id_alumno = $1 ORDER BY fecha DESC',
      [id_alumno]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear una medición
exports.createMedicion = async (req, res) => {
  const {
    id_alumno, fecha, peso, altura, cintura, cadera,
    brazo, pierna, grasa_corporal, imc, balanza_manual, notas
  } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO mediciones (
        id_alumno, fecha, peso, altura, cintura, cadera, brazo, 
        pierna, grasa_corporal, imc, balanza_manual, notas
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      ) RETURNING *`,
      [
        id_alumno, fecha, peso, altura, cintura, cadera,
        brazo, pierna, grasa_corporal, imc,
        balanza_manual, notas
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Editar medición
exports.updateMedicion = async (req, res) => {
  const { id } = req.params;
  const {
    fecha, peso, altura, cintura, cadera,
    brazo, pierna, grasa_corporal, imc, balanza_manual, notas
  } = req.body;
  try {
    const result = await pool.query(
      `UPDATE mediciones SET
        fecha=$1, peso=$2, altura=$3, cintura=$4, cadera=$5,
        brazo=$6, pierna=$7, grasa_corporal=$8, imc=$9,
        balanza_manual=$10, notas=$11
      WHERE id=$12 RETURNING *`,
      [
        fecha, peso, altura, cintura, cadera,
        brazo, pierna, grasa_corporal, imc, balanza_manual, notas, id
      ]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Borrar medición
exports.deleteMedicion = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM mediciones WHERE id=$1 RETURNING *', [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Eliminado correctamente", medicion: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
