import { useState } from "react";
import type { Workspace } from "../../types/workspace";
import Column from "./Column";
import { useBoards } from "../../features/boards/useBoards";
import BoardHeader from "../../features/boards/BoardHeader";
import BoardTabs from "../../features/boards/BoardTabs";

type BoardProps = { selectedWorkspace: Workspace | null; onOpenTeam: () => void };

function Board({ selectedWorkspace, onOpenTeam }: BoardProps) {
    const [cardRefreshVersion, setCardRefreshVersion] = useState(0);
    const boardState = useBoards(selectedWorkspace);

    if (!selectedWorkspace) return <section><h1 className="text-3xl font-bold text-white">Select a workspace</h1><p className="mt-2 text-slate-400">Choose or create a workspace to start.</p></section>;

    return <section>
        <BoardHeader workspaceName={selectedWorkspace.name} boardName={boardState.activeBoard?.name} onCreate={boardState.addBoard} canEdit={selectedWorkspace.role !== "Viewer"} role={selectedWorkspace.role} onOpenTeam={onOpenTeam} />
        {boardState.error && <p role="alert" className="mb-5 rounded-lg bg-red-950/50 p-3 text-sm text-red-300">{boardState.error}</p>}
        <BoardTabs boards={boardState.boards} activeId={boardState.activeBoardId} onSelect={(id) => void boardState.selectBoard(id)} onDelete={(board) => void boardState.removeBoard(board)} canEdit={selectedWorkspace.role !== "Viewer"} />
        <div className="grid grid-cols-1 gap-5 pb-4 md:flex md:overflow-x-auto">
            {boardState.columns.map((column) => <Column id={column.id} title={column.name} refreshVersion={cardRefreshVersion} onCardMoved={() => setCardRefreshVersion((version) => version + 1)} canEdit={selectedWorkspace.role !== "Viewer"} key={column.id} />)}
        </div>
    </section>;
}

export default Board;
