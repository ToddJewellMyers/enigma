using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Auth;
using server.Models;

namespace server.Controllers;

public partial class CardsController
{
    private const int MaximumAttachmentCount = 5;
    private const int MaximumAttachmentBytes = 15 * 1024 * 1024;

    [HttpPost("{cardId}/attachments")]
    [RequestSizeLimit(MaximumAttachmentBytes + 64 * 1024)]
    public async Task<ActionResult<CardAttachment>> UploadAttachment(Guid cardId, IFormFile file)
    {
        var card = await context.KanbanCards
            .Include(item => item.Attachments)
            .Include(item => item.KanbanColumn).ThenInclude(column => column!.Board)
            .SingleOrDefaultAsync(item => item.Id == cardId);
        if (card is null) return NotFound();
        var workspaceId = card.KanbanColumn!.Board!.WorkspaceId;
        if (!await WorkspaceAuthorization.CanEdit(context, workspaceId, User.GetUserId())) return Forbid();
        if (file.Length is <= 0 or > MaximumAttachmentBytes)
            return BadRequest("Choose an image no larger than 15 MB.");
        if (card.Attachments.Count >= MaximumAttachmentCount)
            return BadRequest("A card can have up to 5 images.");

        await using var input = file.OpenReadStream();
        using var memory = new MemoryStream();
        await input.CopyToAsync(memory, HttpContext.RequestAborted);
        var data = memory.ToArray();
        var contentType = DetectImageContentType(data);
        if (contentType is null)
            return BadRequest("Only JPEG, PNG, GIF, and WebP images are supported.");

        var attachment = new CardAttachment
        {
            KanbanCardId = card.Id,
            FileName = Path.GetFileName(file.FileName).Trim() is { Length: > 0 } name ? name[..Math.Min(name.Length, 255)] : "card-image",
            ContentType = contentType,
            Size = data.Length,
            Data = data
        };
        context.CardAttachments.Add(attachment);
        await context.SaveChangesAsync();
        await realtime.NotifyAsync(workspaceId, "card-updated", card.Id, HttpContext.RequestAborted);
        return Ok(attachment);
    }

    [HttpGet("{cardId}/attachments/{attachmentId}")]
    public async Task<IActionResult> GetAttachment(Guid cardId, Guid attachmentId)
    {
        var attachment = await context.CardAttachments
            .Where(item => item.Id == attachmentId && item.KanbanCardId == cardId &&
                (item.KanbanCard.KanbanColumn!.Board!.Workspace!.UserId == User.GetUserId() ||
                 item.KanbanCard.KanbanColumn.Board.Workspace.Members.Any(member => member.UserId == User.GetUserId())))
            .SingleOrDefaultAsync();
        return attachment is null ? NotFound() : File(attachment.Data, attachment.ContentType);
    }

    [HttpDelete("{cardId}/attachments/{attachmentId}")]
    public async Task<IActionResult> DeleteAttachment(Guid cardId, Guid attachmentId)
    {
        var attachment = await context.CardAttachments
            .Include(item => item.KanbanCard).ThenInclude(card => card.KanbanColumn).ThenInclude(column => column!.Board)
            .SingleOrDefaultAsync(item => item.Id == attachmentId && item.KanbanCardId == cardId);
        if (attachment is null) return NotFound();
        var workspaceId = attachment.KanbanCard.KanbanColumn!.Board!.WorkspaceId;
        if (!await WorkspaceAuthorization.CanEdit(context, workspaceId, User.GetUserId())) return Forbid();
        context.CardAttachments.Remove(attachment);
        await context.SaveChangesAsync();
        await realtime.NotifyAsync(workspaceId, "card-updated", cardId, HttpContext.RequestAborted);
        return NoContent();
    }

    private static string? DetectImageContentType(byte[] data)
    {
        if (data.Length >= 3 && data[0] == 0xff && data[1] == 0xd8 && data[2] == 0xff) return "image/jpeg";
        if (data.Length >= 8 && data.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a })) return "image/png";
        if (data.Length >= 6 && (data.AsSpan(0, 6).SequenceEqual("GIF87a"u8) || data.AsSpan(0, 6).SequenceEqual("GIF89a"u8))) return "image/gif";
        if (data.Length >= 12 && data.AsSpan(0, 4).SequenceEqual("RIFF"u8) && data.AsSpan(8, 4).SequenceEqual("WEBP"u8)) return "image/webp";
        return null;
    }
}
