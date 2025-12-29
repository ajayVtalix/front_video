export default function VideoPlayer({ videoRef, className, muted }) {
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={className}
    />
  );
}
