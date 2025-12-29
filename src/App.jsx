
import { BrowserRouter, Routes, Route } from "react-router-dom";
import JoinRoom from "./pages/JoinRoom";
import VideoCall from "./pages/VideoCall";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route path="/call/:roomId" element={<VideoCall />} />
      </Routes>
    </BrowserRouter>
  );
}
