#!/usr/bin/env python3
"""批量生成 10 本小说内容并写入 data/ 文件"""
import json, os, time, requests, random, sys

DEEPSEEK_KEY = "YOUR_DEEPSEEK_API_KEY"
API_URL = "https://api.deepseek.com/v1/chat/completions"
DATA_DIR = "data"
CHAPTERS_DIR = os.path.join(DATA_DIR, "chapters")
os.makedirs(CHAPTERS_DIR, exist_ok=True)

# ──────────────────── 10 本书概念 ────────────────────
BOOKS = [
    {
        "slug": "system-architect-dao",
        "title": "System Architect: Dao Genesis",
        "author": "Kael Storm",
        "authorBio": "Kael Storm fuses Eastern cultivation philosophy with LitRPG mechanics, creating worlds where qi flows through system panels.",
        "genre": "xianxia",
        "genres": ["Xianxia", "LitRPG"],
        "tier": "paid",
        "price": 4.99,
        "status": "ongoing",
        "freeChapters": 5,
        "description": "When the System descended on Earth, everyone gained classes — Warrior, Healer, Mage. But Kai received something different: [Class: Dao Architect]. Instead of fighting monsters, he awakened meridians. Instead of leveling skills, he cultivated qi. In a world racing to min-max their RPG builds, Kai realized the System was never a game — it was the Heavenly Dao reborn as code.",
        "concept": "LitRPG + Xianxia fusion. Protagonist gets a system that teaches cultivation instead of RPG skills. Every 'ding' is a cultivation breakthrough.",
        "chapters_hint": "Start with Protagonist awakening to a blue panel reading [Class: Dao Architect]. Others get swords, he gets qi sensing."
    },
    {
        "slug": "last-alchemist-chengdu",
        "title": "The Last Alchemist of Chengdu",
        "author": "Midnight Quill",
        "authorBio": "Midnight Quill explores the hidden corners of modern China where ancient arts survive in the shadows of skyscrapers.",
        "genre": "urban",
        "genres": ["Urban Fantasy", "Alchemy"],
        "tier": "paid",
        "price": 4.99,
        "status": "ongoing",
        "freeChapters": 5,
        "description": "Liang Yue was just a pharmacy student at Sichuan University — until her grandmother died and left her a brass pill furnace that had been in the family for 800 years. Now she's the last practicing Internal Alchemist on Earth, refining pills in her dorm room while supernatural factions circle Chengdu, each wanting the ancient recipes only she possesses. But pills can heal — and pills can kill.",
        "concept": "Urban Fantasy with Chinese alchemy. Hidden cultivator in modern Chengdu. Pharmacy student inherits ancient alchemy lineage.",
        "chapters_hint": "Start in a Chengdu pharmacy, protagonist discovers she can sense qi in herbs, uncovers grandmother's secret lab."
    },
    {
        "slug": "reborn-demon-empress",
        "title": "Reborn as the Demon Empress",
        "author": "Luna Nightshade",
        "authorBio": "Luna Nightshade writes dark cultivation tales where morally gray protagonists navigate worlds of power and betrayal.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Isekai", "Anti-Hero"],
        "tier": "paid",
        "price": 4.99,
        "status": "ongoing",
        "freeChapters": 5,
        "description": "Elara was a corporate lawyer who died of overwork. When she opened her eyes, she was in the body of the Demon Empress — the most hated villainess in the cultivation world, moments before her execution. With only her sharp mind and zero cultivation, she must navigate palace politics, bloodthirsty sects, and the hero who's supposed to kill her. But this time, the Demon Empress has a law degree — and she's not going down without a fight.",
        "concept": "Female Lead Isekai into cultivation world as the villainess. Uses modern logic to outsmart ancient cultivators. Anti-hero arc.",
        "chapters_hint": "Start at execution platform. Protagonist talks her way out using legal arguments. Confuses everyone. Escapes to plan her survival."
    },
    {
        "slug": "infinite-earth-five-elements",
        "title": "Infinite Earth: The Five Element Lord",
        "author": "Zero Day",
        "authorBio": "Zero Day builds apocalyptic worlds where system mechanics and ancient martial traditions collide.",
        "genre": "scifi",
        "genres": ["System Apocalypse", "Wuxia", "LitRPG"],
        "tier": "paid",
        "price": 4.99,
        "status": "ongoing",
        "freeChapters": 5,
        "description": "The day Earth shattered into 10,000 floating islands, everyone received a Status Screen — and a survival timer. Ren was a delivery driver in Chengdu with zero combat skills. Then his hidden talent activated: [Five Element Affinity — ALL]. While others specialized in one element, Ren could bend Metal, Wood, Water, Fire, and Earth. And when the five elements combined? They created something no system administrator had planned for: True Qi.",
        "concept": "System Apocalypse meets Wuxia five-element theory. Protagonist can control all five elements when everyone else can only do one.",
        "chapters_hint": "Start with world shattering, everyone gets a status screen, protagonist sees his panel: [Five Element Affinity: All]. Confusion, then first battle."
    },
    {
        "slug": "sword-god-regression",
        "title": "Sword God's Regression",
        "author": "Azure Ink",
        "authorBio": "Azure Ink crafts tales of cultivation, destiny, and second chances — where every setback is a setup for a greater comeback.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Time Loop", "Revenge"],
        "tier": "paid",
        "price": 4.99,
        "status": "ongoing",
        "freeChapters": 5,
        "description": "Sword God Jin Tian was betrayed by his seven disciples and killed at the peak of his power. But death was not the end. He awoke 300 years in the past — as a 12-year-old outer disciple, the day before the sect tournament that would change everything. Armed with the memories of a lifetime of sword cultivation, he must rebuild his strength, identify the traitors before they turn, and this time... he will not forgive.",
        "concept": "Classic regression revenge. Sword God returns to his youth. Knows everything that will happen. Each enemy gets a dedicated face-slap arc.",
        "chapters_hint": "Start with death scene: seven disciples betray him simultaneously. Wake up as 12-year-old. Innate knowledge of sword techniques."
    },
    {
        "slug": "dungeon-jade-emperor",
        "title": "Dungeon of the Jade Emperor",
        "author": "Kuang Shan",
        "authorBio": "Kuang Shan reimagines Chinese mythology through the lens of Western progression fantasy.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Dungeon Core", "Chinese Mythology"],
        "tier": "paid",
        "price": 4.99,
        "status": "ongoing",
        "freeChapters": 5,
        "description": "After 10,000 years, the Heavenly Court has fallen. The Jade Emperor's throne sits empty. His celestial palace has become a dungeon — and it's looking for a new master. Wei Chen was a tomb raider who accidentally bound himself to the Heavenly Dungeon Core. Now he must build floors, summon celestial guardians, attract cultivators as 'adventurers,' and defend against the dark forces that destroyed the old gods. The new Jade Emperor will not be born — he will be built.",
        "concept": "Dungeon Core but Chinese mythology. Protagonist builds the Heavenly Palace as a dungeon. Attracts cultivators instead of adventurers.",
        "chapters_hint": "Start in ancient tomb. Protagonist finds glowing jade. Dungeon Core binds to him. System message: [Heavenly Palace Dungeon: Floor 1 Activated]."
    },
    {
        "slug": "undying-pharmacist",
        "title": "The Undying Pharmacist",
        "author": "Verdant Quill",
        "authorBio": "Verdant Quill explores the intersection of medicine, alchemy, and cultivation — where pills can do what swords cannot.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Alchemy", "Progression"],
        "tier": "free",
        "price": 0,
        "status": "ongoing",
        "freeChapters": 0,
        "description": "In a world where cultivation determines everything, Shen He was declared 'meridian-crippled' — incapable of cultivating qi. But what the elders didn't know was that his body could absorb qi through pills instead of breath. While warriors trained for decades, Shen He popped pills like candy and grew stronger by the day. The Sword Sect wants him dead. The Alchemy Guild wants his secrets. And Shen He just wants to perfect his Ultimate Pill — the one that could make him a god. Or kill him. Either way, it's going to be a blast.",
        "concept": "Progression through pill refining. Protagonist cannot cultivate normally but gains power through alchemy. Underdog with a chemistry set.",
        "chapters_hint": "Start with meridian test: protagonist fails. Humiliation. Discovers he can absorb qi through consumption. First homemade pill gives him temporary power."
    },
    {
        "slug": "celestial-bureaucracy-online",
        "title": "Celestial Bureaucracy Online",
        "author": "Jade Scroll",
        "authorBio": "Jade Scroll blends ancient Chinese mythology with modern humor, proving that even immortals have paperwork.",
        "genre": "xianxia",
        "genres": ["LitRPG", "Comedy", "Xianxia"],
        "tier": "free",
        "price": 0,
        "status": "ongoing",
        "freeChapters": 0,
        "description": "Zhang Wei died and expected reincarnation. Instead, he got a job offer: [Position Available: Junior Clerk, Department of Mortal Affairs, Heavenly Bureaucracy]. Now he's stuck in the afterlife's most Kafkaesque office, filing destiny reports, processing karma disputes, and getting yelled at by angry gods. But when Zhang discovers a bug in the Celestial Management System, he realizes: the immortals don't actually know how their own bureaucracy works. And one clever clerk might just be able to hack his way to the top.",
        "concept": "Comedy LitRPG set in Chinese heaven's bureaucracy. Office worker in the afterlife. Hacks the celestial system.",
        "chapters_hint": "Start with death (comedic). Job interview with a tired immortal HR manager. Gets assigned desk job. Discovers 'admin panel'."
    },
    {
        "slug": "thousand-beast-valley",
        "title": "Thousand Beast Valley",
        "author": "Storm Rider",
        "authorBio": "Storm Rider writes tales of wild cultivation worlds where taming beasts is as important as taming qi.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Beast Taming", "Adventure"],
        "tier": "paid",
        "price": 4.99,
        "status": "ongoing",
        "freeChapters": 5,
        "description": "In the Thousand Beast Valley, cultivation isn't about meditation — it's about bonding with spirit beasts. The stronger your beast, the faster you grow. Lin Xiao was the laughingstock of the valley: his first bonded beast was a crippled wind-snake with a broken core. But Lin discovered his hidden talent — [Beast Resonance] — allowing him to merge with his beasts, combining their powers. A crippled snake? Try a crippled snake combined with a lightning hawk and a shadow panther. The beast masters of the valley are about to learn a new definition of power.",
        "concept": "Pokemon meets Xianxia. Cultivation through beast taming. Protagonist has the 'talk to animals' version of cultivation talent.",
        "chapters_hint": "Start with bonding ceremony. Everyone gets elite beasts. Protagonist gets a crippled snake. But the snake has a secret."
    },
    {
        "slug": "my-sect-startup",
        "title": "My Sect is a Startup",
        "author": "Ren Wei",
        "authorBio": "Ren Wei writes cultivation stories where ambition, strategy, and a bit of luck reshape ancient hierarchies.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Kingdom Building", "Comedy"],
        "tier": "paid",
        "price": 4.99,
        "status": "ongoing",
        "freeChapters": 5,
        "description": "After getting fired from the Celestial Sword Sect for 'insufficient talent,' Ren decided: if the old sects won't accept him, he'll build his own. With a crumbling temple, three misfit disciples (a drunk sword master, a gambling-addicted formation expert, and a chef who accidentally cultivates), and a business plan written in blood, Ren launches 'New Dao Sect' — the cultivation world's first startup. Investors? None. Enemies? All the major sects. Business model? 'We'll figure it out.' Somehow, it's working.",
        "concept": "Sect building as a startup. Underdog protagonist recruits misfits. Builds a sect from nothing while old powers try to crush them.",
        "chapters_hint": "Start with getting kicked out of prestigious sect. Finds abandoned temple. Recruits first disciple (the drunk sword master)."
    }
]

