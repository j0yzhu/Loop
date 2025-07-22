from fileinput import filename

from peewee import *
from .database_model import BaseModel

class Image(BaseModel):
    filename: str = CharField()

    @property
    def url(self):
        return f'https://loop-bucket.s3.ap-southeast-2.amazonaws.com/{self.filename}'