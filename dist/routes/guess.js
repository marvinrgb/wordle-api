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
// Auth middleware
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
router.use(authUser);
// List all guesses (only user's own)
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const guesses = yield prisma.guess.findMany({ where: { user_id: req.user.id } });
        res.json(guesses);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch guesses' });
    }
}));
// Get guess by id (only if owned)
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const guess = yield prisma.guess.findFirst({ where: { id: req.params.id, user_id: req.user.id } });
        if (!guess)
            return res.status(404).json({ error: 'Guess not found' });
        res.json(guess);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to fetch guess' });
    }
}));
// Create guess (force user_id)
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { word, wordle_id } = req.body;
    if (!word || !wordle_id) {
        res.status(400).json({ error: 'word and wordle_id are required' });
        return;
    }
    if (!(yield isValidWord(word))) {
        res.status(400).json({ error: 'Word does not exist in dictionary' });
        return;
    }
    try {
        const guess = yield prisma.guess.create({ data: { word, user_id: req.user.id, wordle_id } });
        res.status(201).json(yield testGuess(guess.word, wordle_id));
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to create guess' });
    }
}));
function testGuess(guess, wordle_id) {
    return __awaiter(this, void 0, void 0, function* () {
        const word = yield prisma.wordle.findFirst({
            where: {
                id: wordle_id
            },
            select: {
                word: true
            }
        });
        console.log(guess);
        let result = Array.from(guess).map((letter) => { return { letter: letter, color: "" }; });
        result.forEach((letter, index) => {
            if (letter.letter == (word === null || word === void 0 ? void 0 : word.word[index])) {
                letter.color = "green";
                return;
            }
            else if (word === null || word === void 0 ? void 0 : word.word.includes(letter.letter)) {
                letter.color = "yellow";
                return;
            }
        });
        return result;
    });
}
// Update guess (only if owned)
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { word } = req.body;
    try {
        const updated = yield prisma.guess.updateMany({
            where: { id: req.params.id, user_id: req.user.id },
            data: { word },
        });
        if (updated.count === 0) {
            res.status(404).json({ error: 'Guess not found or not owned' });
            return;
        }
        const guess = yield prisma.guess.findUnique({ where: { id: req.params.id } });
        res.json(guess);
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to update guess' });
    }
}));
// Delete guess (only if owned)
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deleted = yield prisma.guess.deleteMany({ where: { id: req.params.id, user_id: req.user.id } });
        if (deleted.count === 0) {
            res.status(404).json({ error: 'Guess not found or not owned' });
            return;
        }
        res.status(204).end();
    }
    catch (err) {
        res.status(500).json({ error: 'Failed to delete guess' });
    }
}));
exports.default = router;
