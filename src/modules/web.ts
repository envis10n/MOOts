import express from "express";
import log from "./log";
import path from "path";

type ErrorCB = (error: Error | null | undefined) => void;
type Write1 = (chunk: any, cb?: ErrorCB) => boolean;
type Write2 = (chunk: any, encoding?: string, cb?: ErrorCB) => boolean;
type Write = Write1 | Write2;

const webPort =
    process.env.WEB_PORT !== undefined ? Number(process.env.WEB_PORT) : 5000;

export const app = express();

app.use((req, res, next) => {
    log.debug(`[Web] <= ${req.method} ${req.path}`);
    res.on("finish", () => {
        log.debug(`[Web] => ${req.method} ${res.statusCode} ${req.path}`);
    });
    next();
});

const api = express.Router({
    mergeParams: true,
});

export const v1 = express.Router({
    mergeParams: true,
});

v1.get("/test", (req, res) => {
    res.statusCode = 200;
    res.json({ ok: true, ts: Date.now() });
});

api.use("/v1", v1);

app.use("/api", api);

/* Web Client */

app.get("/play", (req, res) => {
    res.sendFile(path.resolve(process.cwd(), "public", "client", "index.html"));
});

app.use("/play", express.static(path.join(process.cwd(), "public", "client")));

/* */

app.listen(webPort, () => {
    log.info("HTTP server online.");
});
