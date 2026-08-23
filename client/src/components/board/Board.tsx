import { useState } from "react";
import type { Workspace } from "../../types/workspace";
import Column from "./Column";
import { useBoards } from "../../features/boards/useBoards";
import BoardHeader from "../../features/boards/BoardHeader";
import BoardTabs from "../../features/boards/BoardTabs";

type BoardProps = { selectedWorkspace: Workspace | null; onOpenTeam: () => void; realtimeRevision: number };

function Board({ selectedWorkspace, onOpenTeam, realtimeRevision }: BoardProps) {
    const [cardRefreshVersion, setCardRefreshVersion] = useState(0);
    const [newColumnName, setNewColumnName] = useState("");
    const [isCreatingColumn, setIsCreatingColumn] = useState(false);
    const boardState = useBoards(selectedWorkspace, realtimeRevision);

    async function addColumn() {
        if (!newColumnName.trim()) return;
        setIsCreatingColumn(true);
        try {
            await boardState.addColumn(newColumnName.trim());
            setNewColumnName("");
        } finally {
            setIsCreatingColumn(false);
        }
    }

    if (!selectedWorkspace) return <section><h1 className="text-3xl font-bold text-white">Select a workspace</h1><p className="mt-2 text-slate-400">Choose or create a workspace to start.</p></section>;

    return <section>
        <BoardHeader workspaceName={selectedWorkspace.name} boardName={boardState.activeBoard?.name} onCreate={boardState.addBoard} canEdit={selectedWorkspace.role !== "Viewer"} role={selectedWorkspace.role} onOpenTeam={onOpenTeam} />
        {boardState.error && <p role="alert" className="mb-5 rounded-lg bg-red-950/50 p-3 text-sm text-red-300">{boardState.error}</p>}
        <BoardTabs boards={boardState.boards} activeId={boardState.activeBoardId} onSelect={(id) => void boardState.selectBoard(id)} onDelete={(board) => void boardState.removeBoard(board)} canEdit={selectedWorkspace.role !== "Viewer"} />
        {selectedWorkspace.role !== "Viewer" && boardState.activeBoardId && <div className="mb-5 flex max-w-md gap-2"><input value={newColumnName} onChange={(event) => setNewColumnName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addColumn(); }} placeholder="New column" aria-label="New column name" maxLength={100} className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500" /><button type="button" onClick={() => void addColumn()} disabled={isCreatingColumn || !newColumnName.trim()} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{isCreatingColumn ? "…" : "+ Column"}</button></div>}
        <div className="grid grid-cols-1 gap-5 pb-4 md:flex md:overflow-x-auto">
            {boardState.columns.map((column) => <Column id={column.id} title={column.name} workspaceId={selectedWorkspace.id} refreshVersion={cardRefreshVersion + realtimeRevision} onCardMoved={() => setCardRefreshVersion((version) => version + 1)} onDelete={() => void boardState.removeColumn(column)} canEdit={selectedWorkspace.role !== "Viewer"} key={column.id} />)}
        </div>
    </section>;
}

export default Board;
