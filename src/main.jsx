import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ReactDOM from 'react-dom';
// import Todo from './Todo';

createRoot(document.getElementById('root')).render(
  <>
    <App />
  </>,
)
