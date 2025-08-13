#!/usr/bin/env python3
"""
Script to fix F401 unused imports in template/placeholder files.
"""
import os

# Template files that typically have unused imports that can be safely removed
template_files = [
    './auditorias/admin.py',
    './auditorias/models.py',
    './auditorias/tests.py',
    './auditorias/views.py',
    './authentication/admin.py',
    './authentication/models.py',
    './authentication/tests.py',
    './authentication/views.py',
    './indicadores/admin.py',
    './indicadores/models.py',
    './indicadores/tests.py',
    './indicadores/views.py',
    './normograma/admin.py',
    './normograma/models.py',
    './normograma/tests.py',
    './normograma/views.py',
    './procesos/admin.py',
    './procesos/models.py',
    './procesos/tests.py',
    './procesos/views.py',
]

# Template import lines that can be safely removed if not used
template_imports = [
    'from django.contrib import admin',
    'from django.db import models',
    'from django.test import TestCase',
    'from django.shortcuts import render',
]

def fix_template_files():
    """Fix unused imports in template/placeholder files."""
    for file_path in template_files:
        if not os.path.exists(file_path):
            continue

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()

            # Check if file is just a template with only import + comment
            content_lines = [line.strip() for line in lines if line.strip()]

            # If file only has imports and comments, remove unused imports
            has_actual_code = any(
                line and not line.startswith('#') and not any(imp in line for imp in template_imports)
                for line in content_lines
            )

            if not has_actual_code:
                # Keep only comments and empty lines, remove template imports
                new_lines = []
                for line in lines:
                    if (line.strip().startswith('#') or
                        line.strip() == '' or
                        not any(imp in line for imp in template_imports)):
                        new_lines.append(line)

                # Write back if changed
                if len(new_lines) != len(lines):
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.writelines(new_lines)
                    print(f"Fixed template file: {file_path}")

        except Exception as e:
            print(f"Error processing {file_path}: {e}")

if __name__ == '__main__':
    fix_template_files()
    print("Done fixing template files!")
