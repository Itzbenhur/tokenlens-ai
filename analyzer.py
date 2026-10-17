import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

def analyze_csv(file_path):
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"CSV file not found: {file_path}")

    with path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            raise ValueError("The CSV file needs a header row.")

        rows = list(reader)

    if not rows:
        raise ValueError("The CSV file has no data rows.")

    fields = {name.strip().lower(): name for name in reader.fieldnames}
    category_col = next(
        (fields[k] for k in ("category", "allocation", "group", "recipient")
         if k in fields), None
    )
    amount_col = next(
        (fields[k] for k in ("tokens", "amount", "allocation_amount", "quantity")
         if k in fields), None
    )

    if not category_col or not amount_col:
        raise ValueError(
            "CSV needs a category column (e.g. category) and a token amount "
            "column (e.g. tokens)."
        )

    totals = defaultdict(float)
    for row in rows:
        category = (row.get(category_col) or "").strip()
        if not category:
            continue
        try:
            amount = float((row.get(amount_col) or "").replace(",", "").strip())
        except ValueError:
            continue
        if amount < 0:
            continue
        totals[category] += amount

    grand_total = sum(totals.values())
    if grand_total <= 0:
        raise ValueError("No valid positive token allocation amounts were found.")

    allocations = []
    for category, amount in sorted(totals.items(), key=lambda item: item[1], reverse=True):
        allocations.append({
            "category": category,
            "tokens": round(amount, 4),
            "percentage": round(amount / grand_total * 100, 2),
        })

    largest = allocations[0]
    top_three_share = sum(item["percentage"] for item in allocations[:3])

    if largest["percentage"] >= 50:
        concentration = "high"
        explanation = (
            f'{largest["category"]} holds {largest["percentage"]}% of the '
            "recorded allocation, so the distribution is heavily concentrated."
        )
    elif largest["percentage"] >= 30:
        concentration = "moderate"
        explanation = (
            f'{largest["category"]} is the largest allocation at '
            f'{largest["percentage"]}%. It is worth examining how this compares '
            "with the other groups."
        )
    else:
        concentration = "lower"
        explanation = (
            f'The largest group is {largest["category"]} at '
            f'{largest["percentage"]}%. No single category exceeds 30% '
            "of the recorded allocation."
        )

    result = {
        "total_recorded_tokens": round(grand_total, 4),
        "category_count": len(allocations),
        "top_three_share_percent": round(top_three_share, 2),
        "concentration_label": concentration,
        "explanation": explanation,
        "allocations": allocations,
        "notes": [
            "This analysis only covers the rows supplied in the CSV.",
            "Allocation concentration alone does not prove that a token is safe or unsafe.",
            "Unlock schedules require dated unlock data and are not analyzed in this first version."
        ]
    }
    return result

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python3 analyzer.py <tokenomics.csv>", file=sys.stderr)
        sys.exit(2)
    try:
        print(json.dumps(analyze_csv(sys.argv[1]), indent=2))
    except (OSError, ValueError) as exc:
        print(f"Analysis error: {exc}", file=sys.stderr)
        sys.exit(1)
