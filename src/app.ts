import dotenv from "dotenv"

dotenv.config({
    path: "./.env"
})

// PLUGINS
import Fastify from "fastify"
import { jwtPlugin } from "./plugins/jwt.plugin.ts"
import { corsPlugin } from "./plugins/cors.plugin.ts"
import { cookiePlugin } from "./plugins/cookie.plugin.ts"
import { multipartPlugin } from "./plugins/multipart.plugin.ts"
import { bcryptPlugin } from "./plugins/bcrypt.plugin.ts"


const app = Fastify({
    logger: true,
})


app.register(jwtPlugin)
app.register(corsPlugin)
app.register(cookiePlugin)
app.register(multipartPlugin)
app.register(bcryptPlugin)

export default app