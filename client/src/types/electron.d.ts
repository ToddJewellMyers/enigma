type TerminalDimensions = { cols: number; rows: number };

interface EnigmaTerminalApi {
    create(dimensions: TerminalDimensions): Promise<string>;
    write(sessionId: string, data: string): void;
    resize(sessionId: string, cols: number, rows: number): void;
    close(sessionId: string): void;
    onData(callback: (sessionId: string, data: string) => void): () => void;
    onExit(callback: (sessionId: string, exitCode: number) => void): () => void;
}

interface Window {
    enigmaTerminal?: EnigmaTerminalApi;
}
