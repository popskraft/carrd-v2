import os
import re

DIST_FILE = 'dist/modal-v2/modal-v2-embed.html'
TARGET_FILE = 'carrd/index.html'

def main():
    if not os.path.exists(DIST_FILE):
        print(f"Error: {DIST_FILE} not found")
        return

    with open(DIST_FILE, 'r') as f:
        plugin_content = f.read()

    # Format the plugin content
    # Add comment header if not present in dist (it usually isn't)
    new_block = '<!-- Modal Plugin -->\n' + plugin_content

    with open(TARGET_FILE, 'r') as f:
        target_content = f.read()

    # Regex to find existing modal plugin block
    # We look for <!-- Modal Plugin --> ... up to ... </script>
    # Note: complex regex might be fragile if markers change.
    
    # Pattern: 
    # <!-- Modal Plugin -->
    # ... code ...
    # </script>
    
    # Let's try to match strict pattern
    pattern = re.compile(r'<!-- Modal Plugin -->.*?</script>', re.DOTALL)
    
    match = pattern.search(target_content)
    
    if match:
        print("Found existing Modal Plugin block. Replacing...")
        new_content = target_content[:match.start()] + new_block + target_content[match.end():]
    else:
        print("Existing Modal Plugin block not found. Appending before </body>...")
        if '</body>' in target_content:
            new_content = target_content.replace('</body>', new_block + '\n</body>')
        else:
            print("Error: </body> tag not found")
            return

    with open(TARGET_FILE, 'w') as f:
        f.write(new_content)
        
    print(f"Successfully updated {TARGET_FILE}")

if __name__ == '__main__':
    main()
