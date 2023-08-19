import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
WP_USERNAME = os.getenv("WP_USERNAME")
WP_PASSWORD = os.getenv("WP_PASSWORD")
WP_URL = os.getenv("WP_URL")
SERP_API_KEY = os.getenv("SERP_API_KEY")
SERP_URL = os.getenv("SERP_URL")
RAPID_API_KEY = os.getenv("RAPID_API_KEY")
CLOUDINARY_NAME = os.getenv("CLOUDINARY_NAME")
CLOUDINARY_KEY = os.getenv("CLOUDINARY_KEY")
CLOUDINARY_SECRET = os.getenv("CLOUDINARY_SECRET")
CLOUDINARY_URL = os.getenv("CLOUDINARY_URL")
GEN_SERP_API_KEY = os.getenv("GEN_SERP_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_ENV = os.getenv("PINECONE_ENV")
PINECONE_MAIN_INDEX = os.getenv("PINECONE_MAIN_INDEX")