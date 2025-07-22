from flask import Flask
from flask_socketio import SocketIO, emit, join_room
from Backend.api.auth import auth_ns
from Backend.api.community import community_ns
from Backend.api.friends import friends_ns
from Backend.api.loopImage import image_ns
from Backend.api.users import user_ns
from Backend.api.feed import post_ns
from Backend.api.homepage import homepage_ns
from Backend.api.message import message_ns
from Backend.api.personal_profile import personal_profile_ns
from Backend.api.groupchat import groupchat_ns
import os
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from flask_restx import Api

from peewee import DoesNotExist
from Backend.model.database_model import db
from Backend.model import user_model, post_model, homepage_model, image_model, community_model, message_model
from Backend.model.user_model import User
from Backend.model.message_model import Message

UPLOAD_FOLDER = "./images"
ALLOWED_EXTENSIONS = {"txt", "pdf", "png", "jpg", "jpeg", "gif"}

# Flask app setup
app = Flask(__name__)
api = Api(app, doc="/docs")

socketio = SocketIO(app, cors_allowed_origins="*")

load_dotenv()  # take environment variables

app.secret_key = os.environ["SECRET_KEY"]

app.config["JWT_TOKEN_LOCATION"] = [
    "headers", "cookies", "json", "query_string"]
app.config["JWT_COOKIE_SECURE"] = False
app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET_KEY"]
app.config["JWT_COOKIE_CSRF_PROTECT"] = False
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False
app.config["UPLOAD_FOLDER"] = os.path.join(
    os.path.dirname(__file__), "static/profile_photos")
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

app.config["S3_BUCKET"] = os.environ["S3_BUCKET"]
app.config["S3_KEY"] = os.environ["S3_KEY"]
app.config["S3_SECRET"] = os.environ["S3_SECRET"]
app.config["S3_LOCATION"] = "http://{}.s3.amazonaws.com/".format(
    app.config["S3_BUCKET"])


jwt = JWTManager(app)

# Register Namespace
api.add_namespace(auth_ns, path="/auth")
api.add_namespace(friends_ns, path="/friends")
api.add_namespace(user_ns, path="/user")
api.add_namespace(post_ns, path="/post")
api.add_namespace(homepage_ns, path="/homepage")
api.add_namespace(message_ns, path="/message")
api.add_namespace(personal_profile_ns, path="/personal_profile")
api.add_namespace(image_ns, path="/image")
api.add_namespace(community_ns, path="/community")
api.add_namespace(groupchat_ns, path="/groupchats")


db.connect()

db.create_tables(
    [user_model.User, user_model.Interest, user_model.UserInterest, user_model.Neurotype, user_model.UserNeurotype, user_model.Friend, user_model.UserPhoto, post_model.Post, post_model.Comment, post_model.Like,
     community_model.Community, community_model.CommunityCategory, community_model.Category, homepage_model.Announcement, homepage_model.Event, homepage_model.UserCommunity, homepage_model.RSVP, image_model.Image,
     message_model.Message, message_model.Message, message_model.CommunityMessage, message_model.CommunityMessageRead, message_model.MessageRead, message_model.GroupChat, message_model.GroupChatMember, message_model.GroupMessage])


for topic in community_model.TOPICS:
    for subtopic in community_model.TOPICS[topic]:
        category, created = community_model.Category.get_or_create(
            topic=topic, subtopic=subtopic)


@socketio.on('connect')
def handle_connect():
    print("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    print("Client disconnected")

@socketio.on('send_message')
def handle_send_message(data):
    try:
        sender = User.get(User.email == data['from'])
        recipient_email = data['room'].replace(data['from'], '').replace('_', '')
        recipient = User.get(User.email == recipient_email)

        message = Message.create(
            text=data['text'],
            sender=sender,
            recipient=recipient,
            delivered=True
        )

        emit('receive_message', {
            'id': message.id,
            'from': sender.email,
            'text': message.text,
            'timestamp': str(message.date)
        }, room=data['room'])

    except DoesNotExist:
        print("User not found for sender or recipient")

@socketio.on('send_community_message')
def handle_send_community_message(data):
    try:
        sender = User.get(User.email == data['from'])
        community = community_model.Community.get(community_model.Community.id == data['room'])

        message = message_model.CommunityMessage.create(
            text=data['text'],
            sender=sender,
            community=community,
            delivered=True
        )

        emit('receive_message', {
            'id': message.id,
            'from': sender.email,
            'from_name': message.sender.username if message.sender.username else message.sender.email,
            'from_profile_picture': message.sender.profile_picture.url if message.sender.profile_picture else None,
            'text': message.text,
            'timestamp': str(message.date)
        }, room=data['room'])

    except DoesNotExist:
        print("User or Community not found")

@socketio.on('join_room')
def handle_join_room(data):
    room = data['room']
    join_room(room)
    print(f"Joined room: {room}")

@socketio.on('send_group_message')
def handle_send_group_message(data):
    try:
        sender = User.get(User.email == data['from'])
        group = message_model.GroupChat.get_by_id(data['group_id'])

        msg = message_model.GroupMessage.create(
            group=group,
            sender=sender,
            text=data['text'],
            delivered=True
        )

        emit('receive_group_message', {
            'id': msg.id,
            'from': sender.email,
            'text': msg.text,
            'timestamp': str(msg.date),
            'username': sender.username,
            'avatar': sender.profile_picture.url if sender.profile_picture else None
        }, room=str(group.id))  # emit to group room
    except DoesNotExist:
        print("Sender or group not found")


if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5002,
                 debug=True, allow_unsafe_werkzeug=True)
