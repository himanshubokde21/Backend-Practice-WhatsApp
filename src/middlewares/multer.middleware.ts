import multer from "fastify-multer"
import path from "node:path"

const localStorage = multer.diskStorage({
    filename: function (req, file, cb) {
        cb(null, file.originalname + "-" + Date.now() + path.extname(file.mimetype))
    },
    destination: function (req, file, cb) {
        cb(null,  path.join(process.cwd(), "src/public/local"))
    }
})

const localUpload = multer({ 
    storage: localStorage 
})

export default localUpload