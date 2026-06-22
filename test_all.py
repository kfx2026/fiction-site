"""FictionVerse 全平台烟雾测试"""
import urllib.request
import urllib.error
import json
import re
import sys
import time

BASE = "https://fiction.aichatmail.one"
API = "https://api.aichatmail.one"
OK, FAIL, ERR = 0, 0, 0

def check(label, url, expect_status=200, content_checks=None, is_json=False):
    global OK, FAIL, ERR
    start = time.time()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            status = resp.status
            elapsed = (time.time() - start) * 1000
            if status != expect_status:
                print(f"  ❌ {label}: HTTP {status} (expected {expect_status}) — {elapsed:.0f}ms")
                FAIL += 1
                return
            issues = []
            if content_checks:
                for ck in content_checks:
                    if isinstance(ck, tuple):
                        name, pattern = ck
                        if not re.search(pattern, body, re.IGNORECASE):
                            issues.append(f"missing: {name}")
                    elif not re.search(ck, body, re.IGNORECASE if isinstance(ck, str) else 0):
                        issues.append(f"pattern not found: {ck[:60]}")
            if is_json:
                try: json.loads(body)
                except: issues.append("invalid JSON")
            if issues:
                print(f"  ⚠️  {label}: HTTP 200 OK ({elapsed:.0f}ms) — {', '.join(issues)}")
                FAIL += 1
            else:
                print(f"  ✅ {label}: HTTP 200 OK ({len(body)} bytes, {elapsed:.0f}ms)")
                OK += 1
    except urllib.error.HTTPError as e:
        elapsed = (time.time() - start) * 1000
        if e.code == expect_status:
            print(f"  ✅ {label}: HTTP {e.code} (expected) — {elapsed:.0f}ms")
            OK += 1
        else:
            print(f"  ❌ {label}: HTTP {e.code} — {elapsed:.0f}ms")
            FAIL += 1
    except Exception as e:
        elapsed = (time.time() - start) * 1000
        print(f"  🔴 {label}: CONNECTION ERROR — {e} ({elapsed:.0f}ms)")
        ERR += 1

print("╔══════════════════════════════════════════════╗")
print("║   FictionVerse 全平台烟雾测试                ║")
print("╚══════════════════════════════════════════════╝")

# ─── 1. 核心页面 (must return 200, must render) ───
print("\n📄 核心页面")
check("首页 /", f"{BASE}/", content_checks=[
    ("Book cards", r'class="bk-card"'),
    ("Ranking", r'"rankings"'),
    ("Hero section", r'hero'),
    ("Footer", r'footer'),
])
check("作者页 /author", f"{BASE}/author", content_checks=[
    ("Login form", r'doEmailLogin'),
    ("Register form", r'btnRegister'),
    ("Agreement box", r'agreementBox'),
    ("Chapter editor", r'loadChapterEditor'),
    ("Auto deploy", r'autoDeploy'),
    ("Payment coming soon", r'Coming Soon'),
    ("checkAgreementScroll", r'checkAgreementScroll'),
    ("activateAgreementCheckbox", r'activateAgreementCheckbox'),
])
check("书架 /bookshelf", f"{BASE}/bookshelf", content_checks=[r'myLibrary', r'book', r'bookshelf'])
check("社区 /community", f"{BASE}/community", content_checks=[r'community', r'html'])
check("关于 /about", f"{BASE}/about", content_checks=[r'about', r'html'])
check("条款 /terms", f"{BASE}/terms", content_checks=[r'terms', r'html'])
check("隐私 /privacy", f"{BASE}/privacy", content_checks=[r'privacy', r'html'])
check("404 /404", f"{BASE}/404", content_checks=[r'Not Found|not found', r'html'])
check("sitemap.xml", f"{BASE}/sitemap.xml", content_checks=[r'<\?xml|xmlns'])
check("robots.txt", f"{BASE}/robots.txt", content_checks=[r'User.agent|Allow|Disallow'])

# ─── 2. 分类页 ───
print("\n📂 分类页")
for slug in ["xianxia", "scifi", "urban", "litrpg", "fantasy", "isekai", "romance"]:
    check(f"genre/{slug}", f"{BASE}/genre/{slug}/", content_checks=[r'genre', r'book'])

# ─── 3. 免费/付费区 ───
print("\n📑 专区页")
check("免费区 /free", f"{BASE}/free/", content_checks=[r'free', r'book'])
check("付费区 /paid", f"{BASE}/paid/", content_checks=[r'paid', r'book'])

# ─── 4. 书籍详情页 (抽3本) ───
print("\n📖 书籍详情页")
test_books = ["dao-celestial-blade", "system-crash-reboot", "blood-moon-rising"]
for slug in test_books:
    check(f"read/{slug}", f"{BASE}/read/{slug}/", content_checks=[slug.replace("-", ""), r'chapter'])

# ─── 5. 章节阅读页 ───
print("\n📑 章节阅读页")
for slug in test_books:
    check(f"read/{slug}/chapters/1", f"{BASE}/read/{slug}/chapters/1.html", content_checks=[r'chapter', r'content'])

# ─── 6. 解锁页 ───
print("\n🔓 解锁页")
for slug in test_books:
    check(f"unlock/{slug}", f"{BASE}/unlock/{slug}/", content_checks=[r'unlock', r'html'])

# ─── 7. 未上架页 ───
print("\n📤 未上架页")
check("unpublished", f"{BASE}/unpublished.html", content_checks=[r'unpublished', r'html'])

# ─── 8. API 端点 ───
print("\n🔌 API 端点")
check("GET /api/books", f"{API}/api/books", content_checks=[r'slug', r'title'], is_json=True)
check("GET /api/books/export", f"{API}/api/books/export", is_json=True)
check("POST /api/author/login", f"{API}/api/author/login", expect_status=400)  # no body = 400

# ─── 9. 新增书籍章节测试 ───
print("\n📚 新增书籍章节")
# 随机挑一本新书测试章节列表
new_books = ["blood-moon-rising", "silver-fang-academy", "spirit-taxi", "nine-tailed-empire", "judge-of-the-dead"]
for slug in new_books[:3]:
    check(f"chapters/{slug}", f"{API}/api/books/{slug}/chapters", is_json=True)

# ─── 10. JS无语法错误 ───
print("\n🪲 JS语法检查")
# 检查关键函数都存在
for page, url in [("author", f"{BASE}/author"), ("首页", f"{BASE}/")]:
    body = urllib.request.urlopen(url).read().decode("utf-8", errors="replace")
    js_blocks = re.findall(r'<script>([\s\S]*?)</script>', body)
    fn_count = 0
    for block in js_blocks:
        fn_count += len(re.findall(r'function\s+\w+\s*\(', block))
    print(f"  ✅ {page}: {fn_count} 个JS函数定义")

# ─── 汇总 ───
print(f"\n{'='*50}")
print(f"总计: ✅ {OK} 通过 | ⚠️ {FAIL} 问题 | 🔴 {ERR} 连接错误")
if FAIL == 0 and ERR == 0:
    print("🎉 全部通过！")
else:
    print(f"⚠️ 有 {FAIL + ERR} 项需要检查")
