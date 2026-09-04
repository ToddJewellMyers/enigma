import { useEffect, useState } from "react";
import type { CardAttachment } from "../../types/card";
import { getCardAttachment } from "../../services/cardService";

type Props = { cardId: string; attachment: CardAttachment; className?: string };

export default function CardAttachmentImage({ cardId, attachment, className = "" }: Props) {
    const [source, setSource] = useState("");
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        let active = true;
        let objectUrl = "";
        setFailed(false);
        void getCardAttachment(cardId, attachment.id).then((blob) => {
            if (!active) return;
            objectUrl = URL.createObjectURL(blob);
            setSource(objectUrl);
        }).catch(() => { if (active) setFailed(true); });
        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [attachment.id, cardId]);

    if (failed) return <div role="img" aria-label={`${attachment.fileName} could not be loaded`} className={`flex items-center justify-center bg-red-950/30 p-2 text-center text-xs text-red-200 ${className}`}>Image unavailable</div>;
    if (!source) return <div aria-label={`Loading ${attachment.fileName}`} className={`animate-pulse bg-black/30 ${className}`} />;
    return <button type="button" onClick={() => window.open(source, "_blank", "noopener,noreferrer")} title={`Open ${attachment.fileName}`} className={`overflow-hidden bg-black/20 ${className}`}>
        <img src={source} alt={attachment.fileName} loading="lazy" className="h-full w-full object-cover" />
    </button>;
}
