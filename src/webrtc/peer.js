
export const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export function createPeerConnection(stream, onTrack, onIce) {
  const pc = new RTCPeerConnection(config);

  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  pc.ontrack = e => onTrack(e.streams[0]);
  pc.onicecandidate = e => e.candidate && onIce(e.candidate);

  return pc;
}
