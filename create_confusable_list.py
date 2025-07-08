import requests
import json
import sys

req = requests.get("https://www.unicode.org/Public/security/16.0.0/confusables.txt")
consfusable_dict = dict()

for line in req.iter_lines(decode_unicode=True):
    line = str(line)
    if line.rfind(f" → ") != -1:
        arrow_index = line.index(f" → ")
        [key, val] = [line[arrow_index - 1], line[arrow_index + 3]]
        if key in consfusable_dict: 
            consfusable_dict[key].append(val)
        else: consfusable_dict[key] = [val]
        if val in consfusable_dict:
            consfusable_dict[val].append(key)
        else: consfusable_dict[val] = [key]

with open(sys.argv[1], "wb") as file:
    file.write(bytes(json.dumps(consfusable_dict), "utf-8"))