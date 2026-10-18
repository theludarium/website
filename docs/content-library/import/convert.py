#!/usr/bin/env python3
"""Convert the content library into the theludarium.com Astro article format.

Output: site_import/out/src/content/articles/<slug>.md
Usage: python3 -I convert.py
"""
import re, glob, os, json, sys

ROOT = "/home/claude/ludarium"
OUT = f"{ROOT}/site_import/out/src/content/articles"
PUB_DATE = "2026-10-18"
DESC_OVERRIDE = json.load(open(f"{ROOT}/site_import/descriptions.json")) if os.path.exists(f"{ROOT}/site_import/descriptions.json") else {}

CAT_MAP = {
    "Strategy guides": "Game Guides", "Glossary": "Game Guides", "Comparisons": "Game Guides",
    "What to play": "Game Guides", "Gift guides": "Game Guides",
    "Tabletop RPGs for beginners": "Game Guides", "Cooperative and campaign games": "Game Guides",
    "Hosting and game-night craft": "Game Night", "Game night programming": "Game Night",
    "Family and intergenerational play": "Game Night", "Who it's for": "Game Night",
    "Social benefits of playing in person": "Togethering", "Play and health": "Togethering",
    "Play and longevity": "Togethering", "Game lounges and third places": "Togethering",
    "Games for the workplace": "Togethering",
    "Conventions": "Game Culture", "Indianapolis": "Game Culture", "Building The Ludarium": "Game Culture",
    "Tabletop game design": "Game Design",
    "Magic: The Gathering and Cube": "Magic & Cube", "Cube Commonwealth": "Magic & Cube",
}
NEW_CAT_SLUG = {"Game Guides": "game-guides", "Game Night": "game-night", "Togethering": "togethering",
                "Game Culture": "game-culture", "Game Design": "game-design", "Magic & Cube": "magic-and-cube"}
# old hub slug -> new category slug (for /categories/<hub> links)
HUB_TO_CAT = {
    "strategy-guides": "game-guides", "glossary": "game-guides", "comparisons": "game-guides",
    "what-to-play": "game-guides", "gift-guides": "game-guides", "tabletop-rpgs-for-beginners": "game-guides",
    "cooperative-and-campaign-games": "game-guides",
    "hosting-and-game-night-craft": "game-night", "game-night-programming": "game-night",
    "family-and-intergenerational-play": "game-night", "who-its-for": "game-night",
    "play-and-health": "togethering", "play-and-longevity": "togethering",
    "lounges-and-third-places": "togethering", "games-for-the-workplace": "togethering",
    "conventions": "game-culture", "indianapolis": "game-culture", "building-the-ludarium": "game-culture",
    "tabletop-game-design": "game-design",
    "magic-the-gathering-and-cube": "magic-and-cube", "cube-commonwealth-community": "magic-and-cube",
}
# slugs that collide with articles already on the site
RENAME = {"articles/design-01-five-minute-teach.md": "how-to-teach-a-board-game-in-five-minutes"}
SITE_EXISTING = {"how-to-host-a-great-game-night", "how-to-teach-a-board-game",
                 "how-we-catalog-board-games-by-how-they-feel", "what-is-togethering"}

def yaml_str(s):
    s = s.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{s}"'

def parse_fm(text):
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    fm = m.group(1)
    def g(k):
        mm = re.search(rf"^{k}:\s*(.+)$", fm, re.M)
        return mm.group(1).strip().strip('"').strip("'").replace('\\"', '"') if mm else ""
    return g, text[m.end():]

def fix_em_dashes(body):
    body = re.sub(r" — (https?://)", r": \1", body)
    body = re.sub(r"\] — ", "]: ", body)
    body = re.sub(r"\|\s*—\s*\|", "| None |", body)
    body = re.sub(r"ward—pay", "ward (pay", body, flags=re.I)
    body = body.replace("ward (pay 2 life;", "ward (pay 2 life);").replace("ward (pay 2 life).", "ward (pay 2 life)).")
    body = body.replace(" — ", ", ").replace("—", ", ")
    return body

def main():
    os.makedirs(OUT, exist_ok=True)
    files = sorted(glob.glob(f"{ROOT}/articles*/*.md"))
    records = []
    for f in files:
        rel = os.path.relpath(f, ROOT)
        text = open(f, encoding="utf-8").read()
        g, body = parse_fm(text)
        slug = RENAME.get(rel, g("slug"))
        old_cat = g("category")
        cat = CAT_MAP[old_cat]
        kws = [g("primary_keyword")] + [k.strip().strip('"') for k in re.findall(r"[^\[\],]+", g("secondary_keywords")) if k.strip()]
        tags = []
        for t in kws + [old_cat]:
            t = t.strip()
            if t and t.lower() not in [x.lower() for x in tags]:
                tags.append(t)
        # drop the body H1 (the page renders the title as the h1)
        body = re.sub(r"\A\s*# .+\n+", "", body, count=1)
        body = re.sub(r"^# (.+)$", r"## \1", body, flags=re.M)  # any stray H1 becomes H2
        body = fix_em_dashes(body)
        desc = DESC_OVERRIDE.get(slug, g("meta_description"))
        records.append(dict(src=rel, slug=slug, title=g("title"), description=desc,
                            category=cat, tags=tags, body=body))
    slugs = {r["slug"] for r in records} | SITE_EXISTING
    missing = set()
    def link_fix(m):
        path = m.group(1)
        a = re.match(r"/articles/([a-z0-9-]+)/?(#[\w-]+)?$", path)
        if a:
            if a.group(1) not in slugs:
                missing.add(a.group(1))
            return f"](/articles/{a.group(1)}/{a.group(2) or ''})"
        c = re.match(r"/categories/([a-z0-9-]+)/?$", path)
        if c:
            return f"](/articles/category/{HUB_TO_CAT.get(c.group(1), 'game-guides')}/)"
        if path.startswith("/tools/bracket"):
            return "](/game-night-madness/)"
        if path.startswith("/calendar"):
            return "](/newsletter/)"
        return m.group(0)
    for r in records:
        r["body"] = re.sub(r"\]\((/[^)\s]+)\)", link_fix, r["body"])
        fm = ["---",
              f"title: {yaml_str(r['title'])}",
              f"description: {yaml_str(r['description'])}",
              f"pubDate: {PUB_DATE}",
              f"category: {r['category']}",
              "tags: [" + ", ".join(yaml_str(t) for t in r["tags"]) + "]",
              "draft: true",
              "---", ""]
        open(f"{OUT}/{r['slug']}.md", "w", encoding="utf-8").write("\n".join(fm) + r["body"].lstrip("\n"))
    json.dump([{k: r[k] for k in ("src", "slug", "title", "description", "category")} for r in records],
              open(f"{ROOT}/site_import/manifest.json", "w"), indent=1)
    short = [r for r in records if len(r["description"]) < 150]
    long_ = [r for r in records if len(r["description"]) > 160]
    titles = [r["title"] for r in records]
    descs = [r["description"] for r in records]
    print(f"{len(records)} articles written; desc<150: {len(short)}, >160: {len(long_)}")
    print("duplicate titles:", len(titles) - len(set(titles)), " duplicate descriptions:", len(descs) - len(set(descs)))
    print("broken internal links:", sorted(missing))
    print("em dashes left:", sum(r["body"].count("—") + r["title"].count("—") + r["description"].count("—") for r in records))
    from collections import Counter
    print(Counter(r["category"] for r in records))

if __name__ == "__main__":
    main()
