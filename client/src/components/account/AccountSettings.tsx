import { useState } from "react";
import { deleteAccount, exportAccount } from "../../services/accountService";
import { getErrorMessage } from "../../api/errorMessage";

type AccountSettingsProps = {
    email: string;
    onClose: () => void;
    onDeleted: () => void;
};

function AccountSettings({ email, onClose, onDeleted }: AccountSettingsProps) {
    const [password, setPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [error, setError] = useState("");
    const [isExporting, setIsExporting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleExport() {
        setError("");
        setIsExporting(true);
        try {
            await exportAccount();
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Your account export could not be created."));
        } finally {
            setIsExporting(false);
        }
    }

    async function handleDelete(event: React.FormEvent) {
        event.preventDefault();
        setError("");
        setIsDeleting(true);
        try {
            await deleteAccount(password, confirmation);
            onDeleted();
        } catch (requestError) {
            setError(getErrorMessage(requestError, "Your account could not be deleted."));
            setIsDeleting(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="account-settings-title">
            <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
                <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                        <h2 id="account-settings-title" className="text-2xl font-bold">Account settings</h2>
                        <p className="mt-1 text-sm text-slate-400">{email}</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close account settings" className="rounded-lg px-3 py-2 text-slate-400 hover:bg-slate-800 hover:text-white">✕</button>
                </div>

                <section className="rounded-xl border border-slate-700 p-4">
                    <h3 className="font-semibold">Download your data</h3>
                    <p className="mt-1 text-sm text-slate-400">Export your account, workspaces, boards, columns, and cards as JSON.</p>
                    <button type="button" disabled={isExporting} onClick={() => void handleExport()} className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">{isExporting ? "Preparing…" : "Download export"}</button>
                </section>

                <form onSubmit={handleDelete} className="mt-6 rounded-xl border border-red-900 bg-red-950/30 p-4">
                    <h3 className="font-semibold text-red-300">Permanently delete account</h3>
                    <p className="mt-1 text-sm text-slate-400">This permanently removes your account and every workspace, board, column, and card. Download an export first if you want a copy.</p>
                    <label className="mt-4 block text-sm text-slate-300">Current password
                        <input type="password" required maxLength={128} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-red-500" />
                    </label>
                    <label className="mt-4 block text-sm text-slate-300">Type DELETE to confirm
                        <input required maxLength={20} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none focus:border-red-500" />
                    </label>
                    {error && <p role="alert" className="mt-4 text-sm text-red-400">{error}</p>}
                    <button disabled={isDeleting || confirmation !== "DELETE" || !password} className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">{isDeleting ? "Deleting…" : "Delete my account"}</button>
                </form>
            </div>
        </div>
    );
}

export default AccountSettings;
