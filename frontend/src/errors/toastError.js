import { toast } from "react-toastify";
import { i18n } from "../translate/i18n";
import { isString } from "lodash";

const toastOpts = (toastId) => ({
  toastId,
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light"
});

const toastError = (err) => {
  const errorCode = err?.response?.status;
  const errorMsg = err?.response?.data?.error;
  const networkOffline = typeof navigator !== "undefined" && !navigator.onLine;

  if (networkOffline || err?.message === "Network Error") {
    toast.error("Sem conexão com o servidor. Verifique sua internet.", toastOpts("offline"));
    return;
  }

  if (errorCode === 500) {
    const msg =
      (errorMsg && i18n.exists(`backendErrors.${errorMsg}`)
        ? i18n.t(`backendErrors.${errorMsg}`)
        : errorMsg) ||
      "Erro interno do servidor. Tente novamente ou contate o suporte.";
    toast.error(msg, toastOpts(errorMsg || "server-500"));
    console.error("HTTP 500:", errorMsg || err);
    return;
  }

  if (errorMsg) {
    if (i18n.exists(`backendErrors.${errorMsg}`)) {
      toast.error(i18n.t(`backendErrors.${errorMsg}`), toastOpts(errorMsg));
      return;
    }
    toast.error(errorMsg, toastOpts(errorMsg));
    return;
  }

  if (isString(err)) {
    toast.error(err, toastOpts(err));
    return;
  }

  toast.error("Ocorreu um erro inesperado.", toastOpts("generic-error"));
};

export default toastError;
