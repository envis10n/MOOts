import { Typevine } from "typevine";
import version from "../version";

export const playerList: string[] = [];

export const grapevine = new Typevine(
    ["channels", "games", "players"],
    "MOOts v" + version,
);

grapevine.events.core.on("connected", () => {
    console.log("[Grapevine] Connected.");
    grapevine
        .authenticate(
            process.env.GRAPEVINE_ID || "",
            process.env.GRAPEVINE_SECRET || "",
        )
        .then((res) => {
            if (res.error) {
                throw res.error;
            } else {
                console.log("[Grapevine] Authenticated.");
                console.log(res.payload);
                grapevine.subscribe("gossip").then((re) => {
                    if (re.error) {
                        throw re.error;
                    } else {
                        console.log("[Grapevine] Subscribed to gossip.");
                    }
                });
            }
        });
});

grapevine.events.core.on("disconnected", () => {
    console.log("[Grapevine] Disconnected.");
});

grapevine.events.core.on("heartbeat", () => {
    grapevine.heartbeat(playerList);
});

grapevine.events.core.on("restart", (downtime) => {
    console.log("[Grapevine] Restart imminent...", downtime, "second(s).");
});

grapevine.events.channels.on("broadcast", (broadcast) => {
    console.log("[Grapevine] Broadcast");
    console.log(broadcast);
});
