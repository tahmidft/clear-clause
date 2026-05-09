from services import parser


def test_extract_text_rejects_unsupported_extension() -> None:
    try:
        parser.extract_text(b"test", "notes.txt")
        assert False, "expected ValueError"
    except ValueError as exc:
        assert "Unsupported file format" in str(exc)

