import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Alumnos from './pages/Alumnos';
import Mediciones from './pages/Mediciones';
import Pagos from './pages/Pagos';

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
        <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="alumnos" element={<Alumnos />} />
          <Route path="mediciones" element={<Mediciones />} />
          <Route path="pagos" element={<Pagos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
