import { useEffect, useState } from "react";
import type { CardAttachment, KanbanCard } from "../../types/card";
import type { CardUpdate } from "../../services/cardService";
import type { WorkspaceMember } from "../../types/workspace";
import { getWorkspaceMembers } from "../../services/workspaceService";
import { deleteCardAttachment, uploadCardAttachment } from "../../services/cardService";
import { getErrorMessage } from "../../api/errorMessage";
import CardAttachmentImage from "./CardAttachmentImage";
import { prepareImageUpload } from "./prepareImageUpload";

type CardEditorProps = { card: KanbanCard; workspaceId: string; onCancel: () => void; onSave: (update: CardUpdate) => Promise<void>; onAttachmentsChange?: (attachments: CardAttachment[]) => void };

export default function CardEditor({ card, workspaceId, onCancel, onSave, onAttachmentsChange }: CardEditorProps) {
    const [title, setTitle] = useState(card.title);
    const [description, setDescription] = useState(card.description ?? "");
    const [priority, setPriority] = useState(card.priority || "Normal");
    const [dueDate, setDueDate] = useState(card.dueDate?.slice(0, 10) ?? "");
    const [assigneeUserId, setAssigneeUserId] = useState(card.assigneeUserId ?? "");
    const [members, setMembers] = useState<WorkspaceMember[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [attachments, setAttachments] = useState(card.attachments ?? []);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState("");
    const [attachmentError, setAttachmentError] = useState("");

    function updateAttachments(next: CardAttachment[]) {
        setAttachments(next);
        onAttachmentsChange?.(next);
    }

    async function upload(files: FileList | null) {
        if (!files?.length) return;
        const selectedFiles = Array.from(files);
        const remainingSlots = 5 - attachments.length;
        if (selectedFiles.length > remainingSlots) {
            setAttachmentError(`You can add ${remainingSlots} more ${remainingSlots === 1 ? "photo" : "photos"} to this card.`);
            return;
        }
        setAttachmentError("");
        setIsUploading(true);
        try {
            let next = [...attachments];
            for (const [index, file] of selectedFiles.entries()) {
                setUploadProgress(`${index + 1}/${selectedFiles.length}`);
                const preparedFile = await prepareImageUpload(file);
                const attachment = await uploadCardAttachment(card.id, preparedFile);
                next = [...next, attachment];
                updateAttachments(next);
            }
        } catch (requestError) {
            setAttachmentError(getErrorMessage(requestError, "The image could not be uploaded."));
        } finally {
            setIsUploading(false);
            setUploadProgress("");
        }
    }

    async function removeAttachment(attachmentId: string) {
        setAttachmentError("");
        try {
            await deleteCardAttachment(card.id, attachmentId);
            updateAttachments(attachments.filter((item) => item.id !== attachmentId));
        } catch (requestError) {
            setAttachmentError(getErrorMessage(requestError, "The image could not be removed."));
        }
    }

    async function save() {
        if (!title.trim()) return;
        setIsSaving(true);
        try {
            await onSave({
                title: title.trim(),
                description: description.trim() || undefined,
                priority,
                dueDate: dueDate ? `${dueDate}T00:00:00.000Z` : undefined,
                assigneeUserId: assigneeUserId || undefined,
            });
        } finally { setIsSaving(false); }
    }

    useEffect(() => {
        void getWorkspaceMembers(workspaceId).then(setMembers);
    }, [workspaceId]);

    return <article data-card-id={card.id} className="mahogany-card rounded-xl border border-blue-500 bg-slate-800 p-4 shadow-sm">
        <input value={title} onChange={(event) => setTitle(event.target.value)} aria-label="Card title" maxLength={200} className="mb-2 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-sm text-white outline-none focus:border-blue-500" />
        <textarea value={description} onChange={(event) => setDescription(event.target.value)} aria-label="Card description" placeholder="Description" rows={3} maxLength={4000} className="mb-2 w-full resize-none rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white outline-none focus:border-blue-500" />
        <div className="mb-3 grid grid-cols-2 gap-2">
            <select value={priority} onChange={(event) => setPriority(event.target.value)} aria-label="Card priority" className="rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white"><option>Low</option><option>Normal</option><option>High</option><option>Urgent</option></select>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} onInput={(event) => setDueDate(event.currentTarget.value)} aria-label="Card due date" className="rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white" />
        </div>
        <select value={assigneeUserId} onChange={(event) => setAssigneeUserId(event.target.value)} aria-label="Card assignee" className="mb-3 w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-xs text-white">
            <option value="">Unassigned</option>
            {members.map((member) => <option value={member.userId} key={member.userId}>{member.email}</option>)}
        </select>
        <div className="mb-3 rounded-lg border border-amber-900/50 bg-black/20 p-3">
            <div className="mb-2 flex items-center justify-between gap-2"><span className="text-xs font-semibold text-amber-100">Artwork & screenshots</span><span className="text-xs text-slate-400">{attachments.length}/5</span></div>
            {attachments.length > 0 && <div className="mb-3 grid grid-cols-2 gap-2">{attachments.map((attachment) => <div key={attachment.id} className="relative"><CardAttachmentImage cardId={card.id} attachment={attachment} className="aspect-video w-full rounded border border-amber-900/50" /><button type="button" onClick={() => void removeAttachment(attachment.id)} aria-label={`Remove ${attachment.fileName}`} className="absolute right-1 top-1 rounded-full bg-black/80 px-2 py-0.5 text-sm text-white hover:bg-red-700">×</button></div>)}</div>}
            <label className={`block cursor-pointer rounded border border-dashed border-amber-700 px-3 py-2 text-center text-xs font-semibold text-amber-100 hover:bg-amber-900/20 ${isUploading || attachments.length >= 5 ? "pointer-events-none opacity-50" : ""}`}>
                {isUploading ? `Uploading ${uploadProgress}…` : "Add photos"}
                <input type="file" accept="image/*,.heic,.heif" multiple className="sr-only" disabled={isUploading || attachments.length >= 5} onChange={(event) => { void upload(event.target.files); event.currentTarget.value = ""; }} />
            </label>
            <p className="mt-2 text-[11px] text-slate-400">JPEG, PNG, GIF, WebP, HEIC, or HEIF · large photos are resized automatically</p>
            {attachmentError && <p role="alert" className="mt-2 text-xs text-red-300">{attachmentError}</p>}
        </div>
        <div className="flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">Cancel</button><button type="button" onClick={() => void save()} disabled={isSaving || !title.trim()} className="rounded bg-blue-600 px-3 py-1 text-xs font-bold text-white disabled:opacity-50">{isSaving ? "Saving…" : "Save"}</button></div>
    </article>;
}
