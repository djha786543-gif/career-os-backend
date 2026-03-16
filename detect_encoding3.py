import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('career-os-v2.html', 'rb') as f:
    raw = f.read()

s = raw.decode('utf-8')

# Map: original emoji -> garbled form in file
# Strategy: for each emoji we want to use in old strings,
# compute what it looks like after double-encoding (UTF-8 bytes read as cp1252/latin-1 then re-encoded as UTF-8)
#
# Actually, let's just find each emoji by computing the garbled form:
# emoji -> utf-8 bytes -> interpret each byte as cp1252/latin-1 char -> unicode string (the garbled form)

def garble_emoji(emoji):
    """Convert emoji to the garbled form as stored in file"""
    utf8_bytes = emoji.encode('utf-8')
    garbled = ''
    for b in utf8_bytes:
        try:
            garbled += bytes([b]).decode('cp1252')
        except:
            garbled += bytes([b]).decode('latin-1')
    return garbled

# Test with 🔍
test = '\U0001f50d'  # 🔍
g = garble_emoji(test)
print(f"🔍 garbled: {repr(g)}")
idx = s.find(g)
print(f"  Found at: {idx}")

# Test with 🌐
test2 = '\U0001f310'  # 🌐
g2 = garble_emoji(test2)
print(f"🌐 garbled: {repr(g2)}")

# Test with 🏭
test3 = '\U0001f3ed'  # 🏭
g3 = garble_emoji(test3)
print(f"🏭 garbled: {repr(g3)}")

# Test with 🎓
test4 = '\U0001f393'  # 🎓
g4 = garble_emoji(test4)
print(f"🎓 garbled: {repr(g4)}")

# Test em dash —
test5 = '\u2014'
g5 = garble_emoji(test5)
print(f"— garbled: {repr(g5)}")

# Test middle dot ·
test6 = '\u00b7'
g6 = garble_emoji(test6)
print(f"· garbled: {repr(g6)}")

# Now let's find the actual text in file for replacement 2
print("\n--- Searching for Replacement 2 context ---")
idx = s.find('jh-dj-controls')
print(repr(s[idx-10:idx+300]))

print("\n--- Searching for Replacement 4 context ---")
idx4 = s.find("const filtered=state.cat==='ALL'?state.jobs:state.jobs.filter")
print(repr(s[idx4-20:idx4+500]))

print("\n--- Searching for Replacement 5 context ---")
idx5 = s.find('job-badges')
while idx5 != -1:
    snippet = s[idx5:idx5+200]
    if 'jbadge-industry' in snippet:
        print(f"At pos {idx5}:")
        print(repr(snippet))
        break
    idx5 = s.find('job-badges', idx5+1)

print("\n--- Searching for Replacement 6 context ---")
idx6 = s.find('function renderJobHub')
print(repr(s[idx6:idx6+500]))
