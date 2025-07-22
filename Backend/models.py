from peewee import *
from Backend.model.user_model import User
import datetime
from Backend.model.database_model import BaseModel
from Backend.api.personal_profile import personal_profile_ns
from Backend.uploads import save_uploaded_file
import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app, url_for
from werkzeug.datastructures import FileStorage  # For file upload handling

database = SqliteDatabase('your_database.db')  # or PostgreSQL/MySQL

class BaseModel(Model):
    class Meta:
        database = database

class UserPhoto(BaseModel):
    user = ForeignKeyField(User, backref='photos')
    photo_url = CharField()
    created_at = DateTimeField(default=datetime.now)
    
    class Meta:
        table_name = 'user_photos'
        
class UserPhoto(BaseModel):
    user = ForeignKeyField(User, backref='photos')
    photo_url = CharField()
    is_profile_picture = BooleanField(default=False)
    created_at = DateTimeField(default=datetime.datetime.now)

photo_upload_model = personal_profile_ns.model('PhotoUpload', {
    'photo': FileStorage(required=True, description='The photo file')
})

# File upload helper
def save_uploaded_file(file_storage):
    # Implement your file saving logic here
    # Example: Save to filesystem or cloud storage
    filename = secure_filename(file_storage.filename)
    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
    file_storage.save(filepath)
    return url_for('uploaded_file', filename=filename, _external=True)