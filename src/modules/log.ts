import winston from "winston";

const level = process.env.LOG_LEVEL || "debug";

const logger = winston.createLogger({
    level,
    format: winston.format.json(),
    transports: [
        new winston.transports.File({ filename: "error.log", level: "error" }),
        new winston.transports.File({ filename: "combined.log" }),
        new winston.transports.Console({
            format: winston.format.simple(),
        }),
    ],
});

export = logger;
