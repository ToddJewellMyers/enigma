import { useState } from "react";
import Card from "./Card";
import { useColumnCards } from "../../features/cards/useColumnCards";
import NewCardForm from "../../features/cards/NewCardForm";

type ColumnProps = { id: string; title: string; refreshVersion: number; onCardMoved: () => void; onDelete: () => void; canEdit: boolean };

function Column({ id, title, refreshVersion, onCardMoved, onDelete, canEdit }: ColumnProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const cardState = useColumnCards(id, refreshVersion, onCardMoved);

    return <div data-column-id={id} onDragOver={(event) => { if (!canEdit) return; event.preventDefault(); event.dataTransfer.dropEffect = "move"; setIsDragOver(true); }} onDragLeave={() => setIsDragOver(false)} onDrop={(event) => { if (!canEdit) return; event.preventDefault(); setIsDragOver(false); const cardId = event.dataTransfer.getData("text/plain"); if (cardId) void cardState.move(cardId, cardState.cards.length + 1); }} className={`mahogany-column min-w-0 rounded-xl border p-4 transition md:min-w-[300px] ${isDragOver ? "border-blue-500 bg-blue-950/40" : "border-slate-800 bg-slate-900/80"}`}>
        <div className="mb-4 flex items-center justify-between gap-2"><h2 className="min-w-0 flex-1 truncate font-semibold text-slate-100">{title}</h2><span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">{cardState.cards.length}</span>{canEdit && <button type="button" aria-label={`Delete column ${title}`} title="Delete column" onClick={() => { if (window.confirm(`Delete column "${title}" and all cards inside it?`)) onDelete(); }} className="rounded px-2 py-1 text-lg leading-none text-slate-400 hover:bg-red-500/20 hover:text-red-300">×</button>}</div>
        {canEdit && <NewCardForm columnTitle={title} onCreate={cardState.add} />}
        {cardState.error && <p role="alert" className="mb-3 rounded bg-red-950/50 p-2 text-xs text-red-300">{cardState.error}</p>}
        <div className="flex flex-col gap-3">
            {cardState.cards.map((card, index) => <Card card={card} onDelete={() => void cardState.remove(card.id)} onSave={(changes) => cardState.update(card.id, changes)} onDropCard={(cardId) => cardState.move(cardId, index + 1)} canEdit={canEdit} key={card.id} />)}
        </div>
    </div>;
}

export default Column;
