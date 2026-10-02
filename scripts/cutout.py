import os
import sys
from pathlib import Path
from PIL import Image

def has_transparency(img: Image.Image) -> bool:
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        alpha = img.convert('RGBA').split()[-1]
        extrema = alpha.getextrema()
        # If minimum alpha is less than 250, it has transparency
        return extrema[0] < 250
    return False

def remove_background_rembg(input_path: Path, output_path: Path):
    try:
        from rembg import remove
        with open(input_path, 'rb') as f:
            input_bytes = f.read()
        output_bytes = remove(input_bytes)
        with open(output_path, 'wb') as f:
            f.write(output_bytes)
        return True, "rembg (ONNX)"
    except Exception as e:
        print(f"rembg error for {input_path.name}: {e}")
        return False, str(e)

def remove_background_fallback(input_path: Path, output_path: Path):
    # Precise white-background removal fallback with soft edge antialiasing
    try:
        img = Image.open(input_path).convert("RGBA")
        data = img.getdata()
        new_data = []
        for r, g, b, a in data:
            # Check white background threshold
            if r > 240 and g > 240 and b > 240:
                # Fade edges smoothly
                min_c = min(r, g, b)
                if min_c > 248:
                    new_data.append((r, g, b, 0))
                else:
                    alpha_factor = int((248 - min_c) / 8.0 * 255)
                    new_data.append((r, g, b, alpha_factor))
            else:
                new_data.append((r, g, b, 255))
        img.putdata(new_data)
        img.save(output_path, "PNG")
        return True, "Color-threshold / antialias fallback"
    except Exception as e:
        return False, str(e)

def main():
    base_dir = Path(__file__).resolve().parent.parent
    orig_dir = base_dir / "src" / "assets" / "img" / "originals"
    out_dir = base_dir / "src" / "assets" / "img"
    out_dir.mkdir(parents=True, exist_ok=True)

    if not orig_dir.exists():
        print(f"Originals directory not found: {orig_dir}")
        return

    images = list(orig_dir.glob("*.png")) + list(orig_dir.glob("*.jpg")) + list(orig_dir.glob("*.jpeg"))
    if not images:
        print("No images found in originals directory.")
        return

    print(f"Found {len(images)} image(s) to process in {orig_dir}:\n")

    for img_path in images:
        out_path = out_dir / (img_path.stem + ".png")
        print(f"--- Processing: {img_path.name} ---")
        with Image.open(img_path) as im:
            already_transparent = has_transparency(im)
            print(f"Initial transparency: {'YES (already transparent)' if already_transparent else 'NO (solid background)'}")

        success, method = remove_background_rembg(img_path, out_path)
        if not success:
            print("rembg not available or encountered an issue. Trying smart fallback...")
            success, method = remove_background_fallback(img_path, out_path)

        if success:
            with Image.open(out_path) as out_im:
                final_trans = has_transparency(out_im)
                print(f"Saved: {out_path.name} via {method}")
                print(f"Verified transparent PNG: {final_trans}")
        else:
            print(f"Failed to process {img_path.name}. Please use remove.bg to cut out.")
        print()

if __name__ == "__main__":
    main()
