import type { FastifyInstance } from "fastify"
import { blockUser, changePassword, changeProfileImg, changeUsername, getUser, loginUser, logoutUser, registerUser, removeUser, unblockUser } from "./user.contoller.ts"
import verifyAuth from "../../middlewares/verifyAuth.middleware.ts"

async function userRouter(app: FastifyInstance) {
    
    app.post(
        "/register",
        registerUser
    )

    app.post(
        "/login",
        loginUser
    )

    app.post(
        "/logout",
        { preHandler: verifyAuth},
        logoutUser
    )

    app.post(
        "/edit-password",
        { preHandler: verifyAuth},
        changePassword
    )

    app.post(
        "/edit-username",
        { preHandler: verifyAuth},
        changeUsername
    )

    app.post(
        "/profile",
        { preHandler: verifyAuth},
        getUser
    )

    app.post(
        "/edit-profileImg",
        { preHandler: verifyAuth},
        changeProfileImg
    )

    app.post(
        "/delete-account",
        { preHandler: verifyAuth},
        removeUser
    )

    app.post(
        "/block",
        { preHandler: verifyAuth },
        blockUser
    )

    app.post(
        "/unblock",
        { preHandler: verifyAuth },
        unblockUser 
    )


}

export { userRouter }
