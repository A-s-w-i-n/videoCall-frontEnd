import {BrowserRouter as Router, Routes, Route } from "react-router";
import LandingPage from "./landing/LandingPage";
import VideoCallPage from "./videoCall/VideoCallPage";
import "./App.css";
import * as process from "process";
global.process = process;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/call" element={<VideoCallPage />} />
      </Routes>
    </Router>
  );
}

export default App;
