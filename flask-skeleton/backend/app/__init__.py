import os
from flask import Flask, render_template

app = Flask(__name__, static_folder="../../frontend/build/static", template_folder="../../frontend/build")

@app.route('/', defaults={'path': ""})
@app.route('/<path:path>')
def index_page(path):
    return render_template("index.html")

#Import controllers here
from controller.auth_controller import *
from controller.text_generator_controller import *