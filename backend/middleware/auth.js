const jwt = require('jsonwebtoken');

// Middleware para proteger rutas
function authMiddleware(req, res, next) {
  // Lee el header "Authorization"
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: "No hay token" });

  const token = authHeader.split(' ')[1]; // Separar "Bearer"
  if (!token) return res.status(401).json({ error: "Token faltante" });

  try {
    const decoded = jwt.verify(token, 'tu_clave_secreta_super_segura'); // Usa la misma clave que en login
    req.user = decoded; // Guarda el usuario en req para usarlo después
    next();
  } catch (err) {
    res.status(403).json({ error: "Token inválido o vencido" });
  }
}

module.exports = authMiddleware;
