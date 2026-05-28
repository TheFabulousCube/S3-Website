import json
import boto3
import os
from datetime import datetime

ses_client = boto3.client('ses', region_name='us-east-1')  
RECEIVER_EMAIL = os.environ.get('RECEIVER_EMAIL', 'your-email@example.com')  

def lambda_handler(event, context):

    allowed_origins = [
        'https://thefabulouscube.com',
        'https://s3-hosted.thefabulouscube.com',
    ]

    request_origin = event.get('headers', {}).get('origin', '')


    print (f'Request Origin: {request_origin}')
    if request_origin not in allowed_origins:
        return {
            'statusCode': 403,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': False,
                'message': 'Origin not allowed.',
            })
        }

    cors_headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': request_origin,
        'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
    }        
    
    if event.get("httpMethod") == "OPTIONS":
        return {
            'statusCode': 204,
            'headers': cors_headers,
            'body': ""
        }

    try:
        raw_body = event.get('body', {})

        if isinstance(raw_body, str):
            body = json.loads(raw_body or '{}')
        elif isinstance(raw_body, dict):
            body = raw_body
        else:
            body = {}

        name = body.get('name', '').strip()
        email = body.get('email', '').strip()
        message = body.get('message', '').strip()

        if not name or not email or not message:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Missing required fields: name, email, or message.',
                })
            }

        if '@' not in email:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': False,
                    'message': 'Invalid email format.',
                })
            }

        print(f'Received contact form submission {body}')
        send_email_to_owner(name, email, message, body)

        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'success': True,
                'message': 'Your message has been sent successfully!',
            })
        }
        
    
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'success': False,
                'message': 'An error occurred while processing your request. Please try again later.',
            })
        }


def send_email_to_owner(name, email, message, data):
    email_body = f"""
New contact form submission received!

Name: {name}
Email: {email}
Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

Message:
{message}

---
Reply directly to: {email}
Raw data: {data}
"""
    
    try:
        ses_client.send_email(
            Source=RECEIVER_EMAIL,
            ReplyToAddresses=[email],
            Destination={
                'ToAddresses': [RECEIVER_EMAIL],
            },
            Message={
                'Subject': {
                    'Data': f'New Contact Form Submission from {name}',
                    'Charset': 'UTF-8',
                },
                'Body': {
                    'Text': {
                        'Data': email_body,
                        'Charset': 'UTF-8',
                    }
                }
            }
        )
        print(f'Email sent successfully to {RECEIVER_EMAIL}')
    except Exception as e:
        print(f'Error sending email to owner: {str(e)}')
        raise
