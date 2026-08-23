import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import AuthPage from "./pages/AuthPage";
import Header from "./components/layout/Header";

expect.extend(toHaveNoViolations);

afterEach(cleanup);

describe("accessibility", () => {
    it("has no detectable violations on the authentication page", async () => {
        const { container } = render(<AuthPage onAuthenticated={() => undefined} />);

        expect(await axe(container)).toHaveNoViolations();
    });

    it("has no detectable violations in the responsive app header", async () => {
        const { container } = render(
            <Header
                email="person@example.com"
                isSidebarOpen={false}
                onMenuClick={() => undefined}
                onLogout={() => undefined}
                onOpenAccount={() => undefined}
                realtimeStatus="live"
            />
        );

        expect(await axe(container)).toHaveNoViolations();
    });
});
