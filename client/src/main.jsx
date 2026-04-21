import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#16161f',
              color: '#f0f0f5',
              border: '1px solid #2a2a3a',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#2ecc71', secondary: '#16161f' },
            },
            error: {
              iconTheme: { primary: '#e63946', secondary: '#16161f' },
            },
          }}
        />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
