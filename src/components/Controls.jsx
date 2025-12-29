export default function Controls({
  onToggleAudio,
  onToggleVideo,
  onHangUp,
  onToggleChat,
  audioEnabled,
  videoEnabled
}) {
  return (
    <div className="controls">
      <button onClick={onToggleAudio}>
        {audioEnabled ? "🎤 Mute" : "🔇 Unmute"}
      </button>

      <button onClick={onToggleVideo}>
        {videoEnabled ? "📹 Stop Video" : "🚫 Start Video"}
      </button>

      <button className="hang-up" onClick={onHangUp}>
        📞 Hang Up
      </button>

      <button onClick={onToggleChat}>💬 Chat</button>
    </div>
  );
}
