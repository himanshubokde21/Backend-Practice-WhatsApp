import { FastifyReply, FastifyRequest } from "fastify";
import asyncHander from "../../utils/asynHandler.util.ts"
import ApiError from "../../utils/ApiError.util.ts"
import db from "../../../db.ts"
import userTable from "../../db/schemas/user.schema.ts";
import { eq, or } from "drizzle-orm";
import app from "../../app.ts"

interface RegisterUserBody {
  email: string;
  phoneNo: string;
  username: string;
  password: string;
  profileImg: string;
  tag: string;
}

const registerUser = asyncHander(async (req: FastifyRequest & { body: RegisterUserBody }, rep: FastifyReply) => {
    const { email, phoneNo, username, password, profileImg, tag} = req.body;

    if (!email.trim() || !phoneNo.trim() || !username.trim() || profileImg.trim() || password.trim()){
        throw new ApiError(400, "Bad Request!")
    }

    if (phoneNo.length !== 10) {
        throw new ApiError(400, "Bad Request!")
    }

    const [existingUser] = await db
    .select({
        id: userTable.id
    })
    .from(userTable)
    .where(
        or(
            eq(userTable.email, email),
            eq(userTable.phoneNo, phoneNo)
        )
    )

    if (existingUser) {
        throw new ApiError(409, "Conflict; User Already Exist!")
    }

    const profileImgUrl = await app.uploadOnCloudinary(profileImg)

    const hashedPassword = await hashPassword(password)

    const [user] = await db
    .insert(userTable)
    .values({
        email: email,
        phoneNo: phoneNo,
        username: username,
        password: password,
        profileImg: profileImgUrl.url,
        profileImgId: profileImgUrl.public_id,
        tag: tag || ""
    })
    .returning()

    if (!user) {
        throw new ApiError(500, "Internal Server Error; Failed to Register User!")
    }

    const AceessToken = app.generateAccessToken(user)
    const refreshToken = app.generateRefreshToken(user.id)

    const [registerUser] = await db
    .update(userTable)
    .set({
        refreshToken: refreshToken
    })
    .where(
        or(
            eq(userTable.email, user.email),
            eq(userTable.phoneNo, user.phoneNo)
        )
    )
    .returning()

    if (!registerUser) {
        throw new ApiError(500, "Internal Server Error; Failed to Register User!")
    }

    

})