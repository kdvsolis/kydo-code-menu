import cloudinary
import cloudinary.uploader
import cloudinary.api
from app.config import (CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET)

def upload_cloudinary(url, public_id):
    config = cloudinary.config(secure=True)
    cloudinary.uploader.upload(url, public_id=public_id, unique_filename=False, overwrite=True)
    return cloudinary.api.resource(public_id)

def upload_file_cloudinary(file_to_upload):
    config = cloudinary.config(secure=True)
    return cloudinary.uploader.upload(file_to_upload)
