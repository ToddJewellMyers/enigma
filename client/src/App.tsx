import { useCallback, useState } from "react";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";

function App() {
    const [token, setToken] = useState(() => localStorage.getItem("kanban_token"));
    const [email, setEmail] = useState(() => localStorage.getItem("kanban_email") ?? "");
    const [inviteToken, setInviteToken] = useState<string | null>(() => {
        const tokenFromUrl = new URLSearchParams(window.location.search).get("inviteToken");
        if (tokenFromUrl) localStorage.setItem("workspace_invite_token", tokenFromUrl);
        return tokenFromUrl ?? localStorage.getItem("workspace_invite_token");
    });
    const handleInviteHandled = useCallback(() => setInviteToken(null), []);
    const openTerminal = window.enigmaDesktop
        ? () => { void window.enigmaDesktop?.openTerminal(); }
        : undefined;

    if (!token) {
        return <AuthPage onOpenTerminal={openTerminal} onAuthenticated={(nextToken, nextEmail) => {
            localStorage.setItem("kanban_token", nextToken);
            localStorage.setItem("kanban_email", nextEmail);
            setToken(nextToken);
            setEmail(nextEmail);
        }} />;
    }

    const logout = () => {
        localStorage.removeItem("kanban_token");
        localStorage.removeItem("kanban_email");
        setToken(null);
    };

    return <Dashboard email={email} inviteToken={inviteToken} onInviteHandled={handleInviteHandled} onOpenTerminal={openTerminal} onLogout={logout} onAccountDeleted={logout} />;
}

export default App;
