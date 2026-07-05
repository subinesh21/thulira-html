import os

output_file = "all_code.txt"
ignore_dirs = {".agents", ".astro", ".git", "dist", "node_modules", "public", ".gemini", "supabase"}
ignore_extensions = {".log", ".lock", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico", ".ttf", ".woff", ".woff2", ".pdf", ".pyc"}

def should_ignore(path):
    # Normalize path for checking
    norm_path = os.path.normpath(path)
    parts = norm_path.split(os.sep)
    
    # Check if any ignored directory is in the path
    if any(idir in parts for idir in ignore_dirs):
        return True
        
    if any(path.endswith(ext) for ext in ignore_extensions):
        return True
    if "pnpm-lock.yaml" in path:
        return True
    if "package-lock.json" in path:
        return True
    if "yarn.lock" in path:
        return True
    if output_file in path:
        return True
    if "collect_code.py" in path:
        return True
    return False

with open(output_file, "w", encoding="utf-8") as out:
    for root, dirs, files in os.walk("."):
        # modify dirs in place to prune
        dirs[:] = [d for d in dirs if not should_ignore(os.path.join(root, d))]
        
        for file in files:
            filepath = os.path.join(root, file)
            if should_ignore(filepath):
                continue
            
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()
                out.write(f"\n\n{'='*50}\n")
                out.write(f"FILE: {filepath}\n")
                out.write(f"{'='*50}\n\n")
                out.write(content)
            except Exception as e:
                # Skip files that can't be read as text
                pass

print(f"Code collection complete. Output saved to {output_file}")
