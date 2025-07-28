import express, { Application, json as parseRequestJSON, urlencoded as parseURLQuery } from 'express';
import RouteManager from './routes/router-manager.js';
import morgan from 'morgan';
import cors from 'cors';

// if there a env set use it as port, if not use 3000
const port: number = process.env.API_PORT ? Number(process.env.API_PORT) : 3000;

const app: Application = express();

// remove express header
app.disable('x-powered-by');

// logging
app.use(morgan('dev'));

// enable CORS
app.use(cors());

// parse requestbody if in json (= make it usable)
app.use(parseRequestJSON());

// the same but for the query parameters
app.use(parseURLQuery());

// forwards all requests under /api to the routeManager, wich distributes them further
app.use('/api', RouteManager);

// starts the server under the specified port
app.listen(port, () => {
  console.log(`api running on port ${port}`);
});