import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../services/socket";
import { createPeerConnection } from "../webrtc/peer";
import "../styles/call.css";

export default function VideoCall() {
  const { roomId } = useParams();
  const localRef = useRef(null);
  const remoteRef = useRef(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    socket.connect();

    const start = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      streamRef.current = stream;
      localRef.current.srcObject = stream;

      socket.emit("join-room", roomId);

      socket.on("ready", async (peerId) => {
        peerRef.current = createPeerConnection(
          stream,
          s => (remoteRef.current.srcObject = s),
          c => socket.emit("ice-candidate", { candidate: c, to: peerId })
        );

        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        socket.emit("offer", { offer, to: peerId });
      });

      socket.on("offer", async ({ offer, from }) => {
        peerRef.current = createPeerConnection(
          stream,
          s => (remoteRef.current.srcObject = s),
          c => socket.emit("ice-candidate", { candidate: c, to: from })
        );

        await peerRef.current.setRemoteDescription(offer);
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit("answer", { answer, to: from });
      });

      socket.on("answer", async ({ answer }) => {
        await peerRef.current.setRemoteDescription(answer);
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        await peerRef.current.addIceCandidate(candidate);
      });
    };

    start();

    return () => {
      peerRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
      socket.disconnect();
    };
  }, [roomId]);

  return (
    <div className="video-container">
      <video ref={remoteRef} autoPlay />
      <video ref={localRef} autoPlay muted />
    </div>
  );
}
