"""Download the bakery photos from Google Drive and build public/photos/*.webp.

Runs in GitHub Actions (.github/workflows/import-drive-photos.yml).
The Drive file IDs come from the DRIVE_PHOTO_IDS repository secret, as JSON:
    {"IMG_2525": "<drive file id>", "IMG_1733": "<drive file id>", ...}
The IDs are never printed.

Every result is checked against the size and a visual fingerprint of the version
that was reviewed, so a photo can never end up under the wrong product name or
turned sideways. If anything does not match, the script stops and nothing is
committed.

Local test without Drive:
    python scripts/photos_from_drive.py public/photos --from-dir <folder with IMG_2525.HEIC ...>
"""
import io
import json
import os
import sys
import time
import urllib.request

from PIL import Image, ImageOps
import pillow_heif

pillow_heif.register_heif_opener()

# Original file (Drive name without extension) -> photo name used by the site.
ORIGINALS = {
    'IMG_2525': 'cinnamon-rolls',
    '5924A01F-FC21-480B-945D-AEC23EBA34BF': 'cinnamon-rolls-trays',
    'IMG_2154': 'cookie-brown-butter',
    'IMG_6231': 'cookie-smores',
    'IMG_6230': 'smores-batch',
    'IMG_6197': 'baklava-rose',
    'IMG_6038': 'dates-small-box',
    'IMG_7327': 'market-table',
    'IMG_7326': 'market-table-sign',
    'IMG_9490': 'muffins',
    'IMG_9603': 'muffins-window',
    'IMG_1144': 'catering-trays',
    'IMG_1733': 'dessert-box',
    'IMG_0447': 'cake-new-chapter',
    'IMG_0419': 'cake-new-chapter-2',
    'IMG_9141': 'cake-bride',
    'IMG_9143': 'cake-bride-table',
    'IMG_8948': 'dessert-jars',
}
# Extra photos cut from an original: name -> (original, crop box in full-size pixels).
CROPS = {
    'cheesecake-oreo': ('IMG_7326', (0, 2177, 2419, 3568)),
}
# Very tall phone shots: keep this slice of the height (top, bottom).
TALL_TRIM = {
    'cinnamon-rolls-trays': (0.12, 0.92),
    'dessert-box': (0.25, 0.98),
}
QUALITY = {800: 74, 1400: 62}
LARGE = {
    'cinnamon-rolls', 'cookie-smores', 'baklava-rose', 'catering-trays',
    'dessert-box', 'cake-new-chapter', 'market-table', 'cookie-brown-butter',
}
# Reviewed versions: name -> (width, height, average hash, difference hash) of the 800px file.
EXPECTED = {
    'baklava-rose': (800, 1067, '681a162c1f5fdbfe', 'd1d2745db29592b8'),
    'cake-bride': (800, 1067, '001cfeff7ff16e00', 'f8f4c6bae1239860'),
    'cake-bride-table': (800, 1067, '00003cbe3cffff00', '25557054f0f847e7'),
    'cake-new-chapter-2': (800, 1067, 'fefcf93c181801ff', 'c0c1e3cd39fa33af'),
    'cake-new-chapter': (800, 1067, '007e7f3e363e12be', '86f8ceece4d46e66'),
    'catering-trays': (800, 1067, '387e7fff1fe0e0c0', 'f1e4cc936a274800'),
    'cheesecake-oreo': (800, 460, 'eae5e0c0c385a004', '1415122b0b354b7d'),
    'cinnamon-rolls': (800, 1067, '000f3ffff38f2561', '1dfc7496673feddb'),
    'cinnamon-rolls-trays': (800, 1138, '3fff070280471cd6', 'f48fbd566d9d6caa'),
    'cookie-brown-butter': (800, 1067, '0f9fe7c766030100', '3c3e0e8ccc67277f'),
    'cookie-smores': (800, 1067, 'ff833021df9f8f03', 'ba1e56573d775d1f'),
    'dates-small-box': (800, 1067, '00002078fcfcf0f6', '62e8c1d090a0c284'),
    'dessert-box': (800, 1038, '003078fcffff1f01', '3c62e0c002cd76ff'),
    'dessert-jars': (800, 980, '00861cbebcb6b6a5', '6c4c7078746c6d6d'),
    'market-table': (800, 1067, 'e0e4e4c987cf2080', '0a15141b3f38e429'),
    'market-table-sign': (800, 1067, 'f2f2e1c3ff90c060', '828c8d1e552690da'),
    'muffins': (800, 1067, '01010182c131ffff', 'e9b5d72413e7e7b2'),
    'muffins-window': (800, 1067, 'c0c0000006fefffe', '12943a35d6509012'),
    'smores-batch': (800, 1067, 'e12f3ffcf8094f32', 'cfdc61b012399ce6'),
}
MAX_HASH_DISTANCE = 10  # of 64 bits; different photos differ by about 30


def fail(message):
    print(f'ERROR: {message}', file=sys.stderr)
    sys.exit(1)


