import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CardEditor from "./features/cards/CardEditor";
import * as cardService from "./services/cardService";

vi.mock("./services/workspaceService", () => ({ getWorkspaceMembers: vi.fn().mockResolvedValue([]) }));
vi.mock("./services/cardService", async (importOriginal) => {
    const original = await importOriginal<typeof import("./services/cardService")>();
    return { ...original, uploadCardAttachment: vi.fn(), deleteCardAttachment: vi.fn(), getCardAttachment: vi.fn() };
});

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("card image attachments", () => {
    it("uploads artwork from the card editor", async () => {
        vi.mocked(cardService.uploadCardAttachment).mockResolvedValue({
            id: "image-id", kanbanCardId: "card-id", fileName: "art.png", contentType: "image/png", size: 10, createdAt: "2026-08-27T00:00:00Z",
        });
        vi.mocked(cardService.getCardAttachment).mockResolvedValue(new Blob(["image"], { type: "image/png" }));
        URL.createObjectURL = vi.fn(() => "blob:art");
        URL.revokeObjectURL = vi.fn();
        const onAttachmentsChange = vi.fn();
        render(<CardEditor card={{ id: "card-id", kanbanColumnId: "column-id", title: "Art", position: 1, priority: "Normal", attachments: [], createdAt: "2026-08-27T00:00:00Z" }} workspaceId="workspace-id" onCancel={() => undefined} onSave={vi.fn()} onAttachmentsChange={onAttachmentsChange} />);

        const file = new File([new Uint8Array([1, 2, 3])], "art.png", { type: "image/png" });
        fireEvent.change(screen.getByLabelText("Add photos"), { target: { files: [file] } });

        await waitFor(() => expect(cardService.uploadCardAttachment).toHaveBeenCalledWith("card-id", file));
        expect(await screen.findByAltText("art.png")).toBeTruthy();
        expect(onAttachmentsChange).toHaveBeenCalledWith([expect.objectContaining({ id: "image-id" })]);
    });
});
