import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_uploaded_file(file):
    """Save uploaded file to storage with validation"""
    if not file or file.filename == '':
        raise ValueError("No selected file")
    
    if not allowed_file(file.filename):
        raise ValueError("File type not allowed")
    
    upload_folder = os.path.join(current_app.root_path, 'static/profile_photos')
    os.makedirs(upload_folder, exist_ok=True)
    
    filename = secure_filename(file.filename)
    unique_name = f"{uuid.uuid4()}_{filename}"
    filepath = os.path.join(upload_folder, unique_name)
    
    file.save(filepath)
    return f"/static/profile_photos/{unique_name}"