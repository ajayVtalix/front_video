import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../services/socket";

const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export default function VideoCall() {
  const { roomId } = useParams();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const isMountedRef = useRef(false);
  const isMakingOfferRef = useRef(false);

  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");

  // ======================================================
  // MEDIA
  // ======================================================
  const startMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    if (!isMountedRef.current) return;
    if (!localVideoRef.current) return;

    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;
  };

  // ======================================================
  // PEER CONNECTION
  // ======================================================
  const createPeer = (remoteSocketId) => {
    if (peerRef.current) return;

    const pc = new RTCPeerConnection(ICE_CONFIG);
    peerRef.current = pc;

    localStreamRef.current.getTracks().forEach(track =>
      pc.addTrack(track, localStreamRef.current)
    );

    pc.ontrack = (event) => {
      if (!isMountedRef.current) return;
      if (!remoteVideoRef.current) return;

      remoteVideoRef.current.srcObject = event.streams[0];
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("ice-candidate", {
          candidate: event.candidate,
          to: remoteSocketId
        });
      }
    };
  };

  // ======================================================
  // SIGNALING HANDLERS
  // ======================================================
  const onReady = async (remoteId) => {
    if (isMakingOfferRef.current) return;

    createPeer(remoteId);
    isMakingOfferRef.current = true;

    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);

    socket.emit("offer", { offer, to: remoteId });
  };

  const onOffer = async ({ offer, from }) => {
    createPeer(from);

    await peerRef.current.setRemoteDescription(offer);
    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    socket.emit("answer", { answer, to: from });
  };

  const onAnswer = async ({ answer }) => {
    if (
      peerRef.current &&
      peerRef.current.signalingState !== "stable"
    ) {
      await peerRef.current.setRemoteDescription(answer);
    }
  };

  const onIceCandidate = async ({ candidate }) => {
    try {
      await peerRef.current?.addIceCandidate(candidate);
    } catch {}
  };

  // ======================================================
  // CHAT
  // ======================================================
  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("chat-message", { message });
    setChat(c => [...c, { self: true, text: message }]);
    setMessage("");
  };

  const onChatMessage = ({ message }) => {
    setChat(c => [...c, { self: false, text: message }]);
  };

  // ======================================================
  // CONTROLS
  // ======================================================
  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;

    track.enabled = !audioOn;
    setAudioOn(!audioOn);
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;

    track.enabled = !videoOn;
    setVideoOn(!videoOn);
  };

  // ======================================================
  // EFFECT
  // ======================================================
  useEffect(() => {
    isMountedRef.current = true;
    socket.connect();

    startMedia().then(() => {
      socket.emit("join-room", roomId);
    });

    socket.on("ready", onReady);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIceCandidate);
    socket.on("chat-message", onChatMessage);

    // 55 min warning
    const warnTimer = setTimeout(() => {
      alert("⚠ Call will end in 5 minutes");
    }, 55 * 60 * 1000);

    // 60 min end
    const endTimer = setTimeout(() => {
      alert("⛔ Call ended");
      cleanup();
    }, 60 * 60 * 1000);

    return () => {
      clearTimeout(warnTimer);
      clearTimeout(endTimer);
      cleanup();
    };
  }, [roomId]);

  // ======================================================
  // CLEANUP
  // ======================================================
  const cleanup = () => {
    isMountedRef.current = false;

    socket.off();
    socket.disconnect();

    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
  };

  // ======================================================
  // UI
  // ======================================================
  return (
    <div className="call-container">
      <video ref={remoteVideoRef} autoPlay playsInline />
      <video ref={localVideoRef} autoPlay muted playsInline />

      <div className="controls">
        <button onClick={toggleAudio}>
          {audioOn ? "Mute" : "Unmute"}
        </button>
        <button onClick={toggleVideo}>
          {videoOn ? "Stop Video" : "Start Video"}
        </button>
      </div>

      <div className="chat">
        {chat.map((c, i) => (
          <div key={i}>
            {c.self ? "You: " : "Peer: "}
            {c.text}
          </div>
        ))}
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
