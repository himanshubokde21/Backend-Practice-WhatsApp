import { FastifyInstance } from "fastify";
import verifyAuth from "../../middlewares/verifyAuth.middleware.ts"
import { 
    addParticipant,
    createGroup,
    demoteAdmin,
    getGroupParticipants,
    leaveGroup,
    promoteAdmin,
    removeParticipant,
    updateGroupImg,
    updateGroupTitle
} from "./group.controller.ts"

async function groupRouter (app: FastifyInstance) {

    app.post(
        "/get-all-memebers",
        { preHandler : verifyAuth},
        getGroupParticipants
    )

    app.post(
        "/promote-admin",
        { preHandler : verifyAuth},
        promoteAdmin
    )

    app.post(
        "/demote-admin",
        { preHandler : verifyAuth},
        demoteAdmin
    )

    app.post(
        "/create",
        { preHandler : verifyAuth},
        createGroup
    )

    app.post(
        "/edit-title",
        { preHandler : verifyAuth},
        updateGroupTitle
    )

    app.post(
        "/edit-group-img",
        { preHandler : verifyAuth},
        updateGroupImg
    )

    app.post(
        "/add-member",
        { preHandler : verifyAuth},
        addParticipant
    )

    app.post(
        "/remove-member",
        { preHandler : verifyAuth},
        removeParticipant
    )

    app.post(
        "/leave",
        { preHandler : verifyAuth},
        leaveGroup
    )
}

export { groupRouter }