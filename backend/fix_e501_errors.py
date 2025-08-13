#!/usr/bin/env python3
"""
Automatic Flake8 E501 Line Length Fixer for ZentraQMS Backend

This script automatically fixes E501 "line too long" errors by applying
intelligent formatting strategies while preserving code functionality.

Usage:
    python fix_e501_errors.py

Features:
- Finds all Python files in apps/, config/, core/ directories
- Identifies lines longer than 79 characters
- Applies various formatting strategies:
  * Breaking long imports
  * Breaking long function calls and definitions
  * Breaking long string literals
  * Breaking long conditional statements
  * Breaking long dictionary/list definitions
- Preserves original code functionality
- Creates backups of modified files
- Provides detailed reporting
"""

import os
import re
import shutil
import sys
from pathlib import Path
from typing import List, Tuple, Dict
import ast
import tokenize
import io


class E501Fixer:
    """Automatic fixer for E501 line length violations."""
    
    def __init__(self, max_line_length: int = 79, backup: bool = True):
        self.max_line_length = max_line_length
        self.backup = backup
        self.fixed_files = []
        self.total_lines_fixed = 0
        
    def find_python_files(self, root_dir: str) -> List[str]:
        """Find all Python files in specified directories."""
        python_files = []
        target_dirs = ['apps', 'config', 'core']
        
        for target_dir in target_dirs:
            dir_path = os.path.join(root_dir, target_dir)
            if os.path.exists(dir_path):
                for root, dirs, files in os.walk(dir_path):
                    # Skip __pycache__ and migrations directories for some fixes
                    if '__pycache__' in root:
                        continue
                    
                    for file in files:
                        if file.endswith('.py'):
                            python_files.append(os.path.join(root, file))
        
        # Also check root level Python files
        for file in os.listdir(root_dir):
            if file.endswith('.py') and os.path.isfile(os.path.join(root_dir, file)):
                python_files.append(os.path.join(root_dir, file))
                
        return python_files
    
    def create_backup(self, file_path: str) -> None:
        """Create a backup of the original file."""
        if self.backup:
            backup_path = f"{file_path}.backup"
            shutil.copy2(file_path, backup_path)
            print(f"  Created backup: {backup_path}")
    
    def fix_long_imports(self, line: str, indent: str = "") -> str:
        """Fix long import statements."""
        line = line.strip()
        
        # Handle 'from ... import ...' statements
        if line.startswith('from ') and ' import ' in line:
            parts = line.split(' import ', 1)
            if len(parts) == 2:
                from_part = parts[0]
                import_part = parts[1]
                
                # Split imports by comma
                imports = [imp.strip() for imp in import_part.split(',')]
                
                if len(imports) > 1:
                    # Multi-line import
                    result = f"{from_part} import (\n"
                    for i, imp in enumerate(imports):
                        if i == len(imports) - 1:
                            result += f"{indent}    {imp}\n{indent})"
                        else:
                            result += f"{indent}    {imp},\n"
                    return result
        
        # Handle regular import statements
        elif line.startswith('import ') and ',' in line:
            imports = line[7:].split(',')  # Remove 'import '
            imports = [imp.strip() for imp in imports]
            
            if len(imports) > 1:
                result = ""
                for imp in imports:
                    result += f"{indent}import {imp}\n"
                return result.rstrip('\n')
        
        return line
    
    def fix_long_string(self, line: str, indent: str = "") -> str:
        """Fix long string literals."""
        # Find string patterns
        string_patterns = [
            (r"'([^'\\]|\\.)*'", "'"),
            (r'"([^"\\]|\\.)*"', '"'),
        ]
        
        for pattern, quote in string_patterns:
            matches = list(re.finditer(pattern, line))
            if matches:
                for match in reversed(matches):  # Process from right to left
                    string_content = match.group(0)
                    if len(string_content) > 40:  # Only break long strings
                        # Remove quotes and split
                        content = string_content[1:-1]
                        
                        # Try to split at natural boundaries
                        if ' ' in content:
                            words = content.split(' ')
                            chunks = []
                            current_chunk = []
                            current_length = 0
                            
                            for word in words:
                                if current_length + len(word) + 1 > 40:
                                    if current_chunk:
                                        chunks.append(' '.join(current_chunk))
                                        current_chunk = [word]
                                        current_length = len(word)
                                    else:
                                        chunks.append(word)
                                        current_length = 0
                                else:
                                    current_chunk.append(word)
                                    current_length += len(word) + 1
                            
                            if current_chunk:
                                chunks.append(' '.join(current_chunk))
                            
                            if len(chunks) > 1:
                                # Create multi-line string
                                new_string = "(\n"
                                for i, chunk in enumerate(chunks):
                                    if i == len(chunks) - 1:
                                        new_string += f"{indent}    {quote}{chunk}{quote}\n{indent})"
                                    else:
                                        new_string += f"{indent}    {quote}{chunk} {quote}\n"
                                
                                line = line[:match.start()] + new_string + line[match.end():]
        
        return line
    
    def fix_long_function_call(self, line: str, indent: str = "") -> str:
        """Fix long function calls and method chains."""
        # Pattern for function calls with parameters
        func_call_pattern = r'(\w+(?:\.\w+)*\s*)\((.*)\)'
        match = re.search(func_call_pattern, line.strip())
        
        if match:
            func_name = match.group(1)
            params = match.group(2)
            
            # Check if we have multiple parameters
            if ',' in params and len(params) > 40:
                # Try to split parameters
                param_list = []
                paren_depth = 0
                bracket_depth = 0
                current_param = ""
                
                for char in params:
                    if char == ',' and paren_depth == 0 and bracket_depth == 0:
                        param_list.append(current_param.strip())
                        current_param = ""
                    else:
                        if char == '(':
                            paren_depth += 1
                        elif char == ')':
                            paren_depth -= 1
                        elif char == '[':
                            bracket_depth += 1
                        elif char == ']':
                            bracket_depth -= 1
                        current_param += char
                
                if current_param.strip():
                    param_list.append(current_param.strip())
                
                if len(param_list) > 1:
                    # Create multi-line function call
                    new_call = f"{func_name.strip()}(\n"
                    for i, param in enumerate(param_list):
                        if i == len(param_list) - 1:
                            new_call += f"{indent}    {param}\n{indent})"
                        else:
                            new_call += f"{indent}    {param},\n"
                    
                    # Replace in original line
                    line = re.sub(func_call_pattern, new_call, line.strip())
        
        return line
    
    def fix_long_dictionary(self, line: str, indent: str = "") -> str:
        """Fix long dictionary definitions."""
        # Simple dictionary pattern
        if '{' in line and '}' in line and ':' in line:
            # Check if it's a simple single-line dictionary
            dict_match = re.search(r'\{([^{}]*)\}', line)
            if dict_match:
                dict_content = dict_match.group(1)
                if ',' in dict_content and len(dict_content) > 40:
                    # Split dictionary items
                    items = []
                    current_item = ""
                    paren_depth = 0
                    quote_char = None
                    
                    for char in dict_content:
                        if char in ['"', "'"] and quote_char is None:
                            quote_char = char
                        elif char == quote_char:
                            quote_char = None
                        elif char == ',' and paren_depth == 0 and quote_char is None:
                            items.append(current_item.strip())
                            current_item = ""
                            continue
                        elif char == '(' and quote_char is None:
                            paren_depth += 1
                        elif char == ')' and quote_char is None:
                            paren_depth -= 1
                        
                        current_item += char
                    
                    if current_item.strip():
                        items.append(current_item.strip())
                    
                    if len(items) > 1:
                        # Create multi-line dictionary
                        new_dict = "{\n"
                        for i, item in enumerate(items):
                            if i == len(items) - 1:
                                new_dict += f"{indent}    {item}\n{indent}}}"
                            else:
                                new_dict += f"{indent}    {item},\n"
                        
                        line = line.replace(dict_match.group(0), new_dict)
        
        return line
    
    def fix_long_list(self, line: str, indent: str = "") -> str:
        """Fix long list definitions."""
        # Simple list pattern
        list_match = re.search(r'\[([^\[\]]*)\]', line)
        if list_match:
            list_content = list_match.group(1)
            if ',' in list_content and len(list_content) > 40:
                # Split list items
                items = []
                current_item = ""
                paren_depth = 0
                quote_char = None
                
                for char in list_content:
                    if char in ['"', "'"] and quote_char is None:
                        quote_char = char
                    elif char == quote_char:
                        quote_char = None
                    elif char == ',' and paren_depth == 0 and quote_char is None:
                        items.append(current_item.strip())
                        current_item = ""
                        continue
                    elif char == '(' and quote_char is None:
                        paren_depth += 1
                    elif char == ')' and quote_char is None:
                        paren_depth -= 1
                    
                    current_item += char
                
                if current_item.strip():
                    items.append(current_item.strip())
                
                if len(items) > 1:
                    # Create multi-line list
                    new_list = "[\n"
                    for i, item in enumerate(items):
                        if i == len(items) - 1:
                            new_list += f"{indent}    {item}\n{indent}]"
                        else:
                            new_list += f"{indent}    {item},\n"
                    
                    line = line.replace(list_match.group(0), new_list)
        
        return line
    
    def fix_long_conditional(self, line: str, indent: str = "") -> str:
        """Fix long conditional statements."""
        stripped = line.strip()
        
        # Handle if/elif statements with multiple conditions
        if stripped.startswith(('if ', 'elif ')) and ' and ' in stripped:
            # Split on 'and' conditions
            if_part = stripped.split(':', 1)[0]  # Everything before the colon
            rest = stripped[len(if_part):]  # The colon and anything after
            
            if ' and ' in if_part:
                conditions = if_part.split(' and ')
                if len(conditions) > 1:
                    keyword = conditions[0].split()[0]  # 'if' or 'elif'
                    first_condition = ' '.join(conditions[0].split()[1:])
                    
                    new_line = f"{keyword} {first_condition} and (\n"
                    for i, condition in enumerate(conditions[1:], 1):
                        condition = condition.strip()
                        if i == len(conditions) - 1:
                            new_line += f"{indent}    {condition}\n{indent}){rest}"
                        else:
                            new_line += f"{indent}    {condition} and\n"
                    
                    return new_line
        
        return line
    
    def get_indentation(self, line: str) -> str:
        """Get the indentation of a line."""
        return line[:len(line) - len(line.lstrip())]
    
    def fix_long_lines_in_file(self, file_path: str) -> int:
        """Fix long lines in a single file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            modified = False
            fixed_count = 0
            new_lines = []
            
            i = 0
            while i < len(lines):
                line = lines[i]
                original_line = line
                
                if len(line.rstrip()) > self.max_line_length:
                    indent = self.get_indentation(line)
                    
                    # Try different fixing strategies
                    strategies = [
                        self.fix_long_imports,
                        self.fix_long_function_call,
                        self.fix_long_string,
                        self.fix_long_dictionary,
                        self.fix_long_list,
                        self.fix_long_conditional,
                    ]
                    
                    for strategy in strategies:
                        try:
                            fixed_line = strategy(line, indent)
                            if fixed_line != line and len(fixed_line.split('\n')[0].rstrip()) <= self.max_line_length:
                                line = fixed_line
                                break
                        except Exception as e:
                            # If a strategy fails, continue with the next one
                            continue
                    
                    if line != original_line:
                        modified = True
                        fixed_count += 1
                        
                        # Handle multi-line replacements
                        if '\n' in line:
                            new_lines.extend(line.split('\n'))
                            # Remove the last empty element if it exists
                            if new_lines and new_lines[-1] == '':
                                new_lines.pop()
                        else:
                            new_lines.append(line)
                    else:
                        new_lines.append(line.rstrip() + '\n')
                else:
                    new_lines.append(line)
                
                i += 1
            
            if modified:
                # Create backup
                self.create_backup(file_path)
                
                # Write fixed content
                with open(file_path, 'w', encoding='utf-8') as f:
                    for line in new_lines:
                        if not line.endswith('\n'):
                            line += '\n'
                        f.write(line)
                
                self.fixed_files.append(file_path)
                self.total_lines_fixed += fixed_count
                print(f"  Fixed {fixed_count} long lines")
                return fixed_count
            
            return 0
            
        except Exception as e:
            print(f"  Error processing file: {e}")
            return 0
    
    def run(self, root_dir: str = ".") -> None:
        """Run the E501 fixer on all Python files."""
        print("ZentraQMS Backend E501 Line Length Fixer")
        print("=" * 50)
        print(f"Maximum line length: {self.max_line_length}")
        print(f"Backup files: {'Yes' if self.backup else 'No'}")
        print()
        
        # Find all Python files
        python_files = self.find_python_files(root_dir)
        print(f"Found {len(python_files)} Python files to check")
        print()
        
        # Process each file
        for file_path in python_files:
            rel_path = os.path.relpath(file_path, root_dir)
            print(f"Processing: {rel_path}")
            
            fixed_count = self.fix_long_lines_in_file(file_path)
            if fixed_count == 0:
                print("  No changes needed")
        
        # Summary
        print()
        print("=" * 50)
        print(f"Summary:")
        print(f"  Files processed: {len(python_files)}")
        print(f"  Files modified: {len(self.fixed_files)}")
        print(f"  Total lines fixed: {self.total_lines_fixed}")
        
        if self.fixed_files:
            print()
            print("Modified files:")
            for file_path in self.fixed_files:
                rel_path = os.path.relpath(file_path, root_dir)
                print(f"  - {rel_path}")
        
        if self.backup and self.fixed_files:
            print()
            print("Backup files created with .backup extension")
            print("Remove them after verifying the changes work correctly")


def main():
    """Main function."""
    if len(sys.argv) > 1:
        if sys.argv[1] in ['-h', '--help']:
            print(__doc__)
            return
        elif sys.argv[1] == '--no-backup':
            fixer = E501Fixer(backup=False)
        else:
            print("Usage: python fix_e501_errors.py [--no-backup]")
            return
    else:
        fixer = E501Fixer()
    
    # Run the fixer
    fixer.run()
    
    print()
    print("Done! Please test your application to ensure everything works correctly.")
    print("If you encounter any issues, restore from the backup files.")


if __name__ == '__main__':
    main()