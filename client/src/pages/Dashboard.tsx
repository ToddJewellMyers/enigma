import { useState } from "react";
import AppLayout from "../components/layout/AppLayout";
import Board from "../components/board/Board";
import type { Workspace } from "../types/workspace";
import AccountSettings from "../components/account/AccountSettings";

type DashboardProps = {
    email: string;
    onLogout: () => void;
    onAccountDeleted: () => void;
    onOpenTerminal?: () => void;
};

function Dashboard({ email, onLogout, onAccountDeleted, onOpenTerminal }: DashboardProps) {
    const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
    const [isAccountOpen, setIsAccountOpen] = useState(false);

    return (
        <AppLayout
            selectedWorkspace={selectedWorkspace}
            onSelectWorkspace={setSelectedWorkspace}
            email={email}
            onLogout={onLogout}
            onOpenAccount={() => setIsAccountOpen(true)}
            onOpenTerminal={onOpenTerminal}
        >
            <Board selectedWorkspace={selectedWorkspace} />
            {isAccountOpen && <AccountSettings email={email} onClose={() => setIsAccountOpen(false)} onDeleted={onAccountDeleted} />}
        </AppLayout>
    );
}

export default Dashboard;
