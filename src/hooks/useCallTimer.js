import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";

export function useCallTimer(isConnected) {
  const startRef = useRef(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    socket.on("call-start-time", ({ startTime }) => {
      startRef.current = startTime;
    });

    return () => socket.off("call-start-time");
  }, []);

  useEffect(() => {
    if (!isConnected || !startRef.current) return;

    const i = setInterval(() => {
      setSeconds(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    return () => clearInterval(i);
  }, [isConnected]);

  return seconds;
}
