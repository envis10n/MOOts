import { GameObject } from "./game_object";

export function Inspectable(
    name: string,
    parent: Option<GameObject>,
    id: number = -1,
    props: IObjectAny = {},
): GameObject {
    const obj = new GameObject(name, parent, props, id);
    obj.class = "Inspectable";
    obj.verbs.look = async (
        caller: Option<GameObject> = null,
    ): Promise<string> => {
        return (
            "You look at " +
            obj.name +
            "...\n" +
            (obj.props.description || "No description.")
        );
    };
    obj.verbs.examine = async (
        caller: Option<GameObject> = null,
    ): Promise<string> => {
        return (
            "You examine " +
            obj.name +
            "...\n" +
            (obj.props.examine || "You find nothing.")
        );
    };
    return obj;
}
