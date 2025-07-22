import { io } from "socket.io-client";

// Connect to your backend
export const socket = io(process.env.EXPO_PUBLIC_API_URL as string, {
    transports: ["websocket"],
    autoConnect: false,
});

// Log connection status
socket.on("connect", () => {
    console.log("Connected to Socket.IO server");
});

socket.on("disconnect", () => {
    console.log("Disconnected from Socket.IO server");
});

socket.on("connect_error", (err) => {
    console.error("Socket.IO connection error:", err);
});
