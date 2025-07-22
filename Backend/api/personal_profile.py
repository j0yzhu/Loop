from flask_restx import Namespace, Resource, fields
from flask import request, current_app, send_from_directory
from flask_jwt_extended import jwt_required, get_jwt_identity
from Backend.model.user_model import User, Interest, UserInterest, UserPhoto
from Backend.model.database_model import db
from Backend.api.loopImage import allowed_file, upload_image, upload_parser
from werkzeug.datastructures import FileStorage
import os
import boto3

# Define namespace with proper metadata
personal_profile_ns = Namespace(
    'personal_profile',
    description='Personal profile operations including viewing and updating profiles',
)

# Helper function to get current user
@jwt_required()
def get_current_user():
    identity = get_jwt_identity()
    # Try username lookup first
    user = User.get_or_none(User.username == identity)
    if user:
        return user
        
    # Fallback to ID lookup
    try:
        return User.get_by_id(identity)
    except User.DoesNotExist:
        raise ValueError(f"User not found with identity: {identity}")

# Response models
profile_model = personal_profile_ns.model('PersonalProfile', {
    'username': fields.String(required=True, description='User identifier'),
    'full_name': fields.String(description='Combined first and last name'),
    'bio': fields.String(description='User biography'), # not linked 
    'pronouns': fields.String(description='User pronouns'),
    'degree': fields.String(description='Academic degree program'),
    'year_level': fields.String(description='Year of study'),
    'profile_picture': fields.String(description='User profile picture url'),  # not linked 
    'photos' : fields.String(description='Uploaded User photos'),  # not linked 
    'interests': fields.List(fields.String, description='List of user interests')  # not linked?
})

update_profile_model = personal_profile_ns.model('UpdateProfile', {
    'bio': fields.String(),  # Will go in UserProfile table
    'pronouns': fields.String(),
    'degree': fields.String(),
    'year_level': fields.String(),  # Now matches DB type
    'profile_picture': fields.String(),
    'photos': fields.String(),
    'interests': fields.List(fields.String)
})

photo_upload_model = personal_profile_ns.parser()
photo_upload_model.add_argument('photo', location='files', type=FileStorage, required=True)

@personal_profile_ns.route('/<string:username>')
@personal_profile_ns.param('username', 'The user identifier')
class UserPersonalProfile(Resource):
    @personal_profile_ns.doc('get_profile')
    @personal_profile_ns.marshal_with(profile_model)
    @personal_profile_ns.response(404, 'User not found')
    def get(self, username):
        
        """Get a user's profile by username"""
        user = User.get_or_none(User.username == username)
        if not user:
            personal_profile_ns.abort(404, f"User {username} not found")

        # Get the user's profile (if exists)
        try:
            user_profile = UserProfile.get(UserProfile.user == user)
            bio = user_profile.bio
        except UserProfile.DoesNotExist:
            bio = "No bio yet"
        
        interests = (Interest
                   .select(Interest.name)
                   .join(UserInterest)
                   .where(UserInterest.user == user))
    
        
        return {
            'username': user.username,
            'full_name': f"{user.firstname} {user.lastname}",
            'bio': bio,  # Now properly fetched from UserProfile
            'pronouns': user.pronoun,
            'degree': user.degree,
            'year_level': user.year_level,
            'interests': [interest.name for interest in interests],
            'profile_picture': user.profile_picture.url if user.profile_picture is not None else None,
            #'photos': [p.photo_url for p in photos]
        }

@personal_profile_ns.route('/view/<string:username>')
class PersonalProfilePage(Resource):
    @personal_profile_ns.doc('view_profile_page')
    @personal_profile_ns.marshal_with(profile_model)
    @personal_profile_ns.response(404, 'User not found')
    def get(self, username):
        """View profile page (renders template in actual implementation)"""
        return UserPersonalProfile().get(username)

@personal_profile_ns.route('/update')
class UpdatePersonalProfile(Resource):
    @jwt_required()
    @personal_profile_ns.expect(update_profile_model)
    def post(self):
        try:
            user = get_current_user()
            data = request.get_json()
            current_app.logger.info(f"Received update data: {data}")

            # Get or create the user profile
            profile, created = UserProfile.get_or_create(user=user)

            # Update user fields
            if 'pronouns' in data:
                user.pronoun = data['pronouns']
            if 'degree' in data:
                user.degree = data['degree']
            if 'year_level' in data:
                try:
                    user.year_level = data['year_level']
                except ValueError:
                    personal_profile_ns.abort(400, "year_level must be a number")

            # Update profile fields
            if 'bio' in data:
                profile.bio = data['bio']
            if 'profile_picture' in data:
                user.profile_picture = data['profile_picture'] #write it in both the profile table and the user table
                profile.profile_picture = data['profile_picture']

            # Handle interests update
            if 'interests' in data:
                current_app.logger.info(f"Processing interests: {data['interests']}")
                
                if isinstance(data['interests'], list):
                    # Clean and normalize
                    new_interests = [i.strip().lower() for i in data['interests'] if i and isinstance(i, str)]
                    new_interests = list(set(new_interests))  # Remove duplicates

                    with db.atomic():
                        # Get current interests as a set of names
                        existing_links = (Interest
                                        .select(Interest.name)
                                        .join(UserInterest)
                                        .where(UserInterest.user == user))
                        existing_interest_names = set(i.name for i in existing_links)

                        # Add only new interests
                        for interest_name in new_interests:
                            if interest_name not in existing_interest_names:
                                interest, _ = Interest.get_or_create(name=interest_name)
                                UserInterest.create(user=user, interest=interest)

                    current_app.logger.info(f"Final interests for {user.username}: {existing_interest_names.union(set(new_interests))}")

            # Save user and profile
            with db.atomic():
                user.save()
                profile.save()

            return {
                "message": "Profile updated successfully",
                "updated_fields": list(data.keys())
            }, 200

        except Exception as e:
            current_app.logger.error(f"Update failed: {str(e)}", exc_info=True)
            personal_profile_ns.abort(500, "Internal server error")


