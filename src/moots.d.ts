declare type Option<T> = T | null;
declare interface IObjectAny {
    [key: string]: any;
    [key: number]: any;
}
declare interface IObject extends IObjectAny {
    parent?: IObject;
    children: IObject[];
    tick: (delta: number) => void;
}

declare interface IAccount {
    uuid: string;
    username: string;
    hash: string;
    created: number;
    last_login: number;
    flags: string[];
    is_wizard: boolean;
    is_builder: boolean;
    is_moderator: boolean;
    online: boolean;
}
