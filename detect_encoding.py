import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('career-os-v2.html', 'rb') as f:
    raw = f.read()

# The file decodes fine as UTF-8 but emojis are mangled
# This means the file is UTF-8 but emojis were stored as double-encoded UTF-8
# (original UTF-8 bytes interpreted as cp1252/latin-1 then re-encoded as UTF-8)

# Verify: decode raw as UTF-8 to get the garbled string
s = raw.decode('utf-8')
idx = s.find('Search Remote CISA')
garbled = s[idx-5:idx+25]
print("Garbled context:", repr(garbled))

# Try to recover: encode garbled chars as cp1252, then decode as utf-8
recovered = garbled.encode('cp1252', errors='replace').decode('utf-8', errors='replace')
print("Recovered:", repr(recovered))

# Check: what does the search emoji look like when double-encoded?
emoji = '\U0001f50d'  # 🔍
print("Emoji:", repr(emoji))
double_encoded = emoji.encode('utf-8').decode('cp1252', errors='replace')
print("Double-encoded:", repr(double_encoded))
