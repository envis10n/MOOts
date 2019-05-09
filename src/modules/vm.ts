import Classes from "../classes";
import { GameObject } from "../classes/game_object";
import vm from "vm";
import { DB } from "@modules/database";

const global = Object.assign(
    {
        // Anything to be injected into the context at startup.
        setInterval,
        console,
    },
    Classes,
);

const bootstrap = `((root) => {
    let glob = globalThis;
    glob.rootObj = root || GameObject("root", null);
    glob.$0 = glob.rootObj;
    let lastTick = Date.now();
    setInterval(() => {
        const delta = Date.now() - lastTick;
        $0.tick(delta);
        lastTick = Date.now();
    }, 100);
    return $0;
})`;

export const sandbox = vm.createContext(global);
export let $0: GameObject;
export function init(root?: GameObject): (code: string) => any {
    if ($0 === undefined) {
        const boot = vm.runInContext(bootstrap, sandbox);
        $0 = boot(root);
    }
    return (code) => {
        return vm.runInContext(code, sandbox);
    };
}
export function getEval(): (caller: GameObject, code: string) => any {
    return (caller, code) => {
        const c = vm.runInContext(
            `((caller) => {
            ${code}
        })`,
            sandbox,
        );
        return c(caller);
    };
}
