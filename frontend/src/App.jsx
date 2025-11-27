import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import TrackingPage from './pages/TrackingPage';
import AdminDashboard from './pages/AdminDashboard';
import RestaurantDashboard from './pages/RestaurantDashboard';
import CartPage from './pages/CartPage';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import ProductDetailPage from './pages/ProductDetailPage';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) return <div className="text-center py-20">Loading...</div>;

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  console.log('App component rendered'); // Debug log

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={
            <HomeRedirector>
              <HomePage />
            </HomeRedirector>
          } />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/tracking/:orderId" element={<TrackingPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />

          {/* Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Restaurant Route */}
          <Route
            path="/restaurant"
            element={
              <ProtectedRoute allowedRoles={['restaurant']}>
                <RestaurantDashboard />
              </ProtectedRoute>
            }
          />

          {/* Smart Redirect for /dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin', 'restaurant']}>
                <DashboardRedirector />
              </ProtectedRoute>
            }
          />

          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  );
}

// Helper component to redirect based on role
const DashboardRedirector = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') return <Navigate to="/admin" />;
  if (user?.role === 'restaurant') return <Navigate to="/restaurant" />;
  return <Navigate to="/" />;
};

// Helper component to redirect admins/restaurants away from home
const HomeRedirector = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-20">Loading...</div>;

  if (user?.role === 'admin') return <Navigate to="/admin" />;
  if (user?.role === 'restaurant') return <Navigate to="/restaurant" />;

  return children;
};

export default App;
