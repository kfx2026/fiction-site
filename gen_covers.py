"""FictionVerse Cover Generator — Minimalist Professional"""
from PIL import Image, ImageDraw, ImageFont
import os
OUT = "images/covers"
os.makedirs(OUT, exist_ok=True)
W, H = 800, 1200

def load_font(path, size):
    try: return ImageFont.truetype(path, size)
    except: return ImageFont.load_default()

def make_cover(slug, bg, accent, title_lines, sub, author, genre):
    img = Image.new('RGB', (W, H), bg)
    d = ImageDraw.Draw(img)
    y = 80
    d.rectangle([W//2-60, y, W//2+60, y+2], fill=accent)
    y = 300
    for line in title_lines:
        f = load_font("C:/Windows/Fonts/georgiab.ttf", 52 if len(title_lines)<=2 else 44)
        bb = d.textbbox((0,0), line, font=f)
        d.text((W//2-(bb[2]-bb[0])//2, y), line, fill=accent, font=f)
        y += 70
    y += 20
    d.rectangle([W//2-40, y, W//2+40, y+1], fill=accent)
    y += 40
    fs = load_font("C:/Windows/Fonts/georgiai.ttf", 24)
    bb = d.textbbox((0,0), sub, font=fs)
    d.text((W//2-(bb[2]-bb[0])//2, y), sub, fill=accent+(128,), font=fs)
    y = 750
    gf = load_font("C:/Windows/Fonts/georgia.ttf", 18)
    bb = d.textbbox((0,0), genre, font=gf)
    gw = bb[2]-bb[0]
    d.rectangle([W//2-gw//2-24, y, W//2+gw//2+24, y+40], outline=accent+(100,), width=1)
    d.text((W//2, y+20), genre, fill=accent+(180,), font=gf, anchor='mm')
    y = 1050
    d.text((W//2, y), author, fill=(200,200,200), font=load_font("C:/Windows/Fonts/georgia.ttf", 22), anchor='mt')
    y += 30
    d.rectangle([W//2-40, y, W//2+40, y+1], fill=accent+(80,))
    img.save(f"{OUT}/{slug}.png", quality=95)
    print(f"  {slug}.png")

make_cover("dao-celestial-blade", (10,12,28), (180,200,220), ["DAO OF THE","CELESTIAL BLADE"], "Book One", "AZURE INK", "XIANXIA · CULTIVATION")
make_cover("last-oracle-shanghai", (18,10,28), (220,180,100), ["THE LAST ORACLE","OF SHANGHAI"], "A Novel of Fate and Fortune", "MIDNIGHT QUILL", "URBAN · SUPERNATURAL")
make_cover("system-crash-reboot", (8,18,12), (100,220,180), ["SYSTEM CRASH","REBOOT PROTOCOL"], "When the Game Becomes Reality", "ZERO DAY", "SCI-FI · LITRPG")
print("Done")
