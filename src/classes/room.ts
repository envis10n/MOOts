import { Inspectable } from "./inspectable";
import { GameObject } from "./game_object";

interface IExit {
    to: GameObject;
    door: Option<GameObject>;
}

const directions: IObjectAny = {
    north: ["north", "n"],
    south: ["south", "s"],
    east: ["east", "e"],
    west: ["west", "w"],
    northwest: ["northwest", "nw"],
    southwest: ["southwest", "sw"],
    northeast: ["northeast", "ne"],
    southeast: ["southeast", "se"],
    up: ["up", "u"],
    down: ["down", "d"],
};

export function Room(
    name: string,
    parent: Option<GameObject>,
    id: number = -1,
    props: IObjectAny = {},
): GameObject {
    if (props.description === undefined) {
        props.description = "You are standing in an empty void.";
    }
    if (props.exits === undefined) {
        props.exits = {};
    }
    const obj = Inspectable(name, parent, id, props);
    function getExits(): Array<{ exit: IExit; direction: string }> {
        const exits = [];
        for (const dir of Object.keys(directions)) {
            const exit: IExit | undefined = obj.props.exits[dir];
            if (exit !== undefined) {
                exits.push({
                    exit,
                    direction: dir,
                });
            }
        }
        return exits;
    }
    obj.class = "Room";
    obj.verbs.look = async (
        caller: Option<GameObject>,
        target?: string,
    ): Promise<string> => {
        if (target !== undefined) {
            const t = await obj.findObject(target);
            if (t !== null && t.verbs.look !== undefined) {
                return t.verbs.look(caller);
            } else {
                return "Look at what?";
            }
        } else {
            const exits = getExits();
            const desc = exits.map((e) => {
                return `To the ${e.direction} you see ${e.exit.to.name}.`;
            });
            return (
                "You look around...\n" +
                obj.props.description +
                (desc.length > 0 ? "\n" + desc.join(".\n") : "") +
                (desc.length > 1 ? "." : "")
            );
        }
    };
    obj.verbs.examine = async (
        caller: Option<GameObject>,
        target?: string,
    ): Promise<string> => {
        if (target !== undefined) {
            const t = await obj.findObject(target);
            if (t !== null && t.verbs.look !== undefined) {
                return t.verbs.examine(caller);
            } else {
                return "Look at what?";
            }
        } else {
            let fin = "You examine your surroundings...\n";
            fin += obj.children
                .filter((objd) => {
                    if (objd.class === "Creature" && objd.controller === null) {
                        return false;
                    } else {
                        return true;
                    }
                })
                .map((objd) => {
                    return "You see " + objd.name;
                })
                .join("\n");
            return fin;
        }
    };
    obj.verbs.move = (caller: GameObject, direction?: string): void => {
        direction = direction ? direction.toLowerCase() : undefined;
        if (direction !== undefined) {
            const exit: IExit | undefined = obj.props.exits[direction];
            if (exit !== undefined) {
                if (exit.door !== null && !exit.door.props.open) {
                    caller.sendMessage(exit.door.name + " blocks you.");
                } else {
                    caller.moveTo(exit.to, direction);
                }
            } else {
                caller.sendMessage("You can't go that way.");
            }
        } else {
            caller.sendMessage("Move where?");
        }
    };
    for (const exit of Object.keys(directions)) {
        for (const alias of directions[exit]) {
            obj.verbs[alias] = (caller: GameObject): void => {
                obj.verbs.move(caller, exit);
            };
        }
    }
    return obj;
}
