from app import app
from flask import request, jsonify
from services.text_generator_service import (
    generate_text,
    scrape_search,
    generate_raw_response,
    scrape_urls,
    scrape_property,
    upload_image,
    upload_file_image
)

@app.route('/api/generate-text', methods = ['POST'])
def generateTextController():
    return jsonify(generate_text(request))

@app.route('/api/scrape-search', methods = ['POST'])
def scrapeSearch():
    return jsonify(scrape_search(request))

@app.route('/api/generate-raw-response', methods = ['POST'])
def generateRawResponseController():
    return jsonify(generate_raw_response(request))

@app.route('/api/scrape-url', methods = ['POST'])
def scrapeUrl():
    return jsonify(scrape_urls(request))

@app.route('/api/onpage-audit', methods = ['POST'])
def scrapeAndFindProperty():
    return jsonify(scrape_property(request))

@app.route('/api/upload-cloudinary', methods = ['POST'])
def uploadCloudinary():
    return jsonify(upload_image(request))

@app.route('/api/upload-file-cloudinary', methods = ['POST'])
def uploadFileCloudinary():
    return jsonify(upload_file_image(request))