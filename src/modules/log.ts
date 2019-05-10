import winston, { format, transports } from "winston";
import Transport from "winston-transport";
import { DB } from "@modules/database";

class ArangoTransport extends Transport {
    private collection: string;
    constructor(opts: { collection: string }) {
        super();
        this.collection = opts.collection;
    }
    public async log(info: IObjectAny, callback: () => void) {
        setImmediate(() => {
            this.emit("logged", info);
        });
        if (info.timestamp === undefined) {
            info.timestamp = new Date().toISOString();
        }
        const col = await DB.collection(this.collection);
        await col.save(info);
        callback();
    }
}

const level = process.env.LOG_LEVEL || "debug";

const logDB =
    process.env.LOG_DB !== undefined ? Boolean(process.env.LOG_DB) : false;

const logger = winston.createLogger({
    level,
    format: format.combine(format.timestamp(), format.json()),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
        new winston.transports.Console({
            format: format.combine(
                format.timestamp({ format: "hh:mm:ss.SSS" }),
                format.colorize(),
                format.simple(),
            ),
        }),
    ],
});

if (logDB) {
    logger.add(new ArangoTransport({ collection: "logs" }));
}

export = logger;
