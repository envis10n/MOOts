import * as vm from "./vm";
import { Creature } from "../classes/creature";
import { GameObject } from "@/classes/game_object";

const $0 = vm.$0;
const $defaultRoom: GameObject = $0.props.defaultRoom;

function characterRegex(): RegExp {
    return /[^a-zA-Z]/g;
}

export enum CharacterError {
    None,
    NotFound,
    NotOwned,
}

export async function getCharacter(
    account: IAccount,
    charName: string,
): Promise<{ character: Option<GameObject>; error: CharacterError }> {
    charName = charName.trim();
    const character = await $0.findObject(charName);
    if (character !== null && character.class === "Creature") {
        if (character.props.owner === account.uuid) {
            return {
                character,
                error: CharacterError.None,
            };
        } else {
            return {
                character: null,
                error: CharacterError.NotOwned,
            };
        }
    } else {
        return {
            character: null,
            error: CharacterError.NotFound,
        };
    }
}

export async function createCharacter(
    account: IAccount,
    charName: string,
): Promise<GameObject> {
    charName = charName.trim();
    if (characterRegex().test(charName)) {
        throw new Error(
            "Invalid character name." +
                "Character name can only include [a-zA-Z]",
        );
    }
    const char = await $0.findObject(charName);
    if (char === null) {
        const character = $defaultRoom.createChild(Creature, charName, {
            owner: account.uuid,
        });
        character.moveTo($defaultRoom);
        return character;
    } else {
        throw new Error("Character already exists.");
    }
}