@personal_profile_ns.route('/profile_picture')
class ProfilePicture(Resource):
    @jwt_required()
    def get(self):
        """Get current profile picture"""
        user = get_current_user()
        
        if not user.profile_picture:
            personal_profile_ns.abort(404, "No profile picture set")
        
        return {
            'profile_picture_id': user.profile_picture.id,
            'url': user.profile_picture.url if user.profile_picture is not None else None,
        }

    @jwt_required()
    @personal_profile_ns.expect(upload_parser)
    def post(self):
        """Upload new profile picture (replaces existing)"""
        user = get_current_user()

        # ⚠️ Bypass the broken upload_parser and use request.files directly
        if 'file' not in request.files:
            return {"msg": "No file provided"}, 400

        file = request.files['file']

        if file.filename == '':
            return {"msg": "Empty filename"}, 400

        if not allowed_file(file.filename):
            return {"msg": "Invalid file type"}, 400

        try:
            # Delete old picture if exists
            if user.profile_picture:
                try:
                    # Delete from S3
                    s3 = boto3.client(
                        "s3",
                        aws_access_key_id=current_app.config['S3_KEY'],
                        aws_secret_access_key=current_app.config['S3_SECRET'],
                        region_name="ap-southeast-2",
                    )
                    s3.delete_object(
                        Bucket=current_app.config['S3_BUCKET'],
                        Key=user.profile_picture.filename
                    )
                    # Delete database record
                    old_picture = user.profile_picture
                    user.profile_picture = None
                    user.save()

                    # Now safe to delete image
                    old_picture.delete_instance()
                except Exception as e:
                    current_app.logger.error(f"Error deleting old image: {str(e)}")

            # Upload new image using helper
            new_image = upload_image(file)
            user.profile_picture = new_image
            user.save()

            return {
                "msg": "Profile picture updated",
                "new_url": new_image.url
            }, 201

        except Exception as e:
            current_app.logger.error(f"Upload failed: {str(e)}")
            return {"msg": "Upload failed"}, 500
        

@personal_profile_ns.route('/photos')
class UploadUserPhoto(Resource):
    @jwt_required()
    def get(self):
        """Get list of user's uploaded photos"""
        user = get_current_user()

        photos = (UserPhoto
                  .select(UserPhoto.id, UserPhoto.photo_url)
                  .where(UserPhoto.user == user))

        return {
            "photos": [{"id": photo.id, "url": photo.photo_url} for photo in photos]
            }

    @jwt_required()
    @personal_profile_ns.expect(upload_parser)
    def post(self):
        """Upload a photo to the user's profile"""
        user = get_current_user()

        # Handle file
        if 'file' not in request.files:
            return {"msg": "No file provided"}, 400

        file = request.files['file']
        if file.filename == '':
            return {"msg": "Empty filename"}, 400

        if not allowed_file(file.filename):
            return {"msg": "Invalid file type"}, 400

        try:
            # Upload image to S3
            new_image = upload_image(file)

            # Create UserPhoto record
            photo = UserPhoto.create(
                user=user,
                photo_url=new_image.url
            )

            return {
                "success": True,
                "url": photo.photo_url  # Explicitly return the URL
            }, 201

        except Exception as e:
            current_app.logger.error(f"Upload failed: {str(e)}")
            return {"msg": "Upload failed"}, 500

@personal_profile_ns.route('/photos/<string:username>')
class PublicUserPhotos(Resource):
    def get(self, username):
        """Publicly get photos for a given user"""
        user = User.get_or_none(User.username == username)
        if not user:
            return {"msg": "User not found"}, 404

        photos = (UserPhoto
                  .select(UserPhoto.id, UserPhoto.photo_url)
                  .where(UserPhoto.user == user))

        return {
            "username": username,
            "photos": [{"id": photo.id, "url": photo.photo_url} for photo in photos]
        }

@personal_profile_ns.route('/photos/<string:photo_key>')  # Changed from photo_url to photo_key
class DeleteUserPhoto(Resource):
    @jwt_required()
    def delete(self, photo_key):
        user = get_current_user()
        
        # Find photo by matching the end of the URL
        photo = UserPhoto.get_or_none(
            (UserPhoto.photo_url.endswith(photo_key)) &
            (UserPhoto.user == user)
        )
        
        if not photo:
            return {"msg": "Photo not found"}, 404

        try:
            s3 = boto3.client(
                "s3",
                aws_access_key_id=current_app.config['S3_KEY'],
                aws_secret_access_key=current_app.config['S3_SECRET'],
                region_name="ap-southeast-2",
            )

            s3.delete_object(
                Bucket=current_app.config['S3_BUCKET'],
                Key=photo_key  # Use just the key part
            )
            
            photo.delete_instance()
            return {"msg": "Photo deleted"}, 200

        except Exception as e:
            current_app.logger.error(f"Delete failed: {str(e)}")
            return {"msg": f"Delete failed: {str(e)}"}, 500