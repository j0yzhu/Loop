from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from flask_restx import Namespace, Resource, fields
from peewee import DoesNotExist, IntegrityError, fn
from Backend.model.user_model import User, Friend
from datetime import datetime
from Backend.model.database_model import db
friends_ns = Namespace('Friends', "Friends Space")

# Helper to find user identity


@jwt_required()
def get_user():
    user = get_jwt_identity()
    return user

# Helper for finding user ID


def get_user_or_404(email):
    try:
        return User.get(User.email == email)
    except DoesNotExist:
        friends_ns.abort(404, f"User with email '{email}' not found")


# Check between these users
sent_requests_field = friends_ns.model('Friend Request', {
    'email': fields.String, 'recipient': fields.String})

# Input model for sending a request
send_request_model = friends_ns.model('SendFriendRequestInput', {
    'recipient_email': fields.String(required=True, description='The identifier (e.g., email or username) of the user to send the request to')
})

# Input model for responding to a request
respond_request_model = friends_ns.model('RespondFriendRequestInput', {
    'action': fields.String(required=True, description='Action to perform: "accept" or "reject"', enum=['accept', 'reject'])
})

# Output model for a single friend request
friend_request_model = friends_ns.model('FriendRequest', {
    'request_id': fields.String(description='Unique identifier for the friend request'),
    'requester': fields.String(description='Identifier of the user sending the request'),
    'recipient': fields.String(description='Identifier of the user receiving the request'),
    'status': fields.String(description='Status of the request (pending, accepted, rejected)'),
    'created_at': fields.DateTime(description='Timestamp when the request was created')
})

# Output model for the friend list
friend_list_model = friends_ns.model('FriendList', {
    'friends': fields.List(fields.String, description='List of friend identifiers')
})


@friends_ns.route("/suggestions")
class SuggestUsers(Resource):
    @friends_ns.doc('get_suggested_users')
    @friends_ns.response(200, 'List of users not yet connected')
    @friends_ns.response(401, 'Unauthorized (JWT token required)')
    def get(self):
        current_user = get_user()
        existing_relations = Friend.select().where(
            (Friend.user == current_user) | (
                Friend.connected_user == current_user)
        )
        connected_ids = {current_user}
        for relation in existing_relations:
            connected_ids.add(relation.user.id)
            connected_ids.add(relation.connected_user.id)

        suggested_users = User.select().where(~User.id.in_(connected_ids)).limit(10)

        users = []
        for user in suggested_users:
            users.append(user.to_dict())
        return jsonify(users)


@friends_ns.route("/list")
class GetFriendsList(Resource):
    @friends_ns.doc('get_friend_list')
    @friends_ns.response(401, 'Unauthorized (JWT token required)')
    def get(self):
        current_user = get_user()
        friends_query = User.select().join(
            Friend,
            on=(
                ((Friend.user == current_user) & (Friend.connected_user == User.id)) |
                ((Friend.connected_user == current_user) & (Friend.user == User.id))
            )
        ).where(
            (Friend.status == 'accepted') & (User.id != current_user)
        ).distinct()
        friends = []
        for friend in friends_query:
            friends.append(friend.to_dict())
        return jsonify(friends)


