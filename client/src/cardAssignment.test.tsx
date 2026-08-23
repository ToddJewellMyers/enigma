import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CardEditor from "./features/cards/CardEditor";
import * as workspaceService from "./services/workspaceService";

vi.mock("./services/workspaceService", () => ({ getWorkspaceMembers: vi.fn() }));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("card assignments", () => {
    it("lets an editor select a workspace member as the assignee", async () => {
        vi.mocked(workspaceService.getWorkspaceMembers).mockResolvedValue([
            { userId: "owner-id", email: "owner@example.com", role: "Owner", joinedAt: "2026-08-23T00:00:00Z" },
            { userId: "partner-id", email: "partner@example.com", role: "Editor", joinedAt: "2026-08-23T00:00:00Z" },
        ]);
        const onSave = vi.fn().mockResolvedValue(undefined);

        render(<CardEditor card={{
            id: "card-id", kanbanColumnId: "column-id", title: "Shared task", position: 1,
            priority: "Normal", createdAt: "2026-08-23T00:00:00Z",
        }} workspaceId="workspace-id" onCancel={() => undefined} onSave={onSave} />);

        await screen.findByRole("option", { name: "partner@example.com" });
        fireEvent.change(screen.getByLabelText("Card assignee"), { target: { value: "partner-id" } });
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ assigneeUserId: "partner-id" })));
    });
});
