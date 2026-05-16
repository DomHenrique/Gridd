import os
import re

files_to_fix = [
    'App.tsx',
    'components/AlbumView.tsx',
    'services/storage.ts',
    'lib/supabase.ts'
]

# Regex to match console.error("Message", var) or console.error(`Message`, var)
# Also grabs console.warn
pattern = re.compile(r'(console\.(?:error|warn})\s*\(\s*(?:([\'"`].*?[\'"`])|[^,)]+)\s*),\s*[a-zA-Z_0-9.]+\s*\)')

for filepath in files_to_fix:
    if not os.path.exists(filepath):
        continue
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Simple substitution: keep the string part, drop the variable part
    # Pattern explanation: Group 1 captures `console.error("Message"`
    # The variable is everything after the comma until `)`
    # Let's use a simpler regex that just matches console.error(something, something_else)
    # and replaces it with console.error(something)
    
    new_content = re.sub(r'(console\.(?:error|warn|log)\s*\(\s*([\'"`].*?[\'"`]))\s*,\s*[^)]+\)', r'\1)', content)
    
    if content != new_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Sanitized: {filepath}")

# Also update index.tsx to suppress console.error in production
index_path = 'index.tsx'
if os.path.exists(index_path):
    with open(index_path, 'r', encoding='utf-8') as f:
        idx_content = f.read()
    if 'console.error = () => {};' not in idx_content:
        idx_content = idx_content.replace('console.warn = () => {};', 'console.warn = () => {};\n  console.error = () => {};')
        with open(index_path, 'w', encoding='utf-8') as f:
            f.write(idx_content)
        print(f"Updated index.tsx")
