import { GameObject } from "./game_object";
import { Inspectable } from "./inspectable";
import { formatter } from "../lib/string_utils";

export function Creature(
    name: string,
    parent: Option<GameObject>,
    id: number = -1,
    props: IObjectAny = {},
): GameObject {
    if (props.hp === undefined) {
        props.hp = {
            max: 100,
            val: 100,
        };
    }
    const obj = Inspectable(name, parent, id, props);
    obj.class = "Creature";
    obj.verbs.look = async (
        caller: Option<GameObject> = null,
    ): Promise<string> => {
        if (caller === obj) {
            if (obj.location !== null) {
                const mirror = await obj.location.findObject("mirror");
                if (mirror !== null) {
                    return "You look at yourself in the mirror. How pompous...";
                } else {
                    return "How would you do that without a mirror?";
                }
            } else {
                return "What?";
            }
        } else {
            if (obj.controller === null) {
                return "Who?";
            }
            const pct = obj.healthPercentage();
            let fin = `You look at ${obj.name}...\n`;
            if (pct >= 0.75) {
                fin += "They are very healthy.";
            } else if (pct >= 0.5) {
                fin += "They are fairly healthy.";
            } else if (pct >= 0.25) {
                fin += "They are mildly unwell.";
            } else {
                fin += "They are on death's doorstep.";
            }
            return fin;
        }
    };
    obj.verbs.examine = async (
        caller: Option<GameObject> = null,
    ): Promise<string> => {
        let fin = `You examine ${obj.name} closely...\n`;
        fin += "They are " + (obj.props.dead ? "dead" : "alive") + ".\n";
        fin += "They have " + obj.props.hp.val + " hitpoints.";
        return fin;
    };
    // Define emotes.
    const validEmotes = "smile laugh dance point shrug".split(" ");
    const emoteFiller: IObjectAny = {
        smile: "at",
        laugh: "at",
        dance: "with",
        point: "at",
        shrug: "at",
    };
    obj.healthPercentage = (): number => {
        return obj.props.hp.val / obj.props.hp.max;
    };
    for (const emote of validEmotes) {
        obj.verbs[emote] = async (caller: GameObject, ...args: string[]) => {
            const t = args.length > 0 ? args.join(" ") : undefined;
            let target: Option<GameObject> = null;
            if (obj.location !== null && t !== undefined) {
                target = await obj.location.findObject(t);
            }
            let fin: string;
            if (target === null) {
                if (t !== undefined) {
                    obj.sendMessage("Who?");
                    return;
                } else {
                    fin = "$name $emote$plural.";
                }
            } else {
                fin = "$name $emote$plural $fluff $target.";
            }
            const me = formatter(fin, {
                $name: "You",
                $emote: emote,
                $plural: "",
                $target: target !== null ? target.name : null,
                $fluff: emoteFiller[emote],
            });
            const out = formatter(fin, {
                $name: obj.name,
                $emote: emote,
                $plural: "s",
                $target: target !== null ? target.name : null,
                $fluff: emoteFiller[emote],
            });
            obj.sendMessage(me);
            obj.sendMessage(out, obj, obj.location);
        };
    }
    obj.verbs.say = (caller: GameObject, ...args: string[]): void => {
        obj.sendMessage(
            `${caller.name} says, "${args.join(" ")}".`,
            null,
            obj.location,
        );
    };
    return obj;
}
