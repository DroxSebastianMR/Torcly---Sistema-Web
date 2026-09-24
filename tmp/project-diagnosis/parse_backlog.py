from __future__ import annotations

import json
from pathlib import Path

import pdfplumber


SOURCE = Path(r"C:\Users\Sebastian Mercado\Downloads\Product_Backlog_Kanban_Torcly (1) (2).pdf")
OUTPUT = Path(r"tmp\project-diagnosis\backlog_rows.json")

rows: list[dict[str, str]] = []
with pdfplumber.open(SOURCE) as pdf:
    for page_number, page in enumerate(pdf.pages, start=1):
        for table in page.extract_tables():
            for raw in table:
                if not raw:
                    continue
                cells = [(cell or "").replace("\n", " ").strip() for cell in raw]
                if not cells or not cells[0].startswith("HU-"):
                    continue
                if len(cells) >= 23:
                    indexes = {"priority": 6, "class": 9, "value": 12, "size": 15, "status": 18, "date": 21}
                else:
                    indexes = {"priority": 5, "class": 6, "value": 8, "size": 11, "status": 14, "date": 17}
                while len(cells) <= indexes["date"]:
                    cells.append("")
                rows.append(
                    {
                        "id": cells[0],
                        "story": cells[3],
                        "priority": cells[indexes["priority"]],
                        "class": cells[indexes["class"]],
                        "value": cells[indexes["value"]],
                        "size": cells[indexes["size"]],
                        "documented_status": cells[indexes["status"]],
                        "entry_date": cells[indexes["date"]],
                        "page": str(page_number),
                    }
                )

OUTPUT.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"count": len(rows), "first": rows[:2], "last": rows[-2:]}, ensure_ascii=False, indent=2))
