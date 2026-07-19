export function fuzzyFind(search: string, name: string): number {
    search = search.toLocaleLowerCase()
    name = name.toLocaleLowerCase()

    let match: number[][] = new Array(search.length).fill(null)
        .map(() => new Array(name.length).fill(null))

    let points: number = 0


    for (let j = 0; j < name.length; j++) {

        if (search[0] === name[j]) {
            // If at boundary grant 10 points
            if (j === 0 || name[j - 1] === " ") {
                match[0][j] = 10
            }
            else {
                match[0][j] = 1
            }
        }
    }

    points = Math.max(...match[0], points)

    for (let i = 1; i < search.length; i++) {
        for (let j = 0; j < name.length; j++) {
            if (search[i] === name[j]) {

                const max = Math.max(0,
                    ...match[i - 1].slice(0, j),
                    match[i - 1][j - 1] ? match[i - 1][j - 1] + 7 : 0)

                match[i][j] = max + 1
            }
        }
        points = Math.max(...match[i], points)
    }

    return points

}
