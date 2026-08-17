import { api } from "../api/api";

export async function exportAccount() {
    const response = await api.get<Blob>("/account/export", { responseType: "blob" });
    const disposition = response.headers["content-disposition"] as string | undefined;
    const filename = disposition?.match(/filename="?([^";]+)"?/)?.[1]
        ?? `sweet-mahogany-boards-export-${new Date().toISOString().slice(0, 10)}.json`;
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
}

export async function deleteAccount(password: string, confirmation: string) {
    await api.delete("/account", { data: { password, confirmation } });
}
