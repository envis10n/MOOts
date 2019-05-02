export async function recurseObject(
    obj: IObjectAny,
    cb: (element: any, key: string) => Promise<any>,
): Promise<void> {
    for (const key of Object.keys(obj)) {
        const el = obj[key];
        if (el !== null && el !== undefined) {
            if (typeof el === "object" && !(el instanceof Array)) {
                await recurseObject(el, cb);
            } else if (!(el instanceof Array)) {
                obj[key] = await cb(el, key);
            }
        }
    }
}
