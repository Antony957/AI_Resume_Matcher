import argparse
import os
import subprocess
from pathlib import Path

def process_pdfs(input_path, output_path):
    # Create output directory if it doesn't exist
    os.makedirs(output_path, exist_ok=True)
    
    # Get all PDF files in the input directory
    pdf_files = Path(input_path).glob('**/*.pdf')
    
    for pdf_file in pdf_files:
        # Create relative output path
        rel_path = pdf_file.relative_to(input_path)
        output_file = Path(output_path) / rel_path.with_suffix('')
        
        # Create output subdirectories if needed
        os.makedirs(output_file.parent, exist_ok=True)
        
        # Run minerU command
        cmd = ['mineru', '-p', str(pdf_file), '-o', str(output_file)]
        try:
            subprocess.run(cmd, check=True)
            print(f"Processed: {pdf_file}")
        except subprocess.CalledProcessError as e:
            print(f"Error processing {pdf_file}: {e}")

def main():
    parser = argparse.ArgumentParser(description='Process PDF files using minerU')
    parser.add_argument('-p', '--input_path', required=True, help='Input directory containing PDF files')
    parser.add_argument('-o', '--output_path', required=True, help='Output directory for processed files')
    
    args = parser.parse_args()
    
    process_pdfs(args.input_path, args.output_path)

if __name__ == '__main__':
    main()