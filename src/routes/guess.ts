import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, User as PrismaUser } from '@prisma/client';
import fetch from 'node-fetch';

const router = Router();
const prisma = new PrismaClient();

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: PrismaUser;
}

// Helper to check if a word exists in English
async function isValidWord(word: string): Promise<boolean> {
  try {
    const resp = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    return resp.status === 200;
  } catch {
    return false;
  }
}

// Auth middleware
function authUser(req: AuthRequest, res: Response, next: NextFunction) {
  (async () => {
    const username = req.headers['x-username'] || req.body.username || req.query.username;
    const authcode = req.headers['x-authcode'] || req.body.authcode || req.query.authcode;
    if (!username || !authcode) {
      res.status(401).json({ error: 'Missing credentials' });
      return;
    }
    const user = await prisma.user.findFirst({ where: { username: String(username), authcode: String(authcode) } });
    if (!user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    req.user = user;
    next();
  })();
}

router.use(authUser);

// List all guesses (only user's own)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const guesses = await prisma.guess.findMany({ where: { user_id: req.user!.id } });
    res.json(guesses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch guesses' });
  }
});

// Get guess by id (only if owned)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const guess = await prisma.guess.findFirst({ where: { id: req.params.id, user_id: req.user!.id } });
    if (!guess) return res.status(404).json({ error: 'Guess not found' });
    res.json(guess);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch guess' });
  }
});

// Create guess (force user_id)
router.post('/', async (req: AuthRequest, res: Response) => {
  const { word, wordle_id } = req.body;
  if (!word || !wordle_id) {
    res.status(400).json({ error: 'word and wordle_id are required' });
    return;
  }
  if (!(await isValidWord(word))) {
    res.status(400).json({ error: 'Word does not exist in dictionary' });
    return;
  }
  try {
    const guess = await prisma.guess.create({ data: { word, user_id: req.user!.id, wordle_id } });
    res.status(201).json(await testGuess(guess.word, wordle_id));
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
  console.log(guess)
  let result = Array.from(guess).map((letter) => { return {letter: letter, color: ""}});
  result.forEach((letter, index) => {
    if (letter.letter == word?.word[index]) {
      letter.color = "green";
      return;
    } else if (word?.word.includes(letter.letter)) {
      letter.color = "yellow";
      return;
    }
  });
  return result;
}

// Update guess (only if owned)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { word } = req.body;
  try {
    const updated = await prisma.guess.updateMany({
      where: { id: req.params.id, user_id: req.user!.id },
      data: { word },
    });
    if (updated.count === 0) {
      res.status(404).json({ error: 'Guess not found or not owned' });
      return;
    }
    const guess = await prisma.guess.findUnique({ where: { id: req.params.id } });
    res.json(guess);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update guess' });
  }
});

// Delete guess (only if owned)
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await prisma.guess.deleteMany({ where: { id: req.params.id, user_id: req.user!.id } });
    if (deleted.count === 0) {
      res.status(404).json({ error: 'Guess not found or not owned' });
      return;
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete guess' });
  }
});

export default router; 