from peewee import *

from .community_model import Community
from .database_model import BaseModel
from .user_model import User  
import datetime

##You can query user.joined_communities to get the communities they joined.
##You can query community.members to get all users who joined.

class Announcement(BaseModel):
    title: str = CharField()
    description = TextField()
    date: datetime.datetime = DateTimeField(default=datetime.datetime.utcnow())

class Event(BaseModel):
    title: str = CharField()
    location: str = CharField()
    date: datetime.datetime = DateTimeField()
    description: str = TextField()
    coordinator = ForeignKeyField(User, backref="events", null=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "location": self.location,
            "date": self.date.isoformat(),
            "description": self.description,
            "coordinator": {
                "id": self.coordinator.id,
                "name": f"{self.coordinator.firstname or ''} {self.coordinator.lastname or ''}".strip() or self.coordinator.email
            } if self.coordinator else None
        }

class UserCommunity(BaseModel):
    user = ForeignKeyField(User, backref="joined_communities")
    community = ForeignKeyField(Community, backref="memberships")
    created_at = DateTimeField(default=datetime.datetime.utcnow)

class RSVP(BaseModel):
    user = ForeignKeyField(User, backref="event_rsvps")
    event = ForeignKeyField(Event, backref="rsvps")
