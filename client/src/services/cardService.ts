import { api } from "../api/api";
import type { CardAttachment, KanbanCard } from "../types/card";

export async function getCards(columnId: string) {
    const response = await api.get<KanbanCard[]>(`/cards/${columnId}`);
    return response.data;
}

export async function createCard(columnId: string, title: string, position: number) {
    const response = await api.post<KanbanCard>("/cards", {
        kanbanColumnId: columnId,
        title,
        position,
        priority: "Normal",
    });

    return response.data;
}

export async function moveCard(cardId: string, columnId: string, position: number) {
    const response = await api.put<KanbanCard>(`/cards/${cardId}/move`, {
        kanbanColumnId: columnId,
        position,
    });

    return response.data;
}

export async function deleteCard(cardId: string) {
    await api.delete(`/cards/${cardId}`);
}

export type CardUpdate = {
    title: string;
    description?: string;
    priority: string;
    dueDate?: string;
    assigneeUserId?: string;
};

export async function updateCard(cardId: string, update: CardUpdate) {
    const response = await api.put<KanbanCard>(`/cards/${cardId}`, update);
    return response.data;
}

export async function uploadCardAttachment(cardId: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return (await api.post<CardAttachment>(`/cards/${cardId}/attachments`, form)).data;
}

export async function getCardAttachment(cardId: string, attachmentId: string) {
    return (await api.get<Blob>(`/cards/${cardId}/attachments/${attachmentId}`, { responseType: "blob" })).data;
}

export async function deleteCardAttachment(cardId: string, attachmentId: string) {
    await api.delete(`/cards/${cardId}/attachments/${attachmentId}`);
}
