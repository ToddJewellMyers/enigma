import { useCallback, useEffect, useRef, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import Board from "../components/board/Board";
import type { Workspace } from "../types/workspace";
import AccountSettings from "../components/account/AccountSettings";
import WorkspaceTeamDialog from "../components/workspace/WorkspaceTeamDialog";
import { acceptWorkspaceInvitation } from "../services/workspaceService";
import { getErrorMessage } from "../api/errorMessage";
import { useWorkspaceRealtime } from "../realtime/useWorkspaceRealtime";

type DashboardProps = {
    email: string;
    onLogout: () => void;
    onAccountDeleted: () => void;
    onOpenTerminal?: () => void;
    inviteToken: string | null;
    onInviteHandled: () => void;
};

function Dashboard({ email, inviteToken, onInviteHandled, onLogout, onAccountDeleted, onOpenTerminal }: DashboardProps) {
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isTeamOpen, setIsTeamOpen] = useState(false);
    const [notice, setNotice] = useState("");
    const [realtimeRevision, setRealtimeRevision] = useState(0);
    const invitationAttempted = useRef(false);
    const handleRealtimeChange = useCallback(() => setRealtimeRevision((revision) => revision + 1), []);
    const realtimeStatus = useWorkspaceRealtime(selectedWorkspace?.id ?? null, handleRealtimeChange);

    useEffect(() => {
        if (!inviteToken || invitationAttempted.current) return;
        invitationAttempted.current = true;
        acceptWorkspaceInvitation(inviteToken).then((workspace) => {
            setSelectedWorkspace(workspace);
            setNotice(`You joined ${workspace.name}.`);
            localStorage.removeItem("workspace_invite_token");
            window.history.replaceState({}, "", window.location.pathname);
            onInviteHandled();
        }).catch((requestError: unknown) => {
            setNotice(getErrorMessage(requestError, "The workspace invitation could not be accepted."));
            onInviteHandled();
        });
    }, [inviteToken, onInviteHandled]);

    return (
        <AppLayout
            selectedWorkspace={selectedWorkspace}
            onSelectWorkspace={setSelectedWorkspace}
            email={email}
            onLogout={onLogout}
            onOpenAccount={() => setIsAccountOpen(true)}
            onOpenTerminal={onOpenTerminal}
            realtimeStatus={realtimeStatus}
            workspaceRefreshVersion={realtimeRevision}
        >
            {notice && <p role="status" className="mb-4 rounded-lg border border-blue-800 bg-blue-950/40 p-3 text-sm text-blue-200">{notice}</p>}
            <Board selectedWorkspace={selectedWorkspace} onOpenTeam={() => setIsTeamOpen(true)} realtimeRevision={realtimeRevision} />
            {isAccountOpen && <AccountSettings email={email} onClose={() => setIsAccountOpen(false)} onDeleted={onAccountDeleted} />}
            {isTeamOpen && selectedWorkspace && <WorkspaceTeamDialog workspace={selectedWorkspace} onClose={() => setIsTeamOpen(false)} refreshVersion={realtimeRevision} />}
        </AppLayout>
    );
}

export default Dashboard;
