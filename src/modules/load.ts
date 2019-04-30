import fs from "fs";
import { promisify as _p } from "util";
import { GameObject } from "@classes/game_object";
import classes from "@classes/";

const readFile = _p(fs.readFile);

export const objects: GameObject[] = [];

async function revive(
    dobj: IObjectAny,
    parent: Option<GameObject> = null,
): Promise<GameObject> {
    const construct = classes[dobj.class];
    if (construct !== undefined) {
        const obj = construct(dobj.name, parent, dobj.id, dobj.props);
        obj.contents = dobj.contents;
        obj.location = dobj.location;
        objects[obj.id] = obj;
        for (const child of dobj.children as IObjectAny[]) {
            const cobj = await revive(child, obj);
            obj.addChild(cobj);
        }
        return obj;
    } else {
        throw new Error("Invalid constructor for class " + dobj.class);
    }
}

function getRefID(val: string): number | null {
    if (typeof val === "string" && /Obj_\d/.test(val)) {
        const id = Number(val[val.length - 1]);
        return id;
    } else {
        return null;
    }
}

async function fixRefs(rootObj: GameObject) {
    const location = getRefID(rootObj.location as any);
    if (location !== null) {
        rootObj.location = objects[location];
    }
    for (const propKey of Object.keys(rootObj.props)) {
        const prop = rootObj.props[propKey];
        const id = getRefID(prop);
        if (id !== null) {
            rootObj.props[propKey] = objects[id];
        }
    }
    for (const child of rootObj.children) {
        await fixRefs(child);
    }
}

export async function load(): Promise<{
    world: GameObject;
    accounts: IAccount[];
}> {
    try {
        const db = await readFile("./.db/world.json", { encoding: "utf8" });
        const accounts = await readFile("./.db/accounts.json", {
            encoding: "utf8",
        });
        const dobj = JSON.parse(db);
        const aobj = JSON.parse(accounts);
        const rootObject = await revive(dobj);
        await fixRefs(rootObject);
        return {
            world: rootObject,
            accounts: aobj,
        };
    } catch (e) {
        console.log("Error loading DB:", e.message);
        throw e;
    }
}
