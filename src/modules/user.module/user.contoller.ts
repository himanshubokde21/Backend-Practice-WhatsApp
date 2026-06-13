import type { FastifyReply, FastifyRequest } from "fastify";
import asyncHander from "../../utils/asynHandler.util.ts"
import ApiError from "../../utils/ApiError.util.ts"
import db from "../../../db.ts"
import userTable from "../../db/schemas/user.schema.ts";
import { eq, or, and, inArray } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../../utils/bcrypt.util.ts"
import ApiResponse from "../../utils/ApiResponse.util.ts"
import { uploadOnCloudinary, deleteFromCloudinary } from "../../utils/cloudinary.util.ts"
import { generateAccessToken, generateRefreshToken } from "../../utils/generateTokens.util.ts"
import localUpload from "../../utils/localUpload.util.ts";
import type { MultipartFile } from "@fastify/multipart";
import app from "../../app.ts";
import contactTable from "../../db/schemas/contact.schema.ts";
import blockTable from "../../db/schemas/block.schema.ts";
import conversationParticipantTable from "../../db/schemas/conversationPaticipant.schema..ts";

const registerUser = asyncHander(async (req: FastifyRequest, rep: FastifyReply) => {
    const fields: Record<string, string> = {}
    let profileImgPath: string = ""

    for await (const part of req.parts()) {
        console.log("PART:", part.type);
    
        if (part.type === "field") {
            if (!part.value) {
                throw new ApiError(400, "Bad Request!");
            }
            fields[part.fieldname] = part.value as string;
            continue;
        }
    
        if (part.type === "file" && part.fieldname === "profileImg") {
            profileImgPath = await localUpload(part) as string;
            continue;
        }
    }

    console.log("loop finished")

    if (!profileImgPath.trim()) {
        throw new ApiError(400, "Profile Image Required!");
    }

    if (fields.phoneNo.length !== 10) {
        throw new ApiError(400, "Bad Request!")
    }

    console.log("now finding existing user");
    

    const [existingUser] = await db
    .select({
        id: userTable.id
    })
    .from(userTable)
    .where(
        or(
            eq(userTable.email, fields.email),
            eq(userTable.phoneNo, fields.phoneNo)
        )
    )

    console.log("existing user found");
    

    if (existingUser) {
        throw new ApiError(409, "Conflict; User Already Exist!")
    }

    const profileImgUrl = await uploadOnCloudinary(profileImgPath)

    if (!profileImgUrl) {
        throw new ApiError(500, "Internal Server Error; Failed to Upload Profile Image!")
    }

    const hashedPassword = await hashPassword(fields.password)

    const [user] = await db
    .insert(userTable)
    .values({
        email: fields.email,
        phoneNo: fields.phoneNo,
        username: fields.username,
        password: hashedPassword,
        profileImg: profileImgUrl.url,
        profileImgId: profileImgUrl.public_id,
        tag: fields.tag || ""
    })
    .returning()

    if (!user) {
        throw new ApiError(500, "Internal Server Error; Failed to Register User!")
    }

    const aceessToken = await generateAccessToken(user)
    const refreshToken = await generateRefreshToken(user.id)

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

    return rep
    .status(201)
    .cookie("accessToken", aceessToken)
    .cookie("refreshToken", refreshToken)
    .send(
        new ApiResponse(201, registerUser, "User Registered Successfully!")
    )

})

const loginUser = asyncHander(async (req: FastifyRequest, rep: FastifyReply) => {
    const fields: Record<string, string> = {}

    for await (const part of req.parts()) {
        if (part.type == "field") {

            if (!part.fieldname.trim()) {
                throw new ApiError(400, "Bad Request!")
            }
    
            fields[part.fieldname] = part.value as string
        }
    }

    const [user] = await db
    .select()
    .from(userTable)
    .where(
        and(
            eq(userTable.username, fields.username),
            eq(userTable.email, fields.email)
        )
    )

    if (!user) {
        throw new ApiError(404, "User Not Found!")
    }

    if (! await verifyPassword(fields.password, user.password)) {
        throw new ApiError(401, "Unauthorized Access!")
    }

    const accessToken = await generateAccessToken(user)
    const refreshToken = await generateRefreshToken(user.id)

    if (!refreshToken || !accessToken) {
        throw new ApiError(500, "Internal Server Error!")
    }

    const [updateUser] = await db
    .update(userTable)
    .set({
        refreshToken: refreshToken
    })
    .where(
        and(
            eq(userTable.username, fields.username),
            eq(userTable.email, fields.email)
        )
    )
    .returning()

    if (!updateUser) {
        throw new ApiError(500, "Internal Server Error!")
    }

    return rep
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", refreshToken)
    .send(
        new ApiResponse(200, updateUser, "User Logged In SuccessFul!")
    )


})

