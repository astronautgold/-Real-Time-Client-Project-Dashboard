import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeUsersCount: number;
  joinProjectBoard: (projectId: string) => void;
  leaveProjectBoard: (projectId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(0);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      auth: { token },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ Socket disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('presence:update', (data: { activeUsersCount: number }) => {
      setActiveUsersCount(data.activeUsersCount);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token, user?.id]);

  const joinProjectBoard = (projectId: string) => {
    if (socket && isConnected) {
      socket.emit('join:project', projectId);
    }
  };

  const leaveProjectBoard = (projectId: string) => {
    if (socket && isConnected) {
      socket.emit('leave:project', projectId);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        activeUsersCount,
        joinProjectBoard,
        leaveProjectBoard,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