@friends_ns.route("/request")
class SendFriendRequest(Resource):
    @friends_ns.doc('send_friend_request')
    @friends_ns.expect(send_request_model)
    @friends_ns.response(201, 'Friend request sent successfully.', friend_request_model)
    @friends_ns.response(400, 'Bad Request (e.g., missing recipient, self-request, already exists/friends)')
    @friends_ns.response(404, 'Recipient user not found')
    @friends_ns.response(401, 'Unauthorized (JWT token required)')
    def post(self):
        # Sends a friend request
        requester_user = get_user()
        data = request.get_json()
        recipient_email = data.get("recipient_email")
        recipient_user = get_user_or_404(recipient_email)
        if not recipient_email:
            return {"message": "Recipient email is required"}, 400
        if requester_user == recipient_user:
            return {"message": "Cannot send a friend request to yourself"}, 400
        existing_request = Friend.get_or_none(
            ((Friend.user == requester_user) & (Friend.connected_user == recipient_user)) |
            ((Friend.user == recipient_user) &
             (Friend.connected_user == requester_user))
        )
        if existing_request:
            if existing_request.status == 'accepted':
                return {"message": "You are already friends with this user"}, 409
            elif existing_request.status == 'pending':
                if existing_request.user == requester_user:
                    return {"message": "You have already sent a pending request to this user"}, 409
                else:
                    return {"message": "This user has already sent you a pending friend request"}, 409
        try:
            with db.atomic():
                friend_request = Friend.create(
                    user=requester_user,
                    connected_user=recipient_user,
                    status='pending'
                )
                friend_request.save()
            return {"message": "Friend request sent successfully"}, 201
        except IntegrityError as e:
            db.rollback()
            return {"message": "Could not send friend request, potentially due to a conflict.", "error": str(e)}, 409
        except Exception as e:
            db.rollback()
            return {"message": "An unexpected error occurred"}, 500


@friends_ns.route("/requests/pending")
class GetPendingRequests(Resource):
    @friends_ns.doc('get_pending_requests')
    @friends_ns.response(200, 'Success', friends_ns.model('PendingRequestsList', {
        'pending_requests': fields.List(fields.Nested(friend_request_model))
    }))
    @friends_ns.response(401, 'Unauthorized (JWT token required)')
    def get(self):
        current_user = get_user()
        pending_requests = Friend.select().where(
            (Friend.status == 'pending') &
            (Friend.connected_user_id == current_user)
        ).distinct()
        requests = []
        for req in pending_requests:
            requests.append({
                'request_id': str(req.id),
                'requester': req.user.email,
                'requester_id': req.user.id,
                'req_name': str(req.user.firstname + ' ' + req.user.lastname),
                'recipient': req.connected_user.email,
                'status': req.status,
                'created_at': req.created_at.isoformat(),
                "profile_picture_url": req.user.profile_picture.url if req.user.profile_picture is not None else None
            })
        return jsonify(requests)


@friends_ns.route("/request/<string:request_id>/respond")
class RespondToFriendRequest(Resource):
    @friends_ns.doc('respond_to_friend_request', params={'request_id': 'The ID of the friend request to respond to'})
    @friends_ns.expect(respond_request_model)
    @friends_ns.response(200, 'Request responded successfully.', friend_request_model)
    @friends_ns.response(400, 'Bad Request (e.g., invalid action, request already handled)')
    @friends_ns.response(401, 'Unauthorized (JWT token required)')
    @friends_ns.response(403, 'Forbidden (Not authorized to respond to this request)')
    @friends_ns.response(404, 'Friend request not found')
    @jwt_required()
    def put(self, request_id):
        current_user = get_user()
        data = request.get_json()
        action = data.get("action")
        if action not in ['accept', 'reject']:
            return {"message": "Invalid action. Must be 'accept' or 'reject'."}, 400
        try:
            friend_request = Friend.get_by_id(request_id)
        except DoesNotExist:
            return {"message": "Friend request not found."}, 404
        if friend_request.user == current_user:
            return {"message": "You are not authorized to respond to this friend request."}, 403
        if friend_request.status != 'pending':
            return {"message": "This friend request has already been handled."}, 400
        try:
            with db.atomic():
                friend_request.status = 'accepted' if action == 'accept' else 'rejected'
                friend_request.save()
            return {
                "request_id": str(friend_request.id),
                "requester": friend_request.user.email,
                "recipient": friend_request.connected_user.email,
                'req_name': str(friend_request.user.firstname + ' ' + friend_request.user.lastname),
                "status": friend_request.status,
                "created_at": friend_request.created_at.isoformat(),
                "profile_picture_url": friend_request.user.profile_picture.url if friend_request.user.profile_picture is not None else None

            }, 200
        except Exception as e:
            db.rollback()
            return {"message": "Failed to update the friend request", "error": str(e)}, 500
