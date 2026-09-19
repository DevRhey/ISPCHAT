import React, { useEffect, useState } from "react";
import { Snackbar, Button } from "@material-ui/core";

const OfflineBanner = () => {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false
  );

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  return (
    <Snackbar
      open={offline}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      message="Você está offline — algumas ações não funcionarão até a conexão voltar."
      action={
        <Button color="inherit" size="small" onClick={() => window.location.reload()}>
          Tentar
        </Button>
      }
    />
  );
};

export default OfflineBanner;
