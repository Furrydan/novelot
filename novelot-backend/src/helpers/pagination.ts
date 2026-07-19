import { novelotError } from "./error.ts"

export function paginate<T>(list: T[], page: number, limit: number) {

    if (page < 1 || (page - 1) * limit >= list.length) {
        throw new novelotError(500, "Invalid Page")
    }
    if (limit < 1 || limit > 100) {
        throw new novelotError(500, "Invalid Page")
    }
    return list.filter((_, index) => (page - 1) * limit <= index && (page) * limit > index)

}
