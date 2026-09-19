import axios from "axios";

const api = axios.create({
	baseURL: process.env.REACT_APP_BACKEND_URL,
	withCredentials: true,
	timeout: 20000,
});

export const openApi = axios.create({
	baseURL: process.env.REACT_APP_BACKEND_URL,
	timeout: 20000,
});

export default api;
