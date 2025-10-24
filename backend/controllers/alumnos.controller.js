const pool = require('../db/pool');

//obtener todos los alumnos de un profesor
exports.getAlumnosByProfesor = async (req, res) => {
    const { id_cliente } = req.params;
    try{
        const result = await pool.query(
            'SELECT * FROM alumnos WHERE id_cliente = $1', [id_cliente]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Crear un alumno para un profesor específico
exports.createAlumno = async (req, res) => {
  const { id_cliente, dni, nombre, sexo, fecha_nacimiento, contacto, notas } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO alumnos (id_cliente, dni, nombre, sexo, fecha_nacimiento, contacto, notas) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id_cliente, dni, nombre, sexo, fecha_nacimiento, contacto, notas]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Editar alumno
exports.updateAlumno = async (req, res) => {
  const { id } = req.params;
  const { dni, nombre, sexo, fecha_nacimiento, contacto, notas } = req.body;
  try {
    const result = await pool.query(
      `UPDATE alumnos SET dni=$1, nombre=$2, sexo=$3, fecha_nacimiento=$4, contacto=$5, notas=$6 WHERE id=$7 RETURNING *`,
      [dni, nombre, sexo, fecha_nacimiento, contacto, notas, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Borrar alumno
exports.deleteAlumno = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `DELETE FROM alumnos WHERE id=$1 RETURNING *`, [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "No encontrado" });
    res.json({ mensaje: "Eliminado correctamente", alumno: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
