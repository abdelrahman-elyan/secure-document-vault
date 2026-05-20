import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Verify from './pages/Verify';
import AdminPanel from './pages/AdminPanel';
import OAuthCallback from './pages/OAuthCallback';
import Settings from './pages/Settings';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',color:'#94a3b8'}}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/dashboard" : "/login"} />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/documents" element={<PrivateRoute><Documents /></PrivateRoute>} />
        <Route path="/verify" element={<PrivateRoute><Verify /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminPanel /></PrivateRoute>} />
      </Routes>
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}