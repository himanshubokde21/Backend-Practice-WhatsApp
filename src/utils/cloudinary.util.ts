import "dotenv"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"
import app from "../app"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,   
})

const uploadOnCloudinary = async (filepath: string) => {
        if (!filepath) return null
        try {
            const res = await cloudinary.uploader.upload(filepath)
            fs.unlinkSync(filepath)
            return res
        }
        catch (error) {
            fs.unlinkSync(filepath)
            return null
        }
}

const deleteFromCloudinary = async (id: string) => {
    const res = await cloudinary.uploader.destroy(id)
    return res
}

app.decorate("uploadOnCloudinary", uploadOnCloudinary)
app.decorate("deleteFromCloudinary", deleteFromCloudinary)