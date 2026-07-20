import { api } from "../api/api";

export type AuthResponse = { token: string; email: string };

export async function register(email: string, password: string) {
    return (await api.post<AuthResponse>("/auth/register", { email, password })).data;
}

export async function login(email: string, password: string) {
    return (await api.post<AuthResponse>("/auth/login", { email, password })).data;
}
