import { useState, useEffect } from "react";
import { socket } from "../services/socket";

export default function ChatPanel({ roomId }) {
  const [chat, setChat] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    socket.on("chat-message", ({ message }) => {
      setChat(c => [...c, { self: false, text: message }]);
    });
    return () => socket.off("chat-message");
  }, []);

  const send = () => {
    if (!msg.trim()) return;

    socket.emit("chat-message", { roomId, message: msg });
    setChat(c => [...c, { self: true, text: msg }]);
    setMsg("");
  };

  return (
    <div className="chat">
      {chat.map((c, i) => (
        <div key={i}>{c.self ? "You: " : "Peer: "}{c.text}</div>
      ))}
      <input value={msg} onChange={e => setMsg(e.target.value)} />
      <button onClick={send}>Send</button>
    </div>
  );
}
