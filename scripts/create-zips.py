import os
import zipfile
import sys

def zip_directory(source_dir, output_zip):
    with zipfile.ZipFile(output_zip, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, source_dir)
                posix_path = rel_path.replace('\\', '/')
                zipf.write(abs_path, posix_path)
    size = os.path.getsize(output_zip)
    print(f"Zip created successfully: size = {size} bytes")

if __name__ == '__main__':
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    
    # 1. Backend Wispbyte
    backend_dir = os.path.join(base_dir, 'deploy-wispbyte')
    backend_zip = os.path.join(base_dir, 'backend-wispbyte.zip')
    zip_directory(backend_dir, backend_zip)
    
    # 2. Frontend Hosting
    frontend_dir = os.path.join(base_dir, 'apps', 'web', 'out')
    frontend_zip = os.path.join(base_dir, 'frontend-hosting.zip')
    zip_directory(frontend_dir, frontend_zip)
