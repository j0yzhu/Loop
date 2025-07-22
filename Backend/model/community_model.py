from peewee import *
from peewee import CharField, TextField, ForeignKeyField, IntegerField
from typing import List
from .user_model import User

from .database_model import BaseModel
from Backend.model.image_model import Image

TOPICS = {
    "Core Support": [
        "Mental Health & Wellness",
        "Academic Support",
        "Social Skills & Communication",
        "Self-Advocacy",
        "Accessibility Resources"
    ],
    "Identity & Experience": [
        "Autism Spectrum",
        "ADHD",
        "Dyslexia & Learning Differences",
        "Sensory Processing",
        "Co-occurring Conditions",
        "Late Diagnosis & Self-Discovery"
    ],
    "Interests & Hobbies": [
        "Gaming & Game Design",
        "Creative Writing",
        "Art & Design",
        "Music & Sound",
        "STEM Topics",
        "Books & Literature",
        "Fandoms & Pop Culture",
        "Sports & Fitness",
        "Movies & TV Shows",
        "Cooking & Baking",
        "Travel & Adventure",
        "Photography & Videography",
        "Crafting & DIY Projects",
        "Gardening & Nature",
        "Fashion & Style",
        "Technology & Gadgets",
        "History & Culture",
        "Food & Drink",
    ],
    "Life Skills & Personal Growth": [
        "Career Prep & Internships",
        "Time Management",
        "Study Skills",
        "Daily Routines",
        "Life Transitions",
        "Mindfulness",
        "Goal Setting",
        "Stress Management",
        "Healthy Relationships",
        "Self-Care & Self-Compassion",
        "Financial Literacy",
    ],
    "Community & Belonging": [
        "Peer Mentorship",
        "Local Meetups",
        "LGBTQIA+",
        "Cultural Identity",
        "Neurodivergent Advocacy & Leadership",
        "Support Spaces",
    ],
    "General Use": [
        "General Discussion",
        "Events & Announcements",
        "Questions & Advice",
        "Off-Topic / Casual Chat",
    ]
}

# Automatically create all the records in the database for the categories


class Category(BaseModel):
    id: int
    topic: str = CharField(null=False)
    subtopic: str = CharField(null=False)
    communities: List['CommunityCategory']

    def to_dict(self):
        return {
            "id": self.id,
            "topic": self.topic,
            "subtopic": self.subtopic,
        }

class Community(BaseModel):
    id: int
    name: str = CharField()
    description: str = TextField()
    owner: User = ForeignKeyField(User, backref='own_communities', null=False)
    community_picture: Image = ForeignKeyField(Image, null=True)
    members: int = IntegerField(default=0)
    categories: List['CommunityCategory']

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "members": self.members,
            "community_picture": self.community_picture.url if self.community_picture is not None else None,
            "owner": {
                "email": self.owner.email,
                "username": self.owner.username
            },
            "categories": [category.category.to_dict() for category in self.categories]
        }

class CommunityCategory(BaseModel):
    community: Community = ForeignKeyField(Community, backref='categories')
    category: Category = ForeignKeyField(Category, backref='communities')
