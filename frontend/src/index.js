// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Se vuoi iniziare a misurare le performance nella tua app, passa una funzione
// per registrare i risultati (ad esempio: reportWebVitals(console.log))
// o invia a un endpoint di analytics. Maggiori info: https://bit.ly/CRA-vitals
reportWebVitals();

