import "dotenv"
import { v2 as cloudinary } from "cloudinary"
import fs from "fs"

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
            console.log("uploaded on cloudinary")
            return res
        }
        catch (error) {
            fs.unlinkSync(filepath)
            return null
        }
}

const deleteFromCloudinary = async (id: string) => {
    try {
        const res = await cloudinary.uploader.destroy(id)
        return res
    } catch (error) {
        return null
    }
}

export { uploadOnCloudinary, deleteFromCloudinary }