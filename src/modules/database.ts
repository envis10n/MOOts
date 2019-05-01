import arango, { DocumentCollection, EdgeCollection } from "arangojs";

const arangoURI = process.env.ARANGO_URI || "http://localhost:8529";
const arangoUser = process.env.ARANGO_USER || "root";
const arangoPassword = process.env.ARANGO_PASSWORD || "";
const arangoDB = process.env.ARANGO_DB || "moots";

const db = arango({
    url: arangoURI,
});

db.useBasicAuth(arangoUser, arangoPassword);

db.useDatabase(arangoDB);

db.exists().then((exists) => {
    if (!exists) {
        db.createDatabase(arangoDB);
        db.useDatabase(arangoDB);
    }
});

export namespace DB {
    export async function collection(
        name: string,
    ): Promise<DocumentCollection> {
        const col = db.collection(name);
        if (!(await col.exists())) {
            console.log("[DB] Creating collection:", name);
            await col.create();
        }
        return col;
    }
    export async function edgeCollection(
        name: string,
    ): Promise<EdgeCollection> {
        const col = db.edgeCollection(name);
        if (!(await col.exists())) {
            console.log("[DB] Creating edge collection:", name);
            await col.create();
        }
        return col;
    }
}
