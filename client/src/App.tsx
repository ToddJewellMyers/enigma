import { lazy, Suspense, useState } from "react";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";

const DesktopTerminal = lazy(() => import("./components/terminal/DesktopTerminal"));
function App() {
    const [token, setToken] = useState(() => localStorage.getItem("kanban_token"));
    const [email, setEmail] = useState(() => localStorage.getItem("kanban_email") ?? "");
    const [showDesktopTerminal, setShowDesktopTerminal] = useState(false);

    if (showDesktopTerminal && window.enigmaTerminal) {
        return (
            <main className="flex h-screen flex-col bg-slate-950 p-4 text-white sm:p-6">
                <button type="button" onClick={() => setShowDesktopTerminal(false)} className="mb-3 w-fit rounded-lg bg-slate-800 px-3 py-2 text-sm hover:bg-slate-700">← Back to Enigma</button>
                <div className="min-h-0 flex-1">
                    <Suspense fallback={<p className="text-slate-400">Starting terminal…</p>}><DesktopTerminal /></Suspense>
                </div>
            </main>
        );
    }

    if (!token) {
        return <AuthPage onOpenTerminal={window.enigmaTerminal ? () => setShowDesktopTerminal(true) : undefined} onAuthenticated={(nextToken, nextEmail) => {
            localStorage.setItem("kanban_token", nextToken);
            localStorage.setItem("kanban_email", nextEmail);
            setToken(nextToken);
            setEmail(nextEmail);
        }} />;
    }

    return <Dashboard email={email} onLogout={() => {
        localStorage.removeItem("kanban_token");
        localStorage.removeItem("kanban_email");
        setToken(null);
    }} />;

}
export default App;
