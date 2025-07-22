from peewee import CharField, TextField, ForeignKeyField, DateTimeField, IntegerField, UUIDField, CompositeKey
from .database_model import BaseModel
from .user_model import User, UserPhoto
from .homepage_model import Community
from .image_model import Image
from datetime import datetime
import uuid

class Post(BaseModel):
    id = UUIDField(primary_key=True, default=uuid.uuid4)
    author = ForeignKeyField(User, backref='posts')
    content = TextField()
    community = ForeignKeyField(Community, backref='posts', null=False)
    topic = CharField(null=True)
    created_at = DateTimeField(default=datetime.now)
    likes = IntegerField(default=0)

    def to_dict(self, current_user_id=None):
        liked_by_user = False
        if current_user_id:
            liked_by_user = Like.get_or_none((Like.post == self.id) & (Like.user == current_user_id)) is not None
        # 1) If the user has a profile_picture FK, get the .url string
        if isinstance(self.author.profile_picture, Image):
            photo_url = self.author.profile_picture.url
        else:
            photo_url = self.author.profile_picture or ""

        # 2) Fallback to any UserPhoto marked as profile-picture
        if not photo_url:
            uph = UserPhoto.get_or_none(
                (UserPhoto.user == self.author) &
                (UserPhoto.is_profile_picture == True)
            )
            photo_url = uph.photo_url if uph else ""

        return {
            "id": str(self.id),
            "content": self.content,
            "topic": self.topic,
            "community": {
            "id":   str(self.community.id),
            "name": self.community.name
            },
            "created_at": self.created_at.isoformat(),
            "likes": self.likes,
            "author": {
                "name": f"{self.author.firstname or ''} {self.author.lastname or ''}".strip() or self.author.email,
                "photo_url": photo_url
            },
            "comments": [comment.to_dict() for comment in self.comments.order_by(Comment.created_at.asc())],
            "liked_by_user": liked_by_user
    }

class Comment(BaseModel):
    user = ForeignKeyField(User, backref='comments')
    post = ForeignKeyField(Post, backref='comments')
    content = TextField()
    created_at = DateTimeField(default=datetime.now)

    def to_dict(self):
        return {
            "user": self.user.username,
            "post_id": str(self.post.id),
            "content": self.content,
            "created_at": self.created_at.isoformat()
        }

class Like(BaseModel):
    user = ForeignKeyField(User, backref='likes')
    post = ForeignKeyField(Post, backref='likes')
    created_at = DateTimeField(default=datetime.now)

    class Meta:
        table_name = 'like'
        primary_key = CompositeKey('post', 'user')
