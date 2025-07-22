import os

from peewee import *
from dotenv import load_dotenv

if not os.environ.get('DATABASE_NAME'):
    # Because the .env is getting copied into the docker we should only load the .env if the environment variable is not set
    load_dotenv()

DATABASE_NAME = os.environ['DATABASE_NAME']
DATABASE_USER = os.environ['DATABASE_USER']
DATABASE_PASSWORD = os.environ['DATABASE_PASSWORD']
DATABASE_HOST = os.environ['DATABASE_HOST']
DATABASE_PORT = os.environ['DATABASE_PORT']


db = PostgresqlDatabase(DATABASE_NAME, user=DATABASE_USER, password=DATABASE_PASSWORD, host=DATABASE_HOST, port=DATABASE_PORT)

class BaseModel(Model):
    class Meta:
        database = db