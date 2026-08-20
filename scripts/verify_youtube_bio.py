#!/usr/bin/env python3
"""
YouTube Bio Verification Script using YouTube Data API v3
Fetches YouTube channel description (bio) and checks if verification code is present.
"""

import json
import sys
import argparse
import os
from typing import Optional
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


def fetch_youtube_bio(channel_identifier: str, verification_code: Optional[str] = None, api_key: Optional[str] = None) -> dict:
    """
    Fetch YouTube channel description (bio) for a given channel and optionally verify a code.
    
    Args:
        channel_identifier: YouTube channel ID, username, or custom URL
        verification_code: Optional verification code to check in bio
        api_key: Optional YouTube Data API v3 key (if not provided, uses environment variable)
        
    Returns:
        Dictionary with success status, bio, and verification result
    """
    # Remove @ if present and clean up
    clean_identifier = channel_identifier.replace('@', '').strip()
    
    if not clean_identifier:
        return {
            'success': False,
            'error': 'Channel identifier is required',
            'error_code': 'invalid_identifier'
        }
    
    # Get API key from parameter or environment
    youtube_api_key = api_key or os.environ.get('YOUTUBE_API_KEY')
    
    if not youtube_api_key:
        return {
            'success': False,
            'error': 'YouTube API key not configured. Set YOUTUBE_API_KEY environment variable.',
            'error_code': 'api_key_missing'
        }
    
    try:
        # Build YouTube API service
        youtube = build('youtube', 'v3', developerKey=youtube_api_key)
        
        # Determine if identifier is a channel ID or username/custom URL
        channel_id = None
        channel_handle = None
        
        # Check if it's a channel ID (starts with UC)
        if clean_identifier.startswith('UC') and len(clean_identifier) == 24:
            channel_id = clean_identifier
        # Check if it's a custom URL (starts with c/ or user/)
        elif '/' in clean_identifier:
            # Extract from URL like youtube.com/c/ChannelName or youtube.com/user/username
            parts = clean_identifier.split('/')
            for i, part in enumerate(parts):
                if part in ['c', 'user', 'channel'] and i + 1 < len(parts):
                    clean_identifier = parts[i + 1]
                    break
            channel_handle = clean_identifier
        else:
            # Assume it's a username or custom URL handle
            channel_handle = clean_identifier
        
        # Try to get channel by ID first
        if channel_id:
            request = youtube.channels().list(
                part='snippet,statistics,contentDetails',
                id=channel_id
            )
        else:
            # Try to get channel by username/handle
            # First, try searching for the channel
            search_request = youtube.search().list(
                part='snippet',
                q=channel_handle,
                type='channel',
                maxResults=1
            )
            search_response = search_request.execute()
            
            if not search_response.get('items'):
                return {
                    'success': False,
                    'error': f'Channel "{channel_handle}" not found',
                    'error_code': 'channel_not_found'
                }
            
            channel_id = search_response['items'][0]['id']['channelId']
            
            # Now get full channel details
            request = youtube.channels().list(
                part='snippet,statistics,contentDetails',
                id=channel_id
            )
        
        # Execute the request
        response = request.execute()
        
        if not response.get('items'):
            return {
                'success': False,
                'error': 'Channel not found',
                'error_code': 'channel_not_found'
            }
        
        channel = response['items'][0]
        snippet = channel.get('snippet', {})
        statistics = channel.get('statistics', {})
        
        # Get channel description (bio)
        bio = snippet.get('description', '') or snippet.get('customUrl', '')
        
        # Get additional channel info
        channel_title = snippet.get('title', '')
        channel_id_final = channel.get('id', '')
        custom_url = snippet.get('customUrl', '')
        published_at = snippet.get('publishedAt', '')
        country = snippet.get('country', '')
        default_language = snippet.get('defaultLanguage', '')
        
        # Get statistics
        subscriber_count = int(statistics.get('subscriberCount', 0) or 0)
        video_count = int(statistics.get('videoCount', 0) or 0)
        view_count = int(statistics.get('viewCount', 0) or 0)
        
        # Check verification code if provided
        verified = False
        if verification_code:
            verified = verification_code in bio
        
        result = {
            'success': True,
            'channel_id': channel_id_final,
            'channel_title': channel_title,
            'custom_url': custom_url or None,
            'bio': bio,
            'subscriber_count': subscriber_count,
            'video_count': video_count,
            'view_count': view_count,
            'country': country or None,
            'published_at': published_at,
        }
        
        if verification_code is not None:
            result['verified'] = verified
            result['verification_code'] = verification_code
            result['message'] = (
                'Verification successful! Code found in channel description.' if verified
                else 'Verification code not found in channel description. Please add it and try again.'
            )
        
        return result
        
    except HttpError as e:
        error_details = json.loads(e.content.decode('utf-8'))
        error_reason = error_details.get('error', {}).get('errors', [{}])[0].get('reason', 'unknown')
        
        if e.resp.status == 403:
            if error_reason == 'quotaExceeded':
                return {
                    'success': False,
                    'error': 'YouTube API quota exceeded. Please try again later.',
                    'error_code': 'quota_exceeded'
                }
            elif error_reason == 'keyInvalid':
                return {
                    'success': False,
                    'error': 'Invalid YouTube API key.',
                    'error_code': 'invalid_api_key'
                }
            else:
                return {
                    'success': False,
                    'error': f'API access denied: {error_reason}',
                    'error_code': 'access_denied'
                }
        elif e.resp.status == 404:
            return {
                'success': False,
                'error': 'Channel not found',
                'error_code': 'channel_not_found'
            }
        else:
            return {
                'success': False,
                'error': f'YouTube API error: {str(e)}',
                'error_code': 'api_error',
                'status_code': e.resp.status
            }
    except Exception as e:
        return {
            'success': False,
            'error': f'Unexpected error: {str(e)}',
            'error_code': 'unknown_error'
        }


def main():
    """Main entry point for the script."""
    parser = argparse.ArgumentParser(
        description='Fetch YouTube channel description and verify code using YouTube Data API v3'
    )
    parser.add_argument(
        'channel_identifier',
        type=str,
        help='YouTube channel ID, username, custom URL, or channel handle (with or without @)'
    )
    parser.add_argument(
        '--verification-code',
        type=str,
        default=None,
        help='Verification code to check in channel description'
    )
    parser.add_argument(
        '--api-key',
        type=str,
        default=None,
        help='YouTube Data API v3 key (or set YOUTUBE_API_KEY environment variable)'
    )
    parser.add_argument(
        '--json-input',
        action='store_true',
        help='Read input as JSON from stdin (for API-like usage)'
    )
    
    args = parser.parse_args()
    
    # If JSON input mode, read from stdin
    if args.json_input:
        try:
            input_data = json.load(sys.stdin)
            channel_identifier = input_data.get('channel_identifier') or input_data.get('username') or input_data.get('channel_id')
            verification_code = input_data.get('verification_code')
            api_key = input_data.get('api_key')
        except json.JSONDecodeError:
            result = {
                'success': False,
                'error': 'Invalid JSON input',
                'error_code': 'invalid_json'
            }
            print(json.dumps(result))
            sys.exit(1)
    else:
        channel_identifier = args.channel_identifier
        verification_code = args.verification_code
        api_key = args.api_key
    
    # Fetch bio and verify
    result = fetch_youtube_bio(channel_identifier, verification_code, api_key)
    
    # Output as JSON
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if result.get('success', False) else 1)


if __name__ == '__main__':
    main()














