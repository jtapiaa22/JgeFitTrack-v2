// Calcular fecha de fin de prueba (días desde hoy)
function calcularFechaPrueba(dias = 30) {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + dias);
  return fecha;
}

// Verificar si la prueba está vencida
function pruebaVencida(fechaFin) {
  if (!fechaFin) return false;
  return new Date() > new Date(fechaFin);
}

module.exports = {
  calcularFechaPrueba,
  pruebaVencida
};
