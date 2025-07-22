from flask import request, jsonify
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from peewee import fn
from Backend.model import message_model
from Backend.model.message_model import (Message, MessageRead, GroupChat, GroupChatMember, GroupMessage,
                                         CommunityMessage, CommunityMessageRead)
from Backend.model.user_model import User
from Backend.model.homepage_model import UserCommunity


message_ns = Namespace('Message', description='Messaging operations')

# Schema for returning a message
chat_fields = message_ns.model('Message', {
    'id': fields.Integer,
    'sender': fields.String,
    'message': fields.String,
    'timestamp': fields.String,
    'delivered': fields.Boolean
})

new_message = message_ns.model('NewCommunityMessage', {
    'text': fields.String(required=True, description='The content of the message')
})


def check_user_is_member_of_community(user, community_id):
    return UserCommunity.select().where(
        (UserCommunity.user == user) & (UserCommunity.community == community_id)
    ).exists()

@message_ns.route("/community/<int:community_id>/messages")
class CommunityChat(Resource):
    @jwt_required()

    def get(self, community_id):
        user_id = get_jwt_identity()
        try:
            user = User.get_by_id(user_id)

            if not check_user_is_member_of_community(user, community_id):
                return {"error": "You are not a member of this community"}, 403

            messages = (CommunityMessage
                        .select()
                        .where(CommunityMessage.community == community_id)
                        .order_by(CommunityMessage.date.asc())
                        )

            #     'id': fields.Integer,
            #     'sender': fields.String,
            #     'message': fields.String,
            #     'timestamp': fields.String,
            #     'delivered': fields.Boolean

            return [
                {
                    'id': message.id,
                    'from': message.sender.email,
                    'from_name': message.sender.username if message.sender.username else message.sender.email,
                    'from_profile_picture': message.sender.profile_picture.url if message.sender.profile_picture else None,
                    'text': message.text,
                    'timestamp': str(message.date)
                }
                for message in messages
            ]

        except User.DoesNotExist:
            return {"error": "User not found"}, 404

@jwt_required()
@message_ns.expect(new_message, validate=True)
@message_ns.marshal_with(chat_fields, code=201)
def post(self, community_id):
    user = User.get_by_id(get_jwt_identity())

    if not check_user_is_member_of_community(user, community_id):
        return {'error': 'Not a member of this community'}, 403

    data = request.get_json()
    msg = CommunityMessage.create(
        community=community_id,
        sender=user,
        text=data['text'],
        delivered=True
    )
    return msg, 201


