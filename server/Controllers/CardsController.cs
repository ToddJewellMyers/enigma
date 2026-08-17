using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using Microsoft.AspNetCore.Authorization;
using server.Auth;
using server.Contracts;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CardsController : ControllerBase
{
    private readonly AppDbContext _context;

    public CardsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{columnId}")]
    public async Task<ActionResult<List<KanbanCard>>> GetCards(Guid columnId)
    {
        return await _context.KanbanCards
            .Where(c => c.KanbanColumnId == columnId && c.KanbanColumn!.Board!.Workspace!.UserId == User.GetUserId())
            .OrderBy(c => c.Position)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<KanbanCard>> CreateCard(KanbanCard card)
    {
        var columnExists = await _context.KanbanColumns
            .AnyAsync(column => column.Id == card.KanbanColumnId && column.Board!.Workspace!.UserId == User.GetUserId());

        if (!columnExists)
        {
            return BadRequest("The selected column does not exist.");
        }

        _context.KanbanCards.Add(card);
        await _context.SaveChangesAsync();

        return Ok(card);
    }

    [HttpPut("{cardId}")]
    public async Task<ActionResult<KanbanCard>> UpdateCard(Guid cardId, UpdateCardRequest request)
    {
        var userId = User.GetUserId();
        var card = await _context.KanbanCards.SingleOrDefaultAsync(item => item.Id == cardId && item.KanbanColumn!.Board!.Workspace!.UserId == userId);

        if (card is null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest("A card title is required.");
        }

        card.Title = request.Title.Trim();
        card.Description = string.IsNullOrWhiteSpace(request.Description)
            ? null
            : request.Description.Trim();
        card.Priority = string.IsNullOrWhiteSpace(request.Priority)
            ? "Normal"
            : request.Priority;
        card.DueDate = request.DueDate;

        await _context.SaveChangesAsync();
        return Ok(card);
    }

    [HttpPut("{cardId}/move")]
    public async Task<ActionResult<KanbanCard>> MoveCard(Guid cardId, MoveCardRequest request)
    {
        var userId = User.GetUserId();
        var card = await _context.KanbanCards.SingleOrDefaultAsync(item => item.Id == cardId && item.KanbanColumn!.Board!.Workspace!.UserId == userId);

        if (card is null)
        {
            return NotFound();
        }

        var targetColumnExists = await _context.KanbanColumns
            .AnyAsync(column => column.Id == request.KanbanColumnId && column.Board!.Workspace!.UserId == userId);

        if (!targetColumnExists)
        {
            return BadRequest("The selected column does not exist.");
        }

        var sourceColumnId = card.KanbanColumnId;
        var sourceCards = await _context.KanbanCards
            .Where(existingCard =>
                existingCard.KanbanColumnId == sourceColumnId && existingCard.Id != cardId)
            .OrderBy(existingCard => existingCard.Position)
            .ToListAsync();

        var targetCards = sourceColumnId == request.KanbanColumnId
            ? sourceCards
            : await _context.KanbanCards
                .Where(existingCard =>
                    existingCard.KanbanColumnId == request.KanbanColumnId && existingCard.Id != cardId)
                .OrderBy(existingCard => existingCard.Position)
                .ToListAsync();

        for (var index = 0; index < sourceCards.Count; index++)
        {
            sourceCards[index].Position = index + 1;
        }

        var targetIndex = Math.Clamp(request.Position - 1, 0, targetCards.Count);
        targetCards.Insert(targetIndex, card);

        card.KanbanColumnId = request.KanbanColumnId;

        for (var index = 0; index < targetCards.Count; index++)
        {
            targetCards[index].Position = index + 1;
        }

        await _context.SaveChangesAsync();
        return Ok(card);
    }

    [HttpDelete("{cardId}")]
    public async Task<IActionResult> DeleteCard(Guid cardId)
    {
        var userId = User.GetUserId();
        var card = await _context.KanbanCards.SingleOrDefaultAsync(item => item.Id == cardId && item.KanbanColumn!.Board!.Workspace!.UserId == userId);

        if (card is null)
        {
            return NotFound();
        }

        var remainingCards = await _context.KanbanCards
            .Where(existingCard =>
                existingCard.KanbanColumnId == card.KanbanColumnId && existingCard.Id != cardId)
            .OrderBy(existingCard => existingCard.Position)
            .ToListAsync();

        _context.KanbanCards.Remove(card);

        for (var index = 0; index < remainingCards.Count; index++)
        {
            remainingCards[index].Position = index + 1;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
