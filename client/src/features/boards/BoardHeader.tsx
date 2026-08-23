import { useState } from "react";

type BoardHeaderProps = {
    workspaceName: string;
    boardName?: string;
    onCreate: (name: string) => Promise<void>;
    canEdit: boolean;
    role: string;
    onOpenTeam: () => void;
};

export default function BoardHeader({ workspaceName, boardName, onCreate, canEdit, role, onOpenTeam }: BoardHeaderProps) {
    const [name, setName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    async function create() {
        if (!name.trim()) return;
        setIsCreating(true);
        try {
            await onCreate(name.trim());
            setName("");
        } finally {
            setIsCreating(false);
        }
    }

    return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-sm text-slate-400">{workspaceName} · {role}</p><h1 className="text-3xl font-bold text-white">{boardName ?? "No board yet"}</h1></div>
        <div className="flex w-full gap-3 sm:w-auto">
            <button type="button" onClick={onOpenTeam} className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Team</button>
            {canEdit && <><input value={name} onChange={(event) => setName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void create(); }} placeholder="New board" aria-label="New board name" maxLength={100} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
            <button type="button" onClick={() => void create()} disabled={isCreating || !name.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">{isCreating ? "…" : "+ Board"}</button></>}
        </div>
    </div>;
}
