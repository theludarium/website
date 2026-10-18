import re, glob, os, sys
import sys
ART = sys.argv[1] if len(sys.argv)>1 else "/home/claude/ludarium/articles"
BANNED = ["genuinely","honestly","straightforward","delve","unlock","elevate","game-changer"]
SIG = "The game is the reason. The people are the point."
files = sorted(glob.glob(f"{ART}/*.md"))
slugs = {}
for f in files:
    t = open(f).read()
    m = re.search(r"^slug:\s*(.+)$", t, re.M)
    slugs[m.group(1).strip() if m else "?"] = f
for idx in ["/home/claude/ludarium/ARTICLES.md","/home/claude/ludarium/ARTICLES2.md","/home/claude/ludarium/ARTICLES3.md","/home/claude/ludarium/ARTICLES4.md","/home/claude/ludarium/ARTICLES5.md"]:
    for s in re.findall(r"\| ([a-z0-9-]+) \| [A-Z0-9]", open(idx).read()):
        slugs.setdefault(s, idx)
print(f"{len(files)} files\n")
for f in files:
    t = open(f).read()
    issues = []
    fm = re.match(r"^---\n(.*?)\n---\n", t, re.S)
    if not fm: issues.append("no front matter")
    else:
        y = fm.group(1)
        for k in ["title","slug","meta_description","primary_keyword","secondary_keywords","category","reading_time"]:
            if not re.search(rf"^{k}:", y, re.M): issues.append(f"missing {k}")
        tt = re.search(r"^title:\s*(.+)$", y, re.M)
        if tt and len(tt.group(1).strip().strip('"\'')) > 60: issues.append(f"title {len(tt.group(1).strip())} chars")
        md = re.search(r"^meta_description:\s*(.+)$", y, re.M)
        if md and len(md.group(1).strip().strip('"\'')) > 155: issues.append(f"meta {len(md.group(1).strip())} chars")
    body = t[fm.end():] if fm else t
    wc = len(body.split())
    if not 1200 <= wc <= 1800: issues.append(f"wc {wc}")
    if not re.search(r"^# ", body, re.M): issues.append("no H1")
    if not re.search(r"^## .*FAQ", body, re.M|re.I): issues.append("no FAQ H2")
    if body.count(SIG) != 1: issues.append(f"signature x{body.count(SIG)}")
    low = body.lower()
    for b in BANNED:
        if re.search(rf"\b{re.escape(b)}\b", low): issues.append(f"banned: {b}")
    links = re.findall(r"\]\(/articles/([a-z0-9-]+)\)", body)
    if not 2 <= len(links) <= 3: issues.append(f"links {len(links)}")
    for l in links:
        if l not in slugs: issues.append(f"bad slug {l}")
    if "newsletter" not in body.lower(): issues.append("no newsletter CTA")
    v = body.count("<!-- VERIFY -->")
    print(f"{os.path.basename(f):40} {wc:5}w  verify={v}  {'OK' if not issues else '; '.join(issues)}")
