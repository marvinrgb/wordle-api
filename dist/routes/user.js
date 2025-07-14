"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Auth middleware (skip for POST /)
function authUser(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        if (req.method === 'POST' && req.path === '/')
            return next();
        const username = req.headers['x-username'] || req.body.username || req.query.username;
        const authcode = req.headers['x-authcode'] || req.body.authcode || req.query.authcode;
        if (!username || !authcode)
            return res.status(401).json({ error: 'Missing credentials' });
        const user = yield prisma.user.findFirst({ where: { username, authcode } });
        if (!user)
            return res.status(401).json({ error: 'Unauthorized' });
        req.user = user;
        next();
    });
}
router.use(authUser);
// List all users
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany();
        res.json(users);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
}));
// Get user by id
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const user = yield prisma.user.findUnique({ where: { id: req.params.id } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
}));
// Create user
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, authcode } = req.body;
    if (!username || !authcode) {
        return res.status(400).json({ error: 'username and authcode are required' });
    }
    try {
        const user = yield prisma.user.create({ data: { username, authcode } });
        res.status(201).json(user);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create user' });
    }
}));
// Update user
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { username, authcode } = req.body;
    try {
        const user = yield prisma.user.update({
            where: { id: req.params.id },
            data: { username, authcode },
        });
        res.json(user);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update user' });
    }
}));
// Delete user
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.user.delete({ where: { id: req.params.id } });
        res.status(204).end();
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
}));
exports.default = router;
