import { useEffect, useRef, useState } from "react";
import { forgotPassword, login, register, resetPassword, verifyEmail } from "../services/authService";
import { getErrorMessage } from "../api/errorMessage";

type AuthPageProps = {
    onAuthenticated: (token: string, email: string) => void;
    onOpenTerminal?: () => void;
};

type AuthMode = "login" | "register" | "forgot" | "reset";

function AuthPage({ onAuthenticated, onOpenTerminal }: AuthPageProps) {
    const query = new URLSearchParams(window.location.search);
    const resetToken = query.get("resetToken") ?? "";
    const verificationToken = query.get("verifyToken") ?? "";
    const inviteToken = query.get("inviteToken") ?? localStorage.getItem("workspace_invite_token");
    const [mode, setMode] = useState<AuthMode>(resetToken ? "reset" : "login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(Boolean(verificationToken));
    const verificationAttempted = useRef(false);

    useEffect(() => {
        if (!verificationToken || verificationAttempted.current) return;
        verificationAttempted.current = true;
        verifyEmail(verificationToken)
            .then((response) => {
                window.history.replaceState({}, "", window.location.pathname);
                onAuthenticated(response.token, response.email);
            })
            .catch((requestError: unknown) => {
                setError(getErrorMessage(requestError, "This verification link is invalid or has expired."));
                setIsSubmitting(false);
            });
    }, [onAuthenticated, verificationToken]);

    function selectMode(nextMode: AuthMode) {
        setMode(nextMode);
        setError("");
        setMessage("");
        setPassword("");
        setConfirmPassword("");
        if (nextMode !== "reset") window.history.replaceState({}, "", window.location.pathname);
    }

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setIsSubmitting(true);
        setError("");
        setMessage("");
        try {
            if (mode === "register") {
                const response = await register(email, password, inviteToken);
                if ("token" in response) {
                    onAuthenticated(response.token, response.email);
                } else {
                    setMessage(response.message);
                    setPassword("");
                }
            } else if (mode === "forgot") {
                const response = await forgotPassword(email);
                setMessage(response.message);
            } else if (mode === "reset") {
                if (password !== confirmPassword) throw new Error("Passwords do not match.");
                const response = await resetPassword(resetToken, password);
                window.history.replaceState({}, "", window.location.pathname);
                setMessage(response.message);
                setMode("login");
                setPassword("");
                setConfirmPassword("");
            } else {
                const response = await login(email, password);
                onAuthenticated(response.token, response.email);
            }
        } catch (requestError) {
            setError(getErrorMessage(requestError, mode === "login" ? "Invalid email or password." : "The request could not be completed."));
        } finally {
            setIsSubmitting(false);
        }
    }

    const title = mode === "register" ? "Create account" : mode === "forgot" ? "Reset your password" : mode === "reset" ? "Choose a new password" : "Welcome back";

    return (
        <main className="mahogany-shell flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white sm:p-6">
            <form onSubmit={handleSubmit} aria-describedby={error ? "auth-error" : message ? "auth-message" : undefined} className="mahogany-auth-panel w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
                <img
                    src="/branding/sweet-mahogany-logo-v2.png"
                    alt="Sweet Mahogany Boards"
                    className="brand-logo brand-logo-auth mb-6"
                />
                <h1 className="mb-6 text-3xl font-bold">{verificationToken && isSubmitting ? "Verifying your email…" : title}</h1>

                {mode !== "reset" && !verificationToken && (
                    <label className="mb-4 block text-sm text-slate-300">Email
                        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
                    </label>
                )}
                {(mode === "login" || mode === "register" || mode === "reset") && !verificationToken && (
                    <label className="mb-4 block text-sm text-slate-300">{mode === "reset" ? "New password" : "Password"}
                        <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} maxLength={128} required autoComplete={mode === "login" ? "current-password" : "new-password"} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
                    </label>
                )}
                {mode === "reset" && !verificationToken && (
                    <label className="mb-4 block text-sm text-slate-300">Confirm new password
                        <input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} maxLength={128} required autoComplete="new-password" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
                    </label>
                )}

                {error && <p id="auth-error" role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
                {message && <p id="auth-message" role="status" className="mb-4 rounded-lg border border-emerald-800 bg-emerald-950 p-3 text-sm text-emerald-200">{message}</p>}
                {!verificationToken && <button disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-bold hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? "Please wait…" : mode === "register" ? "Register" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Reset password" : "Log in"}</button>}

                {mode === "login" && !verificationToken && (
                    <>
                        <button type="button" onClick={() => selectMode("register")} className="mt-4 w-full text-sm text-slate-400 hover:text-white">Need an account? Register</button>
                        <button type="button" onClick={() => selectMode("forgot")} className="mt-3 w-full text-sm text-slate-400 hover:text-white">Forgot your password?</button>
                    </>
                )}
                {mode !== "login" && !verificationToken && <button type="button" onClick={() => selectMode("login")} className="mt-4 w-full text-sm text-slate-400 hover:text-white">Back to login</button>}
                {onOpenTerminal && !verificationToken && <button type="button" onClick={onOpenTerminal} className="mt-3 w-full rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-blue-500 hover:text-white">Open local terminal</button>}
            </form>
        </main>
    );
}

export default AuthPage;
