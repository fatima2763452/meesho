import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';

import { getCookie, clearAllAuthData } from './utils/cookies';
import api from './services/api';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token') || getCookie('token');
  const userInfo = localStorage.getItem('userInfo') || getCookie('userInfo');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const isSecurityOn = localStorage.getItem('flipkartSecurity') === 'ON';
  if (isSecurityOn) {
    clearAllAuthData();
    window.location.replace('https://www.flipkart.com');
    return null;
  }

  // Keep localStorage and cookie in sync
  if (!localStorage.getItem('token') && token) {
    localStorage.setItem('token', token);
  }
  if (!localStorage.getItem('userInfo') && userInfo) {
    localStorage.setItem('userInfo', userInfo);
  }

  return children;
};

import CustomerDetail from './pages/CustomerDetail';
import Invoice from './components/customer/Invoice';
import MarginReceipt from './components/customer/MarginReceipt';
import PaymentReceipt from './components/customer/PaymentReceipt';
import AccountOpeningForm from './pages/AccountOpeningForm';
import SecretAdmin from './pages/SecretAdmin';
import RecycleBin from './pages/RecycleBin';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/secret-admin" element={<SecretAdmin />} />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/recycle-bin" 
        element={
          <ProtectedRoute>
            <RecycleBin />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/account-opening" 
        element={
          <ProtectedRoute>
            <AccountOpeningForm />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/:id" 
        element={
          <ProtectedRoute>
            <CustomerDetail />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/:id/invoice" 
        element={
          <ProtectedRoute>
            <Invoice />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/:id/margin-receipt" 
        element={
          <ProtectedRoute>
            <MarginReceipt />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/customer/:id/payment-receipt" 
        element={
          <ProtectedRoute>
            <PaymentReceipt />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

function App() {
  React.useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    // Monitor global security cloak in real-time
    const checkSecurityStatus = async () => {
      try {
        const { data } = await api.get('/auth/system-status');
        if (data.isSecurityCloakOn) {
          localStorage.setItem('flipkartSecurity', 'ON');
          const token = localStorage.getItem('token') || getCookie('token');
          const isSecretAdmin = window.location.pathname.startsWith('/secret-admin');

          // Only redirect if user is ALREADY LOGGED IN and NOT on secret-admin
          // Secret admin panel can always be opened
          if (token && !isSecretAdmin) {
            clearAllAuthData();
            window.location.replace('https://www.flipkart.com');
          }
        } else {
          localStorage.setItem('flipkartSecurity', 'OFF');
        }
      } catch (e) {
        if (localStorage.getItem('flipkartSecurity') === 'ON') {
          const token = localStorage.getItem('token') || getCookie('token');
          const isSecretAdmin = window.location.pathname.startsWith('/secret-admin');
          if (token && !isSecretAdmin) {
            clearAllAuthData();
            window.location.replace('https://www.flipkart.com');
          }
        }
      }
    };

    checkSecurityStatus();
    const interval = setInterval(checkSecurityStatus, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}

export default App;
