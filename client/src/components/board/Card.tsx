import { useState } from "react";
import type { KanbanCard } from "../../types/card";
import type { CardUpdate } from "../../services/cardService";
import CardDisplay from "../../features/cards/CardDisplay";
import CardEditor from "../../features/cards/CardEditor";

type CardProps = { card: KanbanCard; onDelete: () => void; onSave: (update: CardUpdate) => Promise<void>; onDropCard: (cardId: string) => Promise<void> };

function Card({ card, onDelete, onSave, onDropCard }: CardProps) {
    const [isEditing, setIsEditing] = useState(false);
    if (isEditing) return <CardEditor card={card} onCancel={() => setIsEditing(false)} onSave={async (changes) => { await onSave(changes); setIsEditing(false); }} />;
    return <CardDisplay card={card} onEdit={() => setIsEditing(true)} onDelete={onDelete} onDropCard={onDropCard} />;
}

export default Card;
