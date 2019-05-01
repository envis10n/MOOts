import * as vm from "./modules/vm";
import { Room } from "./classes/room";
import { load, objects, save } from "./modules/load";

process.on("unhandledRejection", (e) => {
    console.error(e);
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
    console.log("MOOts r1");
    console.log("Loading database...");
    await import("./modules/database");
    const world = await load();
    if (world !== null) {
        vm.init(world);
    } else {
        console.log("Seeding db...");
        vm.init();
        const $void = vm.$0.createChild(Room, "Void");
        vm.$0.props.defaultRoom = $void;
    }
    await import("./modules/network");
    worldSave();
}

main();
