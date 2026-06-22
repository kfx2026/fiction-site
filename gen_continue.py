#!/usr/bin/env python3
"""章节补写器 — 为所有书续写到20章，保持人物和情节连续性"""
import json, os, time, requests, random, re, sys

DEEPSEEK_KEY = "YOUR_DEEPSEEK_API_KEY"
API_URL = "https://api.deepseek.com/v1/chat/completions"
DATA_DIR = "data"
CHAPTERS_DIR = os.path.join(DATA_DIR, "chapters")
TARGET_CHAPTERS = 20  # 每本最低章节数
MAX_BOOKS_PER_RUN = 34  # 全部

def call_deepseek(system_prompt, user_prompt, max_tokens=2500):
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {DEEPSEEK_KEY}"}
    data = {"model": "deepseek-chat", "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}], "max_tokens": max_tokens, "temperature": 0.9}
    try:
        r = requests.post(API_URL, headers=headers, json=data, timeout=300)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"    ⚠️ {e}")
        return None

def read_last_chapter_content(slug):
    """读最后一章内容做上下文"""
    cp = os.path.join(CHAPTERS_DIR, f"{slug}_content.json")
    if os.path.exists(cp):
        chs = json.load(open(cp, "r", encoding="utf-8"))
        if chs:
            last = chs[-1]
            content = last.get("content", "")
            # truncate to last ~500 words for context
            words = content.split()
            if len(words) > 500:
                content = "..." + " ".join(words[-500:])
            return last["number"], last["title"], content
    return 0, "Unknown", "(No previous content)"

def continue_book(book, total_existing):
    slug = book["slug"]
    ch_path = os.path.join(CHAPTERS_DIR, f"{slug}.json")
    existing = json.load(open(ch_path, "r", encoding="utf-8")) if os.path.exists(ch_path) else []
    current_count = len(existing)
    need = TARGET_CHAPTERS - current_count
    
    if need <= 0:
        return [], 0
    
    print(f"\n📖 {book['title']} ({current_count}→{TARGET_CHAPTERS} ch, generating {need})")
    
    # Read last chapter for character/plot continuity
    last_num, last_title, last_fragment = read_last_chapter_content(slug)
    
    # Build character summary from description
    desc = book.get("description", "")
    concept = book.get("concept", desc[:100])
    
    system_prompt = f"""You are continuing an English web novel. Maintain ABSOLUTE consistency with previous chapters.

CRITICAL RULES:
1. Same characters (names, personalities, abilities, relationships)
2. Same world rules (power system, geography, factions)
3. Plot must logically follow previous events
4. NEVER contradict earlier chapters
5. Show character growth across chapters (not static)
6. Each chapter: hook → conflict → revelation → cliffhanger
7. 2000-2500 words per chapter, fast-paced
8. NEVER use AI phrases like "delve into", "furthermore", "in conclusion"
9. Show emotions through action/dialogue, never describe them

BOOK: {book['title']}
AUTHOR: {book['author']}
GENRES: {', '.join(book.get('genres', []))}
PREMISE: {desc}
LATEST CHAPTER (#{last_num}): {last_title}
LAST SCENE (for continuity): {last_fragment}"""

    new_chapters = []
    for i in range(need):
        ch_num = current_count + i + 1
        print(f"    Ch {ch_num}...", end=" ", flush=True)
        
        user_prompt = f"Write Chapter {ch_num} of '{book['title']}'."
        if i == 0:
            user_prompt += f"\n\nThis IMMEDIATELY follows Chapter {last_num} '{last_title}'. Start exactly where that chapter ended. Advance the plot with a new conflict, revelation, or power progression. End with a cliffhanger."
        else:
            user_prompt += f"\n\nContinue from Chapter {ch_num-1}. Introduce a new twist or escalate existing conflict. Maintain ALL character voices. End with a strong cliffhanger."
        
        user_prompt += "\n\nFORMAT:\nCHAPTER_TITLE: [3-8 word title]\n[2000-2500 word chapter]"
        
        content = call_deepseek(system_prompt, user_prompt, max_tokens=2500)
        if content:
            title = f"Chapter {ch_num}"
            body = content
            if content.startswith("CHAPTER_TITLE:"):
                parts = content.split("\n", 1)
                title = parts[0].replace("CHAPTER_TITLE:", "").strip().strip('"')
                body = parts[1].strip() if len(parts) > 1 else content
            
            # De-AI pass
            body = re.sub(r'\b(Delve into|It is important to note|Furthermore,|Ultimately,|In conclusion,)\b', '', body)
            
            wc = len(body.split())
            new_chapters.append({"number": ch_num, "title": title, "content": body, "wordCount": wc})
            
            # Update last fragment for next iteration
            words = body.split()
            last_fragment = "..." + " ".join(words[-300:]) if len(words) > 300 else body
            last_num, last_title = ch_num, title
            
            print(f"✓ {wc}w")
        else:
            new_chapters.append({"number": ch_num, "title": f"Chapter {ch_num}", "content": "...", "wordCount": 0})
            print("✗")
        
        time.sleep(2.5)
    
    return new_chapters, len(new_chapters)

def main():
    books_path = os.path.join(DATA_DIR, "books.json")
    all_books = json.load(open(books_path, "r", encoding="utf-8"))
    
    total_new = 0
    for i, book in enumerate(all_books[:MAX_BOOKS_PER_RUN]):
        slug = book["slug"]
        ch_path = os.path.join(CHAPTERS_DIR, f"{slug}.json")
        if not os.path.exists(ch_path):
            print(f"[{i+1}/{len(all_books)}] SKIP {slug} — no chapters file")
            continue
        
        existing = json.load(open(ch_path, "r", encoding="utf-8"))
        current = len(existing)
        if current >= TARGET_CHAPTERS:
            print(f"[{i+1}/{len(all_books)}] SKIP {book['title']} — already {current} ch ✓")
            continue
        
        new_chs, added = continue_book(book, len(all_books))
        
        if new_chs:
            # Update metadata
            existing.extend([{"number": c["number"], "title": c["title"], 
                            "wordCount": c["wordCount"], "updated": "2026-06-22"} for c in new_chs])
            json.dump(existing, open(ch_path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
            
            # Update content cache
            cp = os.path.join(CHAPTERS_DIR, f"{slug}_content.json")
            old_content = json.load(open(cp, "r", encoding="utf-8")) if os.path.exists(cp) else []
            old_content.extend(new_chs)
            json.dump(old_content, open(cp, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
            
            # Update book entry
            book["chapters"] = len(existing)
            book["wordCount"] = sum(c["wordCount"] for c in existing)
            book["updated"] = "2026-06-22"
            book["tier"] = "free"
            book["price"] = 0
            book["freeChapters"] = 0
            total_new += added
            
            print(f"   ✅ Done! Now {len(existing)} chapters, {book['wordCount']} words")
    
    # Save updated books.json
    json.dump(all_books, open(books_path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    
    total_ch = sum(b.get("chapters", 0) for b in all_books)
    total_w = sum(b.get("wordCount", 0) for b in all_books)
    print(f"\n{'='*50}")
    print(f"🎉 Chapter continuations complete!")
    print(f"   Books: {len(all_books)}")
    print(f"   New chapters added: {total_new}")
    print(f"   Total chapters: {total_ch}")
    print(f"   Total words: {total_w} (~{total_w//1000}k)")

if __name__ == "__main__":
    main()
