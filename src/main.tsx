import React from 'react'
import ReactDOM from 'react-dom/client'
// Global styles must load before component styles so components can override them.
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
