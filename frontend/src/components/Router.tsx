import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Auth from '../pages/Auth';
import App from '../App';

const Router = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  
  // Handle authentication state changes
  useEffect(() => {
    if (!isLoading) {
      setShowAuth(!isAuthenticated);
    }
  }, [isAuthenticated, isLoading]);
  
  // Show loading state while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Show login/register page if not authenticated
  if (showAuth) {
    return <Auth />;
  }
  
  // Show main app if authenticated
  return <App />;
};

export default Router;
