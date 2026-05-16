/// <reference types="vite/client" />

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';


// Suppress console logs in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.info = () => {};
  console.debug = () => {};
  console.warn = () => {};
  console.error = () => {}; // Optional: also hide warnings to be very quiet
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
