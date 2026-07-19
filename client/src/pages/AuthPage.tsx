import { useState } from "react";
import { login, register } from "../services/authService";
import { getErrorMessage } from "../api/errorMessage";

type AuthPageProps = { onAuthenticated: (token: string, email: string) => void };

function AuthPage({ onAuthenticated }: AuthPageProps) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: React.FormEvent) {
        event.preventDefault();
        setIsSubmitting(true);
        setError("");
        try {
            const response = isRegistering ? await register(email, password) : await login(email, password);
            onAuthenticated(response.token, response.email);
        } catch (requestError) {
            setError(getErrorMessage(
                requestError,
                isRegistering ? "Registration failed. Check your details." : "Invalid email or password."
            ));
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white sm:p-6">
            <form onSubmit={handleSubmit} aria-describedby={error ? "auth-error" : undefined} className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl sm:p-8">
                <p className="mb-2 text-sm font-bold tracking-[0.3em] text-blue-400">ENIGMA</p>
                <h1 className="mb-6 text-3xl font-bold">{isRegistering ? "Create account" : "Welcome back"}</h1>
                <label className="mb-4 block text-sm text-slate-300">Email
                    <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
                </label>
                <label className="mb-4 block text-sm text-slate-300">Password
                    <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
                </label>
                {error && <p id="auth-error" role="alert" className="mb-4 text-sm text-red-400">{error}</p>}
                <button disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-2 font-bold hover:bg-blue-700 disabled:opacity-50">{isSubmitting ? "Please wait…" : isRegistering ? "Register" : "Log in"}</button>
                <button type="button" onClick={() => { setIsRegistering(!isRegistering); setError(""); }} className="mt-4 w-full text-sm text-slate-400 hover:text-white">{isRegistering ? "Already have an account? Log in" : "Need an account? Register"}</button>
            </form>
        </main>
    );
}

export default AuthPage;
