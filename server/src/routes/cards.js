const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const router = express.Router();

// Create card
router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Title is required'),
  body('columnId').notEmpty().withMessage('Column ID is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Verify column belongs to user's board
    const column = await req.prisma.column.findFirst({
      where: {
        id: req.body.columnId,
        board: { userId: req.user.userId }
      }
    });

    if (!column) {
      return res.status(404).json({ error: 'Column not found' });
    }

    // Get max order in column
    const maxOrder = await req.prisma.card.findFirst({
      where: { columnId: req.body.columnId },
      orderBy: { order: 'desc' }
    });

    const card = await req.prisma.card.create({
      data: {
        title: req.body.title,
        content: req.body.content,
        categoryTag: req.body.categoryTag,
        color: req.body.color,
        dueDate: req.body.dueDate,
        columnId: req.body.columnId,
        order: (maxOrder?.order ?? -1) + 1
      },
      include: { column: true }
    });

    res.status(201).json({ card });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update card
router.put('/:id', auth, async (req, res) => {
  try {
    const card = await req.prisma.card.findFirst({
      where: {
        id: req.params.id,
        column: { board: { userId: req.user.userId } }
      },
      include: { column: true }
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    // 狀態對應欄位名稱
    const statusToColumnTitle = {
      'todo': '待辦',
      'doing': '執行中',
      'done': '已完成'
    }

    const newStatus = req.body.status
    const targetColumnTitle = statusToColumnTitle[newStatus]

    // 如果狀態改變，找到對應的欄位
    let targetColumnId = card.columnId
    if (newStatus !== card.status && targetColumnTitle) {
      const targetColumn = await req.prisma.column.findFirst({
        where: {
          boardId: card.column.boardId,
          title: targetColumnTitle
        }
      })
      if (targetColumn) {
        targetColumnId = targetColumn.id
      }
    }

    // Set completedAt when status changes to done
    const completedAt = newStatus === 'done' 
      ? new Date() 
      : (card.status === 'done' ? null : card.completedAt)

    const updatedCard = await req.prisma.card.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title,
        content: req.body.content,
        categoryTag: req.body.categoryTag,
        color: req.body.color,
        status: newStatus,
        dueDate: req.body.dueDate,
        completedAt,
        columnId: targetColumnId
      },
      include: { column: true }
    });

    res.json({ card: updatedCard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete card
router.delete('/:id', auth, async (req, res) => {
  try {
    const card = await req.prisma.card.findFirst({
      where: {
        id: req.params.id,
        column: { board: { userId: req.user.userId } }
      }
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await req.prisma.card.delete({ where: { id: req.params.id } });

    res.json({ message: 'Card deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Move card (drag-drop)
router.post('/move', auth, async (req, res) => {
  const { cardId, targetColumnId, newOrder, status } = req.body;

  try {
    const card = await req.prisma.card.findFirst({
      where: {
        id: cardId,
        column: { board: { userId: req.user.userId } }
      }
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const sourceColumnId = card.columnId;
    const newStatus = status || card.status
    const completedAt = newStatus === 'done' 
      ? new Date() 
      : (card.status === 'done' ? null : card.completedAt)

    // Use transaction for atomicity
    await req.prisma.$transaction(async (tx) => {
      // If moving within same column
      if (sourceColumnId === targetColumnId) {
        // Get cards in the column
        const cards = await tx.card.findMany({
          where: { columnId: sourceColumnId },
          orderBy: { order: 'asc' }
        });

        // Remove card from its current position
        cards.splice(cards.findIndex(c => c.id === cardId), 1);
        // Insert at new position
        cards.splice(newOrder, 0, card);

        // Reorder all cards
        for (let i = 0; i < cards.length; i++) {
          await tx.card.update({
            where: { id: cards[i].id },
            data: { order: i }
          });
        }
      } else {
        // Moving to different column
        
        // Get target column cards
        const targetCards = await tx.card.findMany({
          where: { columnId: targetColumnId },
          orderBy: { order: 'asc' }
        });

        // Insert at new position
        targetCards.splice(newOrder, 0, { ...card, columnId: targetColumnId });

        // Reorder target column
        for (let i = 0; i < targetCards.length; i++) {
          await tx.card.update({
            where: { id: targetCards[i].id },
            data: { order: i, columnId: targetColumnId }
          });
        }

        // Reorder source column
        const sourceCards = await tx.card.findMany({
          where: { columnId: sourceColumnId },
          orderBy: { order: 'asc' }
        });

        for (let i = 0; i < sourceCards.length; i++) {
          await tx.card.update({
            where: { id: sourceCards[i].id },
            data: { order: i }
          });
        }
      }

      // Update card status, columnId and completedAt
      // 如果狀態改變，找到對應的欄位
      let finalColumnId = targetColumnId
      if (newStatus !== card.status) {
        const statusToColumnTitle = {
          'todo': '待辦',
          'doing': '執行中',
          'done': '已完成'
        }
        const targetColumnTitle = statusToColumnTitle[newStatus]
        if (targetColumnTitle) {
          const targetColumn = await tx.column.findFirst({
            where: {
              boardId: card.column.boardId,
              title: targetColumnTitle
            }
          })
          if (targetColumn) {
            finalColumnId = targetColumn.id
          }
        }
      }

      await tx.card.update({
        where: { id: cardId },
        data: { 
          status: newStatus, 
          completedAt,
          columnId: finalColumnId
        }
      });
    });

    // Fetch updated card
    const updatedCard = await req.prisma.card.findUnique({
      where: { id: cardId },
      include: { column: true }
    });

    res.json({ card: updatedCard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check overdue cards (for cron job)
router.get('/overdue', auth, async (req, res) => {
  try {
    const overdueCards = await req.prisma.card.findMany({
      where: {
        column: { board: { userId: req.user.userId } },
        status: { not: 'done' },
        dueDate: { lt: new Date() }
      },
      include: { column: { include: { board: true } } }
    });

    res.json({ cards: overdueCards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
