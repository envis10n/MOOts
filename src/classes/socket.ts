import EventEmitter from "events";
import { GameController } from "./controller";
import { GameObject } from "./game_object";
import Telnet from "ts-telnet";
import * as vm from "@modules/vm";
import * as Account from "@modules/accounts";
import * as Character from "@modules/characters";

export class Socket extends EventEmitter {
    public controller: Option<GameController> = null;
    public account: Option<IAccount> = null;
    constructor(public socket: Telnet.Client) {
        super();
        this.socket.on("data", (chunk: Buffer) => {
            let d = chunk.toString().trim();
            if (d[d.length - 1] === "\r") {
                d = d.substring(0, d.length - 1);
            }
            this.onData(d);
        });
        this.socket.on("close", () => {
            if (this.controller !== null) {
                this.controller.controlled.controller = null;
                if (this.account !== null) {
                    this.account.online = false;
                }
            }
        });
    }
    public send(message: string): void {
        this.socket.send(message + "\r\n");
    }
    public async ask(prompt: string, mask?: boolean): Promise<string> {
        let res = await this.socket.ask(prompt, mask);
        if (res[res.length - 1] === "\r") {
            res = res.substring(0, res.length - 1);
        }
        return res;
    }
    public control(obj: GameObject): GameController {
        return new GameController(obj, this);
    }
    private async login(username?: string, password?: string): Promise<void> {
        if (username === undefined) {
            username = await this.ask("Username: ");
        }
        if (password === undefined) {
            password = await this.ask("Password: ", true);
        }
        if (username.length > 0 && password.length > 0) {
            try {
                const account = await Account.getAccount(username, password);
                this.account = account;
                this.account.online = true;
                this.account.last_login = Date.now();
                this.send("Authenticated.\nWelcome, " + username + ".");
                this.selectCharacter();
            } catch (e) {
                this.send(e.message);
            }
        } else {
            this.send("Username or password invalid.");
        }
    }
    private async register(): Promise<void> {
        const username = await this.ask("Username: ");
        const password = await this.ask("Password: ", true);
        const password2 = await this.ask("Re-type Password: ", true);
        if (
            username.length > 0 &&
            password.length > 0 &&
            password2.length > 0
        ) {
            if (password === password2) {
                try {
                    const account = await Account.createAccount(
                        username,
                        password,
                    );
                    this.account = account;
                    this.send(
                        "Account created.\nAuthenticated.\nWelcome, " +
                            username +
                            ".",
                    );
                    this.selectCharacter();
                } catch (e) {
                    this.send(e.message);
                }
            } else {
                this.send("Passwords did not match.");
            }
        } else {
            this.send("Invalid username or password.");
        }
    }
    private async selectCharacter(): Promise<void> {
        const charName = await this.ask("What is your name? ");
        const charGet = await Character.getCharacter(
            this.account as IAccount,
            charName,
        );
        switch (charGet.error) {
            case Character.CharacterError.None:
                if (charGet.character !== null) {
                    const controller = new GameController(
                        charGet.character,
                        this,
                    );
                    charGet.character.sendMessage(
                        `${charGet.character.name} appears.`,
                        charGet.character,
                        charGet.character.location,
                    );
                    controller.do_command("look");
                }
                break;
            case Character.CharacterError.NotFound:
                this.send("Character not found.");
                const create = await this.ask(
                    "Would you like to create this character? ",
                );
                const yN = create.toLowerCase()[0];
                switch (yN) {
                    case "y":
                        try {
                            const character = await Character.createCharacter(
                                this.account as IAccount,
                                charName,
                            );
                            const controller = new GameController(
                                character,
                                this,
                            );
                            character.sendMessage(
                                `${character.name} appears.`,
                                character,
                                character.location,
                            );
                            controller.do_command("look");
                        } catch (e) {
                            this.send(e.message);
                            this.selectCharacter();
                        }
                        break;
                    case "n":
                        this.selectCharacter();
                        break;
                }
                break;
            case Character.CharacterError.NotOwned:
                this.send("Character not found.");
                this.selectCharacter();
                break;
        }
    }
    private async getEval(cmd: string): Promise<string> {
        console.log(cmd);
        if (cmd.endsWith("\\")) {
            const n = await this.ask("(...)> ");
            console.log(n);
            return this.getEval(cmd.substring(0, cmd.length - 1) + "\n" + n);
        } else {
            return cmd;
        }
    }
    private onData(data: string) {
        if (this.controller !== null) {
            if (data.startsWith("@")) {
                const commandArgs = data.split(" ");
                const command = commandArgs[0];
                const args = commandArgs.slice(1);
                switch (command) {
                    case "@eval":
                        if (this.account !== null) {
                            if (this.account.is_wizard) {
                                this.getEval(args.join(" ")).then((code) => {
                                    try {
                                        this.send(vm.init()(code));
                                    } catch (e) {
                                        this.send(e.message);
                                    }
                                });
                            } else {
                                this.emit("data", data);
                            }
                        } else {
                            this.emit("data", data);
                        }
                        break;
                    default:
                        this.emit("data", data);
                        break;
                }
            } else {
                this.emit("data", data);
            }
        } else {
            // Handle no controller.
            const commandArgs = data.split(" ");
            const command = commandArgs[0];
            const args = commandArgs.slice(1);
            if (this.account === null) {
                switch (command) {
                    case "help":
                    case "commands":
                        this.send(
                            "Available Commands:\n\n" +
                                "  login - Login to a user account.\n" +
                                "  register - Register a new user account.\n" +
                                "  help, commands - Display this.",
                        );
                        break;
                    case "login":
                        this.login(...args);
                        break;
                    case "register":
                        this.register();
                        break;
                }
            } else {
                switch (command) {
                    default:
                        this.send("Nothing doing.");
                        break;
                }
            }
        }
    }
}
