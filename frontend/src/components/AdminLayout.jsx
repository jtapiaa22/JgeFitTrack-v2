import { Outlet } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';

function AdminLayout({ user, onLogout }) {
  return (
    <div>
      <AdminNavbar user={user} onLogout={onLogout} />
      <main style={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}

const styles = {
  main: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  }
};

export default AdminLayout;
