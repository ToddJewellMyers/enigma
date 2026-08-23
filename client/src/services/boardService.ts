import { api } from "../api/api";
import type { Board } from "../types/board";

export async function getBoards(workspaceId: string) {
    const response = await api.get<Board[]>(`/boards/${workspaceId}`);
    return response.data;
}

export async function createBoard(workspaceId: string, name: string) {
    const response = await api.post<Board>("/boards?includeDefaultColumns=true", {
        workspaceId,
        name,
    });

    return response.data;
}

export async function deleteBoard(boardId: string) {
    await api.delete(`/boards/${boardId}`);
}
