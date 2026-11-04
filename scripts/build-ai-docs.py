#!/usr/bin/env python3
"""Build the expanded LLM reference from reviewed text and a pinned source checkout."""
import argparse
from pathlib import Path
import re
import subprocess
from urllib.parse import urljoin

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--source', type=Path, default=ROOT.parent / 'EveryO')
parser.add_argument('--check', action='store_true', help='Fail if the generated reference is stale')
args = parser.parse_args()
index = (ROOT / 'llms.txt').read_text()
revision = re.search(r'Content reviewed against upstream commit ([0-9a-f]{40})\.', index).group(1)
head = subprocess.check_output(['git', '-C', str(args.source), 'rev-parse', 'HEAD'], text=True).strip()
if head != revision:
    parser.error('Source checkout differs from the reviewed revision in llms.txt. Review upstream changes before updating the provenance.')
repo = 'https://github.com/krishanth7/EveryO/blob/' + revision + '/'
result = index + '\n\n---\n\n' + (ROOT / 'documentation.md').read_text()
for name in ['docs/getting-started.md', 'docs/architecture.md', 'docs/autograd.md', 'docs/api-reference.md', 'docs/scaling.md', 'docs/cuda.md', 'docs/troubleshooting.md', 'examples/README.md']:
    source = args.source / name
    text = source.read_text()
    base = urljoin(repo, name)
    # Resolve relative Markdown links against their original source location.
    text = re.sub(r'\]\(([^\s)]+)\)', lambda match: '](' + urljoin(base, match[1]) + ')', text)
    result += '\n\n---\n\nSource: ' + base + '\n\n' + text
output = ROOT / 'llms-full.txt'
if args.check:
    if not output.exists() or output.read_text() != result:
        parser.exit(1, 'llms-full.txt is stale. Run this command without --check.\n')
    print('PASS: expanded AI reference matches the reviewed source and Markdown guide')
else:
    output.write_text(result)
    print('Built llms-full.txt from reviewed commit ' + revision)
