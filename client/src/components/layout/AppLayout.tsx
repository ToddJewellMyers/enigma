import { useCallback, useState, type ReactNode } from "react";
import type { Workspace } from "../../types/workspace";
import Header from "./Header";
import Sidebar from "./Sidebar";

type AppLayoutProps = {
    children: ReactNode;
    selectedWorkspace: Workspace | null;
    onSelectWorkspace: (workspace: Workspace | null) => void;
    email: string;
    onLogout: () => void;
    onOpenAccount: () => void;
    onOpenTerminal?: () => void;
};

function AppLayout({ children, selectedWorkspace, onSelectWorkspace, email, onLogout, onOpenAccount, onOpenTerminal }: AppLayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const handleSelectWorkspace = useCallback((workspace: Workspace | null) => {
        onSelectWorkspace(workspace);
        setIsSidebarOpen(false);
    }, [onSelectWorkspace]);

    return (
        <div className="mahogany-shell flex min-h-screen flex-col bg-slate-950 text-slate-100 lg:h-screen">
            <a href="#main-content" className="skip-link">Skip to main content</a>
            <Header
                email={email}
                isSidebarOpen={isSidebarOpen}
                onMenuClick={() => setIsSidebarOpen((isOpen) => !isOpen)}
                onLogout={onLogout}
                onOpenAccount={onOpenAccount}
                onOpenTerminal={onOpenTerminal}
            />

            <div className="flex flex-1 overflow-hidden">
                {isSidebarOpen && (
                    <button
                        type="button"
                        aria-label="Close workspace menu"
                        className="fixed inset-0 top-16 z-30 bg-black/60 lg:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                )}
                <Sidebar
                    selectedWorkspace={selectedWorkspace}
                    isOpen={isSidebarOpen}
                    onSelectWorkspace={handleSelectWorkspace}
                />
                <main id="main-content" tabIndex={-1} className="min-h-0 min-w-0 flex-1 overflow-auto p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}

export default AppLayout;
