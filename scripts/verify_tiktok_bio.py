#!/usr/bin/env python3
"""
TikTok Bio Verification Script using Apify API
Fetches TikTok profile bio (signature) and checks if verification code is present.
Uses Apify's TikTok scraper actor to get profile data.
"""

import json
import sys
import argparse
import os
from typing import Optional

try:
    from apify_client import ApifyClient
    APIFY_CLIENT_AVAILABLE = True
except ImportError:
    APIFY_CLIENT_AVAILABLE = False
    import requests


def fetch_tiktok_bio(username: str, verification_code: Optional[str] = None, api_key: Optional[str] = None) -> dict:
    """
    Fetch TikTok bio for a given username and optionally verify a code using Apify API.
    
    Args:
        username: TikTok username (without @)
        verification_code: Optional verification code to check in bio
        api_key: Optional Apify API token (if not provided, uses environment variable)
        
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
    
    # Get API token from parameter or environment
    apify_token = api_key or os.environ.get('APIFY_TOKEN') or os.environ.get('TIKTOK_API_KEY')
    
    if not apify_token:
        return {
            'success': False,
            'error': 'Apify API token not configured. Set APIFY_TOKEN environment variable.',
            'error_code': 'api_key_missing'
        }
    
    try:
        # Use Apify TikTok Scraper Actor
        # Actor ID format: username/actor-name (e.g., "scraptik/tiktok-api")
        # Or use actor ID directly if provided
        actor_id = os.environ.get('APIFY_TIKTOK_ACTOR_ID', 'scraptik/tiktok-api')
        
        # Prepare input according to scraptik/tiktok-api docs: https://apify.com/scraptik/tiktok-api
        # Python API docs: https://apify.com/scraptik/tiktok-api/api/python
        run_input = {
            'profile_username': clean_username,
        }
        
        user_profile = None
        
        if APIFY_CLIENT_AVAILABLE:
            # Use official Apify Python client (recommended)
            # Docs: https://apify.com/scraptik/tiktok-api/api/python
            try:
                client = ApifyClient(apify_token)
                
                # Run the actor and wait for it to finish
                run = client.actor(actor_id).call(run_input=run_input)
                
                # Fetch results from the dataset
                dataset_id = run.get('defaultDatasetId')
                if dataset_id:
                    for item in client.dataset(dataset_id).iterate_items():
                        user_profile = item
                        break  # Get first result
                
                if not user_profile:
                    return {
                        'success': False,
                        'error': 'No results from Apify actor',
                        'error_code': 'no_results'
                    }
            except Exception as e:
                # If client fails, fall back to HTTP requests
                error_msg = str(e)
                if 'not valid' in error_msg.lower() or 'authentication' in error_msg.lower():
                    return {
                        'success': False,
                        'error': 'Apify API token is invalid. Please check your APIFY_TOKEN in backend/.env',
                        'error_code': 'auth_error',
                        'hint': 'Get your token from https://console.apify.com/account/integrations'
                    }
                # Continue to HTTP fallback
                pass
        
        # Fallback to HTTP requests if client not available or failed
        if not user_profile:
            if not APIFY_CLIENT_AVAILABLE:
                import requests
            
            # Use HTTP API directly
            # Convert scraptik/tiktok-api to scraptik~tiktok-api for HTTP API
            actor_id_http = actor_id.replace('/', '~')
            sync_url = f'https://api.apify.com/v2/acts/{actor_id_http}/run-sync?token={apify_token}'
            
            response = requests.post(sync_url, json=run_input, timeout=60)
            
            if not response.ok:
                try:
                    error_data = response.json() if response.text else {}
                    error_message = error_data.get("error", {}).get("message", response.text[:200])
                except json.JSONDecodeError:
                    error_message = response.text[:200] if response.text else f'HTTP {response.status_code}: {response.reason}'
                
                if 'not valid' in error_message.lower() or 'authentication' in error_message.lower():
                    return {
                        'success': False,
                        'error': 'Apify API token is invalid. Please check your APIFY_TOKEN in backend/.env',
                        'error_code': 'auth_error',
                        'status_code': response.status_code,
                        'hint': 'Get your token from https://console.apify.com/account/integrations'
                    }
                
                return {
                    'success': False,
                    'error': f'Failed to run Apify actor ({actor_id}): {error_message}',
                    'error_code': 'api_error',
                    'status_code': response.status_code
                }
            
            # Get results from sync response
            # Check for empty response first
            if not response.text or response.text.strip() == '':
                return {
                    'success': False,
                    'error': 'Empty response from Apify API. Check your API token and actor ID.',
                    'error_code': 'empty_response',
                    'status_code': response.status_code,
                    'hint': 'Verify APIFY_TOKEN and APIFY_TIKTOK_ACTOR_ID in backend/.env'
                }
            
            try:
                run_data = response.json()
            except json.JSONDecodeError as e:
                return {
                    'success': False,
                    'error': f'Invalid JSON response from Apify API: {str(e)}',
                    'error_code': 'parse_error',
                    'status_code': response.status_code,
                    'response_preview': response.text[:500] if response.text else 'No response body',
                    'hint': 'The API may have returned an error page or invalid response. Check your API token.'
                }
            
            dataset_id = run_data.get('data', {}).get('defaultDatasetId')
            
            if dataset_id:
                results_url = f'https://api.apify.com/v2/datasets/{dataset_id}/items?token={apify_token}'
                results_response = requests.get(results_url, timeout=10)
                
                if results_response.ok:
                    try:
                        results = results_response.json()
                    except json.JSONDecodeError as e:
                        return {
                            'success': False,
                            'error': f'Invalid JSON response from Apify dataset: {str(e)}. Response: {results_response.text[:200]}',
                            'error_code': 'parse_error',
                            'status_code': results_response.status_code
                        }
                    
                    if results and len(results) > 0:
                        user_profile = results[0]
                    else:
                        return {
                            'success': False,
                            'error': 'No results from Apify actor',
                            'error_code': 'no_results'
                        }
                else:
                    error_text = results_response.text[:200] if results_response.text else 'No error message'
                    return {
                        'success': False,
                        'error': f'Failed to get results from Apify dataset: {error_text}',
                        'error_code': 'api_error',
                        'status_code': results_response.status_code
                    }
            else:
                return {
                    'success': False,
                    'error': 'No dataset ID from Apify run',
                    'error_code': 'api_error'
                }
        
        if not user_profile:
            return {
                'success': False,
                'error': 'Failed to get user profile from Apify',
                'error_code': 'profile_not_found'
            }
        
        # Extract bio from scraptik/tiktok-api response
        # According to docs: https://apify.com/scraptik/tiktok-api
        # Response structure: user object with fields like nickname, signature (bio), follower_count, etc.
        user_data = user_profile.get('user', user_profile)  # Some responses wrap in 'user'
        
        # Try multiple possible bio field names (scraptik uses 'signature' for bio)
        bio = (
            user_data.get('signature', '') or
            user_data.get('bio', '') or
            user_data.get('description', '') or
            user_profile.get('signature', '') or
            user_profile.get('bio', '') or
            ''
        )
        
        # Get additional profile info from scraptik/tiktok-api response format
        # Fields: nickname, follower_count, following_count, aweme_count (video count), total_favorited (likes)
        followers = user_data.get('follower_count', 0) or user_data.get('followerCount', 0) or user_data.get('followers', 0) or 0
        following = user_data.get('following_count', 0) or user_data.get('followingCount', 0) or user_data.get('following', 0) or 0
        video_count = user_data.get('aweme_count', 0) or user_data.get('video_count', 0) or user_data.get('videoCount', 0) or user_data.get('videos', 0) or 0
        likes = user_data.get('total_favorited', 0) or user_data.get('heart_count', 0) or user_data.get('likes', 0) or 0
        nickname = user_data.get('nickname', '') or user_data.get('displayName', '') or user_data.get('display_name', '') or ''
        is_verified = user_data.get('is_verified', False) or user_data.get('verified', False) or user_data.get('isVerified', False) or False
        
        if not bio:
            return {
                'success': False,
                'error': 'Profile bio not found in Apify response',
                'error_code': 'profile_not_found',
                'debug': f'User profile keys: {list(user_profile.keys())}'
            }
        
        # Check verification code if provided
        verified = False
        if verification_code:
            verified = verification_code.lower() in bio.lower()
        
        result = {
            'success': True,
            'username': clean_username,
            'bio': bio,
            'nickname': nickname,
            'is_verified': is_verified,
            'followers': followers,
            'following': following,
            'likes': likes,
            'video_count': video_count,
        }
        
        if verification_code is not None:
            result['verified'] = verified
            result['verification_code'] = verification_code
            result['message'] = (
                'Verification successful! Code found in bio.' if verified
                else 'Verification code not found in bio. Please add it and try again.'
            )
        
        return result
        
    except requests.exceptions.Timeout:
        return {
            'success': False,
            'error': 'Request timeout. Apify API is taking too long to respond.',
            'error_code': 'timeout'
        }
    except requests.exceptions.ConnectionError:
        return {
            'success': False,
            'error': 'Connection error. Could not reach Apify API.',
            'error_code': 'connection_error'
        }
    except json.JSONDecodeError as e:
        return {
            'success': False,
            'error': f'Invalid JSON response from API: {str(e)}',
            'error_code': 'parse_error'
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
        description='Fetch TikTok bio and verify code using Apify API'
    )
    parser.add_argument(
        'username',
        type=str,
        help='TikTok username (with or without @)'
    )
    parser.add_argument(
        '--verification-code',
        type=str,
        default=None,
        help='Verification code to check in bio'
    )
    parser.add_argument(
        '--api-key',
        type=str,
        default=None,
        help='Apify API token (or set APIFY_TOKEN environment variable)'
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
        username = args.username
        verification_code = args.verification_code
        api_key = args.api_key
    
    # Fetch bio and verify
    result = fetch_tiktok_bio(username, verification_code, api_key)
    
    # Output as JSON
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    sys.exit(0 if result.get('success', False) else 1)


if __name__ == '__main__':
    main()
