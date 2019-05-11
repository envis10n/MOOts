import { Socket } from "@classes/socket";
import Telnet from "ts-telnet";
import fs from "fs";
import { grapevine } from "@modules/grapevine";
import { WServer, WClient } from "@modules/websocket";
import log from "@modules/log";

export const sockets: Socket[] = [];

if (grapevine !== null) {
    grapevine.events.channels.on("broadcast", async (payload) => {
        if (payload.channel === "gossip") {
            const broadcastTo = sockets.filter((socket) => {
                if (socket.account !== null) {
                    return (
                        socket.account.flags.find((v) => v === "GOSSIP") !==
                        undefined
                    );
                }
            });
            for (const socket of broadcastTo) {
                socket.send(
                    `[Gossip] <${payload.game}> ${payload.name}: ${
                        payload.message
                    }`,
                );
            }
        }
    });

    grapevine.events.core.on("connected", async () => {
        for (const socket of sockets) {
            if (socket.account !== null) {
                socket.send("Connected to Grapevine.");
            }
        }
    });

    grapevine.events.core.on("disconnected", async () => {
        for (const socket of sockets) {
            if (socket.account !== null) {
                socket.send("Disconnected from Grapevine.");
            }
        }
    });

    grapevine.events.core.on("restart", async (downtime) => {
        for (const socket of sockets) {
            if (socket.account !== null) {
                socket.send(
                    "Grapevine will be restarting shortly. Expected downtime: " +
                        downtime +
                        " seconds.",
                );
            }
        }
    });
}

const motd = `\`..       \`..    \`....         \`....       \`..
\`. \`..   \`...  \`..    \`..    \`..    \`..    \`..
\`.. \`.. \` \`..\`..        \`..\`..        \`..\`.\`. \`. \`....
\`..  \`..  \`..\`..        \`..\`..        \`..  \`..  \`..
\`..   \`.  \`..\`..        \`..\`..        \`..  \`..    \`...
\`..       \`..  \`..     \`..   \`..     \`..   \`..      \`..
\`..       \`..    \`....         \`....        \`.. \`.. \`..

Welcome to MOOts`;

const wsPort =
    process.env.WS_PORT !== undefined ? Number(process.env.WS_PORT) : 5557;
const wsHost = process.env.WS_HOST;

const ws = new WServer(wsPort, wsHost);

ws.on("listening", () => {
    log.info("WebSocket server online.");
});

ws.on("connection", telnetConnectionHandler);

async function telnetConnectionHandler(
    client: Telnet.Client | WClient,
): Promise<void> {
    log.debug("Connection established.");
    client.on("Core.Hello", (obj) => {
        log.debug("Client: " + obj.client + " v" + obj.version);
    });
    let socket: Socket | null = new Socket(client);
    sockets.push(socket);
    client.send(motd);
    client.send(
        "Login using `login`.\nRegister a new account with `register`.",
    );
    client.on("error", (err: Error) => {
        log.error("Client error:", err.message);
    });
    client.on("close", () => {
        log.debug("Connection lost.");
        if (socket !== null) {
            const iSocket = sockets.findIndex((v) => v === socket);
            if (iSocket !== -1) {
                sockets.splice(iSocket, 1);
            }
            if (socket.controller !== null) {
                socket.controller.controlled.sendMessage(
                    socket.controller.controlled.name + " fades.",
                    socket.controller.controlled,
                    socket.controller.controlled.location,
                );
            }
        }
        socket = null;
    });
}

try {
    const telnetHost: string = process.env.TELNET_HOST || "localhost";
    const telnetPort: number =
        process.env.TELNET_PORT !== undefined
            ? Number(process.env.TELNET_PORT)
            : 5555;
    const telnetSecure: boolean =
        process.env.TELNET_SECURE !== undefined
            ? Boolean(process.env.TELNET_SECURE)
            : false;
    const tserv = new Telnet.Server(telnetHost, telnetPort);
    log.info("Telnet server online.");
    tserv.on("connection", telnetConnectionHandler);
    if (telnetSecure) {
        const sHostname = process.env.TELNET_SECURE_HOSTNAME || "";
        const sKey = fs.readFileSync(process.env.TELNET_SECURE_KEY || "");
        const sCert = fs.readFileSync(process.env.TELNET_SECURE_CERT || "");
        const sPort: number =
            process.env.TELNET_SECURE_PORT !== undefined
                ? Number(process.env.TELNET_SECURE_PORT)
                : telnetPort + 1;
        const tservSecure = new Telnet.SecureServer(telnetHost, sPort, {
            options: {
                key: sKey,
                cert: sCert,
            },
            hostname: sHostname,
        });
        log.info("Telnet secure server online.");
        tservSecure.on("connection", telnetConnectionHandler);
    }
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
