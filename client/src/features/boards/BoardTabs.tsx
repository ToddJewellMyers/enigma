import type { Board } from "../../types/board";

type BoardTabsProps = { boards: Board[]; activeId: string | null; onSelect: (id: string) => void; onDelete: (board: Board) => void };

export default function BoardTabs({ boards, activeId, onSelect, onDelete }: BoardTabsProps) {
    return <div aria-label="Boards" className="mb-5 flex max-w-full gap-2 overflow-x-auto pb-2">
        {boards.map((board) => <div key={board.id} className={`group flex items-center rounded-lg transition ${board.id === activeId ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"}`}>
            <button type="button" onClick={() => onSelect(board.id)} className="px-3 py-2 text-sm">{board.name}</button>
            <button type="button" onClick={() => { if (window.confirm(`Delete board "${board.name}" and all of its cards?`)) onDelete(board); }} aria-label={`Delete board ${board.name}`} title="Delete board" className="mr-1 rounded px-2 py-1 text-sm transition hover:bg-red-500/20 hover:text-red-300 lg:opacity-0 lg:focus:opacity-100 lg:group-hover:opacity-100">×</button>
        </div>)}
    </div>;
}
