#!/usr/bin/env python3
import json

# Read the cleaned app.js
with open('static/js/app.js', 'r', encoding='utf-8') as f:
    app_js = f.read()

# Read the static handler
with open('src/handlers/static.js', 'r', encoding='utf-8') as f:
    static_handler = f.read()

# Escape for JavaScript string literal
escaped = json.dumps(app_js)[1:-1]  # Remove outer quotes

# Find the start of APP_JS constant
start_marker = 'const APP_JS = "'
start_idx = static_handler.find(start_marker)

if start_idx == -1:
    print('❌ Could not find APP_JS constant')
    exit(1)

# Find the end (the closing ");)
start_content = start_idx + len(start_marker)
end_idx = static_handler.find('";', start_content)

if end_idx == -1:
    print('❌ Could not find end of APP_JS')
    exit(1)

# Replace the constant
new_static = (
    static_handler[:start_idx] +
    f'const APP_JS = "{escaped}";' +
    static_handler[end_idx+2:]
)

# Write back
with open('src/handlers/static.js', 'w', encoding='utf-8') as f:
    f.write(new_static)

print('✅ Updated embedded APP_JS - client-side JobPosting removed')
