import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import AdminRoute from './components/AdminRoute';

// Páginas de profesor
import Dashboard from './pages/Dashboard';
import Alumnos from './pages/Alumnos';
import Mediciones from './pages/Mediciones';
import Pagos from './pages/Pagos';
import Evolucion from './pages/Evolucion';

// Páginas de admin
import AdminDashboard from './pages/admin/AdminDashboard';
import Profesores from './pages/admin/Profesores';
import RegistrarProfesor from './pages/admin/RegistrarProfesor';
import Suscripciones from './pages/admin/Suscripciones';
import Reportes from './pages/admin/Reportes';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogin = (data) => {
    setIsAuthenticated(true);
    setUser(data.cliente);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas de ADMIN */}
        {user?.rol === 'admin' && (
          <Route path="/admin" element={
            <AdminRoute>
              <AdminLayout user={user} onLogout={handleLogout} />
            </AdminRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="profesores" element={<Profesores />} />
            <Route path="profesores/nuevo" element={<RegistrarProfesor />} />  {/* NUEVA RUTA */}
            <Route path="suscripciones" element={<Suscripciones />} />
            <Route path="reportes" element={<Reportes />} />
          </Route>
        )}

                {/* Rutas de PROFESOR */}
        <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
          <Route index element={
            <Navigate to={user?.rol === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />
          } />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="alumnos" element={<Alumnos />} />
          <Route path="mediciones" element={<Mediciones />} />
          <Route path="pagos" element={<Pagos />} />
          <Route path="/evolucion" element={<Evolucion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

