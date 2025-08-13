#!/usr/bin/env python3
"""
Script to fix Flake8 errors systematically.
"""
import os
import subprocess

def fix_w292_w293_errors():
    """Fix W292 (no newline at end) and W293 (blank line with whitespace) errors."""
    print("Fixing W292 and W293 errors...")

    # Get all python files
    result = subprocess.run([
        'find', '.', '-name', '*.py', '-not', '-path', './venv/*'
    ], capture_output=True, text=True)

    python_files = result.stdout.strip().split('\n')

    for file_path in python_files:
        if not file_path or not os.path.exists(file_path):
            continue

        try:
            with open(file_path, 'rb') as f:
                content = f.read()

            # Fix W293: blank line contains whitespace
            content_str = content.decode('utf-8', errors='ignore')
            lines = content_str.split('\n')

            # Remove whitespace from blank lines
            fixed_lines = []
            for line in lines:
                if line.strip() == '':  # If line is blank or only whitespace
                    fixed_lines.append('')  # Make it completely empty
                else:
                    fixed_lines.append(line)

            # Fix W292: no newline at end of file
            if fixed_lines and fixed_lines[-1] != '':
                fixed_lines.append('')

            # Join lines and write back
            fixed_content = '\n'.join(fixed_lines)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(fixed_content)

            print(f"Fixed: {file_path}")

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

if __name__ == '__main__':
    fix_w292_w293_errors()
    print("Done!")
