export interface KanbanCard {
    id: string;
    kanbanColumnId: string;
    title: string;
    description?: string;
    position: number;
    priority: string;
    dueDate?: string;
    assigneeUserId?: string;
    assigneeEmail?: string;
    attachments?: CardAttachment[];
    createdAt: string;
}

export interface CardAttachment {
    id: string;
    kanbanCardId: string;
    fileName: string;
    contentType: string;
    size: number;
    createdAt: string;
}
