import { GameObject } from "./game_object";
import { GOConstructor } from "./game_object_base";
import { Room } from "./room";
import { Creature } from "./creature";
import { Inspectable } from "./inspectable";

const exp: { [key: string]: GOConstructor } = {
    GameObject: (name, parent, id, props): GameObject => {
        return new GameObject(name, parent, props, id);
    },
    Room,
    Creature,
    Inspectable,
};

export = exp;
