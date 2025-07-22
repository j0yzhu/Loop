import typing

from Backend.model.database_model import BaseModel
from peewee import CharField, DateField, IntegerField, ForeignKeyField, DateTimeField, SQL, TextField, BooleanField
import datetime
from typing import List
from .image_model import Image

if typing.TYPE_CHECKING:
    from .community_model import Community

class User(BaseModel):
    id: int
    own_communities: List['Community']
    email: str = CharField(unique=True)
    hash_salted_password: str = CharField()
    username: str = CharField(null=True)
    firstname: str = CharField(null=True)
    lastname: str = CharField(null=True)
    year_level: str = CharField(null=True)
    degree: str = CharField(null=True)
    date_of_birth: datetime.datetime = DateField(null=True)
    gender: str = CharField(null=True)
    age: str = CharField(null=True)
    pronoun: str = CharField(null=True)
    profile_picture: Image = ForeignKeyField(Image, null=True)
    interests: List['UserInterest']
    neurotypes: List['UserNeurotype']
    photos: List['UserPhoto']
    bio = TextField(null=True, default=None)

    def to_dict(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "firstname": self.firstname,
            'full_name': f"{self.firstname} {self.lastname}",
            "lastname": self.lastname,
            "year_level": self.year_level,
            "degree": self.degree,
            "date_of_birth": self.date_of_birth.isoformat() if self.date_of_birth else None,
            "gender": self.gender,
            "profile_picture": self.profile_picture.url if self.profile_picture else None,
            "profile_picture_url": self.profile_picture.url if self.profile_picture else None,
            "neurotypes": [unt.neurotype.name for unt in self.neurotypes],
            "interests": [ui.interest.name for ui in self.interests],
            # Keep both pronoun & pronoun coz we are using these interchangeably...
            "pronoun": self.pronoun,
            "pronouns": self.pronoun,
            "bio": self.bio,
            "photos": [photo.photo_url for photo in self.photos if photo.photo_url],
        }

    def is_friend_with(self, other_user):
        from Backend.model.user_model import Friend  # to avoid circular import issues
        return Friend.select().where(
            (
                ((Friend.user == self) & (Friend.connected_user == other_user)) |
                ((Friend.user == other_user) & (Friend.connected_user == self))
            ) &
            (Friend.status == 'accepted')
        ).exists()


class Interest(BaseModel):
    # name of interest i.e coding
    name = CharField(unique=True)

class UserInterest(BaseModel):
    user: User = ForeignKeyField(User, backref='interests')
    interest: Interest = ForeignKeyField(Interest, backref='users')


class Neurotype(BaseModel):
    # name of neurotype i.e ADHD
    name = CharField(unique=True)

class UserNeurotype(BaseModel):
    user: User = ForeignKeyField(User, backref='neurotypes')
    neurotype: Neurotype = ForeignKeyField(Neurotype, backref='users')


class Friend(BaseModel):
    user = ForeignKeyField(User, backref='connections')
    connected_user = ForeignKeyField(User, backref='connections_to')
    status = CharField(choices=[('pending', 'Pending'), ('accepted',
                       'Accepted'), ('rejected', 'Rejected')], default='pending')
    created_at = DateTimeField(default=datetime.datetime.now)
    updated_at = DateTimeField(default=datetime.datetime.now)

    class Meta:
        indexes = ((('user', 'connected_user'), True),)

class UserPhoto(BaseModel):
    user = ForeignKeyField(User, backref='photos')
    photo_url = CharField(null=True)  
    is_profile_picture = BooleanField(default=False) 
    created_at = DateTimeField(default=datetime.datetime.now)
    
    class Meta:
        table_name = 'user_photos'