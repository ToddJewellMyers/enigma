type HeaderProps = {
    email: string;
    isSidebarOpen: boolean;
    onMenuClick: () => void;
    onLogout: () => void;
    onOpenAccount: () => void;
    onOpenTerminal?: () => void;
};

function Header({ email, isSidebarOpen, onMenuClick, onLogout, onOpenAccount, onOpenTerminal }: HeaderProps) {
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
                <p className="text-base font-bold tracking-[0.12em] text-white sm:text-xl">
                SWEET MAHOGANY BOARDS
                </p>
            </div>

            <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                {onOpenTerminal && (
                    <button type="button" onClick={onOpenTerminal} className="hidden rounded-lg bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800 sm:block">Terminal</button>
                )}
                <input
                    placeholder="Search..."
                    aria-label="Search boards and cards"
                    className="hidden w-40 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-sm outline-none focus:border-blue-500 xl:block"
                />
                <span className="hidden max-w-40 truncate text-xs text-slate-400 sm:block">{email}</span>
                <button type="button" onClick={onOpenAccount} className="whitespace-nowrap rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700">Account</button>
                <button type="button" onClick={onLogout} className="whitespace-nowrap rounded-lg bg-slate-800 px-3 py-2 text-sm text-white hover:bg-slate-700">Log out</button>
            </div>
        </header>
    );
}

export default Header;
