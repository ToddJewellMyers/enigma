export interface Workspace {
    id: string;
    name: string;
    createdAt: string;
    role: "Owner" | "Editor" | "Viewer";
    memberCount: number;
}

export interface WorkspaceMember {
    userId: string;
    email: string;
    role: "Owner" | "Editor" | "Viewer";
    joinedAt: string;
}

export interface WorkspaceInvitation {
    id: string;
    email: string;
    role: "Editor" | "Viewer";
    expiresAt: string;
    inviteUrl?: string;
    emailSent?: boolean;
}
