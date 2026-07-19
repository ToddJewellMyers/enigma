import { useState } from "react";
import type { KanbanCard } from "../../types/card";
import type { CardUpdate } from "../../services/cardService";

type CardProps = {
    card: KanbanCard;
    onDelete: () => void;
    onSave: (update: CardUpdate) => Promise<void>;
    onDropCard: (cardId: string) => Promise<void>;
};

function Card({ card, onDelete, onSave, onDropCard }: CardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description ?? "");
    const [priority, setPriority] = useState(card.priority || "Normal");
    const [dueDate, setDueDate] = useState(card.dueDate?.slice(0, 10) ?? "");
    const [isSaving, setIsSaving] = useState(false);
    const [isDropTarget, setIsDropTarget] = useState(false);

    async function handleSave() {
        if (!title.trim()) return;

        setIsSaving(true);
        try {
            await onSave({
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                dueDate: dueDate || undefined,
            });
            setIsEditing(false);
        } finally {
            setIsSaving(false);
        }
    }

    function handleCancel() {
        setTitle(card.title);
        setDescription(card.description ?? "");
        setPriority(card.priority || "Normal");
        setDueDate(card.dueDate?.slice(0, 10) ?? "");
        setIsEditing(false);
    }

    if (isEditing) {
        return (
            <article data-card-id={card.id} className="rounded-xl border border-blue-500 bg-slate-800 p-4 shadow-sm">
                <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    aria-label="Card title"
                    maxLength={200}
                    className="mb-2 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-sm text-white outline-none focus:border-blue-500"
                />
                <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    aria-label="Card description"
                    placeholder="Description"
                    rows={3}
                    maxLength={4000}
                    className="mb-2 w-full resize-none rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-blue-500"
                />
                <div className="mb-3 grid grid-cols-2 gap-2">
                    <select
                        value={priority}
                        onChange={(event) => setPriority(event.target.value)}
                        aria-label="Card priority"
                        className="rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white"
                    >
                        <option>Low</option>
                        <option>Normal</option>
                        <option>High</option>
                        <option>Urgent</option>
                    </select>
                    <input
                        type="date"
                        value={dueDate}
                        onChange={(event) => setDueDate(event.target.value)}
                        onInput={(event) => setDueDate(event.currentTarget.value)}
                        aria-label="Card due date"
                        className="rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white"
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button onClick={handleCancel} className="rounded px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">Cancel</button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50"
                    >
                        {isSaving ? "Saving…" : "Save"}
                    </button>
                </div>
            </article>
        );
    }

    return (
        <article
            draggable
            data-card-id={card.id}
            onDragStart={(event) => {
                event.dataTransfer.effectAllowed = "move";
                event.dataTransfer.setData("text/plain", card.id);
            }}
            onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
                event.dataTransfer.dropEffect = "move";
                setIsDropTarget(true);
            }}
            onDragLeave={() => setIsDropTarget(false)}
            onDrop={async (event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsDropTarget(false);
                const cardId = event.dataTransfer.getData("text/plain");
                if (cardId && cardId !== card.id) await onDropCard(cardId);
            }}
            className={`cursor-grab rounded-xl border bg-slate-800 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 active:cursor-grabbing ${
                isDropTarget ? "border-blue-400 ring-2 ring-blue-500/40" : "border-slate-700"
            }`}
        >
            <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-white">{card.title}</h3>
                <div className="flex">
                    <button onClick={() => setIsEditing(true)} aria-label={`Edit card ${card.title}`} title="Edit card" className="rounded px-2 text-sm text-slate-500 transition hover:bg-blue-500/20 hover:text-blue-300">Edit</button>
                    <button
                        onClick={() => {
                            if (window.confirm(`Delete card "${card.title}"?`)) onDelete();
                        }}
                        aria-label={`Delete card ${card.title}`}
                        title="Delete card"
                        className="rounded px-2 text-lg leading-5 text-slate-500 transition hover:bg-red-500/20 hover:text-red-300"
                    >×</button>
                </div>
            </div>

            <p className="mb-3 text-xs leading-5 text-slate-400">
                {card.description || "No description added yet."}
            </p>

            <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-600/20 px-2 py-1 text-xs font-semibold text-blue-300">
                    {card.priority}
                </span>

                <span className="text-xs text-slate-500">
                    {card.dueDate ? `Due ${new Date(card.dueDate).toLocaleDateString()}` : "No due date"}
                </span>
            </div>
        </article>
    );
}

export default Card;
