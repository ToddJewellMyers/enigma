import { useEffect, useState } from "react";
import type { KanbanCard } from "../../types/card";
import type { CardUpdate } from "../../services/cardService";
import CardDisplay from "../../features/cards/CardDisplay";
import CardEditor from "../../features/cards/CardEditor";

type CardProps = { card: KanbanCard; workspaceId: string; onDelete: () => void; onSave: (update: CardUpdate) => Promise<void>; onDropCard: (cardId: string) => Promise<void>; canEdit: boolean };

function Card({ card, workspaceId, onDelete, onSave, onDropCard, canEdit }: CardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [visibleCard, setVisibleCard] = useState(card);
    useEffect(() => setVisibleCard(card), [card]);
    if (isEditing) return <CardEditor card={visibleCard} workspaceId={workspaceId} onAttachmentsChange={(attachments) => setVisibleCard((current) => ({ ...current, attachments }))} onCancel={() => setIsEditing(false)} onSave={async (changes) => { await onSave(changes); setIsEditing(false); }} />;
    return <CardDisplay card={visibleCard} onEdit={() => setIsEditing(true)} onDelete={onDelete} onDropCard={onDropCard} canEdit={canEdit} />;
}

export default Card;
