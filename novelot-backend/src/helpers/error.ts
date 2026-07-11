export class novelotError extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.status = status
        Object.setPrototypeOf(this, novelotError.prototype)
    }
}
