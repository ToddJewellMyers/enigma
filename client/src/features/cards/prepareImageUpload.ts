const MAXIMUM_UPLOAD_BYTES = 5 * 1024 * 1024;
const TARGET_UPLOAD_BYTES = 4.5 * 1024 * 1024;
const MAXIMUM_IMAGE_DIMENSION = 2560;
const SERVER_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);

function isLikelyImage(file: File) {
    return file.type.startsWith("image/") || /\.(heic|heif)$/i.test(file.name);
}

function jpegName(fileName: string) {
    const baseName = fileName.replace(/\.[^.]+$/, "").trim() || "card-photo";
    return `${baseName}.jpg`;
}

async function decodeImage(file: File) {
    if (typeof createImageBitmap === "function") {
        try {
            const bitmap = await createImageBitmap(file);
            return { width: bitmap.width, height: bitmap.height, source: bitmap, close: () => bitmap.close() };
        } catch {
            // Safari can decode some camera formats through an image element even when createImageBitmap cannot.
        }
    }

    const objectUrl = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = objectUrl;
        await image.decode();
        return { width: image.naturalWidth, height: image.naturalHeight, source: image, close: () => undefined };
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
    return new Promise<Blob>((resolve, reject) => canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error("This photo could not be converted.")),
        "image/jpeg",
        quality,
    ));
}

export async function prepareImageUpload(file: File) {
    if (!isLikelyImage(file)) throw new Error(`${file.name} is not a supported image.`);
    if (SERVER_IMAGE_TYPES.has(file.type) && file.size <= MAXIMUM_UPLOAD_BYTES) return file;

    let decoded: Awaited<ReturnType<typeof decodeImage>>;
    try {
        decoded = await decodeImage(file);
    } catch {
        throw new Error(`${file.name} could not be converted. Try taking a screenshot of it first.`);
    }

    try {
        const scale = Math.min(1, MAXIMUM_IMAGE_DIMENSION / Math.max(decoded.width, decoded.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(decoded.width * scale));
        canvas.height = Math.max(1, Math.round(decoded.height * scale));
        const context = canvas.getContext("2d");
        if (!context) throw new Error("This browser cannot prepare photos for upload.");
        context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);

        let quality = 0.88;
        let blob = await canvasBlob(canvas, quality);
        while (blob.size > TARGET_UPLOAD_BYTES && quality > 0.42) {
            quality -= 0.1;
            blob = await canvasBlob(canvas, quality);
        }
        if (blob.size > MAXIMUM_UPLOAD_BYTES)
            throw new Error(`${file.name} is still too large after resizing.`);
        return new File([blob], jpegName(file.name), { type: "image/jpeg", lastModified: file.lastModified });
    } finally {
        decoded.close();
    }
}

export { MAXIMUM_UPLOAD_BYTES };
