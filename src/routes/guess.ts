import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Auth middleware
async function authUser(req, res, next) {
  const username = req.headers['x-username'] || req.body.username || req.query.username;
  const authcode = req.headers['x-authcode'] || req.body.authcode || req.query.authcode;
  if (!username || !authcode) return res.status(401).json({ error: 'Missing credentials' });
  const user = await prisma.user.findFirst({ where: { username, authcode } });
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
}

router.use(authUser);

// List all guesses (only user's own)
router.get('/', async (req, res) => {
  try {
    const guesses = await prisma.guess.findMany({ where: { user_id: req.user.id } });
    res.json(guesses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch guesses' });
  }
});

// Get guess by id (only if owned)
router.get('/:id', async (req, res) => {
  try {
    const guess = await prisma.guess.findFirst({ where: { id: req.params.id, user_id: req.user.id } });
    if (!guess) return res.status(404).json({ error: 'Guess not found' });
    res.json(guess);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch guess' });
  }
});

// Create guess (force user_id)
router.post('/', async (req, res) => {
  const { word, wordle_id } = req.body;
  if (!word || !wordle_id) {
    return res.status(400).json({ error: 'word and wordle_id are required' });
  }
  try {
    const guess = await prisma.guess.create({ data: { word, user_id: req.user.id, wordle_id } });
    const result = await testGuess(word, wordle_id);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create guess' });
  }
});

async function testGuess(guess: string, wordle_id: string) {
  const word = await prisma.wordle.findFirst({
    where: {
      id: wordle_id
    },
    select: {
      word: true
    }
  });
  let result = Array.from(guess).map((letter) => { return {letter: letter, color: ""}});
  result.forEach((letter, index) => {
    if (letter.letter == word?.word) {
      letter.color = "green";
    } else if (word?.word.includes(letter.letter)) {
      letter.color = "yellow";
    }
  });
  return result;
}

// Update guess (only if owned)
router.put('/:id', async (req, res) => {
  const { word } = req.body;
  try {
    const updated = await prisma.guess.updateMany({
      where: { id: req.params.id, user_id: req.user.id },
      data: { word },
    });
    if (updated.count === 0) return res.status(404).json({ error: 'Guess not found or not owned' });
    const guess = await prisma.guess.findUnique({ where: { id: req.params.id } });
    res.json(guess);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update guess' });
  }
});

// Delete guess (only if owned)
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await prisma.guess.deleteMany({ where: { id: req.params.id, user_id: req.user.id } });
    if (deleted.count === 0) return res.status(404).json({ error: 'Guess not found or not owned' });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete guess' });
  }
});

export default router; 