const prepositions = `
    of
    with
    at
    from
    into
    during
    including
    until
    against
    among
    throughout
    despite
    towards
    upon
    concerning
    to
    in
    for
    on
    by
    about
    like
    through
    over
    before
    between
    after
    since
    without
    under
    within
    along
    following
    across
    behind
    beyond
    plus
    except
    but
    up
    out
    around
    down
    off
    above
    near
    at
`
    .split("\n")
    .map((v) => v.trim().replace(/[^\w]/g, ""))
    .filter((v) => v !== "");

export function parseCommand(input: string): string[] {
    return input
        .split(" ")
        .filter((v) => prepositions.find((v2) => v2 === v) === undefined);
}
