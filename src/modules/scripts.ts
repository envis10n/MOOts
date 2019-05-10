import { DB } from "@modules/database";

export interface IScript {
    _key: string;
    code: string;
    author: string;
    name: string;
}

export async function getScripts(): Promise<IScript[]> {
    const col = await DB.collection("scripts");
    const res: IScript[] = await (await col.all()).all();
    return res;
}
