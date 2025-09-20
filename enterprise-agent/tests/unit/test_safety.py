from src.utils.safety import scrub_pii


def test_scrub_pii():
    assert scrub_pii("Email: test@example.com") == "Email: [REDACTED]"


def test_scrub_pii_multiple():
    text = "Contact: john@example.com and jane@test.org for details"
    expected = "Contact: [REDACTED] and [REDACTED] for details"
    assert scrub_pii(text) == expected


def test_scrub_pii_no_emails():
    text = "This text has no email addresses"
    assert scrub_pii(text) == text
