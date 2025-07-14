import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient, User as PrismaUser } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Extend Express Request type to include user
interface AuthRequest extends Request {
  user?: PrismaUser;
}

// Auth middleware (for mutating routes only)
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

// List all wordles (public)
router.get('/', async (req: Request, res: Response) => {
  try {
    const wordles = await prisma.wordle.findMany({
        select: {
            id: true,
            creator: {
                select: {
                    username: true
                }
            },
            created_at: true
        }
    });
    res.json(wordles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wordles' });
  }
});

// Get wordle by id (public)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const wordle = await prisma.wordle.findUnique({ where: { id: req.params.id }, select: {
        word: true,
        max_guesses: true,
        creator: {
            select: {
                username: true
            }
        }
    } });
    if (!wordle) {
      res.status(404).json({ error: 'Wordle not found' });
      return;
    }
    
    res.json({
        max_guesses: wordle.max_guesses,
        creator: wordle.creator.username,
        letters: wordle.word.length
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wordle' });
  }
});

// Auth required for the following routes
router.post('/', authUser, async (req: AuthRequest, res: Response) => {
  const { word, max_guesses } = req.body;
  if (!word || typeof max_guesses !== 'number') {
    res.status(400).json({ error: 'word and max_guesses (number) are required' });
    return;
  }
  try {
    const wordle = await prisma.wordle.create({ data: { word, max_guesses, creator_id: req.user!.id } });
    res.status(201).json(wordle);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create wordle' });
  }
});

// Update wordle (only if owned)
router.put('/:id', authUser, async (req: AuthRequest, res: Response) => {
  const { word, max_guesses } = req.body;
  try {
    // Only allow update if owned
    const wordle = await prisma.wordle.updateMany({
      where: { id: req.params.id, creator_id: req.user!.id },
      data: { word, max_guesses },
    });
    if (wordle.count === 0) {
      res.status(404).json({ error: 'Wordle not found or not owned' });
      return;
    }
    const updated = await prisma.wordle.findUnique({ where: { id: req.params.id } });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update wordle' });
  }
});

// Delete wordle (only if owned)
router.delete('/:id', authUser, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await prisma.wordle.deleteMany({ where: { id: req.params.id, creator_id: req.user!.id } });
    if (deleted.count === 0) {
      res.status(404).json({ error: 'Wordle not found or not owned' });
      return;
    }
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete wordle' });
  }
});

export default router; 