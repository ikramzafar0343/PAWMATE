// TEMPORARILY disabled - React 18 StrictMode causes double API calls in dev
// import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// React StrictMode intentionally double-invokes effects in development to detect issues.
// This causes duplicate API calls during development.
// Re-enable for production: uncomment StrictMode import and wrap with <StrictMode>

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
  // Re-enable for production:
  // <StrictMode>
  //   <BrowserRouter>
  //     <App />
  //   </BrowserRouter>
  // </StrictMode>
)
