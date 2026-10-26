with open('0nownq0vvffs-.js', 'r', encoding='utf-8') as f:
    c = f.read()

start = 8500
end = 14500
with open('extracted_three_logic.js', 'w', encoding='utf-8') as out:
    out.write(c[start:end])

print(f"Written {end-start} chars to extracted_three_logic.js")
