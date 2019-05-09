import { Typevine } from "typevine";
import version from "../version";
import log from "@modules/log";

const grapevineID = process.env.GRAPEVINE_ID || "";
const grapevineSecret = process.env.GRAPEVINE_SECRET || "";
const grapeEnabled =
    process.env.GRAPEVINE_ENABLED !== undefined
        ? grapevineID !== "" && grapevineSecret !== ""
            ? Boolean(process.env.GRAPEVINE_ENABLED)
            : false
        : false;

export const playerList: string[] = [];

export const grapevine: Typevine | null = grapeEnabled
    ? new Typevine(["channels", "games", "players"], "MOOts v" + version)
    : null;

if (grapevine !== null) {
    grapevine.events.core.on("connected", () => {
        log.info("[Grapevine] Connected.");
        grapevine
            .authenticate(
                process.env.GRAPEVINE_ID || "",
                process.env.GRAPEVINE_SECRET || "",
            )
            .then((res) => {
                if (res.error) {
                    throw res.error;
                } else {
                    log.info("[Grapevine] Authenticated.");
                    log.debug(JSON.stringify(res.payload));
                    grapevine.subscribe("gossip").then((re) => {
                        if (re.error) {
                            throw re.error;
                        } else {
                            log.info("[Grapevine] Subscribed to gossip.");
                        }
                    });
                }
            });
    });

    grapevine.events.core.on("disconnected", () => {
        log.info("[Grapevine] Disconnected.");
    });

    grapevine.events.core.on("heartbeat", () => {
        grapevine.heartbeat(playerList);
    });

    grapevine.events.core.on("restart", (downtime) => {
        log.info("[Grapevine] Restart imminent...", downtime, "second(s).");
    });

    grapevine.events.channels.on("broadcast", (broadcast) => {
        log.debug("[Grapevine] Broadcast");
        log.debug(JSON.stringify(broadcast));
    });
} else {
    log.info("[Grapevine] Disabled.");
}
