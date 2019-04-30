import argon from "argon2";
import { v4 } from "uuid";

function usernameRegex(): RegExp {
    return /[^\w-._]/g;
}

export const accounts: Map<string, IAccount> = new Map();

export function saveAccounts(): IAccount[] {
    return Array.from(accounts).map((v) => v[1]);
}

export function loadAccounts(data: IAccount[]) {
    for (const account of data) {
        accounts.set(account.username, account);
    }
}

export async function createAccount(
    username: string,
    password: string,
): Promise<IAccount> {
    username = username.trim();
    if (accounts.get(username) === undefined) {
        if (usernameRegex().test(username)) {
            throw new Error(
                "Invalid characters.\n" +
                    "A username may only contain [a-zA-Z0-9_.-]",
            );
        } else {
            const account: IAccount = {
                username,
                hash: await argon.hash(password, { raw: false }),
                created: Date.now(),
                online: true,
                last_login: Date.now(),
                uuid: v4(),
                flags: [],
                is_builder: false,
                is_moderator: false,
                is_wizard: false,
            };
            accounts.set(username, account);
            return account;
        }
    } else {
        throw new Error("Account name is taken.");
    }
}

export async function updateAccount(account: IAccount): Promise<void> {
    accounts.set(account.username, account);
}

export async function getAccount(
    username: string,
    password: string,
): Promise<IAccount> {
    username = username.trim();
    password = password.trim();
    const account = accounts.get(username);
    if (account !== undefined) {
        if (await argon.verify(account.hash, password)) {
            return account;
        } else {
            throw new Error("Invalid password.");
        }
    } else {
        throw new Error("Invalid account name.");
    }
}
