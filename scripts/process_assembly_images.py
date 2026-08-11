import os
from PIL import Image
from rembg import remove, new_session

input_dir = os.path.join(os.getcwd(), 'public', 'images', 'product-assembly')
output_dir = os.path.join(input_dir, 'processed')
os.makedirs(output_dir, exist_ok=True)

print(f"Input directory: {input_dir}")
print(f"Output directory: {output_dir}")

session = new_session("u2net")

images_to_process = [
    ("110302586530_001.jpg", "component-01-spindle-enclosure.png"),
    ("222000195786_002.jpg", "component-02-linear-rail.png"),
    ("carbide-cutter-endmill_e29a3cd3-680f-4e33-bf24-e213effcbe3c.webp", "component-03-carbide-endmill.png"),
    ("carbide-insert_27f87af9-658a-48ac-a685-fcc0447aae63.webp", "component-04-carbide-insert.png"),
    ("round-gauge.webp", "component-05-round-gauge.png"),
    ("inserted-ballnose2_3bff53e0-7aeb-4634-abcc-b3bd2f98b7a4.webp", "component-06-ballnose-tool.png"),
    ("TORX-SCREW_b8e51035-e565-487f-8015-6e052b1d0503.webp", "component-07-torx-screw.png"),
    ("power-toools.avif", "component-08-power-unit.png"),
    ("router-toools.avif", "component-09-router-head.png"),
    ("hammer_002.avif", "component-10-hammer.png"),
]

for src_name, dst_name in images_to_process:
    src_path = os.path.join(input_dir, src_name)
    dst_path = os.path.join(output_dir, dst_name)
    if not os.path.exists(src_path):
        print(f"Skipping missing file: {src_name}")
        continue
    print(f"Processing: {src_name} -> {dst_name}...")
    try:
        with open(src_path, 'rb') as f:
            input_data = f.read()
        output_data = remove(input_data, session=session)
        with open(dst_path, 'wb') as f:
            f.write(output_data)
        
        # Verify transparency and crop transparent padding
        img = Image.open(dst_path)
        bbox = img.getbbox()
        if bbox:
            img_cropped = img.crop(bbox)
            img_cropped.save(dst_path)
            print(f"Successfully saved and cropped {dst_name} ({img_cropped.size[0]}x{img_cropped.size[1]})")
        else:
            print(f"Successfully saved {dst_name} ({img.size[0]}x{img.size[1]})")
    except Exception as e:
        print(f"Error processing {src_name}: {e}")

print("Background removal complete!")
