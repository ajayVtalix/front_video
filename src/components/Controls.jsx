export default function Controls({
  audioOn,
  videoOn,
  toggleAudio,
  toggleVideo,
  endCall
}) {
  return (
    <div className="controls">
      <button onClick={toggleAudio}>
        {audioOn ? "Mute" : "Unmute"}
      </button>
      <button onClick={toggleVideo}>
        {videoOn ? "Stop Video" : "Start Video"}
      </button>
      <button className="end" onClick={endCall}>
        End Call
      </button>
    </div>
  );
}
