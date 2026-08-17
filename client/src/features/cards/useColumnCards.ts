import { useEffect, useState } from "react";
import type { KanbanCard } from "../../types/card";
import type { CardUpdate } from "../../services/cardService";
import { createCard, deleteCard, getCards, moveCard, updateCard } from "../../services/cardService";
import { getErrorMessage } from "../../api/errorMessage";

export function useColumnCards(columnId: string, refreshVersion: number, onCardMoved: () => void) {
    const [cards, setCards] = useState<KanbanCard[]>([]);
    const [error, setError] = useState("");

    async function add(title: string) {
        try {
            setError("");
            const card = await createCard(columnId, title, cards.length + 1);
            setCards((current) => [...current, card]);
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The card could not be created."));
            throw requestError;
        }
    }

    async function move(cardId: string, position: number) {
        try {
            setError("");
            await moveCard(cardId, columnId, position);
            onCardMoved();
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The card could not be moved."));
        }
    }

    async function remove(cardId: string) {
        try {
            setError("");
            await deleteCard(cardId);
            setCards((current) => current.filter((card) => card.id !== cardId));
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The card could not be deleted."));
        }
    }

    async function update(cardId: string, changes: CardUpdate) {
        try {
            setError("");
            const updated = await updateCard(cardId, changes);
            setCards((current) => current.map((card) => card.id === cardId ? updated : card));
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The card could not be updated."));
            throw requestError;
        }
    }

    useEffect(() => {
        getCards(columnId).then((data) => { setCards(data); setError(""); })
            .catch((requestError: unknown) => setError(getErrorMessage(requestError, "Cards could not be loaded.")));
    }, [columnId, refreshVersion]);

    return { cards, error, add, move, remove, update };
}
