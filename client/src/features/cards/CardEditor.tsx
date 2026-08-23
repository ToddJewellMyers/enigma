import { useEffect, useState } from "react";
import type { KanbanCard } from "../../types/card";
import type { CardUpdate } from "../../services/cardService";
import type { WorkspaceMember } from "../../types/workspace";
import { getWorkspaceMembers } from "../../services/workspaceService";

type CardEditorProps = { card: KanbanCard; workspaceId: string; onCancel: () => void; onSave: (update: CardUpdate) => Promise<void> };

export default function CardEditor({ card, workspaceId, onCancel, onSave }: CardEditorProps) {
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description ?? "");
    const [priority, setPriority] = useState(card.priority || "Normal");
    const [dueDate, setDueDate] = useState(card.dueDate?.slice(0, 10) ?? "");
    const [assigneeUserId, setAssigneeUserId] = useState(card.assigneeUserId ?? "");
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    async function save() {
        if (!title.trim()) return;
        setIsSaving(true);
        try {
            await onSave({
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : undefined,
                assigneeUserId: assigneeUserId || undefined,
            });
        } finally { setIsSaving(false); }
    }

    useEffect(() => {
        void getWorkspaceMembers(workspaceId).then(setMembers);
    }, [workspaceId]);

    return <article data-card-id={card.id} className="mahogany-card rounded-xl border border-blue-500 bg-slate-800 p-4 shadow-sm">
        <input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Card title" maxLength={200} className="mb-2 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-sm text-white outline-none focus:border-blue-500" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} aria-label="Card description" placeholder="Description" rows={3} maxLength={4000} className="mb-2 w-full resize-none rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-blue-500" />
        <div className="mb-3 grid grid-cols-2 gap-2">
            <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Card priority" className="rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white"><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option></select>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} onInput={(event) => setDueDate(event.currentTarget.value)} aria-label="Card due date" className="rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white" />
        </div>
        <select value={assigneeUserId} onChange={(event) => setAssigneeUserId(event.target.value)} aria-label="Card assignee" className="mb-3 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white">
            <option value="">Unassigned</option>
            {members.map((member) => <option value={member.userId} key={member.userId}>{member.email}</option>)}
        </select>
        <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">Cancel</button><button type="button" onClick={() => void save()} disabled={isSaving || !title.trim()} className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50">{isSaving ? "Saving…" : "Save"}</button></div>
    </article>;
}
