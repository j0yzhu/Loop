import bcrypt
from dotenv import load_dotenv
from flask import request, jsonify
from Backend.api.uploads import ALLOWED_EXTENSIONS
from Backend.model.user_model import User, Neurotype, UserNeurotype, UserInterest, Interest
from Backend.model.community_model import Community
from Backend.model.homepage_model import UserCommunity
from Backend.api.loopImage import upload_image, upload_parser, allowed_file

from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended import jwt_required

from flask_restx import Namespace, Resource, fields, reqparse
from datetime import datetime

user_ns = Namespace("User", description="user stuff")

load_dotenv()

profile_model = user_ns.model("ProfileSetup", {"username": fields.String, "dob": fields.String,"year_level": fields.String,
"degree": fields.String, "pronouns": fields.String,"gender": fields.String, "neurotypes": fields.List(fields.String), "interests":fields.List(fields.String), "age": fields.String})

@user_ns.route("/setup/profile-picture")
class SetupProfilePicture(Resource):
    @jwt_required()
    @user_ns.expect(upload_parser)
    def post(self):
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)

        file = request.files['file']
        if file and allowed_file(file.filename):
            image = upload_image(file)
            user.profile_picture = image
            user.save()

            return {
                "msg": "Profile picture successfully uploaded!",
                "profile_picture": user.profile_picture.url
            }

        return {"msg": "File type not allowed"}, 400


@user_ns.route("/setup")
class SetupProfile(Resource):
    @jwt_required()
    @user_ns.expect(profile_model)
    def post(self):
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)

        data = request.get_json()

        dob_str = data.get("dob")
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()

        if not user:
            return {"error": "User not found"}, 404

        user.username = data.get("username")
        user.date_of_birth = dob
        user.age = data.get("age")
        user.degree = data.get("degree")
        user.pronoun = data.get("pronouns")
        user.year_level = data.get("year_level")
        user.gender = data.get("gender")
        user.save()

        UserNeurotype.delete().where(UserNeurotype.user == user).execute()
        
        # Only process non-empty neurotypes
        neurotypes = [n for n in data.get("neurotypes", []) if n.strip()]
        for neurotype_name in neurotypes:
            neurotype, _ = Neurotype.get_or_create(name=neurotype_name.strip())
            UserNeurotype.create(user=user, neurotype=neurotype)

        # Clear existing interests before adding new ones
        UserInterest.delete().where(UserInterest.user == user).execute()
        
        # Only process non-empty interests
        interests = [i for i in data.get("interests", []) if i.strip()]
        for interest_name in interests:
            interest, _ = Interest.get_or_create(name=interest_name.strip())
            UserInterest.create(user=user, interest=interest)

        # Refresh user data
        user = User.get_by_id(user_id)
        return {
            "msg": "Profile successfully set up!",
            "profile": user.to_dict()
        }, 201


@user_ns.route("/me")
class GetProfile(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        user: User = User.get_by_id(user_id)

        if not user:
            return {"error": "Profile not found"}, 404

        return user.to_dict(), 200

    
@user_ns.route('/me/communities')
class MyCommunities(Resource):
    @jwt_required()
    def get(self):
        user = User.get_by_id(get_jwt_identity())
        # pull all join-rows for this user
        joins = UserCommunity.select().where(UserCommunity.user == user)
        return jsonify([
            {
                "id":         j.community.id,
                "name":       j.community.name,
                "description":j.community.description,
                "joined_at":   j.created_at.isoformat()  # or add a joined_at field
            }
            for j in joins
        ])

@user_ns.route("/email/<string:email>")
class GetUserByEmail(Resource):
    @jwt_required()
    def get(self, email):
        user = User.get_or_none(User.email == email)

        if not user:
            return {"error": "User not found"}, 404

        return user.to_dict(), 200


def calculate_age(dob_str):
    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d")
        today = datetime.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except ValueError:
        return None

@user_ns.route("/<int:id>")
class GetOtherUserProfile(Resource):
    @jwt_required()
    def get(self, id):
        user = User.get_or_none(User.id == id)

        if not user:
            return {"error": "User not found"}, 404

        return user.to_dict(), 200

@user_ns.route("/delete-user")
class DeleteCurrentUser(Resource):
    @jwt_required()
    def delete(self):
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)

        if not user:
            return {"error": "User not found"}, 404

        # Delete related UserNeurotype and UserInterest entries
        UserNeurotype.delete().where(UserNeurotype.user == user).execute()
        UserInterest.delete().where(UserInterest.user == user).execute()
        UserCommunity.delete().where(UserCommunity.user == user).execute()

        # Delete the user
        user.delete_instance()

        return {"msg": "User deleted successfully"}, 200
