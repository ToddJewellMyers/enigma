import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

function DesktopTerminal() {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const api = window.enigmaTerminal;
        const container = containerRef.current;
        if (!api || !container) return;

        const terminal = new Terminal({
            cursorBlink: true,
            fontFamily: '"SFMono-Regular", Menlo, Monaco, Consolas, monospace',
            fontSize: 14,
            scrollback: 10000,
            theme: {
                background: "#020617",
                foreground: "#e2e8f0",
                cursor: "#60a5fa",
                selectionBackground: "#1d4ed880"
            }
        });
        const fitAddon = new FitAddon();
        terminal.loadAddon(fitAddon);
        terminal.open(container);
        fitAddon.fit();
        terminal.focus();

        let sessionId = "";
        let disposed = false;
        const removeDataListener = api.onData((id, data) => {
            if (id === sessionId) terminal.write(data);
        });
        const removeExitListener = api.onExit((id, exitCode) => {
            if (id === sessionId) terminal.writeln(`\r\n[Process exited with code ${exitCode}]`);
        });
        const inputDisposable = terminal.onData((data) => {
            if (sessionId) api.write(sessionId, data);
        });
        const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit();
            if (sessionId) api.resize(sessionId, terminal.cols, terminal.rows);
        });
        resizeObserver.observe(container);

        api.create({ cols: terminal.cols, rows: terminal.rows }).then((id) => {
            if (disposed) api.close(id);
            else sessionId = id;
        });

        return () => {
            disposed = true;
            resizeObserver.disconnect();
            inputDisposable.dispose();
            removeDataListener();
            removeExitListener();
            if (sessionId) api.close(sessionId);
            terminal.dispose();
        };
    }, []);

    return (
        <section className="flex h-full min-h-[32rem] flex-col" aria-label="Terminal workspace">
            <div className="mb-3 flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-400">Local shell</p>
                    <h1 className="text-2xl font-bold text-white">Terminal</h1>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">Desktop only</span>
            </div>
            <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-3 shadow-2xl" />
        </section>
    );
}

export default DesktopTerminal;
