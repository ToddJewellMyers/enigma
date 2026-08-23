import { useEffect, useState } from "react";
import type { Workspace } from "../../types/workspace";
import type { Board } from "../../types/board";
import type { KanbanColumn } from "../../types/column";
import { createBoard, deleteBoard, getBoards } from "../../services/boardService";
import { createColumn, getColumns } from "../../services/columnService";
import { getErrorMessage } from "../../api/errorMessage";

const defaultColumns = ["Backlog", "Ready", "In Progress", "Testing", "Done"];

export function useBoards(selectedWorkspace: Workspace | null) {
    const [boards, setBoards] = useState<Board[]>([]);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [error, setError] = useState("");

    async function selectBoard(boardId: string) {
        setActiveBoardId(boardId);
        try {
            setColumns(await getColumns(boardId));
            setError("");
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Columns could not be loaded."));
        }
    }

    async function addBoard(name: string) {
        if (!selectedWorkspace) return;
        try {
            setError("");
            const board = await createBoard(selectedWorkspace.id, name);
            await Promise.all(defaultColumns.map((column, index) => createColumn(board.id, column, index + 1)));
            setBoards(await getBoards(selectedWorkspace.id));
            await selectBoard(board.id);
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The board could not be created."));
            throw requestError;
        }
    }

    async function removeBoard(board: Board) {
        try {
            setError("");
            await deleteBoard(board.id);
            const remaining = boards.filter((item) => item.id !== board.id);
            setBoards(remaining);
            if (activeBoardId !== board.id) return;
            const next = remaining[0];
            setActiveBoardId(next?.id ?? null);
            setColumns(next ? await getColumns(next.id) : []);
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The board could not be deleted."));
        }
    }

    useEffect(() => {
        async function load() {
            if (!selectedWorkspace) {
                setBoards([]);
                setActiveBoardId(null);
                setColumns([]);
                return;
            }
            try {
                const nextBoards = await getBoards(selectedWorkspace.id);
                const first = nextBoards[0];
                setBoards(nextBoards);
                setActiveBoardId(first?.id ?? null);
                setColumns(first ? await getColumns(first.id) : []);
                setError("");
            } catch (requestError) {
                setError(getErrorMessage(requestError, "Boards could not be loaded."));
            }
        }
        void load();
    }, [selectedWorkspace]);

    useEffect(() => {
        if (!selectedWorkspace) return;
        const refresh = async () => {
            if (document.visibilityState !== "visible") return;
            try {
                const nextBoards = await getBoards(selectedWorkspace.id);
                const nextActiveId = nextBoards.some((board) => board.id === activeBoardId) ? activeBoardId : nextBoards[0]?.id ?? null;
                setBoards(nextBoards);
                setActiveBoardId(nextActiveId);
                setColumns(nextActiveId ? await getColumns(nextActiveId) : []);
            } catch {
                // The regular action handlers surface errors; background refresh stays quiet.
            }
        };
        const timer = window.setInterval(() => void refresh(), 10_000);
        return () => window.clearInterval(timer);
    }, [activeBoardId, selectedWorkspace]);

    return { boards, columns, activeBoardId, activeBoard: boards.find((board) => board.id === activeBoardId), error, addBoard, removeBoard, selectBoard };
}
