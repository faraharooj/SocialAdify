import os

def print_directory_structure(root_dir, indent="", skip_folders=None):
    if skip_folders is None:
        skip_folders = {"venv", "node_modules", ".next"}  # folders to ignore

    for item in os.listdir(root_dir):
        if item in skip_folders:
            continue

        path = os.path.join(root_dir, item)
        if os.path.isdir(path):
            print(indent + f"📁 {item}")
            print_directory_structure(path, indent + "    ", skip_folders)
        else:
            print(indent + f"📄 {item}")

root_path = r"D:\socialadify\frontend"
print(f"Directory structure for: {root_path}\n")
print_directory_structure(root_path)
