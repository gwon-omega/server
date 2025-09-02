import * as multer from 'multer'
import {cloudinary,storage} from '../services/cloudinaryConfig'
import { Request } from 'express'
const upload = (multer as any)({storage : storage,


    fileFilter : (req:Request,file:Express.Multer.File,cb)=>{
        const allowedFileTypes = ['image/png','image/jpeg','image/jpg']
        if(allowedFileTypes.includes(file.mimetype)){
            cb(null,true)
        }else{
            cb(new Error("Only image files are supported"))
        }
    },
    limits : {
        fileSize : 4 * 1024 * 1024 // 2 mb
    }
})


export default upload
