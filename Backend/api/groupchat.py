from flask_restx import Namespace, Resource, fields
from flask import request
from flask_jwt_extended import jwt_required, get_jwt_identity
from Backend.model.user_model import User
from Backend.model.message_model import GroupChat, GroupChatMember
from Backend.model.database_model import db

groupchat_ns = Namespace('GroupChat', description='Group chat operations')

create_group_model = groupchat_ns.model('CreateGroupChat', {
    'name': fields.String(required=True),
    'members': fields.List(fields.String, required=True)
})

@groupchat_ns.route("/")
class GroupChatAPI(Resource):
    @jwt_required()
    @groupchat_ns.expect(create_group_model)
    def post(self):
        data = request.get_json()
        group_name = data.get("name")
        member_emails = data.get("members")

        user_id = get_jwt_identity()
        creator = User.get_by_id(user_id)

        with db.atomic():
            group = GroupChat.create(name=group_name, creator=creator)
            GroupChatMember.create(group=group, user=creator)
            for email in member_emails:
                member = User.get(User.email == email)
                GroupChatMember.create(group=group, user=member)

        return {"message": "Group chat created", "group_id": group.id}, 201
