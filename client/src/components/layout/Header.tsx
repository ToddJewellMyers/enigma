type HeaderProps = {
    email: string;
    isSidebarOpen: boolean;
    onMenuClick: () => void;
    onLogout: () => void;
    activeView?: "board" | "terminal";
    onViewChange?: (view: "board" | "terminal") => void;
};

function Header({ email, isSidebarOpen, onMenuClick, onLogout, activeView = "board", onViewChange }: HeaderProps) {
    return (
        <header className="z-40 flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900 px-4 sm:px-6">
            <div className="flex items-center gap-3">
                <button
                    type="button"
                    aria-label="Toggle workspace menu"
                    aria-controls="workspace-sidebar"
                    aria-expanded={isSidebarOpen}
                    onClick={onMenuClick}
                    className="rounded-lg p-2 text-xl text-slate-300 hover:bg-slate-800 hover:text-white lg:hidden"
                >
                    <span aria-hidden="true">☰</span>
                </button>
                <p className="text-xl font-bold tracking-widest text-white sm:text-2xl">
                ENIGMA
                </p>
            </div>

            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                {onViewChange && (
                    <div className="hidden rounded-lg bg-slate-950 p-1 sm:flex" aria-label="Application view">
                        <button type="button" aria-pressed={activeView === "board"} onClick={() => onViewChange("board")} className={`rounded px-3 py-1.5 text-sm ${activeView === "board" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>Boards</button>
                        <button type="button" aria-pressed={activeView === "terminal"} onClick={() => onViewChange("terminal")} className={`rounded px-3 py-1.5 text-sm ${activeView === "terminal" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}>Terminal</button>
                    </div>
                )}
                <input
                    placeholder="Search..."
                    aria-label="Search boards and cards"
                    className="hidden w-40 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-blue-500 xl:block"
                />
                <span className="hidden max-w-40 truncate text-xs text-slate-400 sm:block">{email}</span>
                <button type="button" onClick={onLogout} className="whitespace-nowrap rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700">Log out</button>
            </div>
        </header>
    );
}

export default Header;
