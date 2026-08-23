import { useEffect, useRef, useState } from "react";
import type { Workspace } from "../../types/workspace";
import type { Board } from "../../types/board";
import type { KanbanColumn } from "../../types/column";
import { createBoard, deleteBoard, getBoards } from "../../services/boardService";
import { createColumn, deleteColumn, getColumns } from "../../services/columnService";
import { getErrorMessage } from "../../api/errorMessage";

export function useBoards(selectedWorkspace: Workspace | null, realtimeRevision: number) {
    const [boards, setBoards] = useState<Board[]>([]);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const activeBoardIdRef = useRef<string | null>(null);
    const [error, setError] = useState("");

    async function selectBoard(boardId: string) {
        activeBoardIdRef.current = boardId;
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
            activeBoardIdRef.current = next?.id ?? null;
            setActiveBoardId(next?.id ?? null);
            setColumns(next ? await getColumns(next.id) : []);
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The board could not be deleted."));
        }
    }

    async function addColumn(name: string) {
        if (!activeBoardId) return;
        try {
            setError("");
            await createColumn(activeBoardId, name, columns.length + 1);
            setColumns(await getColumns(activeBoardId));
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The column could not be created."));
            throw requestError;
        }
    }

    async function removeColumn(column: KanbanColumn) {
        try {
            setError("");
            await deleteColumn(column.id);
            setColumns((current) => current.filter((item) => item.id !== column.id)
                .map((item, index) => ({ ...item, position: index + 1 })));
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The column could not be deleted."));
        }
    }

    useEffect(() => {
        async function load() {
            if (!selectedWorkspace) {
                setBoards([]);
                activeBoardIdRef.current = null;
                setActiveBoardId(null);
                setColumns([]);
                return;
            }
            try {
                const nextBoards = await getBoards(selectedWorkspace.id);
                const first = nextBoards[0];
                setBoards(nextBoards);
                activeBoardIdRef.current = first?.id ?? null;
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
        if (realtimeRevision === 0 || !selectedWorkspace) return;
        const refresh = async () => {
            try {
                const nextBoards = await getBoards(selectedWorkspace.id);
                const selectedId = activeBoardIdRef.current;
                const nextActiveId = nextBoards.some((board) => board.id === selectedId) ? selectedId : nextBoards[0]?.id ?? null;
                setBoards(nextBoards);
                activeBoardIdRef.current = nextActiveId;
                setActiveBoardId(nextActiveId);
                setColumns(nextActiveId ? await getColumns(nextActiveId) : []);
                setError("");
            } catch (requestError) {
                setError(getErrorMessage(requestError, "The shared board could not be synchronized."));
            }
        };
        void refresh();
    }, [realtimeRevision, selectedWorkspace]);

    useEffect(() => {
        if (!selectedWorkspace) return;
        const refresh = async () => {
            if (document.visibilityState !== "visible") return;
            try {
                const nextBoards = await getBoards(selectedWorkspace.id);
                const selectedId = activeBoardIdRef.current;
                const nextActiveId = nextBoards.some((board) => board.id === selectedId) ? selectedId : nextBoards[0]?.id ?? null;
                setBoards(nextBoards);
                activeBoardIdRef.current = nextActiveId;
                setActiveBoardId(nextActiveId);
                setColumns(nextActiveId ? await getColumns(nextActiveId) : []);
            } catch {
                // The regular action handlers surface errors; background refresh stays quiet.
            }
        };
        const timer = window.setInterval(() => void refresh(), 60_000);
        return () => window.clearInterval(timer);
    }, [selectedWorkspace]);

    return { boards, columns, activeBoardId, activeBoard: boards.find((board) => board.id === activeBoardId), error, addBoard, removeBoard, addColumn, removeColumn, selectBoard };
}
