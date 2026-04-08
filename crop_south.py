from PIL import Image
import os

base_dir = r"c:\Users\ADMIN\Desktop\fecapstone4\FE_SP26SE049\public\assets\regions"
src_path = os.path.join(base_dir, "all_regions.png")
dest_path = os.path.join(base_dir, "south.png")

img = Image.open(src_path).convert("RGBA")
width, height = img.size

# Crop from 78% to avoid Hue Citadel
left = int(width * 0.78)
box = (left, 0, width, height)
cropped = img.crop(box)

data = cropped.getdata()
new_data = []
for item in data:
    if item[0] > 230 and item[1] > 230 and item[2] > 230:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

cropped.putdata(new_data)

# Get bounding box of non-zero alpha pixels to trim excess transparent space
# This will make the graphic fit perfectly when scaled inside object-contain!
bbox = cropped.getbbox()
if bbox:
    cropped = cropped.crop(bbox)

cropped.save(dest_path, "PNG")
print("Done cropping tight bounding box")
