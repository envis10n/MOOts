import { Socket } from "./socket";
import { GameObject } from "./game_object";
import { parseCommand } from "../lib/parser";

export class GameController {
    constructor(public controlled: GameObject, public socket: Socket) {
        this.controlled.controller = this;
        this.socket.controller = this;
        this.socket.on("data", (data) => {
            this.do_command(data);
        });
    }
    public hear(message?: string): void {
        if (message !== undefined) {
            this.socket.send(message);
        }
    }
    public async do_command(command: string): Promise<void> {
        const parsed = parseCommand(command);
        if (parsed.length > 0) {
            let target: GameObject;
            if (this.controlled.location !== null) {
                target = this.controlled.location;
            } else {
                target = this.controlled;
            }
            let cmd = target.verbs[parsed[0]];
            if (cmd !== undefined) {
                const res = cmd(this.controlled, ...parsed.slice(1));
                if (res instanceof Promise) {
                    res.then((v) => {
                        this.hear(v);
                    });
                } else if (res !== undefined) {
                    this.hear(res);
                }
            } else if (target === this.controlled.location) {
                cmd = this.controlled.verbs[parsed[0]];
                if (cmd !== undefined) {
                    const res = cmd(this.controlled, ...parsed.slice(1));
                    if (res instanceof Promise) {
                        res.then((v) => {
                            this.hear(v);
                        });
                    } else if (res !== undefined) {
                        this.hear(res);
                    }
                } else {
                    switch (parsed[0]) {
                        default:
                            this.hear("What?");
                            break;
                    }
                }
            } else {
                switch (parsed[0]) {
                    default:
                        this.hear("What?");
                        break;
                }
            }
        }
    }
}
