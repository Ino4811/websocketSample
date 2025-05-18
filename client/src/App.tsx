import { Routes, Route, Link } from 'react-router-dom'
import './App.css'
import HomePage from './pages/HomePage/HomePage'
import PollingPage from './pages/PollingPage/PollingPage'
import WebSocketPage from './pages/WebSocketPage/WebSocketPage'

function App() {
  return (
    <>
      <nav className="navbar">
        <ul>
          <li><Link to="/http">HTTP API</Link></li>
          <li><Link to="/polling">Polling API</Link></li>
          <li><Link to="/websocket">WebSocket API</Link></li>
        </ul>
      </nav>
      <div className="page-content">
        <Routes>
          <Route path="/http" element={<HomePage />} />
          <Route path="/polling" element={<PollingPage />} />
          <Route path="/websocket" element={<WebSocketPage />} />
        </Routes>
      </div>
    </>
  )
}

export default App
