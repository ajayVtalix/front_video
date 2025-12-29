import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";

const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};

export function useWebRTC(roomId) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);

  const isMountedRef = useRef(false);
  const isMakingOfferRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);

  const startMedia = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    if (!isMountedRef.current) return;

    localStreamRef.current = stream;
    localVideoRef.current.srcObject = stream;
  };

  const createPeer = (remoteId) => {
    if (peerRef.current) return;

    const pc = new RTCPeerConnection(ICE_CONFIG);
    peerRef.current = pc;

    localStreamRef.current.getTracks().forEach(track =>
      pc.addTrack(track, localStreamRef.current)
    );

    pc.ontrack = e => {
      remoteVideoRef.current.srcObject = e.streams[0];
      setIsConnected(true);
    };

    pc.onicecandidate = e => {
      if (e.candidate) {
        socket.emit("ice-candidate", {
          to: remoteId,
          candidate: e.candidate
        });
      }
    };
  };

  useEffect(() => {
    isMountedRef.current = true;
    socket.connect();

    startMedia().then(() => {
      socket.emit("join-room", { roomId });
    });

socket.on("ready", async (remoteId) => {
  if (peerRef.current) return;

  createPeer(remoteId);

  // deterministic offer creation
  const offer = await peerRef.current.createOffer();
  await peerRef.current.setLocalDescription(offer);

  socket.emit("offer", { offer, to: remoteId });
});


socket.on("offer", async ({ offer, from }) => {
  createPeer(from);
  await peerRef.current.setRemoteDescription(offer);

  const answer = await peerRef.current.createAnswer();
  await peerRef.current.setLocalDescription(answer);

  socket.emit("answer", { answer, to: from });
});

socket.on("answer", async ({ answer }) => {
  if (peerRef.current?.signalingState !== "stable") {
    await peerRef.current.setRemoteDescription(answer);
  }
});


    socket.on("ice-candidate", async ({ candidate }) => {
      await peerRef.current?.addIceCandidate(candidate);
    });

    return () => {
      isMountedRef.current = false;
      socket.disconnect();
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [roomId]);

  const toggleAudio = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) {
      t.enabled = !audioOn;
      setAudioOn(!audioOn);
    }
  };

  const toggleVideo = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) {
      t.enabled = !videoOn;
      setVideoOn(!videoOn);
    }
  };

  const endCall = () => {
    socket.emit("end-call", { roomId });
  };

  return {
    localVideoRef,
    remoteVideoRef,
    isConnected,
    audioOn,
    videoOn,
    toggleAudio,
    toggleVideo,
    endCall
  };
}
