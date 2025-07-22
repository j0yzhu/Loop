import bcrypt
from dotenv import load_dotenv
from flask import request, jsonify

from Backend.model.user_model import User

from flask_jwt_extended import create_access_token
from flask_jwt_extended import get_jwt_identity
from flask_jwt_extended import jwt_required
from flask_jwt_extended import set_access_cookies, unset_access_cookies

from flask_restx import Namespace, Resource, fields

auth_ns = Namespace('Auth', "Onboarding")
load_dotenv()

@auth_ns.route("/me")
class Me(Resource):
    @jwt_required(locations=["cookies"])
    def get(self):
        # Access the identity of the current user with get_jwt_identity
        # To get the current user, use get_jwt_identity()
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)
        if not user:
            return {"message": "User not found"}, 404

        return {
            "email": user.email,
            "username": user.username,
            "firstname": user.firstname,
            "lastname": user.lastname,
            "year_level": user.year_level,
            "degree": user.degree,
            "date_of_birth": str(user.date_of_birth) if user.date_of_birth else None,
            "gender": user.gender,
            "age": user.age,
            "pronoun": user.pronoun
        }, 200


register_fields = auth_ns.model('Register', {'firstname': fields.String, 'lastname': fields.String,
'email': fields.String, 'password': fields.String})
@auth_ns.route("/register")
class Register(Resource):
    @auth_ns.expect(register_fields)
    def post(self):
        data = request.get_json()
        firstname = data.get("firstname")
        lastname = data.get("lastname")
        users_email = data.get("email", "").strip().lower()
        password = data.get("password")

        if not firstname:
            response = jsonify(error="Firstname required")
            response.status = 400
            return response
        if not lastname:
            response = jsonify(error="Lastname required")
            response.status = 400
            return response
        if not users_email:
            response = jsonify(error="UoA Email Required")
            response.status = 400
            return response
        if not password:
            response =  jsonify(error="Password Required")
            response.status = 400
            return response

        if not users_email.endswith("@aucklanduni.ac.nz") and not users_email.endswith("@auckland.ac.nz"):
            response = jsonify(error="Use your UoA email.")
            response.status = 400
            return response

        already_user = User.get_or_none(email=users_email)
        if already_user is not None:
            return jsonify(error="User with this email already exists"), 400

        hashed_password = hash_salt_password(password)
        new_user = User(firstname= firstname, lastname= lastname,  email=users_email, hash_salted_password=hashed_password)
        new_user.save()

        # Generate JWT token
        access_token = create_access_token(identity=str(new_user.id))
        # We return the access token in the response body so React Native can consume it more easily
        # We return the access token in a cookie also so it's easier to work with swagger
        response = jsonify({"access_token": access_token})
        set_access_cookies(response, access_token)
        return response
    
login_fields = auth_ns.model('Login', {'email': fields.String, 'password': fields.String})
@auth_ns.route("/login")
class Login(Resource):
    @auth_ns.expect(login_fields)
    def post(self):
        data = request.get_json()
        users_email = data.get("email", "").strip().lower()
        password = data.get("password")

        print(users_email)

        if not users_email:
            response = jsonify(error="UoA Email Required")
            response.status = 400
            return response
        if not password:
            response =  jsonify(error="Password Required")
            response.status = 400
            return response

        if not users_email.endswith("@aucklanduni.ac.nz") and not users_email.endswith("@auckland.ac.nz"):
            response = jsonify(error="Use your UoA email.")
            response.status = 400
            return response

        user = User.get_or_none(email=users_email)
        if not user or not verify_password(password, user.hash_salted_password):
            response = jsonify(error="Incorrect email/password")
            response.status = 401
            return response

        # Generate JWT token
        access_token = create_access_token(identity=str(user.id))
        # We return the access token in the response body so React Native can consume it more easily
        # We return the access token in a cookie also so it's easier to work with swagger
        response = jsonify({"access_token": access_token})
        set_access_cookies(response, access_token)
        return response

@auth_ns.route("/logout")
class Logout(Resource):
    def post(self):
        response = jsonify({"msg": "logout successful"})
        unset_access_cookies(response)
        return response

def hash_salt_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