def kind_of(data):
    if data[:3] == b'\xff\xd8\xff':
        return 'jpeg'
    if data[4:8] == b'ftyp' and data[8:12] in (b'heic', b'heix', b'mif1', b'msf1', b'heim', b'heis', b'hevc', b'hevx'):
        return 'heif'
    return None


def download(file_id):
    url = f'https://drive.usercontent.google.com/download?id={file_id}&export=download&confirm=t'
    problem = 'unknown'
    for attempt in range(5):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (busy-biese photo import)'})
            with urllib.request.urlopen(request, timeout=90) as response:
                data = response.read()
            if kind_of(data):
                return data
            problem = 'Drive returned a page instead of an image (check that the file is shared by link)'
        except Exception as error:  # report the type only, never the URL
            problem = f'{type(error).__name__} {getattr(error, "code", "")}'.strip()
        time.sleep(4 * (attempt + 1))
    raise RuntimeError(problem)


def read_local(folder, stem):
    for ext in ('.HEIC', '.heic', '.JPG', '.jpg', '.JPEG', '.jpeg'):
        path = os.path.join(folder, stem + ext)
        if os.path.exists(path):
            with open(path, 'rb') as handle:
                return handle.read()
    raise RuntimeError('not found in the local folder')


def load(data):
    image = Image.open(io.BytesIO(data))
    image = ImageOps.exif_transpose(image)
    return image.convert('RGB')


def fingerprint(image):
    gray = image.convert('L')
    small = list(gray.resize((8, 8), Image.Resampling.BOX).tobytes())
    average = sum(small) / 64
    ahash = sum(1 << i for i, p in enumerate(small) if p > average)
    wide = list(gray.resize((9, 8), Image.Resampling.BOX).tobytes())
    dhash = 0
    for row in range(8):
        for col in range(8):
            if wide[row * 9 + col] > wide[row * 9 + col + 1]:
                dhash |= 1 << (row * 8 + col)
    return ahash, dhash


def check(name, path):
    width, height, ahash, dhash = EXPECTED[name]
    with Image.open(path) as image:
        if abs(image.width - width) > 1 or abs(image.height - height) > 1:
            fail(f'{name}: size {image.width}x{image.height}, expected {width}x{height}')
        got_a, got_d = fingerprint(image)
    distance_a = bin(got_a ^ int(ahash, 16)).count('1')
    distance_d = bin(got_d ^ int(dhash, 16)).count('1')
    if distance_a > MAX_HASH_DISTANCE or distance_d > MAX_HASH_DISTANCE:
        fail(f'{name}: does not look like the reviewed photo (differences {distance_a}, {distance_d})')
    return distance_a, distance_d


def save(image, name, out_dir):
    for width in (800, 1400):
        if width == 1400 and name not in LARGE:
            continue
        copy = image.copy()
        if copy.width > width:
            copy = copy.resize((width, round(copy.height * width / copy.width)), Image.Resampling.LANCZOS)
        path = os.path.join(out_dir, f'{name}-{width}.webp')
        copy.save(path, 'WEBP', quality=QUALITY[width], method=6)
        note = ''
        if width == 800:
            note = ' fingerprint ok (%d, %d)' % check(name, path)
        print(f'{name}-{width}.webp {copy.width}x{copy.height} {os.path.getsize(path) // 1024} KB{note}')


def main():
    if len(sys.argv) < 2:
        fail('usage: photos_from_drive.py <output folder> [--from-dir <folder>]')
    out_dir = sys.argv[1]
    local = sys.argv[3] if len(sys.argv) > 3 and sys.argv[2] == '--from-dir' else None
    ids = {}
    if not local:
        raw = os.environ.get('DRIVE_PHOTO_IDS', '').strip()
        if not raw:
            fail('the DRIVE_PHOTO_IDS secret is empty or missing')
        try:
            ids = json.loads(raw)
        except json.JSONDecodeError:
            fail('the DRIVE_PHOTO_IDS secret is not valid JSON')
        missing = [stem for stem in ORIGINALS if stem not in ids]
        if missing:
            fail('the DRIVE_PHOTO_IDS secret has no entry for: ' + ', '.join(missing))
    os.makedirs(out_dir, exist_ok=True)

    images = {}
    for stem in ORIGINALS:
        try:
            data = read_local(local, stem) if local else download(ids[stem])
        except RuntimeError as error:
            fail(f'{stem}: {error}')
        images[stem] = load(data)
        print(f'{stem}: {kind_of(data)}, {images[stem].width}x{images[stem].height}')

    for stem, name in ORIGINALS.items():
        image = images[stem]
        if name in TALL_TRIM:
            top, bottom = TALL_TRIM[name]
            image = image.crop((0, int(image.height * top), image.width, int(image.height * bottom)))
        save(image, name, out_dir)
    for name, (stem, box) in CROPS.items():
        save(images[stem].crop(box), name, out_dir)

    total = sum(os.path.getsize(os.path.join(out_dir, f)) for f in os.listdir(out_dir) if f.endswith('.webp'))
    print(f'done: {len(EXPECTED)} photos, {total // 1024} KB')


if __name__ == '__main__':
    main()
