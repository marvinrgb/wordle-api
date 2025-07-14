import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Auth middleware (skip for POST /)
async function authUser(req, res, next) {
  if (req.method === 'POST' && req.path === '/') return next();
  const username = req.headers['x-username'] || req.body.username || req.query.username;
  const authcode = req.headers['x-authcode'] || req.body.authcode || req.query.authcode;
  if (!username || !authcode) return res.status(401).json({ error: 'Missing credentials' });
  const user = await prisma.user.findFirst({ where: { username, authcode } });
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  req.user = user;
  next();
}

router.use(authUser);

// List all users
router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get user by id
router.get('/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Create user
router.post('/', async (req, res) => {
  const { username, authcode } = req.body;
  if (!username || !authcode) {
    return res.status(400).json({ error: 'username and authcode are required' });
  }
  try {
    const user = await prisma.user.create({ data: { username, authcode } });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', async (req, res) => {
  const { username, authcode } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { username, authcode },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router; 