import logo from './logo.svg';
import './App.css';
import {BrowserRouter as Router, Routes, Route} from "react-router-dom"
import Landing from "./pages/Landing"
import Authentication from "./pages/authentication"
import {AuthProvider} from "./contexts/AuthContext"
import VideoMeetComponent from "./pages/VideoMeet"
import HomeComponent from "./pages/home"; 
import VideoMeet from "./pages/VideoMeet";
import History from './pages/history';


function App() {
  return (
  <>
    <Router>
      <AuthProvider>
      <Routes>
        <Route path='/' element={<Landing/>} />
        <Route path='/auth' element={<Authentication/>} />
        <Route path="/:meetingCode" element={<VideoMeet />} />
        <Route path='/home' element={<HomeComponent/>} />
        <Route path='/history' element={<History/>} />
        <Route path='/:url' element={<VideoMeetComponent/>} />
      </Routes>
      </AuthProvider>
    </Router>
  </>
  );
}

export default App;
