import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

// Instancia de axios con configuración base
const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para agregar token automáticamente a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Servicios de Alumnos
export const alumnosService = {
  getByProfesor: (id_cliente) => api.get(`/alumnos/${id_cliente}`),
  create: (data) => api.post('/alumnos', data),
  update: (id, data) => api.put(`/alumnos/${id}`, data),
  delete: (id) => api.delete(`/alumnos/${id}`)
};

// Servicios de Mediciones
export const medicionesService = {
  getByAlumno: (id_alumno) => api.get(`/mediciones/${id_alumno}`),
  create: (data) => api.post('/mediciones', data),
  update: (id, data) => api.put(`/mediciones/${id}`, data),
  delete: (id) => api.delete(`/mediciones/${id}`)
};

// Servicios de Pagos
export const pagosService = {
  getByAlumno: (id_alumno) => api.get(`/pagos-alumnos/alumno/${id_alumno}`),
  getByProfesor: (id_profesor) => api.get(`/pagos-alumnos/profesor/${id_profesor}`),
  create: (data) => api.post('/pagos-alumnos', data),
  update: (id, data) => api.put(`/pagos-alumnos/${id}`, data),
  delete: (id) => api.delete(`/pagos-alumnos/${id}`)
};

// Servicios de Suscripciones
export const suscripcionesService = {
  getAll: () => api.get(`/pagos-suscripciones`),
  getByCliente: (id_cliente) => api.get(`/pagos-suscripciones/${id_cliente}`),
  getSuscripcionActiva: (id_cliente) => api.get(`/pagos-suscripciones/${id_cliente}/activa`),
  create: (data) => api.post(`/pagos-suscripciones`, data),
  update: (id, data) => api.put(`/pagos-suscripciones/${id}`, data),
  delete: (id) => api.delete(`/pagos-suscripciones/${id}`)
};



export default api;
