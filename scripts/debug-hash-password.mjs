import Fastify from "fastify"
import fastifyBcrypt from "fastify-bcrypt"
import { hashPassword } from "../src/utils/hashPassword.util.ts"

const app = Fastify({ logger: false })
await app.register(fastifyBcrypt, { saltWorkFactor: 10 })
await app.ready()

const hashed = await hashPassword(app, "test-password")
await app.close()

console.log(JSON.stringify({ ok: hashed?.startsWith("$2"), hashLength: hashed?.length }))
