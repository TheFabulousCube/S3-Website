import json
import os
from email.utils import parseaddr

import boto3


ses = boto3.client("ses")


def handler(event, context):
    origin = (event.get("headers") or {}).get("origin") or (
        event.get("headers") or {}
    ).get("Origin")
    headers = cors_headers(origin)

    if event.get("httpMethod") == "OPTIONS":
        return response(204, "", headers)

    try:
        payload = json.loads(event.get("body") or "{}")
    except json.JSONDecodeError:
        return response(400, {"message": "Invalid request body."}, headers)

    name = clean(payload.get("name"), 120)
    email = clean(payload.get("email"), 254)
    message = clean(payload.get("message"), 4000)

    if not name or not email or not message:
        return response(400, {"message": "Name, email, and message are required."}, headers)

    if "@" not in parseaddr(email)[1]:
        return response(400, {"message": "Please provide a valid email address."}, headers)

    to_email = os.environ["CONTACT_TO_EMAIL"]
    from_email = os.environ["CONTACT_FROM_EMAIL"]
    subject_prefix = os.environ.get("CONTACT_EMAIL_SUBJECT_PREFIX", "Website contact")

    body = "\n".join(
        [
            f"Name: {name}",
            f"Email: {email}",
            f"Device: {clean(payload.get('device'), 80)}",
            f"Screen: {clean(payload.get('screenResolution'), 80)}",
            f"Timezone: {clean(payload.get('timezone'), 120)}",
            f"Environment: {clean(payload.get('environment'), 80)}",
            "",
            message,
        ]
    )

    ses.send_email(
        Source=from_email,
        Destination={"ToAddresses": [to_email]},
        Message={
            "Subject": {"Data": f"{subject_prefix}: {name}"},
            "Body": {"Text": {"Data": body}},
        },
        ReplyToAddresses=[email],
    )

    return response(200, {"message": "Message sent."}, headers)


def clean(value, max_length):
    if value is None:
        return ""
    return str(value).strip()[:max_length]


def cors_headers(origin):
    allowed = [
        item.strip()
        for item in os.environ.get("ALLOWED_ORIGINS", "").split(",")
        if item.strip()
    ]
    allow_origin = origin if origin in allowed else (allowed[0] if allowed else "*")
    return {
        "Access-Control-Allow-Origin": allow_origin,
        "Access-Control-Allow-Headers": "Content-Type,X-Api-Key",
        "Access-Control-Allow-Methods": "OPTIONS,POST",
        "Vary": "Origin",
    }


def response(status_code, body, headers):
    return {
        "statusCode": status_code,
        "headers": headers,
        "body": "" if body == "" else json.dumps(body),
    }
