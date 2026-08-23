import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { useEffect, useRef, useState } from "react";

export type RealtimeStatus = "connecting" | "live" | "reconnecting" | "offline";

export type WorkspaceChangedEvent = {
    kind: string;
    workspaceId: string;
    entityId?: string | null;
};

function getHubUrl() {
    const apiUrl = import.meta.env.VITE_API_URL?.replace(/\/$/, "");
    if (!apiUrl || apiUrl.startsWith("/")) return "/hubs/workspaces";
    return `${new URL(apiUrl).origin}/hubs/workspaces`;
}

export function useWorkspaceRealtime(workspaceId: string | null, onChange: (event: WorkspaceChangedEvent) => void) {
    const [status, setStatus] = useState<RealtimeStatus>("offline");
    const onChangeRef = useRef(onChange);

    useEffect(() => { onChangeRef.current = onChange; }, [onChange]);

    useEffect(() => {
        if (!workspaceId) {
            setStatus("offline");
            return;
        }

        let disposed = false;
        let retryTimer: number | undefined;
        const connection = new HubConnectionBuilder()
            .withUrl(getHubUrl(), {
                accessTokenFactory: () => localStorage.getItem("kanban_token") ?? "",
                withCredentials: false,
            })
            .withAutomaticReconnect({
                nextRetryDelayInMilliseconds: ({ previousRetryCount }) =>
                    Math.min(30_000, 1_000 * (2 ** previousRetryCount)),
            })
            .configureLogging(LogLevel.Warning)
            .build();

        connection.on("WorkspaceChanged", (event: WorkspaceChangedEvent) => {
            if (!disposed && event.workspaceId === workspaceId) onChangeRef.current(event);
        });
        connection.onreconnecting(() => { if (!disposed) setStatus("reconnecting"); });
        connection.onreconnected(async () => {
            if (disposed) return;
            try {
                await connection.invoke("JoinWorkspace", workspaceId);
                setStatus("live");
            } catch {
                setStatus("offline");
                await connection.stop();
            }
        });
        connection.onclose(() => { if (!disposed) setStatus("offline"); });

        const connect = async () => {
            setStatus("connecting");
            try {
                await connection.start();
                await connection.invoke("JoinWorkspace", workspaceId);
                if (!disposed) setStatus("live");
            } catch {
                if (!disposed) {
                    setStatus("offline");
                    retryTimer = window.setTimeout(() => void connect(), 5_000);
                }
            }
        };
        void connect();

        return () => {
            disposed = true;
            if (retryTimer !== undefined) window.clearTimeout(retryTimer);
            if (connection.state === HubConnectionState.Connected)
                void connection.invoke("LeaveWorkspace", workspaceId).finally(() => connection.stop());
            else
                void connection.stop();
        };
    }, [workspaceId]);

    return status;
}
