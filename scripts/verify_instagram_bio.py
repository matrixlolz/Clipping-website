#!/usr/bin/env python3
"""
Instagram Bio Verification Script using Instaloader
Fetches Instagram profile bio and checks if verification code is present.
"""

import json
import sys
import argparse
from typing import Optional
import instaloader


def fetch_instagram_bio(username: str, verification_code: Optional[str] = None) -> dict:
    """
    Fetch Instagram bio for a given username and optionally verify a code.
    
    Args:
        username: Instagram username (without @)
        verification_code: Optional verification code to check in bio
        
    Returns:
        Dictionary with success status, bio, and verification result
    """
    # Remove @ if present
    clean_username = username.replace('@', '').strip()
    
    if not clean_username:
        return {
            'success': False,
            'error': 'Username is required',
            'error_code': 'invalid_username'
        }
    
    try:
        # Create Instaloader instance
        # Note: For public profiles, login is not required
        # If you need to access private profiles, you'll need to login
        loader = instaloader.Instaloader(
            download_videos=False,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=False,
            compress_json=False,
            post_metadata_txt_pattern='',
            max_connection_attempts=3
        )
        
        # Try to load profile (works for public profiles without login)
        try:
            profile = instaloader.Profile.from_username(loader.context, clean_username)
        except instaloader.exceptions.ProfileNotExistsException:
            return {
                'success': False,
                'error': f'Profile @{clean_username} does not exist',
                'error_code': 'profile_not_found'
            }
        except instaloader.exceptions.PrivateProfileNotFollowedException:
            return {
                'success': False,
                'error': f'Profile @{clean_username} is private and not accessible',
                'error_code': 'private_profile'
            }
        except instaloader.exceptions.LoginRequiredException:
            return {
                'success': False,
                'error': 'Login required to access this profile. Please configure Instagram credentials.',
                'error_code': 'login_required'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Failed to fetch profile: {str(e)}',
                'error_code': 'fetch_error'
            }
        
        # Get bio
        bio = profile.biography or ''
        
        # Check verification code if provided
        verified = False
        if verification_code:
            verified = verification_code in bio
        
        result = {
            'success': True,
            'username': clean_username,
            'bio': bio,
            'full_name': profile.full_name or '',
            'is_verified': profile.is_verified,
            'followers': profile.followers,
            'followees': profile.followees,
        }
        
        if verification_code is not None:
            result['verified'] = verified
            result['verification_code'] = verification_code
            result['message'] = (
                'Verification successful! Code found in bio.' if verified
                else 'Verification code not found in bio. Please add it and try again.'
            )
        
        return result
        
    except instaloader.exceptions.ConnectionException as e:
        return {
            'success': False,
            'error': f'Connection error: {str(e)}',
            'error_code': 'connection_error'
        }
    except instaloader.exceptions.BadResponseException as e:
        return {
            'success': False,
            'error': f'Instagram API error: {str(e)}',
            'error_code': 'api_error'
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
        description='Fetch Instagram bio and verify code using Instaloader'
    )
    parser.add_argument(
        'username',
        type=str,
        help='Instagram username (with or without @)'
    )
    parser.add_argument(
        '--verification-code',
        type=str,
        default=None,
        help='Verification code to check in bio'
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
            username = input_data.get('username', '')
            verification_code = input_data.get('verification_code')
        except json.JSONDecodeError:
            result = {
                'success': False,
                'error': 'Invalid JSON input',
                'error_code': 'invalid_json'
            }
            print(json.dumps(result))
            sys.exit(1)
    else:
        username = args.username
        verification_code = args.verification_code
    
    # Fetch bio and verify
    result = fetch_instagram_bio(username, verification_code)
    
    # Output as JSON
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if result.get('success', False) else 1)


if __name__ == '__main__':
    main()














