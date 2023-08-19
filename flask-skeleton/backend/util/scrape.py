import httplib2
import requests
from bs4 import BeautifulSoup, SoupStrainer

def scrape_website(url, tag):
    http = httplib2.Http()
    status, response = http.request(url)
    return BeautifulSoup(response, features="html.parser", parse_only=SoupStrainer(tag))

def scrape_and_find_property(url, tag, property_content):
    http = httplib2.Http()
    status, response = http.request(url)
    soup = BeautifulSoup(response, features="html.parser")
    for element in soup.find_all(tag):
        if element.get("property", None) == property_content:
            return element.get("content", None)
    return ""

def scrape_and_find_text(url, text):
    http = httplib2.Http()
    status, response = http.request(url)
    soup = BeautifulSoup(response, features="html.parser")
    return soup(text=lambda t: text in t.text.lower())

def get_sizes(uri):
    # get file size *and* image size (None if not known)
    try:
        return int(requests.get(uri, stream = True).headers['Content-length'])
    except Exception as e:
        return 0

def num_apperances_of_tag(url, tag_name):
    http = httplib2.Http()
    status, response = http.request(url)
    soup = BeautifulSoup(response, features="html.parser")
    return len(soup.find_all(tag_name))