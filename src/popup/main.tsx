import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import Popup from './Popup'
import App from '../pages/App'

const isPopup = window.location.pathname.includes('popup')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPopup ? <Popup /> : <App />}
  </StrictMode>
)