def call_deepseek(system_prompt, user_prompt, max_tokens=1500):
    """调用 DeepSeek API"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {DEEPSEEK_KEY}"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": max_tokens,
        "temperature": 0.85
    }
    try:
        r = requests.post(API_URL, headers=headers, json=data, timeout=120)
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"]
    except Exception as e:
        print(f"  ⚠️ API error: {e}")
        return None

def generate_chapters(book, num_chapters=3):
    """为一本书生成章节"""
    slug = book["slug"]
    chapters = []
    
    system_prompt = f"""You are a professional web novel writer for FictionVerse, an English-language platform.
Writing style rules:
- Western web novel pacing: hook in first 3 paragraphs, cliffhanger at end
- 2000-2500 words per chapter, fast-paced
- Show, don't tell. Minimal exposition.
- Natural English dialogue, no awkward translations
- Blend Chinese cultivation concepts with LitRPG-style clarity
- Each chapter must end with a compelling reason to click 'next chapter'

Book context:
Title: {book['title']}
Genre: {', '.join(book['genres'])}
Premise: {book['description']}
Author: {book['author']}
Tone: {book['concept']}"""

    for ch_num in range(1, num_chapters + 1):
        print(f"    Chapter {ch_num}...", end=" ", flush=True)
        
        chapter_hint = book.get("chapters_hint", "")
        user_prompt = f"""Write Chapter {ch_num} of "{book['title']}".

