import { useEffect, useState } from "react";
import type { CardAttachment } from "../../types/card";
import { getCardAttachment } from "../../services/cardService";

type Props = { cardId: string; attachment: CardAttachment; className?: string };

export default function CardAttachmentImage({ cardId, attachment, className = "" }: Props) {
    const [source, setSource] = useState("");

    useEffect(() => {
        let active = true;
        let objectUrl = "";
        void getCardAttachment(cardId, attachment.id).then((blob) => {
            if (!active) return;
            objectUrl = URL.createObjectURL(blob);
            setSource(objectUrl);
        });
        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [attachment.id, cardId]);

    if (!source) return <div aria-label={`Loading ${attachment.fileName}`} className={`animate-pulse bg-black/30 ${className}`} />;
    return <button type="button" onClick={() => window.open(source, "_blank", "noopener,noreferrer")} title={`Open ${attachment.fileName}`} className={`overflow-hidden bg-black/20 ${className}`}>
        <img src={source} alt={attachment.fileName} loading="lazy" className="h-full w-full object-cover" />
    </button>;
}