@message_ns.route("/conversations")
class Conversations(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        try:
            user = User.get_by_id(user_id)

            # --- Direct Messages ---
            messages = (
                Message.select()
                .where((Message.sender == user) | (Message.recipient == user))
                .order_by(Message.date.desc())
            )

            conversations = {}

            for msg in messages:
                other = msg.recipient if msg.sender == user else msg.sender
                room_id = "_".join(sorted([user.email, other.email]))
                from_me = msg.sender == user

                unread_count = (
                    Message
                    .select()
                    .where(
                        (Message.sender == other) &
                        (Message.recipient == user) &
                        (~Message.id.in_(
                            MessageRead.select(MessageRead.message)
                            .where(MessageRead.user == user)
                        ))
                    )
                    .count()
                )

                recipient_seen = (
                    from_me and
                    MessageRead.select()
                        .where((MessageRead.message == msg) & (MessageRead.user == msg.recipient))
                        .exists()
                )

                if room_id not in conversations:
                    conversations[room_id] = {
                        "conversation_id": room_id,
                        "is_group": False,
                        "last_message": {
                            "message": msg.text,
                            "timestamp": msg.date.isoformat() + "Z"
                        },
                        "sender_id": msg.sender.email,
                        "sender_pfp": msg.sender.profile_picture.url if msg.sender.profile_picture else None,
                        "recipient_id": msg.recipient.email,
                        "recipient_pfp": msg.recipient.profile_picture.url if msg.recipient.profile_picture else None,
                        "delivered": msg.delivered,
                        "other_user_username": other.username,
                        "other_user_email": other.email,
                        "unread_count": unread_count,
                        "from_me": from_me,
                        "recipient_seen": recipient_seen
                    }

            # --- Group Chats ---
            group_memberships = (
                message_model.GroupChatMember
                .select()
                .where(message_model.GroupChatMember.user == user)
            )

            for membership in group_memberships:
                group = membership.group

                # Only include if group has messages
                latest_msg = (
                    message_model.GroupMessage
                    .select()
                    .where(message_model.GroupMessage.group == group)
                    .order_by(message_model.GroupMessage.date.desc())
                    .first()
                )

                if latest_msg:
                    conversations[f"group_{group.id}"] = {
                        "conversation_id": f"group_{group.id}",
                        "is_group": True,
                        "group_id": group.id,
                        "group_name": group.name,
                        "last_message": {
                            "message": latest_msg.text,
                            "timestamp": latest_msg.date.isoformat() + "Z"
                        }
                    }

            return jsonify(list(conversations.values()))

        except User.DoesNotExist:
            return {"error": "User not found"}, 404


@message_ns.route("/history/<recipient_email>")
class MessageHistory(Resource):
    @jwt_required()
    def get(self, recipient_email):
        current_user_id = get_jwt_identity()

        try:
            current_user = User.get_by_id(current_user_id)
            recipient = User.get(User.email == recipient_email)

            messages = (
                Message
                .select()
                .where(
                    ((Message.sender == current_user) & (Message.recipient == recipient)) |
                    ((Message.sender == recipient) & (Message.recipient == current_user))
                )
                .order_by(Message.date.asc())
            )

            # Mark unread messages as read
            unread_messages = [
                m for m in messages
                if m.recipient == current_user and not MessageRead.select()
                    .where((MessageRead.message == m) & (MessageRead.user == current_user))
                    .exists()
            ]

            for m in unread_messages:
                MessageRead.create(message=m, user=current_user)

            return [{
                "id": str(m.id),
                "text": m.text,
                "from": m.sender.email,
                "timestamp": m.date.isoformat() + "Z"
            } for m in messages]

        except User.DoesNotExist:
            return {"error": "User not found"}, 404


@message_ns.route("/group-history/<int:group_id>")
class GroupChatHistory(Resource):
    @jwt_required()
    def get(self, group_id):
        try:
            messages = (
                GroupMessage
                .select(GroupMessage, User)
                .join(User, on=(GroupMessage.sender == User.id))
                .where(GroupMessage.group == group_id)
                .order_by(GroupMessage.date.asc())
            )

            return [{
                "id": str(m.id),
                "text": m.text,
                "from": m.sender.email,
                "username": m.sender.username,
                "avatar": m.sender.profile_picture.url if m.sender.profile_picture else None,
                "timestamp": m.date.isoformat() + "Z"
            } for m in messages]

        except Exception as e:
            return {"error": str(e)}, 500

@message_ns.route("/group/<int:group_id>/members")
class GroupMembers(Resource):
    @jwt_required()
    def get(self, group_id):
        try:
            group = GroupChat.get_by_id(group_id)

            members = (
                GroupChatMember
                .select(GroupChatMember, User)
                .join(User)
                .where(GroupChatMember.group == group)
            )

            return jsonify({
                "group_name": group.name,
                "members": [{
                    "username": m.user.username,
                    "email": m.user.email,
                    "avatar": m.user.profile_picture.url if m.user.profile_picture else None
                } for m in members]
            })

        except GroupChat.DoesNotExist:
            return {"error": "Group not found"}, 404



@message_ns.route('/group/<int:group_id>/name')
class UpdateGroupName(Resource):
    @jwt_required()
    def patch(self, group_id):
        try:
            data = request.json
            new_name = data.get('name')
            if not new_name:
                return {"error": "Name is required"}, 400

            group = GroupChat.get_by_id(group_id)
            group.name = new_name
            group.save()
            return {"message": "Group name updated"}, 200

        except GroupChat.DoesNotExist:
            return {"error": "Group not found"}, 404
        except Exception as e:
            return {"error": str(e)}, 500


@message_ns.route('/group/<int:group_id>/add-member')
class AddGroupMember(Resource):
    @jwt_required()
    def post(self, group_id):
        try:
            data = request.json
            emails = data.get('emails')  
            if not emails or not isinstance(emails, list):
                return {"error": "List of emails is required"}, 400

            group = GroupChat.get_by_id(group_id)
            added = []

            for email in emails:
                try:
                    user = User.get(User.email == email)
                    exists = GroupChatMember.select().where(
                        (GroupChatMember.group == group) & (GroupChatMember.user == user)
                    ).exists()
                    if not exists:
                        GroupChatMember.create(group=group, user=user)
                        added.append(email)
                except User.DoesNotExist:
                    continue

            return {"message": "Users added", "added": added}, 201

        except GroupChat.DoesNotExist:
            return {"error": "Group not found"}, 404
        except Exception as e:
            return {"error": str(e)}, 500

@message_ns.route('/group/<int:group_id>/leave')
class LeaveGroup(Resource):
    @jwt_required()
    def post(self, group_id):
        try:
            user_id = get_jwt_identity()
            group = GroupChat.get_by_id(group_id)

            deleted = GroupChatMember.delete().where(
                (GroupChatMember.group == group) &
                (GroupChatMember.user == user_id)
            ).execute()

            if deleted == 0:
                return {"message": "You are not a member of this group"}, 404

            return {"message": "Left group successfully"}, 200

        except GroupChat.DoesNotExist:
            return {"error": "Group not found"}, 404
        except Exception as e:
            return {"error": str(e)}, 500