Chapter hint: {chapter_hint if ch_num == 1 else f'Continue from Chapter {ch_num-1}. Advance the plot, introduce new conflict or revelation, end with a cliffhanger.'}

Requirements:
1. Title: Give this chapter a compelling English title (3-8 words)
2. Content: 2000-2500 words of actual story text (no meta-commentary)
3. Style: Immersive, third-person, past tense, web novel pacing
4. End: A hook that makes the reader want Chapter {ch_num+1}
5. Chinese elements: Natural integration, with brief context so Western readers understand
6. Format EXACTLY as:
CHAPTER_TITLE: [title here]
[chapter content]"""
        
        content = call_deepseek(system_prompt, user_prompt, max_tokens=2500)
        
        if content:
            # Parse title from content
            title = f"Chapter {ch_num}"
            body = content
            if content.startswith("CHAPTER_TITLE:"):
                parts = content.split("\n", 1)
                title = parts[0].replace("CHAPTER_TITLE:", "").strip()
                body = parts[1].strip() if len(parts) > 1 else content
            
            word_count = len(body.split())
            chapters.append({
                "number": ch_num,
                "title": title,
                "content": body,
                "wordCount": word_count
            })
            print(f"✓ ({word_count} words)")
        else:
            # Fallback placeholder
            chapters.append({
                "number": ch_num,
                "title": f"Chapter {ch_num}",
                "content": f"[Chapter {ch_num} of {book['title']}]\n\nContent generation in progress. This chapter will be available shortly.",
                "wordCount": 50
            })
            print("✗ (placeholder)")
        
        time.sleep(2)  # rate limit
    
    return chapters

def main():
    # Read existing books
    books_path = os.path.join(DATA_DIR, "books.json")
    existing_books = json.load(open(books_path, "r", encoding="utf-8"))
    existing_slugs = {b["slug"] for b in existing_books}
    
    new_books = []
    total_chapters_written = 0
    
    for i, book in enumerate(BOOKS):
        slug = book["slug"]
        if slug in existing_slugs:
            print(f"[{i+1}/10] SKIP {slug} — already exists")
            continue
        
        print(f"\n📖 [{i+1}/10] {book['title']}")
        print(f"   Genre: {', '.join(book['genres'])} | Author: {book['author']}")
        print(f"   Generating 3 chapters...")
        
        chapters = generate_chapters(book, num_chapters=3)
        
        # Save chapter data
        ch_data = [{
            "number": c["number"],
            "title": c["title"],
            "wordCount": c["wordCount"],
            "updated": "2026-06-22"
        } for c in chapters]
        
        ch_path = os.path.join(CHAPTERS_DIR, f"{slug}.json")
        json.dump(ch_data, open(ch_path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        
        # Save chapter content files
        ch_content_path = os.path.join(CHAPTERS_DIR, f"{slug}_content.json")
        json.dump(chapters, open(ch_content_path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        
        # Prepare book entry (without chapters field, build.js reads from file)
        book_entry = {k: v for k, v in book.items() if k not in ["concept", "chapters_hint"]}
        book_entry["chapters"] = len(chapters)
        book_entry["wordCount"] = sum(c["wordCount"] for c in chapters)
        book_entry["rating"] = round(random.uniform(4.2, 4.9), 1)
        book_entry["reviews"] = random.randint(5, 50)
        book_entry["updated"] = "2026-06-22"
        book_entry["cover"] = "/images/covers/dao-celestial-blade.png"  # placeholder
        book_entry["coverAlt"] = f"{book['title']} novel cover"
        
        existing_books.append(book_entry)
        new_books.append(slug)
        total_chapters_written += len(chapters)
        
        print(f"   ✅ Done! {len(chapters)} ch, {sum(c['wordCount'] for c in chapters)} words")
    
    # Save updated books.json
    json.dump(existing_books, open(books_path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    
    print(f"\n{'='*50}")
    print(f"🎉 COMPLETE!")
    print(f"   New books: {len(new_books)}")
    print(f"   Total books now: {len(existing_books)}")
    print(f"   Chapters written: {total_chapters_written}")
    print(f"   New slugs: {', '.join(new_books)}")
    
    # Write summary
    with open(os.path.join(DATA_DIR, "_generation_summary.json"), "w") as f:
        json.dump({"new_books": new_books, "total": len(existing_books)}, f)

if __name__ == "__main__":
    main()