const logoutUser = asyncHander(async (req: FastifyRequest, rep: FastifyReply) => {
    const userId = req.user?.id as string

    await db
    .update(userTable)
    .set({
        refreshToken: null
    })
    .where(
        eq(userTable.id, userId)
    )

    return rep
    .status(200)
    .clearCookie("accessToken")
    .clearCookie("refreshToken")
    .send(
        new ApiResponse(200, {}, "User Logged Out Successful!")
    )
})

const getUser = asyncHander(async (req: FastifyRequest, rep: FastifyReply) => {
    const userId = req.user?.id as string

    const [user] = await db
    .select()
    .from(userTable)
    .where(
        eq(userTable.id, userId)
    )

    if (!user) {
        throw new ApiError(404, "USer Not Found")
    }

    return rep
    .status(200)
    .send(
        new ApiResponse(200, user, "Profile Fetched Successful!")
    )

})

const removeUser = asyncHander(async (req: FastifyRequest, rep: FastifyReply) => {
    const userId = req.user?.id as string

    const [deleteUser] = await db
    .delete(userTable)
    .where(
        eq(userTable.id, userId)
    )
    .returning()

    if (!deleteUser) {
        throw new ApiError(500, "Internal Server Error!")
    }

    return rep
    .status(200)
    .send(
        new ApiResponse(200, {}, "User Removed Successful!")
    )
})

const changeProfileImg = asyncHander(async (req: FastifyRequest, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { value: profileImg } = await req.parts().next() as { value: MultipartFile }

    const [user] = await db
    .select({
        profileImgId: userTable.profileImgId
    })
    .from(userTable)
    .where(
        eq(userTable.id, userId)
    )

    if (!user) {
        throw new ApiError(500, "Internal Server Error!")
    }

    if (!profileImg) {
        throw new ApiError(400, "Bad Request!")
    }

    const profileImgPath = await localUpload(profileImg)

    if (!profileImgPath) {
        throw new ApiError(500, "Internal Server Error!")
    }

    const [profileImgUrl, deleteProfileImg] = await Promise.all([
        uploadOnCloudinary(profileImgPath),
        deleteFromCloudinary(user.profileImgId)
    ])

    if (deleteProfileImg === null || deleteProfileImg.res !== "ok") {
        throw new ApiError(500, "Internal Server Error!")
    }

    if (!profileImgUrl) {
        throw new ApiError(500, "Internal Server Error!")
    }

    await db
    .update(userTable)
    .set({
        profileImg: profileImgUrl.url,
        profileImgId: profileImgUrl.public_id
    })
    .where(
        eq(userTable.id, userId)
    )

    return rep
    .status(200)
    .send(
        new ApiResponse(200, {}, "Resources Updated Successful!")
    )
})

const changeUsername = asyncHander(async (req: FastifyRequest, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const {value: newUsername} = (await (req.parts()).next()).value as {value: string}

    if (!newUsername.trim()) {
        throw new ApiError(400, "Bad Request!")
    }

    const [updateUser] = await db
    .update(userTable)
    .set({
        username: newUsername
    })
    .where(
        eq(userTable.id, userId)
    )
    .returning()

    if (!updateUser) {
        throw new ApiError(500, "Internal Server Error!")
    }

    return rep
    .status(200)
    .send(
        new ApiResponse(200, {username: updateUser.username}, "Resource Updated Successful!")
    )

})

const changePassword = asyncHander(async (req: FastifyRequest, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const {value: newPassword} = (await req.parts().next()).value as {value: string}

    if (!newPassword.trim()) {
        throw new ApiError(400, "Bad Request!")
    }

    const hashedPassword = await hashPassword(newPassword)

    const [updateUser] = await db
    .update(userTable)
    .set({
        password: hashedPassword
    })
    .where(
        eq(userTable.id, userId)
    )
    .returning()

    if (!updateUser) {
        throw new ApiError(500, "Internal Server Error!")
    }
    return rep
    .status(200)
    .send(
        new ApiResponse(200, {}, "Resource Updated Successful!")
    )
})

