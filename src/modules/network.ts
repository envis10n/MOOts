import { Socket } from "@classes/socket";
import Telnet from "ts-telnet";
import fs from "fs";
import tls from "tls";

const motd = `\`..       \`..    \`....         \`....       \`..
\`. \`..   \`...  \`..    \`..    \`..    \`..    \`..
\`.. \`.. \` \`..\`..        \`..\`..        \`..\`.\`. \`. \`....
\`..  \`..  \`..\`..        \`..\`..        \`..  \`..  \`..
\`..   \`.  \`..\`..        \`..\`..        \`..  \`..    \`...
\`..       \`..  \`..     \`..   \`..     \`..   \`..      \`..
\`..       \`..    \`....         \`....        \`.. \`.. \`..

Welcome to MOOts`;

/*
export const wss = new WebSocket.Server({
    host: process.env.WS_HOST || "localhost",
    port: process.env.WS_PORT !== undefined ? Number(process.env.WS_PORT) : 13389,
});
*/

/*

export const clients: Map<Socket, WebSocket> = new Map();
export const sockets: Map<GameController, Socket> = new Map();

wss.on("connection", async (ws) => {
    console.log("Connection established from websocket.");
    let socket: Socket | null = new Socket(ws);
    const $defaultRoom: GameObject = vm.$0.props.defaultRoom || vm.$0;
    let plrObj: GameObject | null;
    const f = await vm.$0.findObject(`Player${plrNum}`);
    if (f !== null && f.name === `Player${plrNum}`) {
        plrObj = f;
    } else {
        plrObj = $defaultRoom.createChild(Creature, `Player${plrNum}`);
        plrObj.moveTo($defaultRoom);
    }
    plrNum++;
    plrObj.sendMessage(plrObj.name + " appears.", plrObj, plrObj.location);
    let controller: GameController | null = new GameController(plrObj, socket);
    plrObj.sendMessage(motd);
    clients.set(socket, ws);
    sockets.set(controller, socket);
    ws.on("close", () => {
        console.log("Connection lost.");
        if (plrObj !== null && controller !== null && socket !== null) {
            if (plrObj.parent !== null) {
                plrObj.parent.removeChild(plrObj);
            }
            sockets.delete(controller);
            clients.delete(socket);
            controller.controlled.sendMessage(controller.controlled.name + " fades.",
                controller.controlled, controller.controlled.location);
            controller.controlled.controller = null;
            socket = null;
            plrObj = null;
            controller = null;
        }
    });
    ws.on("pong", () => {
        setTimeout(() => {
            if (ws.readyState !== 1) {
                console.log("Broken socket?\n", ws);
            } else {
                ws.ping();
            }
        }, 25000);
    });
    ws.ping();
});

wss.on("listening", () => {
    console.log("WebSocket server online.");
});

*/

async function telnetConnectionHandler(client: Telnet.Client): Promise<void> {
    console.log("Connection established.");
    client.on("Core.Hello", (obj) => {
        console.log("Client:", obj.client, "v" + obj.version);
    });
    let socket: Socket | null = new Socket(client);
    client.send(motd);
    client.send(
        "Login using `login`.\nRegister a new account with `register`.",
    );
    client.on("error", (err: Error) => {
        console.log("Client error:", err.message);
    });
    client.on("close", () => {
        console.log("Connection lost.");
        if (socket !== null) {
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
    console.log("Telnet server online.");
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
        console.log("Telnet secure server online.");
        tservSecure.on("connection", telnetConnectionHandler);
    }
} catch (e) {
    console.error(e.message);
    process.exit(1);
}
