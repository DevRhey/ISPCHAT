import { useContext, useEffect, useState } from "react";
import { SocketContext } from "../../context/Socket/SocketContext";

const useV2Connection = () => {
  const socketManager = useContext(SocketContext);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(true);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (!companyId) {
      setConnected(false);
      setReconnecting(false);
      return undefined;
    }

    const socket = socketManager.getSocket(companyId);

    const onConnect = () => {
      setConnected(true);
      setReconnecting(false);
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onReady = () => {
      setConnected(true);
      setReconnecting(false);
    };

    if (socketManager.socketReady) {
      setConnected(true);
      setReconnecting(false);
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("ready", onReady);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("ready", onReady);
    };
  }, [socketManager]);

  const refresh = () => {
    setReconnecting(true);
    const companyId = localStorage.getItem("companyId");
    if (companyId) {
      socketManager.getSocket(companyId);
    }
    setTimeout(() => setReconnecting(false), 1500);
  };

  return { connected, reconnecting, refresh };
};

export default useV2Connection;
