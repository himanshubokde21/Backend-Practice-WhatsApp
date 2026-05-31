import type { MultipartFile } from "@fastify/multipart"
import fs from "node:fs"
import path from "node:path"
import { pipeline } from "node:stream/promises"

const localUpload = async (part: MultipartFile) => {

    try {
        const filepath = path.join(
            process.cwd(),
            "src/public/local",
            part.filename
        )
    
        await pipeline(
            part.file,
            fs.createWriteStream(filepath)
        )
    
        return filepath
    } catch (error) {
        return null
    }
}

export default localUpload