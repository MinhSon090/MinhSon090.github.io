import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import './components/react-bits/effects.css';

createRoot(document.getElementById('root')).render(
  <StrictMode><App /></StrictMode>,
);
