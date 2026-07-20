import { useEffect, useState } from "react";
import type { KanbanCard } from "../../types/card";
import { createCard, deleteCard, getCards, moveCard, updateCard } from "../../services/cardService";
import type { CardUpdate } from "../../services/cardService";
import Card from "./Card";
import { getErrorMessage } from "../../api/errorMessage";

type ColumnProps = {
  id: string;
  title: string;
  refreshVersion: number;
  onCardMoved: () => void;
};

function Column({ id, title, refreshVersion, onCardMoved }: ColumnProps) {
  const [cards, setCards] = useState<KanbanCard[]>([]);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);

  async function loadCards() {
    try {
      const data = await getCards(id);
      setCards(data);
      setError("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Cards could not be loaded."));
    }
  }

  async function handleCreateCard() {
    if (!newCardTitle.trim()) return;

    try {
      setIsCreating(true);
      setError("");
      const card = await createCard(id, newCardTitle.trim(), cards.length + 1);
      setCards((currentCards) => [...currentCards, card]);
      setNewCardTitle("");
    } catch (requestError) {
      setError(getErrorMessage(requestError, "The card could not be created."));
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragOver(false);

    const cardId = event.dataTransfer.getData("text/plain");
    if (!cardId) return;

    await handleMoveCard(cardId, cards.length + 1);
  }

  async function handleMoveCard(cardId: string, position: number) {
    try {
      setError("");
      await moveCard(cardId, id, position);
      onCardMoved();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "The card could not be moved."));
    }
  }

  async function handleDeleteCard(cardId: string) {
    try {
      setError("");
      await deleteCard(cardId);
      setCards((currentCards) =>
        currentCards.filter((card) => card.id !== cardId)
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, "The card could not be deleted."));
    }
  }

  async function handleUpdateCard(cardId: string, update: CardUpdate) {
    try {
      setError("");
      const updatedCard = await updateCard(cardId, update);
      setCards((currentCards) =>
        currentCards.map((card) => card.id === cardId ? updatedCard : card)
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, "The card could not be updated."));
      throw new Error("Card update failed");
    }
  }

  useEffect(() => {
    loadCards();
  }, [id, refreshVersion]);

  return (
    <div
      data-column-id={id}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`min-w-0 rounded-xl border p-4 transition md:min-w-[300px] ${
        isDragOver
          ? "border-blue-500 bg-blue-950/40"
          : "border-slate-800 bg-slate-900/80"
      }`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-100">{title}</h2>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400">
          {cards.length}
        </span>
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={newCardTitle}
          onChange={(e) => setNewCardTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreateCard();
          }}
          placeholder="New card"
          aria-label={`New card title for ${title}`}
          maxLength={200}
          className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
        />

        <button
          type="button"
          aria-label={`Add card to ${title}`}
          onClick={handleCreateCard}
          disabled={isCreating || !newCardTitle.trim()}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700"
        >
          {isCreating ? "…" : "+"}
        </button>
      </div>

      {error && <p role="alert" className="mb-3 rounded bg-red-950/50 p-2 text-xs text-red-300">{error}</p>}

      <div className="flex flex-col gap-3">
        {cards.map((card, index) => (
          <Card
            card={card}
            onDelete={() => handleDeleteCard(card.id)}
            onSave={(update) => handleUpdateCard(card.id, update)}
            onDropCard={(cardId) => handleMoveCard(cardId, index + 1)}
            key={card.id}
          />
        ))}
      </div>
    </div>
  );
}

export default Column;
