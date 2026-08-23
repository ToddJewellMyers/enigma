import { api } from "../api/api";
import type { Workspace, WorkspaceInvitation, WorkspaceMember } from "../types/workspace";

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

export async function getWorkspaceMembers(workspaceId: string) {
    return (await api.get<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`)).data;
}

export async function getWorkspaceInvitations(workspaceId: string) {
    return (await api.get<WorkspaceInvitation[]>(`/workspaces/${workspaceId}/invitations`)).data;
}

export async function inviteWorkspaceMember(workspaceId: string, email: string, role: "Editor" | "Viewer") {
    return (await api.post<WorkspaceInvitation>(`/workspaces/${workspaceId}/invitations`, { email, role })).data;
}

export async function acceptWorkspaceInvitation(token: string) {
    return (await api.post<Workspace>("/workspaces/invitations/accept", { token })).data;
}

export async function updateWorkspaceMemberRole(workspaceId: string, userId: string, role: "Editor" | "Viewer") {
    await api.patch(`/workspaces/${workspaceId}/members/${userId}`, { role });
}

export async function removeWorkspaceMember(workspaceId: string, userId: string) {
    await api.delete(`/workspaces/${workspaceId}/members/${userId}`);
}
