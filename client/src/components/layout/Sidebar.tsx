import { useEffect, useState } from "react";
import type { Workspace } from "../../types/workspace";
import {
    createWorkspace,
    deleteWorkspace,
    getWorkspaces,
} from "../../services/workspaceService";
import { getErrorMessage } from "../../api/errorMessage";

type SidebarProps = {
    selectedWorkspace: Workspace | null;
    isOpen: boolean;
    onSelectWorkspace: (workspace: Workspace | null) => void;
};

function Sidebar({
    selectedWorkspace,
    isOpen,
    onSelectWorkspace,
}: SidebarProps) {
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [newWorkspaceName, setNewWorkspaceName] = useState("");
    const [error, setError] = useState("");

    async function loadWorkspaces() {
        try {
            const data = await getWorkspaces();
            setWorkspaces(data);
            setError("");

            // Automatically select the first workspace
            if (!selectedWorkspace && data.length > 0) {
                onSelectWorkspace(data[0]);
            }
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Workspaces could not be loaded."));
        }
    }

    async function handleCreateWorkspace() {
        if (!newWorkspaceName.trim()) return;

        try {
            setError("");
            const workspace = await createWorkspace(newWorkspaceName);

            setWorkspaces((prev) => [...prev, workspace]);
            setNewWorkspaceName("");

            onSelectWorkspace(workspace);
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The workspace could not be created."));
        }
    }

    async function handleDeleteWorkspace(workspace: Workspace) {
        if (!window.confirm(`Delete workspace "${workspace.name}" and everything inside it?`)) {
            return;
        }

        try {
            setError("");
            await deleteWorkspace(workspace.id);
            const remainingWorkspaces = workspaces.filter(
                (existingWorkspace) => existingWorkspace.id !== workspace.id
            );
            setWorkspaces(remainingWorkspaces);

            if (selectedWorkspace?.id === workspace.id) {
                onSelectWorkspace(remainingWorkspaces[0] ?? null);
            }
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The workspace could not be deleted."));
        }
    }

    useEffect(() => {
        loadWorkspaces();
    }, []);

    return (
        <aside id="workspace-sidebar" aria-label="Workspace navigation" className={`fixed inset-y-16 left-0 z-40 flex w-[min(20rem,85vw)] flex-col border-r border-slate-800 bg-slate-900 p-5 transition-transform lg:static lg:inset-auto lg:z-auto lg:w-64 lg:shrink-0 lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <h2 className="mb-5 text-xs font-bold uppercase tracking-widest text-slate-400">
                Workspaces
            </h2>

            <nav className="flex flex-col gap-2">
                {workspaces.map((workspace) => (
                    <div
                        key={workspace.id}
                        className={`group flex items-center rounded-lg transition ${selectedWorkspace?.id === workspace.id
                            ? "bg-blue-600 text-white"
                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                            }`}
                    >
                        <button
                            onClick={() => onSelectWorkspace(workspace)}
                            className="min-w-0 flex-1 px-3 py-2 text-left text-sm"
                        >
                            <span className="block truncate">{workspace.name}</span>
                        </button>
                        <button
                            onClick={() => handleDeleteWorkspace(workspace)}
                            aria-label={`Delete workspace ${workspace.name}`}
                            title="Delete workspace"
                            className="mr-1 rounded px-2 py-1 text-sm transition hover:bg-red-500/20 hover:text-red-300 lg:opacity-0 lg:focus:opacity-100 lg:group-hover:opacity-100"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </nav>

            {error && <p role="alert" className="mt-3 rounded-lg bg-red-950/50 p-2 text-xs text-red-300">{error}</p>}

            <div className="mt-auto flex flex-col gap-3">
                <input
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="New workspace"
                    aria-label="New workspace name"
                    maxLength={100}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                />

                <button
                    onClick={handleCreateWorkspace}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                    + Workspace
                </button>
            </div>
        </aside>
    );
}

export default Sidebar;
