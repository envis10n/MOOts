import natural from "natural";
import { GameObjectBase, GOConstructor } from "./game_object_base";
import { GameController } from "./controller";

let globalCounter = 0;

export class GameObject implements GameObjectBase {
    [key: string]: any;
    public class: string = "GameObject";
    public parent: Option<GameObject> = null;
    public children: GameObject[] = [];
    public props: IObjectAny = {};
    public location: Option<GameObject> = null;
    public contents: Option<GameObject[]> = null;
    public controller: Option<GameController> = null;
    public verbs: IObjectAny = {};
    constructor(
        public name: string,
        parent: Option<GameObject>,
        props: IObjectAny = {},
        public id: number = -1,
    ) {
        this.parent = parent;
        for (const prop of Object.keys(props)) {
            this.props[prop] = props[prop];
        }
        if (this.id === -1) {
            this.id = globalCounter;
            globalCounter++;
        }
    }
    public sendMessage(
        message: string,
        caller: Option<GameObject> = null,
        parent: Option<GameObject> = null,
    ) {
        if (parent !== null) {
            for (const child of parent.children) {
                if (child !== caller) {
                    child.sendMessage(message);
                }
            }
        } else {
            if (this.controller !== null) {
                this.controller.hear(message);
            }
        }
    }
    public moveTo(room: GameObject, exit: string | null = null): void {
        const old = this.location;
        this.location = room;
        if (old !== null && exit !== null) {
            this.sendMessage(`${this.name} moves ${exit}.`, this, old);
            old.removeChild(this);
        }
        room.addChild(this);
        if (exit !== null) {
            this.sendMessage(`You move ${exit}.`);
            this.sendMessage(`${this.name} enters.`, this, this.location);
            room.verbs.look(this).then((msg: string) => {
                this.sendMessage(msg);
            });
        }
    }
    public async findObject(terms: string): Promise<Option<GameObject>> {
        const s = this.children.find((obj) => {
            return (
                terms.toLowerCase().replace(/[\s]/g, "") ===
                obj.name.toLowerCase().replace(/[\s]/g, "")
            );
        });
        if (s !== undefined) {
            return s;
        } else {
            let result: Option<GameObject> = null;
            if (this.children.length > 0) {
                for (const child of this.children) {
                    result = await child.findObject(terms);
                    if (result !== null) {
                        break;
                    }
                }
            }
            return result;
        }
    }
    public async findObjectByID(id: number): Promise<Option<GameObject>> {
        const s = this.children.find((obj) => obj.id === id);
        if (s !== undefined) {
            return s;
        } else {
            let result: Option<GameObject> = null;
            if (this.children.length > 0) {
                for (const child of this.children) {
                    result = await child.findObjectByID(id);
                    if (result !== null) {
                        break;
                    }
                }
            }
            return result;
        }
    }
    public createChild(
        base: GOConstructor,
        name: string,
        props: IObjectAny = {},
    ): GameObject {
        let obj: GameObject = base(name, this, -1, props);
        if (typeof base === "function") {
            obj = base(name, this, -1, props);
        } else {
            obj = base;
        }
        const i = this.children.push(obj) - 1;
        return this.children[i];
    }
    public addChild(obj: GameObject): boolean {
        if (this.children.find((v) => v === obj) === undefined) {
            this.children.push(obj);
            return true;
        } else {
            return false;
        }
    }
    public removeChild(obj: GameObject): boolean {
        const i = this.children.findIndex((v) => v === obj);
        if (i !== -1) {
            this.children.splice(i, 1);
            return true;
        } else {
            return false;
        }
    }
    public toString(): string {
        return "Obj_" + this.id;
    }
    public tick(delta: number): void {
        if (
            this.props.onTick !== undefined &&
            typeof this.props.onTick === "function"
        ) {
            this.props.onTick.call(this, delta);
        }
        for (const child of this.children) {
            child.tick(delta);
        }
    }
    public serializeProps(): IObjectAny {
        return JSON.parse(
            JSON.stringify(this.props, (key, val) => {
                if (val instanceof GameObject) {
                    return val.toString();
                } else {
                    return val;
                }
            }),
        );
    }
    public serialize(): IObjectAny {
        const children: IObjectAny[] = [];
        for (const child of this.children) {
            children.push(child.serialize());
        }
        const parent = this.parent === null ? null : this.parent.toString();
        const contents =
            this.contents === null
                ? null
                : this.contents.map((v) => {
                      return v.toString();
                  });
        const location =
            this.location === null ? null : this.location.toString();
        return {
            _key: `Object-${this.name}-${this.id}`,
            id: this.id,
            class: this.class,
            children,
            name: this.name,
            props: this.serializeProps(),
            parent,
            contents,
            location,
        };
    }
}
