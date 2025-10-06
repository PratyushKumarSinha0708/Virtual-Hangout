import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Authentication from "./pages/Authentication"
import LandingPage from "./pages/LandingPage"
import { AuthProvider } from './contents/AuthContext'
import VideoMeet from './pages/VideoMeet'
import History from './pages/History'
import Home from './pages/Home'

function App() {


  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path='/' element={<LandingPage />} />
            <Route path="/auth" element={<Authentication />} />
            <Route path="/home" element={<Home />} />
            <Route path='/:url' element={<VideoMeet />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </AuthProvider>
      </Router>

    </>
  )
}

export default App
