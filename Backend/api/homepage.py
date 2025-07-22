from flask import jsonify, request
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import jwt_required, get_jwt_identity
from Backend.model.user_model import User
from Backend.model.homepage_model import Announcement, Event, UserCommunity, RSVP
from Backend.model.community_model import Community
from datetime import datetime, timedelta

homepage_ns = Namespace("Homepage", description="Joining communities and events")

join_model = homepage_ns.model("JoinCommunity", {
    "community_id": fields.Integer(required=True),
})

rsvp_model = homepage_ns.model("RSVPEvent", {
    "event_id": fields.Integer(required=True),
})

create_event = homepage_ns.model("createEvent", {
    "title": fields.String(required=True),
    "location": fields.String(required=True),
    "date": fields.DateTime(required=True),
    "description": fields.String(required=True)
})

announcements_model = homepage_ns.model("CreateAnnouncement", {
    "title": fields.String(required=True),
    "description": fields.String(required=True),
})


# Create Announcement
@homepage_ns.route('/createAnnouncement')
class CreateAnnouncement(Resource):
    @jwt_required()
    @homepage_ns.expect(announcements_model)
    def post(self):
        data = request.get_json()
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)

        # Check if the user is a staff member
        if not user or not user.email.endswith("@auckland.ac.nz"):
            return {"msg": "Unauthorized. Only staff can make announcements"}, 403

        title = data.get("title")
        description = data.get("description")

        required_fields = [title, description]
        if not all(required_fields):
            return {"msg": "Missing required fields."}, 400

        new_announcement = Announcement(title=title, description=description)
        new_announcement.save()

        return {"msg": "Announcement created successfully.", "announcement_id": new_announcement.id}, 201


# Get all Announcements
@homepage_ns.route('/announcements')
class AllAnnouncements(Resource):
    @jwt_required()
    def get(self):
        one_month_ago = datetime.now() - timedelta(days=30)
        announcements = Announcement.select().where(Announcement.date >= one_month_ago)

        result = []
        for announcement in announcements:
            result.append({
                "id": announcement.id,
                "title": announcement.title,
                "description": announcement.description,
                "date": announcement.date,
            })
        return jsonify(result if result else {"message": "Empty"})


# Join Community
@homepage_ns.route('/join')
class JoinCommunity(Resource):
    @jwt_required()
    @homepage_ns.expect(join_model)
    def post(self):
        data = request.get_json()
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)
        community = Community.get_by_id(data['community_id'])

        if not community:
            return {"msg": "Community not found."}, 404

        # Prevent duplicate joins
        if UserCommunity.select().where(
                (UserCommunity.user == user) & (UserCommunity.community == community)
        ).exists():
            return {"msg": "Already a member"}, 400

        UserCommunity.create(user=user, community=community)

        community.members += 1
        community.save()

        return {"msg": "Community joined!"}, 200


# Get all Communities
@homepage_ns.route('/communities')
class AllCommunities(Resource):
    @jwt_required()
    def get(self):
        communities = Community.select()
        result = []
        for community in communities:
            result.append({
                "id": community.id,
                "name": community.name,
                "description": community.description,
                "members": community.members,
                "community_picture": community.community_picture.url if community.community_picture is not None else None
            })
        return jsonify(result)


# RSVP to Event
@homepage_ns.route('/rsvp')
class RSVPEvent(Resource):
    @jwt_required()
    @homepage_ns.expect(rsvp_model)
    def post(self):
        data = request.get_json()
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)
        event = Event.get_by_id(data['event_id'])

        if RSVP.select().where((RSVP.user == user) & (RSVP.event == event)).exists():
            return {"msg": "Already RSVPed"}, 400

        RSVP.create(user=user, event=event)

        return {"msg": "RSVP successful!"}

# Get all Events
@homepage_ns.route('/events')
class AllEvents(Resource):
    @jwt_required()
    def get(self):
        currentDay = datetime.now()
        events = Event.select().where(Event.date >= currentDay).order_by(Event.date)
        result = []
        for event in events:
            result.append(
                event.to_dict()
            )
        return jsonify(result)

# Create a Event
@homepage_ns.route('/createEvent')
class CreateEvent(Resource):
    @jwt_required()
    @homepage_ns.expect(create_event)
    def post(self):
        data = request.get_json()
        user_id = get_jwt_identity()
        user = User.get_by_id(user_id)

        title = data.get("title")
        location = data.get("location")
        date = data.get("date")
        description = data.get("description")

        required_fields = [title, location, date, description]
        if not all(required_fields):
            return {"msg": "Missing required fields."}, 400

        try:
            from datetime import datetime
            date = datetime.fromisoformat(date)
        except ValueError:
            return {"msg": "Invalid date format. Use ISO 8601 format."}, 400

        new_event = Event(title=title, location=location, date=date, description=description, coordinator=user)
        new_event.save()

        return {"msg": "Event created successfully.", "event_id": new_event.id}, 201


# Get events rsvped by user
@homepage_ns.route('/rsvped')
class rsvpedEvent(Resource):
    @jwt_required()
    def get(self):
        user_id = get_jwt_identity()
        user = User.get_or_none(User.id == user_id)
        if not user:
            return {"error": "User not found"}, 404

        events_q = (
            Event
            .select(Event)
            .join(RSVP)
            .where(
                (RSVP.user == user)
            )
        )
        result = []
        for e in events_q:
            result.append(
                e.to_dict()
            )
        return jsonify(result)
