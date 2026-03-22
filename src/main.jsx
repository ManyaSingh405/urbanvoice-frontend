import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import { ThemeProvider } from './context/ThemeContext.jsx'
import './index.css'

// Set base URL for all axios calls globally
axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Set auth token on every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('uv_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
)