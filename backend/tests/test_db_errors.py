from sqlalchemy.exc import ProgrammingError

from db_errors import http_exception_from_sqlalchemy


def test_programming_error_missing_column_detail():
    exc = ProgrammingError(
        "SELECT",
        {},
        Exception('column preferences.max_revision_rounds does not exist'),
    )
    http_exc = http_exception_from_sqlalchemy(exc, context="loading preferences")
    assert http_exc.status_code == 503
    assert "20260524_scam_and_preferences.sql" in http_exc.detail
