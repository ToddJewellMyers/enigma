import { describe, expect, it } from "vitest";
import { MAXIMUM_UPLOAD_BYTES, prepareImageUpload } from "./features/cards/prepareImageUpload";

describe("prepareImageUpload", () => {
    it("keeps supported images that already fit the server limit", async () => {
        const file = new File([new Uint8Array([1, 2, 3])], "art.png", { type: "image/png" });
        expect(await prepareImageUpload(file)).toBe(file);
    });

    it("rejects files that are not images with a useful message", async () => {
        const file = new File(["notes"], "notes.txt", { type: "text/plain" });
        await expect(prepareImageUpload(file)).rejects.toThrow("notes.txt is not a supported image");
    });

    it("publishes the same maximum size enforced by the API", () => {
        expect(MAXIMUM_UPLOAD_BYTES).toBe(5 * 1024 * 1024);
    });
});
