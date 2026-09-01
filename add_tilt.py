import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find if we need to add import { motion } from 'motion/react'
    needs_motion = False
    
    # We will iterate character by character to find <div ... className="...liquid-glass..." ... >
    # and match its closing </div>
    
    output = []
    i = 0
    n = len(content)
    
    # Regex to find opening div with liquid-glass
    pattern = re.compile(r'<div\s+([^>]*?className=(?:\{`[^`]*liquid-glass[^`]*`\}|"[^"]*liquid-glass[^"]*")[^>]*)>')
    
    while i < n:
        match = pattern.search(content, i)
        if not match:
            output.append(content[i:])
            break
            
        start_idx = match.start()
        end_idx = match.end()
        
        # Append everything up to the match
        output.append(content[i:start_idx])
        
        # We found a target <div>, we replace it with <motion.div ... whileHover=...>
        needs_motion = True
        attrs = match.group(1)
        
        # Replace the opening tag
        output.append(f'<motion.div {attrs} whileHover={{ scale: 1.01, y: -4, rotateX: 2, rotateY: -2 }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>')
        
        # Now find the matching closing </div>
        depth = 1
        curr = end_idx
        while curr < n and depth > 0:
            next_open = content.find('<div', curr)
            next_close = content.find('</div', curr)
            
            if next_close == -1:
                break # Should not happen in well-formed JSX
                
            if next_open != -1 and next_open < next_close:
                output.append(content[curr:next_open + 4])
                depth += 1
                curr = next_open + 4
            else:
                output.append(content[curr:next_close])
                depth -= 1
                if depth == 0:
                    output.append('</motion.div>')
                    curr = next_close + 6
                else:
                    output.append('</div')
                    curr = next_close + 5
        
        i = curr

    res = "".join(output)
    
    if needs_motion and 'motion/react' not in res:
        # insert import { motion } from 'motion/react'; after the last import
        import_match = list(re.finditer(r"^import\s+.*?;$", res, re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            idx = last_import.end()
            res = res[:idx] + "\nimport { motion } from 'motion/react';" + res[idx:]
        else:
            res = "import { motion } from 'motion/react';\n" + res

    # If it was already there but as something else, we might need to handle, 
    # but the above is simple enough.

    if res != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(res)
        print(f"Updated {filepath}")

for root, _, files in os.walk('src/pages'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))

