import { useParams } from "react-router-dom";
import { useWebRTC } from "../hooks/useWebRTC";
import { useCallTimer } from "../hooks/useCallTimer";
import VideoPlayer from "../components/VideoPlayer";
import Controls from "../components/Controls";
import ChatPanel from "../components/ChatPanel";
import "../styles/call.css";

export default function VideoCall() {
  const { roomId } = useParams();

  const {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    audioOn,
    videoOn,
    toggleAudio,
    toggleVideo,
    endCall
  } = useWebRTC(roomId);

  const seconds = useCallTimer(isConnected);

  return (
    <div className="call-container">
      <VideoPlayer videoRef={remoteVideoRef} className="remote-video" />
      <VideoPlayer videoRef={localVideoRef} className="local-video" muted />

      {isConnected && (
        <>
          <Controls
            audioOn={audioOn}
            videoOn={videoOn}
            toggleAudio={toggleAudio}
            toggleVideo={toggleVideo}
            endCall={endCall}
          />
          <ChatPanel roomId={roomId} />
          <div className="call-timer">⏱ {seconds}s</div>
        </>
      )}
    </div>
  );
}
