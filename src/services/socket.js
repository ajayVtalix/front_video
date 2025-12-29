// import { io } from "socket.io-client";

// export const socket = io("http://localhost:3044", {
//   autoConnect: false,
//   transports: ["websocket", "polling"]
// });


import { io } from "socket.io-client";

export const socket = io("http://localhost:3044", {
  autoConnect: false
});
