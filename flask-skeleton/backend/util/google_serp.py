import requests
from dotenv import load_dotenv
from app.config import SERP_API_KEY, SERP_URL

def search_with_serp(q, location="", domain="", gl="us", hl="en", resultFormat="json", pageSize="100", pageNumber="1"):
    request_params = f"{SERP_URL}?apiKey={SERP_API_KEY}&q={q}&location={location}&gl={gl}&hl={hl}&resultFormat={resultFormat}&pageSize={pageSize}&pageNumber={pageNumber}"
    search_result = requests.get(request_params).json()
    return search_result