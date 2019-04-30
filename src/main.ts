import * as vm from "./modules/vm";
import { Room } from "./classes/room";
import fs from "fs";
import { load } from "./modules/load";
import { saveAccounts, loadAccounts } from "./modules/accounts";

process.on("unhandledRejection", (e) => {
    console.error(e);
    process.exit(1);
});

function save() {
    const root = vm.$0.serialize();
    const accounts = saveAccounts();
    if (!fs.existsSync("./.db")) {
        fs.mkdirSync("./.db");
    }
    fs.writeFileSync("./.db/world.json", JSON.stringify(root));
    fs.writeFileSync("./.db/accounts.json", JSON.stringify(accounts));
}

async function main() {
    console.log("MOOts r1");
    if (
        fs.existsSync("./.db/world.json") &&
        fs.existsSync("./.db/accounts.json")
    ) {
        console.log("Loading from db...");
        const db = await load();
        vm.init(db.world);
        loadAccounts(db.accounts);
    } else {
        console.log("Seeding db...");
        vm.init();
        const $void = vm.$0.createChild(Room, "Void");
        vm.$0.props.defaultRoom = $void;
    }
    await import("./modules/network");
    setInterval(() => {
        save();
    }, 15000);
    save();
}

main();
