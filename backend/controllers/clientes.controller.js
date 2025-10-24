const pool = require('../db/pool');

// Obtener todos los clientes
exports.getClientes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Crear nuevo cliente
exports.createCliente = async (req, res) => {
  const { dni, nombre, email, usuario, contrasenia } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO clientes (dni, nombre, email, usuario, contrasenia) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [dni, nombre, email, usuario, contrasenia]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//editar cliente
exports.updateCliente = async (req, res) => {
  const { id } = req.params;
  const { dni, nombre, email, usuario, contrasenia } = req.body;
  try {
    const result = await pool.query(
      'UPDATE clientes SET dni=$1, nombre=$2, email=$3, usuario=$4, contrasenia=$5 WHERE id=$6 RETURNING *',
      [dni, nombre, email, usuario, contrasenia, id]
    );
    if (result.rows.length == 0) return res.status(404).json({ error: "No encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


//borrar cliente
exports.deleteCliente = async(req, res) => {
  const { id } = req.params;
  try{
    const result = await pool.query(
      'DELETE FROM clientes WHERE id=$1 RETURNING *', [id]
    );
    if (result.rows.length == 0) return res.status(404).json({
      error: "No encontrado"
    });
    res.json({ mensaje: "Eliminado correctamente", cliente: result.rows[0]});
  } catch (err){
    res.status(500).json({
      error: err.message
    });
  }
};
