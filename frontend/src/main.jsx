import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ShareProvider } from './context/ShareContext'
import './index.css'
import App from './App.jsx'

// Apply the saved theme before the first paint, on every route (including
// /login and /signup, which don't render the Header's theme toggle).
if (localStorage.getItem('theme') === 'light') {
  document.body.classList.add('light-mode')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ShareProvider>
        <App />
      </ShareProvider>
    </BrowserRouter>
  </StrictMode>,
)
