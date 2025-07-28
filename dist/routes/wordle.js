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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const node_fetch_1 = __importDefault(require("node-fetch"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Helper to check if a word exists in English
function isValidWord(word) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const resp = yield (0, node_fetch_1.default)(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            return resp.status === 200;
        }
        catch (_a) {
            return false;
        }
    });
}
// Auth middleware (for mutating routes only)
function authUser(req, res, next) {
    (() => __awaiter(this, void 0, void 0, function* () {
        const username = req.headers['x-username'] || req.body.username || req.query.username;
        const authcode = req.headers['x-authcode'] || req.body.authcode || req.query.authcode;
        if (!username || !authcode) {
            res.status(401).json({ error: 'Missing credentials' });
            return;
        }
        const user = yield prisma.user.findFirst({ where: { username: String(username), authcode: String(authcode) } });
        if (!user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        req.user = user;
        next();
    }))();
}
// List all wordles (public)
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wordles = yield prisma.wordle.findMany({
            select: {
                id: true,
                created_at: true,
                creator: {
                    select: {
                        username: true
                    }
                },
                max_guesses: true,
                description: true,
                guesses: {
                    select: {
                        word: true,
                        created_at: true,
                        user: {
                            select: {
                                username: true
                            }
                        }
                    }
                }
            }
        });
        res.json(wordles);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch wordles' });
    }
}));
// Get wordle by id (public)
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wordle = yield prisma.wordle.findUnique({ where: { id: req.params.id },
            select: {
                id: true,
                description: true,
                created_at: true,
                creator: {
                    select: {
                        username: true
                    }
                },
                max_guesses: true,
                word: true
            } });
        if (!wordle) {
            res.status(404).json({ error: 'Wordle not found' });
            return;
        }
        wordle.letters = wordle.word.length;
        delete wordle.word;
        res.json(wordle);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch wordle' });
    }
}));
// Auth required for the following routes
router.post('/', authUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { word, max_guesses } = req.body;
    if (!word || typeof max_guesses !== 'number') {
        res.status(400).json({ error: 'word and max_guesses (number) are required' });
        return;
    }
    if (!(yield isValidWord(word))) {
        res.status(400).json({ error: 'Word does not exist in dictionary' });
        return;
    }
    try {
        const wordle = yield prisma.wordle.create({ data: { word, max_guesses, creator_id: req.user.id } });
        res.status(201).json(wordle);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create wordle' });
    }
}));
// Update wordle (only if owned)
router.put('/:id', authUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { word, max_guesses } = req.body;
    try {
        // Only allow update if owned
        const wordle = yield prisma.wordle.updateMany({
            where: { id: req.params.id, creator_id: req.user.id },
            data: { word, max_guesses },
        });
        if (wordle.count === 0) {
            res.status(404).json({ error: 'Wordle not found or not owned' });
            return;
        }
        const updated = yield prisma.wordle.findUnique({ where: { id: req.params.id } });
        res.json(updated);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update wordle' });
    }
}));
// Delete wordle (only if owned)
router.delete('/:id', authUser, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield prisma.wordle.deleteMany({ where: { id: req.params.id, creator_id: req.user.id } });
        if (deleted.count === 0) {
            res.status(404).json({ error: 'Wordle not found or not owned' });
            return;
        }
        res.status(204).end();
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete wordle' });
    }
}));
exports.default = router;
