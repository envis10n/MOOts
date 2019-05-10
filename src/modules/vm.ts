import Classes from "@classes/";
import { GameObject } from "@classes/game_object";
import vm from "vm";
import { getScripts } from "@modules/scripts";
import log from "@modules/log";

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
export async function init(root?: GameObject): Promise<(code: string) => any> {
    if ($0 === undefined) {
        const boot = vm.runInContext(bootstrap, sandbox);
        const scripts = await getScripts();
        const scriptLoader: (
            code: string,
            global: IObjectAny,
        ) => void = vm.runInContext(
            `(function(code, global){ eval(code); })`,
            sandbox,
        );
        for (const script of scripts) {
            log.debug(
                "Loading script: " + script.name + " by " + script.author,
            );
            try {
                scriptLoader(script.code, global);
            } catch (e) {
                log.error("Error loading script: " + e.message);
            }
        }
        $0 = boot(root);
    }
    return (code) => {
        const scriptLoader: (
            code: string,
            global: IObjectAny,
        ) => void = vm.runInContext(
            `(function(code, global){ return eval(code); })`,
            sandbox,
        );
        return scriptLoader(code, global);
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
