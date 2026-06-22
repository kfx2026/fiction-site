#!/usr/bin/env python3
"""批量生成 20 本英文爽文（聊斋/白蛇/山海经/狼人/穿越/重生）"""
import json, os, time, requests, random, re

DEEPSEEK_KEY = "YOUR_DEEPSEEK_API_KEY"
API_URL = "https://api.deepseek.com/v1/chat/completions"
DATA_DIR = "data"
CHAPTERS_DIR = os.path.join(DATA_DIR, "chapters")
os.makedirs(CHAPTERS_DIR, exist_ok=True)

# ──────────────────── 20 本书 ────────────────────
BOOKS = [
    # ===== 狼人 =====
    {
        "slug": "blood-moon-rising",
        "title": "Blood Moon Rising: The Wolf King's Awakening",
        "author": "Fenrir Shadow",
        "authorBio": "Fenrir Shadow writes dark transformation tales where ancient bloodlines clash with modern survival instincts.",
        "genre": "urban",
        "genres": ["Werewolf", "Urban Fantasy", "Progression"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "Liam never understood why he blacked out during full moons. Then on his 21st birthday, the Wolf King bloodline awakened — and so did the ancient war between werewolf clans. With a rogue pack hunting him for his alpha bloodline and a mysterious woman who smells of moonlight and danger, Liam has seven days to master his transformation before the Blood Moon ceremony. Lose, and his soul belongs to the wolf forever.",
        "concept": "Werewolf + Cultivation bloodline system. Modern man discovers ancient wolf bloodline. Clan politics and moon-powered cultivation.",
        "chapters_hint": "Start at a full moon party. Protagonist transforms unwillingly. Wakes up in the forest covered in blood with wolf senses."
    },
    {
        "slug": "silver-fang-academy",
        "title": "Silver Fang Academy",
        "author": "Luna Grey",
        "authorBio": "Luna Grey explores the hidden societies of supernatural beings living alongside modern humanity.",
        "genre": "urban",
        "genres": ["Werewolf", "School Life", "Romance"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "Silver Fang Academy looks like an elite boarding school. In reality, it's a training ground for young werewolves. Maya is the first half-wolf, half-human hybrid ever admitted — and everyone wants her to fail. The purebloods sneer. The professors doubt. But Maya didn't survive 18 years hiding her wolf to quit now. She'll claw her way to the top, one rival at a time.",
        "concept": "Werewolf academy meets underdog story. Half-breed in pureblood school. Romance subplot with alpha heir.",
        "chapters_hint": "Start with orientation. Protagonist hides her hybrid nature. First shifting class reveals her wolf is a rare silver-coated variant."
    },
    # ===== 重生 =====
    {
        "slug": "merchant-prince-second-life",
        "title": "The Merchant Prince's Second Life",
        "author": "Wei Lin",
        "authorBio": "Wei Lin reimagines historical Chinese commerce through the lens of progression fantasy and rebirth narratives.",
        "genre": "xianxia",
        "genres": ["Rebirth", "Business Building", "Xianxia"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "Zhao Feng was China's wealthiest merchant — until his five sons betrayed him, stole his fortune, and left him to die in a gutter. When he opened his eyes, he was 18 again, with nothing but the clothes on his back... and forty years of business knowledge in his head. This time, no sons. No mercy. He'll build an empire using cultivation resources as commodities, corner the qi stone market, and make his past-life betrayers kneel before they even know who he is.",
        "concept": "Rebirth + business empire building in cultivation world. Merchant reborn with memories. Economic warfare instead of swords.",
        "chapters_hint": "Start with death scene and awakening. Protagonist is 18, working in a qi stone mine. Recognizes this is the day the mine discovers a huge vein — and last time, someone else got rich."
    },
    {
        "slug": "doctor-reborn-apocalypse",
        "title": "Doctor Reborn in the Apocalypse",
        "author": "Chen Wei",
        "authorBio": "Chen Wei writes survival fantasy where medical knowledge becomes the ultimate power in world-ending scenarios.",
        "genre": "xianxia",
        "genres": ["Rebirth", "Apocalypse", "Medical"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "Dr. Lin Mei spent 20 years as a battlefield surgeon in the post-apocalyptic wasteland, only to be murdered by the warlord she saved. When she wakes up, it's Day Zero — 24 hours before the qi storms begin, before the monsters, before humanity fractures. She knows every safe zone, every rare herb, every betrayal that's coming. She has one day to prepare. And this time, she's not saving anyone who doesn't deserve it.",
        "concept": "Rebirth + Apocalypse with medical angle. Surgeon returns to Day Zero. Uses medical/alchemy knowledge to prepare for doomsday.",
        "chapters_hint": "Start with death in future. Wakes in her old apartment. Checks the date — realizes it's the day before everything changes. Immediately starts raiding pharmacies."
    },
    # ===== 穿越 =====
    {
        "slug": "delivery-driver-gods",
        "title": "Delivery Driver of the Gods",
        "author": "Lao Wang",
        "authorBio": "Lao Wang delights in placing ordinary modern Chinese characters into extraordinary mythological circumstances.",
        "genre": "xianxia",
        "genres": ["Isekai", "Comedy", "Chinese Mythology"],
        "tier": "free", "price": 0, "status": "ongoing",
        "freeChapters": 0,
        "description": "Wang Lei was the fastest delivery driver in Chengdu. Then his last order of the night — to an address that didn't exist — dropped him straight into the Heavenly Court. Turns out, the gods have a package delivery problem: no one wants to courier immortality peaches across demon-infested territory. But Wang Lei has a 99.7% on-time delivery rating, an electric scooter that somehow still works in heaven, and absolutely no cultivation ability. The gods are about to learn: never underestimate a delivery driver on commission.",
        "concept": "Modern delivery driver transmigrates to Chinese heaven. Comedy. Uses delivery skills to navigate celestial bureaucracy. Zero combat, all logistics.",
        "chapters_hint": "Start with a normal delivery day. GPS glitches, sends him to a temple. Falls through a portal. Lands at the Heavenly Court's package sorting center."
    },
    {
        "slug": "engineer-built-heaven",
        "title": "The Engineer Who Built Heaven",
        "author": "Zhang Wei",
        "authorBio": "Zhang Wei explores what happens when modern engineering principles collide with ancient mystical systems.",
        "genre": "xianxia",
        "genres": ["Isekai", "Kingdom Building", "Engineering"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "Civil engineer Liu Yang died in a bridge collapse. When he transmigrated to the Heavenly Domain, he found the celestial realm in shambles — crumbling cloud bridges, leaking qi pipelines, a Jade Emperor who's been trying to fix the same leak for 800 years. The immortals have infinite power but zero understanding of structural integrity. Armed with a calculator, reinforced qi-steel, and a very unimpressed attitude toward divine architecture, Liu Yang is going to renovate heaven. Whether the gods like it or not.",
        "concept": "Modern engineer reborn in Chinese heaven. Fixes celestial infrastructure. Every chapter = one heavenly project completed with modern methods.",
        "chapters_hint": "Start with bridge collapse death. Wake up in heaven. First sight: a 'Bridge of Immortality' that's clearly structurally unsound. Starts calculating load distribution."
    },
    # ===== 聊斋改编 =====
    {
        "slug": "fox-wife-bargain",
        "title": "The Fox Wife's Bargain",
        "author": "Lan Hua",
        "authorBio": "Lan Hua breathes new life into classical Chinese ghost stories, retelling them for modern fantasy readers.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Romance", "Liaozhai Adaptation"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "Scholar Chen Yuan moved to a remote mountain temple to study for the imperial exams. When a fox spirit appeared at his door offering a bargain — one year of companionship for one wish granted — he thought he understood the deal. But the fox, Mei, isn't just any spirit. She's the last of the Nine-Tailed Fox lineage, hunted by celestial exorcists. By hiding with a mortal scholar, she's safe. But the longer she stays, the more she realizes: Chen Yuan isn't as mortal as he seems. And his 'wish' might destroy them both.",
        "concept": "Liaozhai fox spirit adaptation. Scholar + fox spirit romance. Hidden identities on both sides. Celestial hunters pursuing them.",
        "chapters_hint": "Start with scholar arriving at abandoned temple. Night falls. A woman appears at his door — but her shadow shows nine tails."
    },
    {
        "slug": "painted-skin-retold",
        "title": "Painted Skin: A Modern Retelling",
        "author": "Mei Lin",
        "authorBio": "Mei Lin updates classical Chinese horror for contemporary audiences, finding terror in the spaces between ancient and modern.",
        "genre": "urban",
        "genres": ["Urban Fantasy", "Horror", "Liaozhai Adaptation"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "In modern Shanghai, cosmetic surgeon Dr. Fang has a secret: his most popular procedure — the one that makes women look 20 years younger overnight — uses skin harvested from spirits. When one of his patients' faces begins to rot in reverse, and a wandering Taoist starts asking questions, Fang realizes the spirits want their skins back. And they're coming for his collection. A chilling modern reimagining of the classic Liaozhai tale 'Painted Skin.'",
        "concept": "Modern adaptation of Liaozhai's Painted Skin. Cosmetic surgeon uses ghost skin. Supernatural horror in contemporary Shanghai.",
        "chapters_hint": "Start with a woman coming to the clinic — her face is literally peeling off at night. Flashback to Dr. Fang discovering the 'procedure' in an old medical text."
    },
    {
        "slug": "ghost-scholar-academy",
        "title": "The Ghost Scholar's Academy",
        "author": "Qing Lian",
        "authorBio": "Qing Lian crafts tales where scholars and spirits collide in academies that bridge the living and the dead.",
        "genre": "xianxia",
        "genres": ["School Life", "Liaozhai Adaptation", "Mystery"],
        "tier": "free", "price": 0, "status": "ongoing",
        "freeChapters": 0,
        "description": "The Wutong Academy has a 100% exam pass rate. But here's the catch: half the students are ghosts. They died before taking the imperial exams and now haunt the academy, studying alongside the living. New student Bai Su can see them all — the drowned scholar in the library, the suicide candidate in the west wing, the murdered prodigy who tutors for extra incense. When one ghost student starts killing the living to 'transfer' their life qi, Bai Su must solve a murder mystery where the victims are already dead... and the killer might be too.",
        "concept": "Liaozhai ghost scholar adaptation. Academy with dead students. Protagonist can see ghosts. Murder mystery in supernatural boarding school.",
        "chapters_hint": "Start with Bai Su arriving at the academy. Immediately notices a student walking through a wall. The ghost student waves at her. 'You can see me?'"
    },
    {
        "slug": "judge-of-the-dead",
        "title": "Judge of the Dead: The Soul Reaper's Apprentice",
        "author": "Yan Luo",
        "authorBio": "Yan Luo descends into the Chinese underworld to find stories of justice, redemption, and bureaucratic nightmares.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Underworld", "Liaozhai Adaptation"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "When death row inmate Jiang Chen was executed, he expected either nothingness or hell. He didn't expect a job offer. The Ten Judges of Diyu — the Chinese underworld — are understaffed. They need someone alive enough to chase escaped souls back to the mortal realm, but dead enough to cross the veil. Jiang Chen becomes a Soul Reaper: hunting rogue spirits by night, pretending to be a living human by day, and slowly discovering that his own death sentence wasn't justice — it was a setup by someone very much alive.",
        "concept": "Chinese underworld adaptation. Executed criminal becomes soul reaper. Each chapter = catching an escaped soul + discovering more about his own case.",
        "chapters_hint": "Start with execution scene. Blackout. Wake up in a massive courtroom with ten giant figures staring down. 'Jiang Chen. You've been selected for community service.'"
    },
    # ===== 白蛇传改编 =====
    {
        "slug": "serpent-kiss-modern",
        "title": "Serpent's Kiss",
        "author": "Xu Xian",
        "authorBio": "Xu Xian retells the most romantic story in Chinese mythology for a world where magic hides in plain sight.",
        "genre": "urban",
        "genres": ["Urban Fantasy", "Romance", "Bai She Adaptation"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "Xu Ming was a quiet pharmacist working at a traditional medicine shop in Hangzhou. Then Bai Suyin walked in — beautiful, mysterious, and asking for herbs that hadn't been used in a thousand years. She's not just a woman. She's a thousand-year-old white snake spirit who's been cultivating to become human. And she's chosen Xu Ming as her 'heart trial' — the mortal she must love to complete her transformation. But the Abbot Fahai has tracked her across lifetimes, and he will stop at nothing to prevent a snake from becoming human.",
        "concept": "Modern White Snake Legend. Pharmacist meets snake spirit. Fahai as supernatural hunter. Romance vs. duty. Modern Hangzhou setting.",
        "chapters_hint": "Start at the pharmacy. Bai Suyin enters during a rainstorm. She asks for 'century ginseng root' — which hasn't existed in 800 years. He happens to have one."
    },
    {
        "slug": "green-snake-rises",
        "title": "The Green Snake Rises",
        "author": "Xiao Qing",
        "authorBio": "Xiao Qing gives voice to the side characters of legend, showing that every snake has her own path to power.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Female Lead", "Bai She Adaptation"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "Everyone knows the White Snake's story. But what about Xiao Qing — the green snake, the loyal sister, the one who was always 'less'? After her sister Bai Suyin was sealed under Leifeng Pagoda, Xiao Qing vanished into the mountains to cultivate alone. Five hundred years later, she emerges — no longer the 'little sister.' The celestial court has changed, the old gods are weak, and a green snake with five centuries of rage and cultivation might just be the most dangerous creature in all three realms. Fahai thought he defeated the White Snake. He's never met her sister.",
        "concept": "Green Snake spin-off. Revenge arc. Xiao Qing as protagonist. 500 years of cultivation. Returns to a world that forgot her.",
        "chapters_hint": "Start at Leifeng Pagoda the moment Bai Suyin is sealed. Xiao Qing watches helplessly. Swears an oath. Flash forward 500 years to her emergence."
    },
    # ===== 山海经神话 =====
    {
        "slug": "beastmaster-nine-realms",
        "title": "Beastmaster of the Nine Realms",
        "author": "Shan Hai",
        "authorBio": "Shan Hai brings the creatures of the Classic of Mountains and Seas into breathtaking fantasy adventure.",
        "genre": "xianxia",
        "genres": ["Beast Taming", "Adventure", "Shan Hai Jing"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "In a world where the creatures of Shan Hai Jing are real, beast tamers are the most powerful cultivators. Su Yun was a stable boy who accidentally bonded with a Qiongqi — a winged tiger from the ancient texts, supposedly untamable. When the Nine Realms Tournament is announced — a competition to capture and bond with the most dangerous mythical beasts — Su Yun enters with nothing but a rope, a half-starved Qiongqi cub, and the desperate hope of saving his village from a corrupt sect. He doesn't need to win. He just needs to survive beasts that eat winners for breakfast.",
        "concept": "Pokémon meets Shan Hai Jing. Tame mythological creatures. Tournament arc. Underdog with a supposedly 'useless' starter beast.",
        "chapters_hint": "Start with protagonist finding an injured cub in the forest. It's tiny, weak — but when full grown it will be a Qiongqi. He binds it."
    },
    {
        "slug": "phoenix-feather-sect",
        "title": "The Phoenix Feather Sect",
        "author": "Feng Huang",
        "authorBio": "Feng Huang reimagines the phoenix mythos through the lens of sect politics and cultivation power systems.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Sect Building", "Mythology"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "Every 500 years, a phoenix dies and is reborn. The Phoenix Feather Sect was built around that cycle — cultivating disciples under the phoenix's blessing. But the last phoenix died 600 years ago, and no new one has appeared. The sect is dying. Feng Lian, the sect's weakest outer disciple, discovers why: the phoenix has been reborn, but not as a bird. It's been reborn... as her. Now every major sect wants to capture her, dissect her, or use her as their personal power source. And Feng Lian has to figure out how to be a phoenix before they figure out where she is.",
        "concept": "Phoenix mythology. Girl discovers she IS the reborn phoenix. Hunted by sects. Must master phoenix powers while hiding.",
        "chapters_hint": "Start with sect ceremony — the annual 'Phoenix Calling' that hasn't worked in centuries. Feng Lian's blood causes the altar to ignite. She runs."
    },
    {
        "slug": "keeper-of-the-kun-peng",
        "title": "Keeper of the Kun Peng",
        "author": "Yu Zhou",
        "authorBio": "Yu Zhou explores the vast mythic creatures of Chinese legend through stories of impossible bonds and epic journeys.",
        "genre": "xianxia",
        "genres": ["Adventure", "Mythology", "Shan Hai Jing"],
        "tier": "free", "price": 0, "status": "ongoing",
        "freeChapters": 0,
        "description": "The Kun Peng is the largest creature in Chinese mythology — a fish so vast it becomes a bird whose wings span the sky. For ten thousand years, it has slept at the bottom of the Northern Ocean. Fisherman's son Hai Ping never expected to see it. But when a celestial war threatens to wake the Kun Peng — and its awakening would flood the mortal world — Hai Ping becomes the creature's unlikely 'Keeper,' bonded by an ancient seal. He must calm the Kun Peng, navigate the politics of gods who want to use it as a weapon, and figure out how a teenage fisherman convinces a creature the size of a mountain to go back to sleep.",
        "concept": "Shan Hai Jing Kun Peng myth. Boy bonds with the world's largest creature. Political intrigue among gods. Coming-of-age adventure.",
        "chapters_hint": "Start with a fishing trip gone wrong. Net catches something impossible. Boy is pulled underwater and sees a single eye the size of a city. It speaks."
    },
    {
        "slug": "nine-tailed-empire",
        "title": "Nine-Tailed Empire",
        "author": "Hu Li",
        "authorBio": "Hu Li crafts tales of fox spirits ascending from tricksters to emperors in worlds of cultivation and cunning.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Kingdom Building", "Shan Hai Jing"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "The Nine-Tailed Foxes were once the tricksters of the cultivation world — powerful but never taken seriously. When the Fox Queen is massacred by the Dragon Emperor, her youngest daughter, Su Ling, inherits one tail and a death sentence. With the fox clans scattered and hunted, Su Ling must do what no fox has ever done: unite the nine clans, grow all nine tails, and build an empire strong enough to challenge the dragons. The dragons think they've already won. They forgot that foxes don't fight fair.",
        "concept": "Nine-tailed fox mythology. Fox spirit builds empire. Revenge against dragons. Political strategy meets cultivation.",
        "chapters_hint": "Start with the massacre. Su Ling is 14, watches her mother the Fox Queen fall. Flees with one tail. Vows revenge. Ten years later..."
    },
    {
        "slug": "children-of-the-dragon",
        "title": "Children of the Dragon",
        "author": "Long Wei",
        "authorBio": "Long Wei reimagines the nine dragon sons of Chinese myth as a family saga of cultivation, rivalry, and destiny.",
        "genre": "xianxia",
        "genres": ["Xianxia", "Family Saga", "Dragon Mythology"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "The Dragon Emperor had nine sons — each born with a different aspect of dragon power, each destined to rule one realm. But the emperor died without naming an heir. Now the nine brothers must compete in the Dragon Ascension Trials: a series of tests across the mortal and immortal realms. The winner becomes emperor. The losers... well, dragon sibling rivalry is legendary for a reason. Youngest son Long Jie was never supposed to win — too small, too weak, too 'human-like.' But Jie has something his brothers don't: the ability to learn from mortals.",
        "concept": "Chinese dragon mythology. Nine dragon sons compete for throne. Underdog youngest son. Travels through mortal and immortal realms learning skills.",
        "chapters_hint": "Start with the Emperor's death. Nine brothers gather. The will is read: 'The Ascension Trials shall decide.' Jie is laughed at. He decides to train in the mortal world."
    },
    # ===== 现代人穿越神话 =====
    {
        "slug": "samsara-app",
        "title": "The Samsara App",
        "author": "Liu Xing",
        "authorBio": "Liu Xing imagines technology that bridges the ancient and the digital, where apps become gateways to reincarnation.",
        "genre": "urban",
        "genres": ["Urban Fantasy", "Modern", "Reincarnation"],
        "tier": "free", "price": 0, "status": "ongoing",
        "freeChapters": 0,
        "description": "There's an app on the dark web called Samsara. Download it, and you can live a past life — not as a memory, but in real-time. You wake up in ancient China, in medieval Europe, in mythical kingdoms. But here's the catch: what happens in the past affects the present. And someone is using Samsara to rewrite history. College student Zhang Xia discovers the app by accident. Now she's jumping between lives — a Tang Dynasty poet, a Warring States strategist, a Qing Dynasty rebel — trying to stop the person who's been manipulating reincarnation for centuries. The past isn't past. It's being edited.",
        "concept": "Modern tech + reincarnation. App lets you live past lives. Mystery thriller across Chinese history. Each 'life' is a new mini-arc.",
        "chapters_hint": "Start with finding the app on a dark web forum. First jump: Tang Dynasty. She's a concubine about to be executed. She uses modern knowledge to escape."
    },
    {
        "slug": "gods-gig-economy",
        "title": "Gods of the Gig Economy",
        "author": "Wang Cai",
        "authorBio": "Wang Cai delights in imagining what happens when ancient deities clock into modern jobs.",
        "genre": "urban",
        "genres": ["Urban Fantasy", "Comedy", "Modern Mythology"],
        "tier": "free", "price": 0, "status": "ongoing",
        "freeChapters": 0,
        "description": "When the Heavenly Court went bankrupt (apparently immortality doesn't generate revenue), the Chinese gods were forced to get mortal jobs. Guan Yu works security. Caishen is a financial advisor (naturally). The Monkey King drives a food delivery scooter — and has a 2.1 rating. Nuwa works at a fertility clinic. The Kitchen God runs a food truck. And the Jade Emperor? He's trying to restructure heaven as a tech startup. But the demons have adapted too — they're running gig economy apps as fronts for soul harvesting. The gods have to unionize. Heaven help us.",
        "concept": "Comedy. Chinese gods doing modern jobs. Monkey King as delivery driver. Corporate satire meets Chinese mythology.",
        "chapters_hint": "Start with the Jade Emperor holding a board meeting. 'We're burning through incense faster than we're collecting it. We need a pivot.' Guan Yu: 'I'm not doing TikTok.'"
    },
    {
        "slug": "spirit-taxi",
        "title": "Spirit Taxi",
        "author": "Chen Mo",
        "authorBio": "Chen Mo navigates the midnight streets where the living and dead share rides and secrets.",
        "genre": "urban",
        "genres": ["Urban Fantasy", "Supernatural", "Mystery"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "Taxi driver Old Ma has been driving the night shift in Chengdu for 30 years. He knows every street, every shortcut... and every ghost. His taxi is a Spirit Taxi — one of the few vehicles that can cross between the living world and the spirit realm. By day he drives regular passengers. By night, his fares include lost souls needing closure, spirits with unfinished business, and occasionally, beings that shouldn't exist at all. Each fare is a story. Each story is a mystery. And Old Ma is starting to realize: someone has been sending these spirits to him on purpose.",
        "concept": "Taxi driver as supernatural mediator. Each chapter = a new ghost passenger with a story. Overarching mystery of who's sending them.",
        "chapters_hint": "Start with a normal fare at 2am. Passenger gets in, gives an address. Old Ma looks in the rearview mirror — no reflection. 'Keep driving,' the voice says. 'I'll pay double.'"
    },
    {
        "slug": "demon-kitchen",
        "title": "The Demon Kitchen",
        "author": "Shi Fu",
        "authorBio": "Shi Fu writes culinary cultivation — where the path to power runs through the stomach and the wok is mightier than the sword.",
        "genre": "urban",
        "genres": ["Urban Fantasy", "Cooking", "Chinese Mythology"],
        "tier": "paid", "price": 4.99, "status": "ongoing",
        "freeChapters": 5,
        "description": "Chef Lin Hao was Michelin-trained in Paris. Now he runs a tiny restaurant in Chengdu that only opens after midnight. His customers? Demons, spirits, and the occasional god. His secret ingredient? Mythological creatures — prepared with French technique. Dragon steak au poivre. Qilin tartare. Phoenix egg soufflé. Every dish gives the eater supernatural power proportional to the creature's potency. Naturally, the celestial authorities don't appreciate a mortal cooking divine beings. And the demons aren't thrilled about being on the menu either. But Lin Hao's restaurant has a waiting list three centuries long, and he's not closing until he's cooked his way through the entire bestiary of Chinese mythology.",
        "concept": "Cooking + Chinese mythology. Chef cooks mythological creatures. Each dish grants powers. Gourmet progression fantasy.",
        "chapters_hint": "Start with a late-night opening. First customer is a weary-looking man who orders 'something with qi.' Chef serves leftover mapo tofu with a century egg. The man's eyes glow. 'This egg... how old is it?'"
    },
]

def call_deepseek(system_prompt, user_prompt, max_tokens=2500):
    headers = {"Content-Type": "application/json", "Authorization": f"Bearer {DEEPSEEK_KEY}"}
    data = {"model": "deepseek-chat", "messages": [{"role": "system", "content": system_prompt}, {"role": "user", "content": user_prompt}], "max_tokens": max_tokens, "temperature": 0.9}
    try:
        r = requests.post(API_URL, headers=headers, json=data, timeout=180)
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"]
        # De-AI: remove common AI tells
        content = re.sub(r'\b(It is important to note|It should be noted|Furthermore,)\b', '', content)
        content = re.sub(r'\b(Delve into|In conclusion|Ultimately,)\b', '', content)
        return content
    except Exception as e:
        print(f"  ⚠️ API: {e}")
        return None

def generate_chapters(book, num_chapters=5):
    slug = book["slug"]
    chapters = []
    system_prompt = f"""You are a skilled English web novel ghostwriter for FictionVerse. Write like a professional author — NOT like an AI.

CRITICAL STYLE RULES:
- NEVER use phrases like "delve into", "it is important to note", "furthermore", "in conclusion", "ultimately"
- NEVER describe emotions — SHOW them through action and dialogue
- Use varied sentence lengths. Short sentences for action. Longer for atmosphere.
- Dialogue must sound like real people talking, not like speeches
- Every paragraph must advance plot, reveal character, or build world — never filler
- Write in third person past tense, immersive and visceral
- Hook reader in first 3 paragraphs
- Cliffhanger at end that makes reader need next chapter
- Blend Chinese elements naturally with brief context

BOOK: {book['title']} by {book['author']}
GENRE: {', '.join(book['genres'])}
PREMISE: {book['description']}
TONE: {book['concept']}"""

    for ch_num in range(1, num_chapters + 1):
        print(f"    Ch {ch_num}...", end=" ", flush=True)
        hint = book.get("chapters_hint", "")
        user_prompt = f"Write Chapter {ch_num} of '{book['title']}'."
        if ch_num == 1 and hint:
            user_prompt += f"\n\nOpening scene direction: {hint}"
        else:
            user_prompt += f"\n\nContinue from Chapter {ch_num-1}. Advance plot significantly. Include a revelation, conflict, or character moment. End with a strong cliffhanger."
        user_prompt += "\n\nFORMAT:\nCHAPTER_TITLE: [3-8 word compelling title]\n[2000-2500 word chapter in immersive prose]"
        
        content = call_deepseek(system_prompt, user_prompt, max_tokens=2500)
        if content:
            title = f"Chapter {ch_num}"
            body = content
            if content.startswith("CHAPTER_TITLE:"):
                parts = content.split("\n", 1)
                title = parts[0].replace("CHAPTER_TITLE:", "").strip().strip('"')
                body = parts[1].strip() if len(parts) > 1 else content
            wc = len(body.split())
            chapters.append({"number": ch_num, "title": title, "content": body, "wordCount": wc})
            print(f"✓ {wc}w")
        else:
            chapters.append({"number": ch_num, "title": f"Chapter {ch_num}", "content": "...", "wordCount": 0})
            print("✗")
        time.sleep(2.5)
    return chapters

def main():
    books_path = os.path.join(DATA_DIR, "books.json")
    existing = json.load(open(books_path, "r", encoding="utf-8"))
    existing_slugs = {b["slug"] for b in existing}
    new_books = []
    total_ch = 0
    
    for i, book in enumerate(BOOKS):
        slug = book["slug"]
        if slug in existing_slugs:
            print(f"[{i+1}/20] SKIP {slug}")
            continue
        print(f"\n📖 [{i+1}/20] {book['title']}")
        print(f"   {', '.join(book['genres'])} | {book['author']} | 5 chapters...")
        chapters = generate_chapters(book, num_chapters=5)
        ch_data = [{"number": c["number"], "title": c["title"], "wordCount": c["wordCount"], "updated": "2026-06-22"} for c in chapters]
        json.dump(ch_data, open(os.path.join(CHAPTERS_DIR, f"{slug}.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        json.dump(chapters, open(os.path.join(CHAPTERS_DIR, f"{slug}_content.json"), "w", encoding="utf-8"), indent=2, ensure_ascii=False)
        entry = {k: v for k, v in book.items() if k not in ["concept", "chapters_hint"]}
        entry["chapters"] = len(chapters)
        entry["wordCount"] = sum(c["wordCount"] for c in chapters)
        entry["rating"] = round(random.uniform(4.2, 4.9), 1)
        entry["reviews"] = random.randint(10, 80)
        entry["updated"] = "2026-06-22"
        entry["cover"] = "/images/covers/dao-celestial-blade.png"
        entry["coverAlt"] = f"{book['title']} novel cover"
        existing.append(entry)
        new_books.append(slug)
        total_ch += len(chapters)
        print(f"   ✅ {len(chapters)} chapters, {sum(c['wordCount'] for c in chapters)} words")
    
    json.dump(existing, open(books_path, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
    print(f"\n{'='*50}\n🎉 DONE! New: {len(new_books)} books · {total_ch} chapters · Total books: {len(existing)}")

if __name__ == "__main__":
    main()
