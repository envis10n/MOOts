import * as vm from "./modules/vm";
import { Room } from "./classes/room";
import { load, save } from "./modules/load";
import version from "./version";
import log from "@modules/log";

process.on("unhandledRejection", (e: any) => {
    log.error(e.message);
    process.exit(1);
});

async function worldSave(): Promise<void> {
    setTimeout(() => {
        const root = vm.$0.serialize();
        save(root).then(() => {
            worldSave();
        });
    }, 15000);
}

async function main() {
    log.info("MOOts v" + version);
    log.info("Loading database...");
    await import("./modules/database");
    const world = await load();
    if (world !== null) {
        await vm.init(world);
    } else {
        log.info("Seeding db...");
        await vm.init();
        const $void = vm.$0.createChild(Room, "Void");
        vm.$0.props.defaultRoom = $void;
    }
    await import("./modules/network");
    await import("./modules/grapevine");
    await import("./modules/web");
    worldSave();
}

main();
