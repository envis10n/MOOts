export function formatter(args: string, formTable: IObjectAny = {}): string {
    const table: IObjectAny = formTable;
    for (const label of Object.keys(table)) {
        const repl = table[label];
        if (repl !== null) {
            args = args.replace(new RegExp(`\\${label}`, "gi"), repl);
        }
    }
    return args;
}
