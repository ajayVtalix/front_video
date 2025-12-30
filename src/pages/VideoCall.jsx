import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { socket } from "../services/socket";

const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export default function VideoCall() {
  const { roomId } = useParams();

  // =========================
  // STATE
  // =========================
  const [role, setRole] = useState(
    window.innerWidth > 768 ? "doctor" : "patient"
  );
  const [isConnected, setIsConnected] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [chat, setChat] = useState([]);
  const [message, setMessage] = useState("");

  const [callDuration, setCallDuration] = useState(0);

  // =========================
  // REFS
  // =========================
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const isMountedRef = useRef(false);
  const isMakingOfferRef = useRef(false);
  const callStartTimeRef = useRef(null);

  // =========================
  // RESPONSIVE ROLE
  // =========================
  useEffect(() => {
    const handleResize = () => {
      setRole(window.innerWidth > 768 ? "doctor" : "patient");
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // =========================
  // MEDIA
  // =========================
  const startMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    if (!isMountedRef.current || !localVideoRef.current) return;

    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;
  };

  // =========================
  // PEER
  // =========================
  const createPeer = (remoteId) => {
    if (peerRef.current) return;

    const pc = new RTCPeerConnection(ICE_CONFIG);
    peerRef.current = pc;

    localStreamRef.current.getTracks().forEach(track =>
      pc.addTrack(track, localStreamRef.current)
    );

    pc.ontrack = (e) => {
      if (!isMountedRef.current || !remoteVideoRef.current) return;

      remoteVideoRef.current.srcObject = e.streams[0];
      setIsConnected(true);

      if (!callStartTimeRef.current) {
        callStartTimeRef.current = Date.now();
      }
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          candidate: e.candidate,
          to: remoteId
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (
        pc.iceConnectionState === "failed" ||
        pc.iceConnectionState === "disconnected"
      ) {
        recoverCall();
      }
    };
  };

  // =========================
  // SIGNALING
  // =========================
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
    if (peerRef.current?.signalingState !== "stable") {
      await peerRef.current.setRemoteDescription(answer);
    }
  };

  const onIceCandidate = async ({ candidate }) => {
    try {
      await peerRef.current?.addIceCandidate(candidate);
    } catch {}
  };

  // =========================
  // CHAT
  // =========================
  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("chat-message", { message });
    setChat(c => [...c, { self: true, text: message }]);
    setMessage("");
  };

  // =========================
  // CONTROLS
  // =========================
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

  // =========================
  // TIMER
  // =========================
  useEffect(() => {
    if (!isConnected || !callStartTimeRef.current) return;

    const interval = setInterval(() => {
      const seconds = Math.floor(
        (Date.now() - callStartTimeRef.current) / 1000
      );
      setCallDuration(seconds);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  const formatTime = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  // =========================
  // EFFECT
  // =========================
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
    socket.on("chat-message", ({ message }) =>
      setChat(c => [...c, { self: false, text: message }])
    );

    socket.on("reconnect", () => {
      socket.emit("join-room", roomId);
    });

    const warn = setTimeout(
      () => alert("⚠ Call will end in 5 minutes"),
      55 * 60 * 1000
    );
    const end = setTimeout(
      () => cleanup(),
      60 * 60 * 1000
    );

    return () => {
      clearTimeout(warn);
      clearTimeout(end);
      cleanup();
    };
  }, [roomId]);

  // =========================
  // RECOVERY
  // =========================
  const recoverCall = async () => {
    if (!isMountedRef.current) return;

    peerRef.current?.close();
    peerRef.current = null;
    isMakingOfferRef.current = false;

    localStreamRef.current?.getTracks().forEach(t => t.stop());
    await startMedia();

    socket.emit("join-room", roomId);
  };

  // =========================
  // CLEANUP
  // =========================
  const cleanup = () => {
    isMountedRef.current = false;
    socket.off();
    socket.disconnect();
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach(t => t.stop());
  };

  // =========================
  // UI
  // =========================
  return (
    <div className={`call-container ${role}`}>
      <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
      <video ref={localVideoRef} autoPlay muted playsInline className="local-video" />

      {isConnected && (
        <>
          <div className="controls">
            <button onClick={toggleAudio}>
              {audioOn ? "Mute" : "Unmute"}
            </button>
            <button onClick={toggleVideo}>
              {videoOn ? "Stop Video" : "Start Video"}
            </button>
          </div>

          <div className="call-timer">
            ⏱ {formatTime(callDuration)}
          </div>

          <div className="chat">
            {chat.map((c, i) => (
              <div key={i}>{c.self ? "You: " : "Peer: "}{c.text}</div>
            ))}
            <input value={message} onChange={e => setMessage(e.target.value)} />
            <button onClick={sendMessage}>Send</button>
          </div>
        </>
      )}
    </div>
  );
}
