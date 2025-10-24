import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

function Layout({ user, onLogout }) {
  return (
    <div>
      <Navbar user={user} onLogout={onLogout} />
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

export default Layout;
