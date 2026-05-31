import type { FastifyInstance } from "fastify"
import app from "../app.ts"

const hashPassword = async (password: string) => {
    const hashed = await app.bcrypt.hash(password)
    return hashed
}

const verifyPassword = async (
    password: string,
    hashedPassword: string
) => {
    return app.bcrypt.compare(password, hashedPassword)
}

export { hashPassword, verifyPassword }
