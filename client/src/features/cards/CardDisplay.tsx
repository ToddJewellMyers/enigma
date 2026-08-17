import { useState } from "react";
import type { KanbanCard } from "../../types/card";

type CardDisplayProps = { card: KanbanCard; onEdit: () => void; onDelete: () => void; onDropCard: (cardId: string) => Promise<void> };

export default function CardDisplay({ card, onEdit, onDelete, onDropCard }: CardDisplayProps) {
    const [isDropTarget, setIsDropTarget] = useState(false);
    return <article draggable data-card-id={card.id} onDragStart={(event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", card.id); }} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; setIsDropTarget(true); }} onDragLeave={() => setIsDropTarget(false)} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); setIsDropTarget(false); const cardId = event.dataTransfer.getData("text/plain"); if (cardId && cardId !== card.id) void onDropCard(cardId); }} className={`cursor-grab rounded-xl border bg-slate-800 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-500 active:cursor-grabbing ${isDropTarget ? "border-blue-400 ring-2 ring-blue-500/40" : "border-slate-700"}`}>
        <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-white">{card.title}</h3>
            <div className="flex"><button type="button" onClick={onEdit} aria-label={`Edit card ${card.title}`} className="rounded px-2 text-sm text-slate-500 hover:bg-blue-500/20 hover:text-blue-300">Edit</button><button type="button" onClick={() => { if (window.confirm(`Delete card "${card.title}"?`)) onDelete(); }} aria-label={`Delete card ${card.title}`} className="rounded px-2 text-lg leading-5 text-slate-500 hover:bg-red-500/20 hover:text-red-300">×</button></div>
        </div>
        <p className="mb-3 text-xs leading-5 text-slate-400">{card.description || "No description added yet."}</p>
        <div className="flex items-center justify-between"><span className="rounded-full bg-blue-600/20 px-2 py-1 text-xs font-semibold text-blue-300">{card.priority}</span><span className="text-xs text-slate-500">{card.dueDate ? `Due ${new Date(card.dueDate).toLocaleDateString()}` : "No due date"}</span></div>
    </article>;
}
