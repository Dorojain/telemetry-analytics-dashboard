import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { DashboardView } from './views/DashboardView'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DashboardView />
  </StrictMode>,
)
