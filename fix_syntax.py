import os

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Fix whileHover
    res = content.replace('whileHover={ scale: 1.01, y: -4, rotateX: 2, rotateY: -2 }', 'whileHover={{ scale: 1.01, y: -4, rotateX: 2, rotateY: -2 }}')
    res = res.replace('transition={ type: "spring", stiffness: 300, damping: 20 }', 'transition={{ type: "spring", stiffness: 300, damping: 20 }}')

    if res != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(res)
        print(f"Fixed {filepath}")

for root, _, files in os.walk('src/pages'):
    for file in files:
        if file.endswith('.tsx'):
            fix_file(os.path.join(root, file))

