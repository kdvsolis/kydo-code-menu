# set shared environment variables
FROM python:3.10-bullseye as python-base

ENV APP_DIR /app/
WORKDIR ${APP_DIR}

COPY . ./
RUN pip install -r requirements.txt
EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]