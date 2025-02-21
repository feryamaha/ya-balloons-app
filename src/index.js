import React from 'react';
import * as ReactDOM from 'react-dom/client'; // Importação atualizada para React 18
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('Service Worker registrado', reg))
    .catch(err => console.error('Erro ao registrar Service Worker', err));
}