from Backend.api.uploads import ALLOWED_EXTENSIONS
from flask_restx import Namespace, Resource, fields, reqparse
import os
import boto3, botocore
from flask import current_app, request, app
from werkzeug.utils import secure_filename
from Backend.model.image_model import Image
import uuid

image_ns = Namespace("Image", description="Uploading Image")

upload_parser = reqparse.RequestParser()
upload_parser.add_argument('file', location='files', type='FileStorage', required=True, help='Image file')


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_image(file) -> Image:
    filename = str(uuid.uuid4())

    s3 = boto3.client(
        "s3",
        aws_access_key_id=current_app.config['S3_KEY'],
        aws_secret_access_key=current_app.config['S3_SECRET'],
        region_name="ap-southeast-2",
    )

    s3.upload_fileobj(
        file,
        current_app.config["S3_BUCKET"],
        filename,
        ExtraArgs={
            "ContentType": file.content_type  # Set appropriate content type as per the file
        }
    )

    return Image.create(filename=filename)

