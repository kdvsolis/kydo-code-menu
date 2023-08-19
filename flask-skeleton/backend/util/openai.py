import openai
from dotenv import load_dotenv
from app.config import OPENAI_API_KEY

def text_generator(text, split=False):
    openai.api_key = OPENAI_API_KEY
    completion = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": text},
    ])
    completion = completion.choices[0]['message']['content']
    if(split):
        return (completion + "\n-----------------------------").split('\n')
    else:
        return completion

def embed_response(input):
    openai.api_key = OPENAI_API_KEY
    res = openai.Embedding.create(
        input=input,
        engine="text-embedding-ada-002"
    )
