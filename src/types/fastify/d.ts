import "@fastify/jwt"
import userTable from "../../db/schemas/user.schema.ts"

type verifiedUser = Pick<
    typeof userTable.$inferInsert,
    "id" | "email" | "phoneNo" |"password" | "username" | "profileImg" | "profileImgId"
>


declare module "@fastify/jwt" {

    interface FastifyJWT {
        user: verifiedUser
    }
}

export {}