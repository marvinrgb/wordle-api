import { Router }from 'express';
const router = Router();

import defaultRoute from './default-route.js';
import userRoute from './user.js';
import wordleRoute from './wordle.js';
import guessRoute from './guess.js';

router.use('/default', defaultRoute);
router.use('/user', userRoute);
router.use('/wordle', wordleRoute);
router.use('/guess', guessRoute);

export default router;