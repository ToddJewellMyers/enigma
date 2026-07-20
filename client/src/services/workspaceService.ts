import { api } from "../api/api";
import type { Workspace } from "../types/workspace";

export async function getWorkspaces() {
    const response = await api.get<Workspace[]>("/workspaces");
    return response.data;
}

export async function createWorkspace(name: string) {
    const response = await api.post<Workspace>("/workspaces", { name });
    return response.data;
}

export async function deleteWorkspace(workspaceId: string) {
    await api.delete(`/workspaces/${workspaceId}`);
}
