interface EnigmaDesktopApi {
    openTerminal(): Promise<boolean>;
}

interface Window {
    enigmaDesktop?: EnigmaDesktopApi;
}
