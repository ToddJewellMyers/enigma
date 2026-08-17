import { api } from "../api/api";

export type AuthResponse = { token: string; email: string };
export type MessageResponse = { message: string };

export async function register(email: string, password: string) {
    return (await api.post<MessageResponse>("/auth/register", { email, password })).data;
}

export async function login(email: string, password: string) {
    return (await api.post<AuthResponse>("/auth/login", { email, password })).data;
}

export async function verifyEmail(token: string) {
    return (await api.post<AuthResponse>("/auth/verify-email", { token })).data;
}

export async function forgotPassword(email: string) {
    return (await api.post<MessageResponse>("/auth/forgot-password", { email })).data;
}

export async function resetPassword(token: string, password: string) {
    return (await api.post<MessageResponse>("/auth/reset-password", { token, password })).data;
}
