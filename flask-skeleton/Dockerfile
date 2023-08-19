FROM nikolaik/python-nodejs:latest
ENV APP_DIR /app/
WORKDIR ${APP_DIR}
COPY . ./
RUN pip install -r requirements.txt
WORKDIR ${APP_DIR}/frontend
RUN npm install
RUN npm run build
WORKDIR ${APP_DIR}/backend
EXPOSE 5000
EXPOSE 8000
CMD ["python", "main.py"]