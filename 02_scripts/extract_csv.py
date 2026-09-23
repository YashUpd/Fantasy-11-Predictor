import os
from yorkpy.analytics import convertYaml2PandasDataframeT20

def convert_all_yaml_to_csv(yaml_dir: str, output_csv_dir: str):
    yaml_dir = os.path.abspath(yaml_dir)          # ✅ Convert to full path
    output_csv_dir = os.path.abspath(output_csv_dir)

    if not os.path.exists(output_csv_dir):
        os.makedirs(output_csv_dir)

    files = [f for f in os.listdir(yaml_dir) if f.endswith('.yaml')]
    print(f"🔍 Found {len(files)} YAML files in {yaml_dir}")

    for filename in files:
        try:
            print(f"🔄 Converting: {filename}")
            _, outfile = convertYaml2PandasDataframeT20(
                infile=filename,
                source=yaml_dir,
                dest=output_csv_dir
            )
            print(f"✅ Saved as: {outfile}")
        except Exception as e:
            print(f"❌ Error in {filename}: {e}")

if __name__ == "__main__":
    input_folder = "01_data/raw_yamls"
    output_folder = "01_data/csv_matches"
    convert_all_yaml_to_csv(input_folder, output_folder)
