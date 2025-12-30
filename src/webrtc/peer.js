// export const configuration = {
//   iceServers: [
//     { urls: "stun:stun.l.google.com:19302" },
//     { urls: "stun:stun1.l.google.com:19302" }
//   ]
// };

// export function createPeerConnection(localStream, onRemoteStream, onIce) {
//   const pc = new RTCPeerConnection(configuration);

//   localStream.getTracks().forEach(track => {
//     pc.addTrack(track, localStream);
//   });

//   pc.ontrack = (event) => {
//     onRemoteStream(event.streams[0]);
//   };

//   pc.onicecandidate = (event) => {
//     if (event.candidate) {
//       onIce(event.candidate);
//     }
//   };

//   return pc;
// }

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
