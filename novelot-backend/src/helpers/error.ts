import { Request, Response, NextFunction } from "express"

export class novelotError extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.status = status
        Object.setPrototypeOf(this, novelotError.prototype)
    }
}

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
    if (err instanceof novelotError && err.status < 500) {
        res.status(err.status).json({ message: err.message })
        return
    }

    console.error(err)
    res.status(500).json({ message: "Internal Server Error" })
}
