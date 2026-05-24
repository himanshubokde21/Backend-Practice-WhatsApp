import "dotenv"
import fp from "fastify-plugin";
import jwt from "@fastify/jwt"
import { FastifyReply, FastifyRequest } from "fastify";
import { FastifyInstance } from "fastify";

const jwtPlugin = fp(async (app: FastifyInstance) => {
    await app.register(jwt, {
        secret: process.env.JWT_SECERT!
    })

    app.decorate("verifyAuth", async function (req: FastifyRequest, rep: FastifyReply) {
        await req.jwtVerify()
    })

    app.decorate("generateAccessToken", async function (payload: {[fieldname: string]: string | number}) {
        app.jwt.sign(
            payload,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY!}
        )
    })

    app.decorate("generateRefreshToken", async function (payload: {[fieldname: string]: string}) {
        app.jwt.sign(
            payload,
            { expiresIn: process.env.REFRESH_TOKEN_EXPIRY!}
        )
    })
})

export { jwtPlugin }

