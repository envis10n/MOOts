import argon from "argon2";
import { v4 } from "uuid";
import { DB } from "@modules/database";

function usernameRegex(): RegExp {
    return /[^\w-._]/g;
}

export async function createAccount(
    username: string,
    password: string,
): Promise<IAccount> {
    const accountCol = await DB.collection("accounts");
    username = username.trim();
    const doc: IAccount[] = await (await accountCol.byExample({
        username,
    })).all();
    if (doc.length === 0) {
        if (usernameRegex().test(username)) {
            throw new Error(
                "Invalid characters.\n" +
                    "A username may only contain [a-zA-Z0-9_.-]",
            );
        } else {
            const account: IAccount = {
                _key: username,
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
            await accountCol.save(account);
            return account;
        }
    } else {
        throw new Error("Account name is taken.");
    }
}

export async function updateAccount(account: IAccount): Promise<void> {
    const col = await DB.collection("accounts");
    await col.replace(account, account);
}

export async function getAccount(
    username: string,
    password: string,
): Promise<IAccount> {
    const col = await DB.collection("accounts");
    username = username.trim();
    password = password.trim();
    const account: IAccount = (await (await col.byExample({
        username,
    })).all())[0];
    if (account !== undefined && account !== null) {
        if (await argon.verify(account.hash, password)) {
            return account;
        } else {
            throw new Error("Invalid password.");
        }
    } else {
        throw new Error("Invalid account name.");
    }
}
