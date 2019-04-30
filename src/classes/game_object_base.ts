import { GameObject } from "./game_object";

export type GOConstructor = (
    name: string,
    parent: Option<GameObject>,
    id?: number,
    props?: IObjectAny,
) => GameObject;

export declare class GameObjectBase {
    public static create<T>(
        name: string,
        parent: Option<GameObject>,
        props?: IObjectAny,
    ): T;
}
