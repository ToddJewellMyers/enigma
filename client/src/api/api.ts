import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "/api";

export const api = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("kanban_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});
