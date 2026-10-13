import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Prevent injected browser extension scripts (e.g. web-vitals, reportAllChanges) from throwing unhandled errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('startTime') ||
      event.message?.includes('reportAllChanges') ||
      event.filename?.includes('extension') ||
      event.filename === ''
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
