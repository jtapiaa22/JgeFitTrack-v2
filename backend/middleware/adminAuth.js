function adminAuth(req, res, next) {
  // req.user ya fue establecido por el middleware authMiddleware
  if (!req.user) {
    return res.status(401).json({ error: "No autenticado" });
  }
  
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: "Acceso denegado. Solo administradores" });
  }
  
  next();
}

module.exports = adminAuth;
