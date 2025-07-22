from peewee import CharField, DateTimeField, TextField, ForeignKeyField, BooleanField, AutoField, Model
from datetime import datetime
from Backend.model.database_model import BaseModel, db
from Backend.model.user_model import User
from Backend.model.community_model import Community

class CommunityMessage(BaseModel):
    id = AutoField()
    text = CharField()
    date: datetime = DateTimeField(default=datetime.utcnow)
    sender = ForeignKeyField(User, backref='sent_community_messages')
    community = ForeignKeyField(Community, backref='messages')
    delivered = BooleanField(default=False)

    class Meta :
        table_name = 'community_messages'

    def to_dict(self):
        return {
            'id': self.id,
            'text': self.text,
            'date': self.date.isoformat(),
            'sender': self.sender.email,
            'community': self.community.id,
            'delivered': self.delivered
        }

class CommunityMessageRead(BaseModel):
    id = AutoField()
    message = ForeignKeyField(CommunityMessage, backref="reads")
    user = ForeignKeyField(User, backref="read_community_messages")
    read_at = DateTimeField(default=datetime.utcnow)

    class Meta:
        table_name = 'community_message_read'


class Message(BaseModel):
    text = CharField()
    date = DateTimeField(default=datetime.utcnow)
    sender = ForeignKeyField(User, backref='sent_messages')
    recipient = ForeignKeyField(User, backref='received_messages')
    delivered = BooleanField(default=False)


class MessageRead(BaseModel):
    message = ForeignKeyField(Message, backref="reads")
    user = ForeignKeyField(User, backref="read_messages")
    read_at = DateTimeField(default=datetime.utcnow)

    class Meta:
        database = db
        indexes = ((("message", "user"), True),)  # Prevent duplicates

class GroupChat(BaseModel):
    name = CharField()
    creator = ForeignKeyField(User, backref='created_groups')
    created_at = DateTimeField(default=datetime.utcnow)

class GroupChatMember(BaseModel):
    group = ForeignKeyField(GroupChat, backref='members')
    user = ForeignKeyField(User, backref='group_memberships')

class GroupMessage(BaseModel):
    text = CharField()
    sender = ForeignKeyField(User, backref='sent_group_messages')
    group = ForeignKeyField(GroupChat, backref='messages')
    date = DateTimeField(default=datetime.utcnow)

