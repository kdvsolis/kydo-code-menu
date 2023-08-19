from rest_framework.exceptions import APIException


class InvalidFieldValue(APIException):
    status_code = 400
    default_detail = "Field value(s) invalid."
    default_code = "invalid_field_value"


class ObjectDoesNotExist(Exception):
    def __init__(self, *args: object) -> None:
        super().__init__(*args)