const refreshAccessToken = asyncHander(async (req: FastifyRequest, rep: FastifyReply) => {
    const refreshToken = req.cookies?.refreshToken as string
    let decodeRefreshToken: {id: string}

    if (!refreshToken?.trim()){
        throw new ApiError(401, "Unauthorized Access!")
    }

    try {
        decodeRefreshToken = app.jwt.verify<{id: string}>(refreshToken)
    } catch (error) {
        throw new ApiError(401, "Unauthorized Access!")
    }

    const [user] = await db
    .select()
    .from(userTable)
    .where(
        eq(userTable.id, decodeRefreshToken.id)
    )

    if(!user) {
        throw new ApiError(500, "Internal Server Error!")
    }

    const newAccessToken = await generateAccessToken(user)

    if (!newAccessToken?.trim()){
        throw new ApiError(500, "Internal Server Error!")
    }

    return rep
    .status(200)
    .cookie("accessCookie", newAccessToken)
    .send(
        new ApiResponse(200, {}, "Cookie Generated Successful!")
    )
})

const searchUsers = asyncHander(async (req: FastifyRequest, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const searchedUser = (await req.parts().next()).value as {username: string}

    if (!searchedUser.username?.trim()) {
        throw new ApiError(400, "Bad Request!")
    }

    const [user] = await db
    .select({
        id: userTable.id,
        username: userTable.username,
        profileImg: userTable.profileImg,
        tag: userTable.tag,
        phoneNo: userTable.phoneNo,
        email: userTable.email,
    })
    .from(userTable)
    .where(
        and(
            eq(contactTable.user, userId),
            eq(contactTable.contactUser, searchedUser.username)
        )
    )

    if (!user) {
        throw new ApiError(500, "Internal Server Error; No User Found!")
    }

    return rep
    .status(200)
    .send(
        new ApiResponse(200, {searchedUser: user}, "User Fetched Successful!")
    )
})

const blockUser = asyncHander(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
        blockedUserId: string
    }
}>, rep: FastifyReply) => {
    const userId = req.user?.id as string
    const { conversationId, blockedUserId } = req.params

    if (!conversationId.trim() || !blockedUserId.trim()) {
        throw new ApiError(400, "Bad Request!")
    }

    try {
        const res = await db
        .transaction(async (tx) => {
            const bothParticipant = await tx
            .select()
            .from(conversationParticipantTable)
            .where(
                and(
                    eq(conversationParticipantTable.conversationId, conversationId),
                    inArray(
                        conversationParticipantTable.userId,
                        [userId, blockedUserId]
                    )
                )
            )

            if (bothParticipant.length != 2) {
                throw new ApiError(403, "Forbidden")
            }

            const [block] = await tx
            .insert(blockTable)
            .values({
                blockedUser: blockedUserId,
                conversationId: conversationId
            })
            .returning() 

            if (!block) {
                throw new ApiError(500, "Internal Server Error!")
            }

            return block

        })

        return rep
        .status(200)
        .send(
            new ApiResponse(200, res, "User Blocked Successful!")
        )

    } catch (error) {
        req.log.error(error)
        throw error
    }

    


})

const unblockUser = asyncHander(async (req: FastifyRequest<{
    Params: {
        conversationId: string,
        blockedUserId: string
    }
}>, rep: FastifyReply) => {
    const { conversationId, blockedUserId } = req.params    

    if (!conversationId.trim() || !blockedUserId.trim())

    try {
        await db
        .transaction(async (tx) => {

            const [blockedUserParticipant] = await tx
            .select()
            .from(conversationParticipantTable)
            .where(
                and(
                    eq(conversationParticipantTable.conversationId, conversationId),
                    eq(conversationParticipantTable.userId, blockedUserId)
                )
            )

            if (!blockedUserParticipant) {
                throw new ApiError(409, "User or Conversation Not Found!")
            }

            const [unblockUser] = await tx
            .delete(blockTable)
            .where(
                and(
                    eq(blockTable.conversationId, conversationId),
                    eq(blockTable.blockedUser, blockedUserId)
                )
            )
            .returning()

            if (!unblockUser) {
                throw new ApiError(500, "Internal Server Error!")
            }

            return rep
            .status(200)
            .send(
                new ApiResponse(200, {}, "User Unblock Successful!")
            )

        })
    } catch (error) {
        req.log.error(error)
        throw error
    }

    
})

export {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    removeUser,
    changeProfileImg,
    changeUsername,
    changePassword,
    refreshAccessToken,
    searchUsers,
    blockUser,
    unblockUser,
}
