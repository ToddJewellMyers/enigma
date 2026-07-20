import { useEffect, useState } from "react";
import type { Workspace } from "../../types/workspace";
import type { Board as BoardType } from "../../types/board";
import type { KanbanColumn } from "../../types/column";
import { createBoard, deleteBoard, getBoards } from "../../services/boardService";
import { createColumn, getColumns } from "../../services/columnService";
import Column from "./Column";
import { getErrorMessage } from "../../api/errorMessage";

type BoardProps = {
    selectedWorkspace: Workspace | null;
};

const defaultColumns = ["Backlog", "Ready", "In Progress", "Testing", "Done"];

function Board({ selectedWorkspace }: BoardProps) {
    const [boards, setBoards] = useState<BoardType[]>([]);
    const [columns, setColumns] = useState<KanbanColumn[]>([]);
    const [newBoardName, setNewBoardName] = useState("");
    const [cardRefreshVersion, setCardRefreshVersion] = useState(0);
    const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
    const [error, setError] = useState("");

    async function loadBoards() {
        if (!selectedWorkspace) return;
        try {
        const data = await getBoards(selectedWorkspace.id);
        setBoards(data);
        setError("");

        if (data.length > 0) {
            const nextActiveBoard = data.find((board) => board.id === activeBoardId) ?? data[0];
            setActiveBoardId(nextActiveBoard.id);
            await loadColumns(nextActiveBoard.id);
        } else {
            setActiveBoardId(null);
            setColumns([]);
        }
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Boards could not be loaded."));
        }
    }

    async function loadColumns(boardId: string) {
        try {
            const data = await getColumns(boardId);
            setColumns(data);
            setError("");
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Columns could not be loaded."));
        }
    }

    async function handleCreateBoard() {
        if (!selectedWorkspace || !newBoardName.trim()) return;

        try {
        setError("");
        const board = await createBoard(selectedWorkspace.id, newBoardName.trim());

        for (let i = 0; i < defaultColumns.length; i++) {
            await createColumn(board.id, defaultColumns[i], i + 1);
        }

        setNewBoardName("");
        const updatedBoards = await getBoards(selectedWorkspace.id);
        setBoards(updatedBoards);
        setActiveBoardId(board.id);
        await loadColumns(board.id);
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The board could not be created."));
        }
    }

    async function handleDeleteBoard(board: BoardType) {
        if (!window.confirm(`Delete board "${board.name}" and all of its cards?`)) {
            return;
        }

        try {
        setError("");
        await deleteBoard(board.id);

        const remainingBoards = boards.filter(
            (existingBoard) => existingBoard.id !== board.id
        );
        setBoards(remainingBoards);

        if (activeBoardId === board.id) {
            const nextBoard = remainingBoards[0];
            setActiveBoardId(nextBoard?.id ?? null);

            if (nextBoard) {
                await loadColumns(nextBoard.id);
            } else {
                setColumns([]);
            }
        }
        } catch (requestError) {
            setError(getErrorMessage(requestError, "The board could not be deleted."));
        }
    }

    useEffect(() => {
        setActiveBoardId(null);
        loadBoards();
    }, [selectedWorkspace]);

    if (!selectedWorkspace) {
        return (
            <section>
                <h1 className="text-3xl font-bold text-white">Select a workspace</h1>
                <p className="mt-2 text-slate-400">
                    Choose or create a workspace to start.
                </p>
            </section>
        );
    }

    const activeBoard = boards.find((board) => board.id === activeBoardId);

    return (
        <section>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm text-slate-400">{selectedWorkspace.name}</p>
                    <h1 className="text-3xl font-bold text-white">
                        {activeBoard ? activeBoard.name : "No board yet"}
                    </h1>
                </div>

                <div className="flex w-full gap-3 sm:w-auto">
                    <input
                        value={newBoardName}
                        onChange={(e) => setNewBoardName(e.target.value)}
                        placeholder="New board"
                        aria-label="New board name"
                        maxLength={100}
                        className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                    />

                    <button
                        onClick={handleCreateBoard}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                    >
                        + Board
                    </button>
                </div>
            </div>

            {error && <p role="alert" className="mb-5 rounded-lg bg-red-950/50 p-3 text-sm text-red-300">{error}</p>}

            <div aria-label="Boards" className="mb-5 flex max-w-full gap-2 overflow-x-auto pb-2">
                {boards.map((board) => (
                    <div
                        key={board.id}
                        className={`group flex items-center rounded-lg transition ${
                            board.id === activeBoardId
                                ? "bg-blue-600 text-white"
                                : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                        }`}
                    >
                        <button
                            onClick={() => {
                                setActiveBoardId(board.id);
                                loadColumns(board.id);
                            }}
                            className="px-3 py-2 text-sm"
                        >
                            {board.name}
                        </button>
                        <button
                            onClick={() => handleDeleteBoard(board)}
                            aria-label={`Delete board ${board.name}`}
                            title="Delete board"
                            className="mr-1 rounded px-2 py-1 text-sm transition hover:bg-red-500/20 hover:text-red-300 lg:opacity-0 lg:focus:opacity-100 lg:group-hover:opacity-100"
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 gap-5 pb-4 md:flex md:overflow-x-auto">
                {columns.map((column) => (
                    <Column
                        id={column.id}
                        title={column.name}
                        refreshVersion={cardRefreshVersion}
                        onCardMoved={() => setCardRefreshVersion((version) => version + 1)}
                        key={column.id}
                    />
                ))}
            </div>
        </section>
    );
}

export default Board;
