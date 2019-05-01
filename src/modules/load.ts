import { GameObject } from "@classes/game_object";
import classes from "@classes/";
import { DB } from "@modules/database";

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
        } else if (propKey === "exits") {
            for (const exit of Object.keys(prop)) {
                const exitID = getRefID(prop[exit]);
                if (exitID !== null) {
                    rootObj.props.exits[exit] = objects[exitID];
                }
            }
        }
    }
    for (const child of rootObj.children) {
        await fixRefs(child);
    }
}

export async function load(): Promise<Option<GameObject>> {
    try {
        const worldCol = await DB.collection("world");
        const world = await (await worldCol.byExample({ id: 0 })).all();
        if (world[0] === undefined) {
            return null;
        }
        const rootObject = await revive(world[0]);
        await fixRefs(rootObject);
        return rootObject;
    } catch (e) {
        console.log("Error loading DB:", e.message);
        throw e;
    }
}

export async function save(rootObj: IObjectAny): Promise<void> {
    const worldCol = await DB.collection("world");
    if (await worldCol.documentExists(rootObj._key)) {
        await worldCol.replace(rootObj._key, rootObj);
    } else {
        await worldCol.save(rootObj);
    }
}
