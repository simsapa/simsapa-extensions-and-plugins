#!/usr/bin/env python3

import argparse
from pathlib import Path
import re

from mako.template import Template
from mako.lookup import TemplateLookup

parser = argparse.ArgumentParser()
parser.add_argument("input_html")
parser.add_argument("output_html")
parser.add_argument("render_purpose")
args = parser.parse_args()

def main():

    html_input_path = Path(args.input_html)
    html_output_path = Path(args.output_html)
    render_purpose = args.render_purpose
    html_content = ""

    with open(html_input_path, 'r', encoding="utf-8") as f:
        html_content = f.read()

    t = Template(html_content, lookup=TemplateLookup(directories=[html_input_path.parent]))
    html_content = str(t.render(render_purpose=render_purpose))

    for match in re.finditer(r'<<(.+?)>>', html_content):
        file_path = match.group(1)
        p = html_input_path.parent.joinpath(file_path)
        with open(p, 'r', encoding="utf-8") as file:
            file_contents = file.read()
        html_content = html_content.replace(match.group(0), file_contents)

    with open(html_output_path, 'w', encoding="utf-8") as f:
        f.write(html_content)

if __name__ == "__main__":
    main()
