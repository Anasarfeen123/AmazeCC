"""brandify, one className at a time.

Use when brandify.py reports 0 rewrites on a file that clearly has old
classes: nested template literals (`a ${b ? `c` : ""}`) break its file-wide
quote pairing. This applies the same rules (with --status) to each
className="..." and className={`...`} on its own.

Usage: python3 scripts/redesign/brandify_classnames.py <file.tsx> [...]
"""
import re, sys, importlib.util
spec = importlib.util.spec_from_file_location("b", __import__("os").path.join(__import__("os").path.dirname(__file__), "brandify.py"))
b = importlib.util.module_from_spec(spec); spec.loader.exec_module(b)
PAT = re.compile(r'className=(?:"[^"\n]*"|\{`[^`]*`\})')
for f in sys.argv[1:]:
    s = open(f).read(); tot = 0
    def fix(m):
        global tot
        out, n = b.brandify(m.group(0)[len("className="):], status=True)
        tot += n
        return "className=" + out
    s2 = PAT.sub(fix, s)
    print(f, tot)
    if s2 != s: open(f, "w").write(s2)
