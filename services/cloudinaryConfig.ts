import cloudinaryLib from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'



const cloudinary = (cloudinaryLib as any).v2 || cloudinaryLib;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: "server/uploads",
    }),
})

export { cloudinary, storage }
