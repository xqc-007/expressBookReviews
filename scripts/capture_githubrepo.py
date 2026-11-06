"""Capture actual GitHub fork metadata only after verifying its parent."""
import json
from pathlib import Path
import re
import shlex
import subprocess
import sys
owner = sys.argv[1] if len(sys.argv) > 1 else 'xqc-007'
if not re.fullmatch(r'[a-zA-Z0-9-]+', owner):
    raise SystemExit('Invalid GitHub username.')
command = ['curl', '-sS', '--fail-with-body', f'https://api.github.com/repos/{owner}/expressBookReviews']
result = subprocess.run(command, capture_output=True, text=True, check=True)
metadata = json.loads(result.stdout)
if not metadata.get('fork') or metadata.get('parent', {}).get('full_name') != 'ibm-developer-skills-network/expressBookReviews':
    raise SystemExit('This repository is not the required IBM fork.')
root = Path(__file__).resolve().parents[1]
(root/'evidence').mkdir(exist_ok=True)
(root/'evidence/githubrepo').write_text('$ ' + shlex.join(command) + '\n' + result.stdout + '\n')
print('Saved verified fork metadata to evidence/githubrepo')
