import type { FastifyReply, FastifyRequest } from "fastify";
import app from "../app.ts";
import ApiError from "../utils/ApiError.util.ts";
import db from "../../db.ts";
import userTable from "../db/schemas/user.schema.ts";
import { eq } from "drizzle-orm"

const verifyAuth = async (req: FastifyRequest, _: FastifyReply) => {
    const token = (req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "")) as string

    if (!token?.trim()) {
        throw new ApiError(401, "Unauthorized Access!")
    }

    let decode: {id: string} 

    try {
        decode = app.jwt.verify<{id: string}>(token)
    } catch (error) {
        throw new ApiError(401, "Unauthorized Access!")
    }

    if (!decode) {
        throw new ApiError(401, "Unauthorized Access!")
    }

    const [user] = await db
    .select()
    .from(userTable)
    .where(
        eq(userTable.id, decode.id)
    )

    if (!user) {
        throw new ApiError(401, "Unauthorized Access!")
    }

    req.user = user

}

export default verifyAuth