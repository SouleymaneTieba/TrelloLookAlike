"""Generate the architecture PDF from the editable HTML and SVG sources."""
from pathlib import Path
import subprocess
import tempfile

DOCS = Path(__file__).resolve().parent
HTML = DOCS / "architecture-service-taches-integrations.html"
PDF = DOCS / "architecture-service-taches-integrations.pdf"
CHROME = Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome")

if not CHROME.exists():
    raise SystemExit("Google Chrome is required to render the local HTML source to PDF.")

with tempfile.TemporaryDirectory(prefix="task-architecture-pdf-") as profile:
    subprocess.run([
        str(CHROME), "--headless", "--disable-gpu", "--no-sandbox",
        "--disable-dev-shm-usage", f"--user-data-dir={profile}",
        "--no-pdf-header-footer", f"--print-to-pdf={PDF}", HTML.as_uri(),
    ], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

if not PDF.exists() or PDF.stat().st_size < 10_000:
    raise SystemExit("PDF generation failed or produced an unexpectedly small file.")
print(f"Created {PDF} ({PDF.stat().st_size:,} bytes)")
