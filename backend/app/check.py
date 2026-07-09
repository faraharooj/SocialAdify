file_path = "D:\\socialadify\\backend\\app\\api\\insights\\router.py"

with open(file_path, "rb") as f:
    content = f.read()

cleaned_content = content.replace(b'\x00', b'')

with open(file_path, "wb") as f:
    f.write(cleaned_content)

print("✅ Cleaned file of any null bytes.")