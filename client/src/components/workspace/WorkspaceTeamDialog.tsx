import { useCallback, useEffect, useState } from "react";
import { getErrorMessage } from "../../api/errorMessage";
import {
    getWorkspaceInvitations,
    getWorkspaceMembers,
    inviteWorkspaceMember,
    removeWorkspaceMember,
    updateWorkspaceMemberRole,
} from "../../services/workspaceService";
import type { Workspace, WorkspaceInvitation, WorkspaceMember } from "../../types/workspace";

type Props = { workspace: Workspace; onClose: () => void; refreshVersion?: number };

export default function WorkspaceTeamDialog({ workspace, onClose, refreshVersion = 0 }: Props) {
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
    const [email, setEmail] = useState("");
    const [role, setRole] = useState<"Editor" | "Viewer">("Editor");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const isOwner = workspace.role === "Owner";

    const load = useCallback(async () => {
        try {
            const [nextMembers, nextInvitations] = await Promise.all([
                getWorkspaceMembers(workspace.id),
                isOwner ? getWorkspaceInvitations(workspace.id) : Promise.resolve([]),
            ]);
            setMembers(nextMembers);
            setInvitations(nextInvitations);
            setError("");
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Team details could not be loaded."));
        }
    }, [isOwner, workspace.id]);

    useEffect(() => { void load(); }, [load, refreshVersion]);

    async function invite() {
        if (!email.trim()) return;
        setBusy(true);
        try {
            await inviteWorkspaceMember(workspace.id, email.trim(), role);
            setEmail("");
            await load();
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The invitation could not be sent."));
        } finally {
            setBusy(false);
        }
    }

    async function changeRole(member: WorkspaceMember, nextRole: "Editor" | "Viewer") {
        try {
            await updateWorkspaceMemberRole(workspace.id, member.userId, nextRole);
            await load();
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The member role could not be updated."));
        }
    }

    async function remove(member: WorkspaceMember) {
        if (!window.confirm(`Remove ${member.email} from this workspace?`)) return;
        try {
            await removeWorkspaceMember(workspace.id, member.userId);
            await load();
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The member could not be removed."));
        }
    }

    return <div role="dialog" aria-modal="true" aria-labelledby="team-dialog-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4">
        <section className="mahogany-modal max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
                <div><p className="text-sm text-blue-300">{workspace.name}</p><h2 id="team-dialog-title" className="text-2xl font-bold text-white">Workspace team</h2></div>
                <button type="button" onClick={onClose} aria-label="Close team settings" className="rounded-lg px-3 py-1 text-2xl text-slate-400 hover:bg-slate-800 hover:text-white">×</button>
            </div>

            {isOwner && <div className="mt-6 rounded-xl border border-slate-700 bg-slate-950/60 p-4">
                <h3 className="font-semibold text-white">Invite a teammate</h3>
                <p className="mt-1 text-sm text-slate-400">Editors can change boards and cards. Viewers have read-only access.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="partner@example.com" aria-label="Teammate email" className="min-w-0 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
                    <select value={role} onChange={(event) => setRole(event.target.value as "Editor" | "Viewer")} aria-label="Invitation role" className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"><option>Editor</option><option>Viewer</option></select>
                    <button type="button" onClick={() => void invite()} disabled={busy || !email.trim()} className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "Sending…" : "Send invite"}</button>
                </div>
            </div>}

            {error && <p role="alert" className="mt-4 rounded-lg bg-red-950/50 p-3 text-sm text-red-300">{error}</p>}

            <div className="mt-6">
                <h3 className="font-semibold text-white">Members</h3>
                <div className="mt-3 space-y-2">{members.map((member) => <div key={member.userId} className="flex flex-col gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1"><p className="truncate text-sm text-white">{member.email}</p><p className="text-xs text-slate-500">Joined {new Date(member.joinedAt).toLocaleDateString()}</p></div>
                    {isOwner && member.role !== "Owner" ? <><select value={member.role} onChange={(event) => void changeRole(member, event.target.value as "Editor" | "Viewer")} aria-label={`Role for ${member.email}`} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"><option>Editor</option><option>Viewer</option></select><button type="button" onClick={() => void remove(member)} className="rounded-lg px-3 py-2 text-sm text-red-300 hover:bg-red-950/50">Remove</button></> : <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">{member.role}</span>}
                </div>)}</div>
            </div>

            {isOwner && invitations.length > 0 && <div className="mt-6"><h3 className="font-semibold text-white">Pending invitations</h3><div className="mt-3 space-y-2">{invitations.map((invitation) => <div key={invitation.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 p-3"><span className="truncate text-sm text-slate-300">{invitation.email}</span><span className="text-xs text-slate-500">{invitation.role} · expires {new Date(invitation.expiresAt).toLocaleDateString()}</span></div>)}</div></div>}
        </section>
    </div>;
}
