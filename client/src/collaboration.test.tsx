import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import WorkspaceTeamDialog from "./components/workspace/WorkspaceTeamDialog";
import * as workspaceService from "./services/workspaceService";

vi.mock("./services/workspaceService", () => ({
    getWorkspaceMembers: vi.fn(),
    getWorkspaceInvitations: vi.fn(),
    inviteWorkspaceMember: vi.fn(),
    removeWorkspaceMember: vi.fn(),
    updateWorkspaceMemberRole: vi.fn(),
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe("workspace collaboration", () => {
    it("lets an owner invite an editor and displays existing members", async () => {
        vi.mocked(workspaceService.getWorkspaceMembers).mockResolvedValue([{
            userId: "owner-id", email: "owner@example.com", role: "Owner", joinedAt: "2026-08-22T00:00:00Z",
        }]);
        vi.mocked(workspaceService.getWorkspaceInvitations).mockResolvedValue([]);
        vi.mocked(workspaceService.inviteWorkspaceMember).mockResolvedValue({
            id: "invite-id", email: "partner@example.com", role: "Editor", expiresAt: "2026-08-29T00:00:00Z",
        });

        render(<WorkspaceTeamDialog workspace={{
            id: "workspace-id", name: "StoopidGames Projects", createdAt: "2026-08-22T00:00:00Z", role: "Owner", memberCount: 1,
        }} onClose={() => undefined} />);

        expect(await screen.findByText("owner@example.com")).toBeTruthy();
        fireEvent.change(screen.getByLabelText("Teammate email"), { target: { value: "partner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Send invite" }));

        await waitFor(() => expect(workspaceService.inviteWorkspaceMember).toHaveBeenCalledWith("workspace-id", "partner@example.com", "Editor"));
    });

    it("keeps invitation controls hidden from viewers", async () => {
        vi.mocked(workspaceService.getWorkspaceMembers).mockResolvedValue([]);
        render(<WorkspaceTeamDialog workspace={{
            id: "workspace-id", name: "Shared Roadmap", createdAt: "2026-08-22T00:00:00Z", role: "Viewer", memberCount: 2,
        }} onClose={() => undefined} />);
        await waitFor(() => expect(workspaceService.getWorkspaceMembers).toHaveBeenCalled());
        expect(screen.queryByRole("button", { name: "Send invite" })).toBeNull();
    });

    it("shows a copyable link when invitation email delivery fails", async () => {
        vi.mocked(workspaceService.getWorkspaceMembers).mockResolvedValue([]);
        vi.mocked(workspaceService.getWorkspaceInvitations).mockResolvedValue([]);
        vi.mocked(workspaceService.inviteWorkspaceMember).mockResolvedValue({
            id: "invite-id", email: "partner@example.com", role: "Editor", expiresAt: "2026-08-30T00:00:00Z",
            inviteUrl: "https://example.com/?inviteToken=secret", emailSent: false,
        });

        render(<WorkspaceTeamDialog workspace={{
            id: "workspace-id", name: "Shared Project", createdAt: "2026-08-23T00:00:00Z", role: "Owner", memberCount: 1,
        }} onClose={() => undefined} />);

        fireEvent.change(await screen.findByLabelText("Teammate email"), { target: { value: "partner@example.com" } });
        fireEvent.click(screen.getByRole("button", { name: "Send invite" }));

        expect(await screen.findByRole("button", { name: "Copy invite link" })).toBeTruthy();
        expect((screen.getByLabelText("Invitation link") as HTMLInputElement).value).toContain("inviteToken=");
    });
});
