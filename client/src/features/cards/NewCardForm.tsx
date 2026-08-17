import { useState } from "react";

type NewCardFormProps = { columnTitle: string; onCreate: (title: string) => Promise<void> };

export default function NewCardForm({ columnTitle, onCreate }: NewCardFormProps) {
    const [title, setTitle] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    async function create() {
        if (!title.trim()) return;
        setIsCreating(true);
        try { await onCreate(title.trim()); setTitle(""); } finally { setIsCreating(false); }
    }
    return <div className="mb-3 flex gap-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void create(); }} placeholder="New card" aria-label={`New card title for ${columnTitle}`} maxLength={200} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" />
        <button type="button" aria-label={`Add card to ${columnTitle}`} onClick={() => void create()} disabled={isCreating || !title.trim()} className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{isCreating ? "…" : "+"}</button>
    </div>;
}
