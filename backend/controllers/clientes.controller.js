const pool = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Obtener todos los clientes
exports.getClientes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clientes');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// REGISTRO (usa en POST /api/clientes al crear un nuevo cliente)
exports.registroCliente = async (req, res) => {
  const { dni, nombre, email, usuario, contrasenia } = req.body;
  try {
    const hash = await bcrypt.hash(contrasenia, 10);
    const result = await pool.query(
      'INSERT INTO clientes (dni, nombre, email, usuario, contrasenia) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [dni, nombre, email, usuario, hash]
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




// LOGIN 
exports.loginCliente = async (req, res) => {
  const { usuario, contrasenia } = req.body;
  try {
    const result = await pool.query(
      'SELECT * FROM clientes WHERE usuario = $1',
      [usuario]
    );
    const cliente = result.rows[0];
    if (!cliente) return res.status(401).json({ error: "Usuario no existe" });
    // Compara la contraseña encriptada
    const match = await bcrypt.compare(contrasenia, cliente.contrasenia);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });
    // Genera el token JWT
    const token = jwt.sign(
      { id: cliente.id, usuario: cliente.usuario },
      'tu_clave_secreta_super_segura', // cambia esto cuando lleves el proyecto a producción
      { expiresIn: '2h' }
    );
    res.json({ token, cliente: { id: cliente.id, nombre: cliente.nombre, usuario: cliente.usuario } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

