import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import Board from "../components/board/Board";
import type { Workspace } from "../types/workspace";

type DashboardProps = {
    email: string;
    onLogout: () => void;
    onOpenTerminal?: () => void;
};

function Dashboard({ email, onLogout, onOpenTerminal }: DashboardProps) {
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

    return (
        <AppLayout
            selectedWorkspace={selectedWorkspace}
            onSelectWorkspace={setSelectedWorkspace}
            email={email}
            onLogout={onLogout}
            onOpenTerminal={onOpenTerminal}
        >
            <Board selectedWorkspace={selectedWorkspace} />
        </AppLayout>
    );
}

export default Dashboard;
