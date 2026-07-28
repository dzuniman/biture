import pandas as pd
import sys
import json

def read_excel_to_json(file_path):
    try:
        df = pd.read_excel(file_path)
        # Convert to JSON and print to stdout
        print(df.to_json(orient='records'))
    except Exception as e:
        print(f"Error reading Excel file: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) > 1:
        read_excel_to_json(sys.argv[1])
    else:
        print("Please provide the path to the Excel file.", file=sys.stderr)
        sys.exit(1)
