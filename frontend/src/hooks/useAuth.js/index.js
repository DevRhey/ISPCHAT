import { useState, useEffect, useContext, useRef } from "react";
import { useHistory } from "react-router-dom";
import { has, isArray } from "lodash";

import { toast } from "react-toastify";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import toastError from "../../errors/toastError";
import { SocketContext } from "../../context/Socket/SocketContext";
import moment from "moment";

let interceptorsReady = false;

const useAuth = () => {
  const history = useHistory();
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({});
  const refreshingRef = useRef(false);

  const clearSession = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("companyId");
    localStorage.removeItem("userId");
    localStorage.removeItem("cshow");
    api.defaults.headers.Authorization = undefined;
    setIsAuth(false);
  };

  const refreshSession = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    const { data } = await api.post("/auth/refresh_token", {
      refreshToken: refreshToken ? JSON.parse(refreshToken) : undefined
    });
    if (data?.token) {
      localStorage.setItem("token", JSON.stringify(data.token));
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", JSON.stringify(data.refreshToken));
      }
      api.defaults.headers.Authorization = `Bearer ${data.token}`;
      setIsAuth(true);
      if (data.user) setUser(data.user);
    }
    return data;
  };

  useEffect(() => {
    if (interceptorsReady) return;
    interceptorsReady = true;

    api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("token");
        if (token) {
          config.headers["Authorization"] = `Bearer ${JSON.parse(token)}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config || {};
        const status = error?.response?.status;
        const url = originalRequest.url || "";

        // Evita loop em endpoints de auth
        if (url.includes("/auth/login") || url.includes("/auth/refresh_token")) {
          return Promise.reject(error);
        }

        if (status === 403 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            if (!refreshingRef.current) {
              refreshingRef.current = true;
              await refreshSession();
              refreshingRef.current = false;
            }
            return api(originalRequest);
          } catch (refreshErr) {
            refreshingRef.current = false;
            clearSession();
            return Promise.reject(refreshErr);
          }
        }

        // Só desloga em 401 se havia sessão ativa e não for retry de refresh
        if (status === 401 && localStorage.getItem("token") && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await refreshSession();
            return api(originalRequest);
          } catch (refreshErr) {
            clearSession();
            return Promise.reject(refreshErr);
          }
        }

        return Promise.reject(error);
      }
    );
  }, []);

  const socketManager = useContext(SocketContext);

  useEffect(() => {
    const token = localStorage.getItem("token");
    (async () => {
      if (token) {
        try {
          api.defaults.headers.Authorization = `Bearer ${JSON.parse(token)}`;
          const data = await refreshSession();
          setIsAuth(true);
          if (data?.user) setUser(data.user);
        } catch (err) {
          // Token de acesso ainda pode ser válido: tenta /auth/me
          try {
            const { data } = await api.get("/auth/me");
            const companyId = localStorage.getItem("companyId");
            setIsAuth(true);
            setUser((prev) => ({
              ...prev,
              ...data,
              companyId: data.companyId || (companyId ? Number(companyId) : prev.companyId)
            }));
          } catch (meErr) {
            clearSession();
            toastError(err);
          }
        }
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const companyId = localStorage.getItem("companyId");
    if (companyId) {
      const socket = socketManager.getSocket(companyId);

      socket.on(`company-${companyId}-user`, (data) => {
        if (data.action === "update" && data.user.id === user.id) {
          setUser(data.user);
        }
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [socketManager, user]);

  const handleLogin = async (userData) => {
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", userData);
      const {
        user: { companyId, id, company },
      } = data;

      if (has(company, "settings") && isArray(company.settings)) {
        const setting = company.settings.find(
          (s) => s.key === "campaignsEnabled"
        );
        if (setting && setting.value === "true") {
          localStorage.setItem("cshow", null);
        }
      }

      moment.locale("pt-br");
      const dueDate = data.user.company.dueDate;
      const vencimento = moment(dueDate).format("DD/MM/yyyy");

      var diff = moment(dueDate).diff(moment(moment()).format());
      var before = moment(moment().format()).isBefore(dueDate);
      var dias = moment.duration(diff).asDays();

      if (before === true) {
        localStorage.setItem("token", JSON.stringify(data.token));
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", JSON.stringify(data.refreshToken));
        }
        localStorage.setItem("companyId", companyId);
        localStorage.setItem("userId", id);
        localStorage.setItem("companyDueDate", vencimento);
        api.defaults.headers.Authorization = `Bearer ${data.token}`;
        setUser(data.user);
        setIsAuth(true);
        toast.success(i18n.t("auth.toasts.success"));
        if (Math.round(dias) < 5) {
          toast.warn(
            `Sua assinatura vence em ${Math.round(dias)} ${
              Math.round(dias) === 1 ? "dia" : "dias"
            } `
          );
        }
        history.push("/tickets");
        setLoading(false);
      } else {
        toastError(`Opss! Sua assinatura venceu ${vencimento}.
Entre em contato com o Suporte para mais informações! `);
        setLoading(false);
      }
    } catch (err) {
      toastError(err);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);

    try {
      await api.delete("/auth/logout");
    } catch (err) {
      // segue com limpeza local mesmo se o logout remoto falhar
    }

    clearSession();
    setUser({});
    setLoading(false);
    history.push("/login");
  };

  const getCurrentUserInfo = async () => {
    try {
      const { data } = await api.get("/auth/me");
      return data;
    } catch (err) {
      toastError(err);
    }
  };

  return {
    isAuth,
    user,
    loading,
    handleLogin,
    handleLogout,
    getCurrentUserInfo,
  };
};

export default useAuth;
