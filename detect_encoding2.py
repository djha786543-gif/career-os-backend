import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('career-os-v2.html', 'rb') as f:
    raw = f.read()

# The file is UTF-8. Let's check what the actual bytes are around the emoji
idx = raw.find(b'Search Remote CISA')
print("Bytes before:", raw[idx-10:idx].hex())
print("Bytes repr:", repr(raw[idx-10:idx]))

# c3b0 = UTF-8 for U+00F0 (ð)
# c5b8 = UTF-8 for U+0178 (Ÿ)
# e2809d = UTF-8 for U+201D (")
# c28d = UTF-8 for U+008D (control)

# The original emoji 🔍 = U+1F50D = F0 9F 94 8D in UTF-8
# When those bytes are read as latin-1: ð (F0) + Ÿ (9F) + " (94, but wait...)
# Actually in cp1252: F0=ð, 9F=Ÿ, 94=", 8D=<undefined/0x8D>
# Then encoded back as UTF-8:
# ð = U+00F0 -> C3 B0
# Ÿ = U+0178 -> C5 B8
# " = U+201D -> E2 80 9D
# 0x8D (undefined in cp1252, fallback) -> need to check

# So the file has cp1252-double-encoded emojis stored as UTF-8 bytes
# To recover: we need to decode as UTF-8, then for each character,
# encode as latin-1 (getting back the original UTF-8 bytes), then decode as UTF-8

s = raw.decode('utf-8')
idx_s = s.find('Search Remote CISA')
garbled = s[idx_s-5:idx_s+5]
print("Garbled str:", repr(garbled))
print("Garbled bytes:", garbled.encode('utf-8').hex())

# Try encode as latin-1
try:
    back = garbled.encode('latin-1')
    print("Latin-1 bytes:", back.hex())
    reread = back.decode('utf-8', errors='replace')
    print("Re-decoded:", repr(reread))
except Exception as e:
    print("Latin-1 encode error:", e)

# The issue: U+0178 (Ÿ) is NOT in latin-1, so we can't use latin-1
# We need cp1252 which maps 0x9F to Ÿ (U+0178)
# But then 0x8D is also not standard in cp1252...

# Let me check what 0xC2 0x8D decodes to in UTF-8
print("\nU+008D:", repr('\x8d'))
# U+008D is a C1 control character. In cp1252, 0x8D maps to... it's undefined in cp1252
# But Python's cp1252 codec might handle it

# Check what Python cp1252 does with 0x8D
try:
    decoded_8d = bytes([0x8d]).decode('cp1252')
    print("0x8D in cp1252:", repr(decoded_8d))
except Exception as e:
    print("0x8D cp1252 decode error:", e)

# So the file has the emoji stored as: ð + Ÿ + " + \x8d (unicode codepoints after UTF-8 decode)
# To fix: encode each char back to get UTF-8 bytes using cp1252 mapping
# ð = U+00F0, Ÿ = U+0178, " = U+201D, \x8d = U+008D

# To get back to original UTF-8 emoji, we need the original bytes
# U+00F0 in cp1252 output -> byte 0xF0
# U+0178 in cp1252 output -> byte 0x9F
# U+201D in cp1252 output -> byte 0x94
# U+008D -> this is where it breaks. In cp1252, byte 0x8D is indeed \x8d (undefined, passthrough)

# Let's build a cp1252-like encoder that handles these
# Actually, Python's 'cp1252' encoder should handle U+0178->0x9F and U+201D->0x94

test_chars = 'ðŸ"\x8d'
print("\nTest encode each char:")
for c in test_chars:
    try:
        b = c.encode('cp1252')
        print(f"  {repr(c)} -> {b.hex()}")
    except Exception as e:
        try:
            b = c.encode('latin-1')
            print(f"  {repr(c)} -> {b.hex()} (latin-1)")
        except:
            print(f"  {repr(c)} -> ERROR: {e}")
