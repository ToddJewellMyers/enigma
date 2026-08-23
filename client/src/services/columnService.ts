import { api } from "../api/api";
import type { KanbanColumn } from "../types/column";

export async function getColumns(boardId: string) {
    const response = await api.get<KanbanColumn[]>(`/columns/${boardId}`);
    return response.data;
}

export async function createColumn(
    boardId: string,
    name: string,
    position: number
) {
    const response = await api.post<KanbanColumn>("/columns", {
        boardId,
        name,
        position,
    });

    return response.data;
}

export async function deleteColumn(columnId: string) {
    await api.delete(`/columns/${columnId}`);
}
