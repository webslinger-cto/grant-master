#!/usr/bin/env python3
import sys
import json

try:
    import openpyxl
    import pandas as pd
except ImportError:
    print("Installing required packages...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "--user", "openpyxl", "pandas"])
    import openpyxl
    import pandas as pd

# Read the Excel file
excel_file = '/Users/abdulsar/Downloads/Grants Master Sheet.xlsx'
xl = pd.ExcelFile(excel_file)

print(f"Sheet names: {xl.sheet_names}\n")

for sheet_name in xl.sheet_names:
    df = pd.read_excel(excel_file, sheet_name=sheet_name)
    print(f"\n{'='*60}")
    print(f"Sheet: {sheet_name}")
    print(f"{'='*60}")
    print(f"Rows: {len(df)}, Columns: {len(df.columns)}")
    print(f"\nColumn names:")
    for i, col in enumerate(df.columns, 1):
        print(f"  {i}. {col}")

    print(f"\nFirst 3 rows preview:")
    print(df.head(3).to_string())
    print("\n")
