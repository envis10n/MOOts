export = (arg: any): boolean => {
    if (!isNaN(arg)) {
        arg = Number(arg);
    }
    switch (typeof arg) {
        case "string":
            if (arg.toLowerCase() === "true") {
                return true;
            } else {
                return false;
            }
        case "object":
            return Boolean(arg);
        case "number":
            if (arg === 0) {
                return false;
            } else {
                return true;
            }
        default:
            return false;
    }
};
