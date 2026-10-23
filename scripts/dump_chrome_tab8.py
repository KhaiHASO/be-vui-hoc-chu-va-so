import subprocess
import base64
import os

scpt = '''
tell application "Google Chrome"
    set t8 to tab 8 of window id 1712107398
    return execute t8 javascript "document.querySelector('img[alt*=\\"Bài viết\\"]').src"
end tell
'''

p = subprocess.Popen(["osascript", "-e", scpt], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
out, err = p.communicate()
res = out.decode("utf-8").strip()

if res.startswith("data:image/"):
    header, b64 = res.split(",", 1)
    os.makedirs(".ui_audit", exist_ok=True)
    with open(".ui_audit/current_user_image.jpg", "wb") as f:
        f.write(base64.b64decode(b64))
    print("Successfully wrote .ui_audit/current_user_image.jpg, size:", os.path.getsize(".ui_audit/current_user_image.jpg"))
else:
    print("Result not data:image:", res[:100], "Err:", err.decode("utf-8")[:100])
