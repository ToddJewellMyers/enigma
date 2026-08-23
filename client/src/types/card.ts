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
    createdAt: string;
}
