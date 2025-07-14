"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
const default_route_js_1 = __importDefault(require("./default-route.js"));
const user_js_1 = __importDefault(require("./user.js"));
const wordle_js_1 = __importDefault(require("./wordle.js"));
const guess_js_1 = __importDefault(require("./guess.js"));
router.use('/default', default_route_js_1.default);
router.use('/user', user_js_1.default);
router.use('/wordle', wordle_js_1.default);
router.use('/guess', guess_js_1.default);
exports.default = router;
