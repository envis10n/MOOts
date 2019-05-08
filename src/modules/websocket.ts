import WebSocket from "ws";
import { EventEmitter as EE } from "events";

interface IWSEvent {
    event: string;
    payload: IObjectAny;
}

export class WClient extends EE {
    private resolver: Option<(arg: any) => void> = null;
    constructor(private socket: WebSocket) {
        super();
        this.socket.on("message", (data) => {
            if (typeof data !== "string") {
                data = data.toString();
            }
            try {
                const dobj: IWSEvent = JSON.parse(data);
                if (dobj.event === "gmcp") {
                    this.emit("gmcp", dobj.payload);
                    this.emit(dobj.payload.module, dobj.payload.data);
                }
            } catch (e) {
                if (this.resolver !== null) {
                    this.resolver(data);
                } else {
                    this.emit("data", Buffer.from(data));
                }
            }
        });
        this.socket.on("close", (code, reason) => {
            this.emit("close", code, reason);
        });
    }
    public async ask(prompt: string, mask: boolean = false): Promise<string> {
        return new Promise((resolve, reject) => {
            this.resolver = (arg: string) => {
                this.resolver = null;
                resolve(arg);
            };
            this.json({ event: "client/prompt", payload: { prompt, mask } });
        });
    }
    public json(data: IObjectAny) {
        this.socket.send(JSON.stringify(data));
    }
    public send(...args: string[]) {
        this.json({ event: "client/print", payload: args });
    }
    public gmcp(module: string, data: IObjectAny) {
        this.json({
            event: "gmcp",
            payload: {
                module,
                data,
            },
        });
    }
    public close(code?: number, reason?: string) {
        this.socket.close(code, reason);
    }
}

export class WServer extends EE {
    public server: WebSocket.Server;
    constructor(port: number, host: string = "0.0.0.0") {
        super();
        this.server = new WebSocket.Server({
            port,
            host,
        });
        this.server.on("connection", (socket) =>
            this.emit("connection", new WClient(socket)),
        );
        this.server.on("listening", () => this.emit("listening"));
    }
}
