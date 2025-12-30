// import { io } from "socket.io-client";

// export const socket = io("http://localhost:3044", {
//   autoConnect: false,
//   transports: ["websocket", "polling"]
// });


import { io } from "socket.io-client";

export const socket = io("https://back-signal.onrender.com/", {
// export const socket = io("http://192.168.1.15:3044", {
  autoConnect: false
});
