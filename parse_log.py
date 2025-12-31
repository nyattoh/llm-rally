import json
import os
import sys

# Ensure UTF-8 output for Windows terminal
if sys.stdout.encoding != 'utf-8':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

log_path = r'd:\kamui4d\llm-rally\log.json'

if not os.path.exists(log_path):
    print(f"Error: {log_path} not found.")
else:
    try:
        with open(log_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        for i, entry in enumerate(data):
            who = entry.get('who', 'user')
            prompt = entry.get('prompt', '')
            output = entry.get('output', '')
            
            print(f"\n=== Round {entry.get('round', i)}: [{who}] ===")
            if prompt:
                print(f"Prompt:\n{prompt}")
            if output:
                print(f"Output:\n{output}")
            print("-" * 50)
    except Exception as e:
        print(f"Error parsing JSON: {e}")
