import os
from PIL import Image

img_dir = os.path.join(os.path.dirname(__file__), '..', 'src', 'assets', 'img')

for name in ['shoe-cobalt', 'shoe-volt', 'shoe-punch']:
    png_path = os.path.join(img_dir, f'{name}.png')
    webp_path = os.path.join(img_dir, f'{name}.webp')

    im = Image.open(png_path)
    print(f"Processing {name}: original size {im.size}")

    # Compress WebP to stay well under 400 KB (target ~250-320 KB)
    im.save(webp_path, 'WEBP', quality=82, method=6)
    webp_size = os.path.getsize(webp_path)
    print(f"  {name}.webp size: {webp_size:,} bytes ({webp_size / 1024:.1f} KB)")

    # Optimize PNG fallback: convert to palette if possible or optimize RGBA
    # Let's quantize to 256 colors with transparency or optimize RGBA
    # We can save with optimize=True
    opt_png_path = os.path.join(img_dir, f'{name}.png')
    # Save optimized png
    im.save(opt_png_path, 'PNG', optimize=True, compress_level=9)
    png_size = os.path.getsize(opt_png_path)
    print(f"  {name}.png size: {png_size:,} bytes ({png_size / 1024:.1f} KB)")

    # If png is still > 400KB, quantize PNG with dithering to stay under 400KB
    if png_size > 400 * 1024:
        im_quant = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)
        im_quant.save(opt_png_path, 'PNG', optimize=True)
        q_png_size = os.path.getsize(opt_png_path)
        print(f"  {name}.png (quantized) size: {q_png_size:,} bytes ({q_png_size / 1024:.1f} KB)")
