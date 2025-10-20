#!/usr/bin/env python3
"""
Deploy ProtoThrive Frontend to Cloudflare Pages via Direct Upload API
"""
import os
import json
import base64
import hashlib
import requests
from pathlib import Path

ACCOUNT_ID = "d2897bdebfa128919bd89b265e6a712e"
API_TOKEN = "Z5Jo1dY_yYcKhXd_QgHj1H0qGgAIhB84W-OOOgHV"
PROJECT_NAME = "protothrive-frontend"
OUT_DIR = Path("frontend/out")

def get_file_hash(filepath):
    """Calculate SHA-256 hash of file"""
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            sha256.update(chunk)
    return sha256.hexdigest()

def collect_files():
    """Collect all files from out directory with hashes"""
    files = {}
    for filepath in OUT_DIR.rglob('*'):
        if filepath.is_file():
            rel_path = str(filepath.relative_to(OUT_DIR)).replace('\\', '/')
            # Remove leading slash for Pages API
            if not rel_path.startswith('/'):
                rel_path = '/' + rel_path

            file_hash = get_file_hash(filepath)
            files[rel_path] = file_hash
            print(f"  {rel_path}: {file_hash[:8]}...")

    return files

def upload_file(filepath):
    """Upload a single file and return its hash"""
    with open(filepath, 'rb') as f:
        content = base64.b64encode(f.read()).decode('utf-8')
    return content

def main():
    print("ProtoThrive Frontend Deployment")
    print(f"Source: {OUT_DIR}")
    print(f"Account: {ACCOUNT_ID}")
    print(f"Project: {PROJECT_NAME}\n")

    # Step 1: Collect files
    print("Collecting files...")
    manifest = collect_files()
    print(f"Found {len(manifest)} files\n")

    # Step 2: Create deployment
    print("Creating deployment...")

    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json"
    }

    # Create deployment with manifest
    url = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT_NAME}/deployments"

    # Upload files in batches
    files_data = {}
    for file_path in manifest.keys():
        full_path = OUT_DIR / file_path.lstrip('/')
        with open(full_path, 'rb') as f:
            files_data[file_path] = base64.b64encode(f.read()).decode('utf-8')

    payload = {
        "branch": "main",
        "manifest": files_data
    }

    print(f"Uploading {len(files_data)} files to Cloudflare Pages...")
    response = requests.post(url, headers=headers, json=payload, timeout=120)

    if response.status_code == 200:
        result = response.json()
        if result.get('success'):
            deployment = result['result']
            print(f"\nDeployment successful!")
            print(f"ID: {deployment['id']}")
            print(f"URL: {deployment['url']}")
            print(f"Production URL: https://protothrive-frontend.pages.dev")
            return 0
        else:
            print(f"\nAPI Error: {result.get('errors')}")
            return 1
    else:
        print(f"\nHTTP {response.status_code}: {response.text}")
        return 1

if __name__ == "__main__":
    exit(main())
