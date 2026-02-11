const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all boards for user
router.get('/', auth, async (req, res) => {
  try {
    const boards = await req.prisma.board.findMany({
      where: { userId: req.user.userId },
      include: {
        columns: {
          include: { cards: true },
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json({ boards });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single board
router.get('/:id', auth, async (req, res) => {
  try {
    const board = await req.prisma.board.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      },
      include: {
        columns: {
          include: { cards: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    res.json({ board });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new board with default columns
router.post('/', [
  auth,
  body('title').notEmpty().withMessage('Title is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const board = await req.prisma.board.create({
      data: {
        title: req.body.title,
        userId: req.user.userId,
        columns: {
          create: [
            { title: '待辦 (To-do)', order: 0 },
            { title: '執行中 (Doing)', order: 1 },
            { title: '已完成 (Done)', order: 2 }
          ]
        }
      },
      include: {
        columns: {
          include: { cards: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    res.status(201).json({ board });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update board
router.put('/:id', auth, async (req, res) => {
  try {
    const board = await req.prisma.board.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    const updatedBoard = await req.prisma.board.update({
      where: { id: req.params.id },
      data: { title: req.body.title },
      include: {
        columns: {
          include: { cards: true },
          orderBy: { order: 'asc' }
        }
      }
    });

    res.json({ board: updatedBoard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete board
router.delete('/:id', auth, async (req, res) => {
  try {
    const board = await req.prisma.board.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    await req.prisma.board.delete({ where: { id: req.params.id } });

    res.json({ message: 'Board deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add column to board
router.post('/:id/columns', auth, [
  body('title').notEmpty().withMessage('Title is required')
], async (req, res) => {
  try {
    const board = await req.prisma.board.findFirst({
      where: { 
        id: req.params.id,
        userId: req.user.userId
      }
    });

    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Get max order
    const maxOrder = await req.prisma.column.findFirst({
      where: { boardId: req.params.id },
      orderBy: { order: 'desc' }
    });

    const column = await req.prisma.column.create({
      data: {
        title: req.body.title,
        boardId: req.params.id,
        order: (maxOrder?.order ?? -1) + 1
      },
      include: { cards: true }
    });

    res.status(201).json({ column });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
