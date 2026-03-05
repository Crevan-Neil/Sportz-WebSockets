import express, { urlencoded } from 'express';
import http from 'http';
import { matchRouter } from './routes/matches.js';
import { attachWebSocketServer } from './ws/server.js';
import { securityMiddleware } from './arcjet.js';

const PORT = Number(process.env.PORT || 8000);
const HOST = process.env.HOST || '0.0.0.0';

const app = express();
const server = http.createServer(app);


app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(securityMiddleware());

app.use("/matches", matchRouter);

const { broadcastMatchCreated } = attachWebSocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

app.get("/", (req, res) => {
    res.send("Hello from express server");
})

server.listen(PORT, HOST, () => {
    const baseUrl = HOST === '0.0.0.0' ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
    console.log(`Server is running on ${baseUrl}`);
    console.log(`WebSocket is running on ${baseUrl.replace('http', 'ws')}/ws`);
})