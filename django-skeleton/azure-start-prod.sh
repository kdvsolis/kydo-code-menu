python manage.py migrate && \
python manage.py collectstatic --no-input && \
python manage.py createsuperuser --noinput || \
gunicorn --bind=0.0.0.0 api_service.wsgi