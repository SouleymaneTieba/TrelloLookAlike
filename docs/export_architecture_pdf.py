"""Render the adjacent architecture Markdown to PDF using macOS cupsfilter."""

from pathlib import Path
import re
import textwrap


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "architecture-integration-microservices-odc-campus.md"
OUTPUT = ROOT / "architecture-integration-microservices-odc-campus.pdf"


def pdf_string(value):
    value = value.replace("→", "->").replace("·", "-").replace("…", "...")
    encoded = value.encode("cp1252", errors="replace").hex().upper()
    return f"<{encoded}>"


def write_pdf(markdown):
    pages = []
    commands = []
    y = 795

    def new_page():
        nonlocal commands, y
        if commands:
            pages.append("\n".join(commands))
        commands = ["0.15 0.18 0.20 rg"]
        y = 795

    def draw(line, size=10, font="F1", color="0.15 0.18 0.20"):
        nonlocal y
        if y < 48:
            new_page()
        commands.append(f"{color} rg BT /{font} {size} Tf 48 {y} Td {pdf_string(line)} Tj ET")
        y -= size * 1.55

    code_mode = False
    first_title = True
    for raw in markdown.splitlines():
        line = raw.strip()
        if line.startswith("```"):
            code_mode = not code_mode
            y -= 4
            continue
        if not line or line == "---" or re.fullmatch(r"\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?", line):
            y -= 3
            continue
        if line.startswith("|"):
            cells = [re.sub(r"\*\*|`", "", c.strip()) for c in line.strip("|").split("|")]
            line = "  |  ".join(cells)
        elif line.startswith("#"):
            level = len(line) - len(line.lstrip("#"))
            line = line[level:].strip()
            if level == 1:
                if first_title:
                    draw(line, 20, "F2", "0.78 0.31 0.05")
                    first_title = False
                    continue
                y -= 8
                draw(line, 15, "F2", "0.78 0.31 0.05")
                continue
            if level == 2:
                y -= 5
                draw(line, 12, "F2", "0.78 0.31 0.05")
                continue
            draw(line, 10, "F2", "0.20 0.27 0.30")
            continue
        else:
            line = re.sub(r"\*\*|`", "", line)
            line = re.sub(r"^(- |\d+\. )", "• ", line)
        width = 94 if code_mode else 103
        wrapped = textwrap.wrap(line, width=width, subsequent_indent="    ", break_long_words=True) or [""]
        for piece in wrapped:
            draw(piece, 8.2 if code_mode or line.startswith("•") else 9)
    if commands:
        pages.append("\n".join(commands))

    objects = [b""]
    def obj(data):
        objects.append(data if isinstance(data, bytes) else data.encode("ascii"))
        return len(objects) - 1

    catalog_id = obj(b"")
    pages_id = obj(b"")
    regular_id = obj(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>")
    bold_id = obj(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>")
    page_ids = []
    for content in pages:
        stream = content.encode("ascii")
        content_id = obj(b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream")
        page_id = obj(f"<< /Type /Page /Parent {pages_id} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 {regular_id} 0 R /F2 {bold_id} 0 R >> >> /Contents {content_id} 0 R >>")
        page_ids.append(page_id)
    objects[catalog_id] = f"<< /Type /Catalog /Pages {pages_id} 0 R >>".encode()
    objects[pages_id] = (f"<< /Type /Pages /Kids [{''.join(f'{i} 0 R ' for i in page_ids)}] /Count {len(page_ids)} >>").encode()
    result = bytearray(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n")
    offsets = [0]
    for number, data in enumerate(objects[1:], 1):
        offsets.append(len(result))
        result.extend(f"{number} 0 obj\n".encode())
        result.extend(data)
        result.extend(b"\nendobj\n")
    xref = len(result)
    result.extend(f"xref\n0 {len(objects)}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]:
        result.extend(f"{offset:010d} 00000 n \n".encode())
    result.extend(f"trailer\n<< /Size {len(objects)} /Root {catalog_id} 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    OUTPUT.write_bytes(result)


write_pdf(SOURCE.read_text(encoding="utf-8"))

print(f"Created {OUTPUT}")
