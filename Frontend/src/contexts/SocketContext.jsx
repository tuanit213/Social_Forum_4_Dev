import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "@/services/authService";

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ user, children }) => {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user && (user._id || user.id)) {
      const userId = user._id || user.id;
      const token = getAccessToken();
      // Kết nối tới server
      const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace("/api", "") : "http://localhost:5000";
      
      const newSocket = io(socketUrl, {
        withCredentials: true,
        auth: {
          token
        }
      });

      setSocket(newSocket);

      newSocket.on("connect", () => {
        newSocket.emit("join", userId);
      });

      return () => {
        newSocket.disconnect();
      };
    } else if (!user && socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
