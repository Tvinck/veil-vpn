import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import Checkout from './components/Checkout'
import { CyberBackground } from './components/ui/CyberBackground'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ position: 'relative', width: '100%', minHeight: '100vh' }}>
        {/* Background Cyber Canvas */}
        <CyberBackground />

        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />
          
          {/* Checkout Page */}
          <Route path="/checkout" element={<Checkout />} />
          
          {/* Client Dashboard with individual URL token */}
          <Route path="/cabinet/:token" element={<Dashboard />} />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
