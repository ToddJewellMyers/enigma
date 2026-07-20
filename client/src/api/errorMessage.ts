import axios from "axios";

type ValidationProblem = {
    detail?: string;
    title?: string;
    errors?: Record<string, string[]>;
};

export function getErrorMessage(error: unknown, fallback: string) {
    if (!axios.isAxiosError(error)) return fallback;

    const data = error.response?.data as ValidationProblem | string | undefined;
    if (typeof data === "string" && data.trim()) return data;
    if (data && typeof data === "object" && data.errors) {
        const firstMessage = Object.values(data.errors).flat()[0];
        if (firstMessage) return firstMessage;
    }
    if (data && typeof data === "object" && data.detail) return data.detail;
    if (data && typeof data === "object" && data.title && data.title !== "One or more validation errors occurred.") return data.title;
    if (!error.response) return "The server could not be reached. Please try again shortly.";
    if (error.response.status === 401) return "Your session has expired. Please log in again.";
    if (error.response.status === 403) return "You do not have permission to do that.";
    if (error.response.status === 404) return "That item no longer exists.";
    return fallback;
}
