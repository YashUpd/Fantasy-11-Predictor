import os
import sys

def get_directory_structure(root_dir, output_file, indent='', exclude_dirs=None, exclude_extensions=None):
    """
    Generate a text representation of the directory structure starting from root_dir
    and save it to output_file.
    
    Parameters:
    - root_dir: Starting directory to scan
    - output_file: File to save the directory structure
    - indent: Indentation string (used for recursion)
    - exclude_dirs: List of directory names to exclude
    - exclude_extensions: List of file extensions to exclude
    """
    if exclude_dirs is None:
        exclude_dirs = ['.git', '__pycache__', 'venv', 'env', '.ipynb_checkpoints', 'node_modules']
    
    if exclude_extensions is None:
        exclude_extensions = ['.pyc']
    
    with open(output_file, 'a', encoding='utf-8') as f:
        if indent == '':  # Root directory
            f.write(f"{os.path.basename(os.path.abspath(root_dir))}/\n")
        
        # Get all items in the current directory
        try:
            items = sorted(os.listdir(root_dir))
        except PermissionError:
            return  # Skip directories we can't access
        
        # Process directories first, then files
        dirs = [item for item in items if os.path.isdir(os.path.join(root_dir, item)) and item not in exclude_dirs]
        files = [item for item in items if os.path.isfile(os.path.join(root_dir, item)) 
                and not any(item.endswith(ext) for ext in exclude_extensions)]
        
        # Process directories
        for i, item in enumerate(dirs):
            is_last_dir = (i == len(dirs) - 1 and len(files) == 0)
            prefix = '└── ' if is_last_dir else '├── '
            f.write(f"{indent}{prefix}{item}/\n")
            
            # Recursively process subdirectories
            new_indent = indent + ('    ' if is_last_dir else '│   ')
            get_directory_structure(os.path.join(root_dir, item), output_file, new_indent, exclude_dirs, exclude_extensions)
        
        # Process files
        for i, item in enumerate(files):
            is_last = (i == len(files) - 1)
            prefix = '└── ' if is_last else '├── '
            f.write(f"{indent}{prefix}{item}\n")

def main():
    # Get the directory to scan
    if len(sys.argv) > 1:
        root_dir = sys.argv[1]
    else:
        root_dir = os.getcwd()  # Use current directory if none specified
    
    # Define output file
    output_file = "project_structure.txt"
    
    # Clear file if it exists
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(f"Project Structure for: {os.path.abspath(root_dir)}\n")
        f.write("=" * 80 + "\n\n")
    
    # Generate and save directory structure
    get_directory_structure(root_dir, output_file)
    
    print(f"Directory structure has been saved to {os.path.abspath(output_file)}")

if __name__ == "__main__":
    main()