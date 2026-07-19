import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import AuthPage from "./pages/AuthPage";
function App() {
    const [token, setToken] = useState(() => localStorage.getItem("kanban_token"));
    const [email, setEmail] = useState(() => localStorage.getItem("kanban_email") ?? "");

    if (!token) {
        return <AuthPage onAuthenticated={(nextToken, nextEmail) => {
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
