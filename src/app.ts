import dotenv from "dotenv"
import fastify from "fastify"
import { jwtPlugin } from "./plugins/jwt.plugin"
import { corsPlugin } from "./plugins/cors.plugin"
import { cookiePlugin } from "./plugins/cookie.plugin"
import { multipartPlugin } from "./plugins/multipart.plugin"


dotenv.config({
    path: "./config/.env"
})

const app = Fastify({
    logger: true,
})


app.register(jwtPlugin)
app.register(corsPlugin)
app.register(cookiePlugin)
app.register(multipartPlugin)

export default app