// import { useState } from "react";
// import { useNavigate } from "react-router-dom";

// export default function JoinRoom() {
//   const [room, setRoom] = useState("");
//   const navigate = useNavigate();

//   return (
//     <div style={{ padding: 20 }}>
//       <h2>Join Video Call</h2>
//       <input
//         placeholder="Enter room name"
//         value={room}
//         onChange={e => setRoom(e.target.value)}
//       />
//       <button onClick={() => navigate(`/call/${room}`)}>
//         Join
//       </button>
//     </div>
//   );
// }


import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function JoinRoom() {
  const [room, setRoom] = useState("");
  const navigate = useNavigate();

  return (
    <div>
      <h2>Join Room</h2>
      <input
        placeholder="room-id"
        value={room}
        onChange={e => setRoom(e.target.value)}
      />
      <button onClick={() => navigate(`/call/${room}`)}>
        Join
      </button>
    </div>
  );
}
