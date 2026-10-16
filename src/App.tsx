import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StudentDataProvider } from './context/StudentDataContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './router';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StudentDataProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </StudentDataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
