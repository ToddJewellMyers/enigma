import { lazy, Suspense, useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import Board from "../components/board/Board";
import type { Workspace } from "../types/workspace";

const DesktopTerminal = lazy(() => import("../components/terminal/DesktopTerminal"));

type DashboardProps = {
    email: string;
    onLogout: () => void;
};

function Dashboard({ email, onLogout }: DashboardProps) {
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
        null
    );
    const terminalAvailable = Boolean(window.enigmaTerminal);
    const [activeView, setActiveView] = useState<"board" | "terminal">("board");

    return (
        <AppLayout
            selectedWorkspace={selectedWorkspace}
            onSelectWorkspace={setSelectedWorkspace}
            email={email}
            onLogout={onLogout}
            activeView={activeView}
            onViewChange={terminalAvailable ? setActiveView : undefined}
        >
            {activeView === "terminal" && terminalAvailable
                ? <Suspense fallback={<p className="text-slate-400">Starting terminal…</p>}><DesktopTerminal /></Suspense>
                : <Board selectedWorkspace={selectedWorkspace} />}
        </AppLayout>
    );
}

export default Dashboard;
