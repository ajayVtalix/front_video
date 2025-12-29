import { useEffect, useRef, useState } from "react";
import { socket } from "../services/socket";

export default function ChatPanel({ isOpen, onClose }) {
  const [message, setMessage] = useState("");
  const messagesRef = useRef(null);

  const sendMessage = () => {
    if (!message.trim()) return;

    socket.emit("chat-message", { message });
    addMessage(message, "sent");
    setMessage("");
  };

  const addMessage = (text, type) => {
    const el = document.createElement("div");
    el.className = `chat-message ${type}`;
    el.innerHTML = `
      <div>${text}</div>
      <div class="timestamp">${new Date().toLocaleTimeString()}</div>
    `;
    messagesRef.current.appendChild(el);
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  };

  useEffect(() => {
    socket.on("chat-message", ({ message }) => {
      addMessage(message, "received");
    });

    return () => socket.off("chat-message");
  }, []);

  if (!isOpen) return null;

  return (
    <div className="chat-section active">
      <div className="chat-header">
        <h3>Chat</h3>
        <button onClick={onClose}>✕</button>
      </div>

      <div ref={messagesRef} className="chat-messages"></div>

      <div className="chat-input-container">
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
