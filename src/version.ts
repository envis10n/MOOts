import fs from "fs";
import path from "path";

const version: string = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../package.json"), {
        encoding: "utf8",
    }),
).version;

export = version;
