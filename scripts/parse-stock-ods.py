#!/usr/bin/env python3
"""
parse-stock-ods.py

Reads the owner's stock spreadsheets from scripts/input/*.ods and produces
scripts/output/stock.json — the normalized catalog that import-stock.mjs writes
to Supabase.

Sheet layout (one sheet per brand, identical header in all three files):
    SKU | NUME | CATEGORIE | CULOARE | MARIME | CANTITATE | PRET | SUMA MARIMI | VALOARE
One row = one size. SKU/NUME/CATEGORIE/CULOARE are only filled on a product's
first row and carry down to its remaining size rows. Columns past VALOARE hold a
free-text "Sconto X%" note that applies from that row downwards until the next
note — it is a per-brand (occasionally per-block) discount, not a per-row one.

Prices: PRET is the full pre-discount price. base_price = PRET x (1 - sconto),
compare_at_price = PRET. Products in a block with no note keep base_price = PRET
and no compare_at_price.

Stdlib only — an .ods file is a zip holding content.xml.

    python3 scripts/parse-stock-ods.py
"""
import glob
import json
import os
import re
import unicodedata
import zipfile
from xml.etree import ElementTree as ET

NS = {
    'table': 'urn:oasis:names:tc:opendocument:xmlns:table:1.0',
}
TABLE = '{%s}' % NS['table']

IN_DIR = 'scripts/input'
OUT_PATH = 'scripts/output/stock.json'

# --- Source file -> gender parent category -------------------------------
# The three spreadsheets are the only place gender is recorded.
GENDER_BY_FILE = {
    'STOCK BARBATI': ('uomo', 'Uomo', 'Men'),
    'STOC FEMEI': ('donna', 'Donna', 'Women'),
    'STOC ACCESORII SI PAPUCI': ('accessori-scarpe', 'Accessori e Scarpe', 'Accessories & Shoes'),
}

# --- Brand names ---------------------------------------------------------
# Sheet tab -> display brand. Entries marked TODO_CONFIRM are abbreviations in
# the source that we render conservatively rather than guess at a full name.
BRANDS = {
    'ARMANI': 'Armani',
    'BARROW': 'Barrow',
    'BLNCG': 'BLNCG',                    # TODO_CONFIRM abbreviation
    'CALVIN KLEIN': 'Calvin Klein',
    'DISCLAIMER': 'Disclaimer',
    'DS2': 'DS2',
    'EXIT 7': 'Exit 7',
    'GCDS': 'GCDS',
    'GIVENCHY': 'Givenchy',
    'ICBERG': 'Iceberg',                 # source spells it "Icberg"
    'ICON': 'Icon',
    'MARCELO BURLON': 'Marcelo Burlon',
    'MOSCHINO': 'Moschino',
    'NEW BALANCE': 'New Balance',
    'OFF WHITE': 'Off-White',
    'PALM ANGELS': 'Palm Angels',
    'PINKO': 'Pinko',
    'PLEIN SPORT': 'Plein Sport',
    'TOMMY': 'Tommy Hilfiger',
    'POLO': 'Polo',                      # TODO_CONFIRM which Polo label
    'RICHMOND': 'Richmond',              # TODO_CONFIRM John Richmond?
    'VERSACE': 'Versace',
}

# --- Category vocabulary: source value -> (slug, IT name, EN name) --------
CATEGORIES = {
    'TRICOU': ('t-shirt', 'T-shirt', 'T-shirts'),
    'PANTALONI': ('pantaloni', 'Pantaloni', 'Trousers'),
    'PANTALONI SCURTI': ('shorts', 'Shorts', 'Shorts'),
    'SHORT': ('shorts', 'Shorts', 'Shorts'),
    'JEANS': ('jeans', 'Jeans', 'Jeans'),
    'GEANTA': ('borse', 'Borse', 'Bags'),
    'BLUZA': ('felpe', 'Felpe', 'Sweatshirts'),
    'HOODIE': ('hoodie', 'Hoodie', 'Hoodies'),
    'ROCHIE': ('vestiti', 'Vestiti', 'Dresses'),
    'SNEAKERS': ('sneakers', 'Sneakers', 'Sneakers'),
    'SLIDES': ('ciabatte', 'Ciabatte', 'Slides'),
    'COSTUM BAIE': ('costumi-da-bagno', 'Costumi da bagno', 'Swimwear'),
    'COSTUME DE BAIE': ('costumi-da-bagno', 'Costumi da bagno', 'Swimwear'),
    'VESTA': ('gilet', 'Gilet', 'Vests'),
    'JACHETA': ('giacche', 'Giacche', 'Jackets'),
    'CAMASA': ('camicie', 'Camicie', 'Shirts'),
    'BORSETA': ('marsupi', 'Marsupi', 'Belt bags'),
    'FUSTA': ('gonne', 'Gonne', 'Skirts'),
    'CUREA': ('cinture', 'Cinture', 'Belts'),
    'BASCA': ('cappelli', 'Cappelli', 'Caps'),
    'COMPLEU': ('completi', 'Completi', 'Sets'),
    'SALOPETA': ('tute-intere', 'Tute intere', 'Jumpsuits'),
    'PORTOFEL': ('portafogli', 'Portafogli', 'Wallets'),
    'SOSETE': ('calze', 'Calze', 'Socks'),
}

# --- Colour vocabulary: source value -> (IT, EN, hex) --------------------
# The source has spelling variants (NEGRU/NEAGRA, ALB/ALBA) that collapse here.
COLORS = {
    'NEGRU': ('Nero', 'Black', '#000000'),
    'NEAGRA': ('Nero', 'Black', '#000000'),
    'ALB': ('Bianco', 'White', '#FFFFFF'),
    'ALBA': ('Bianco', 'White', '#FFFFFF'),
    'ALBASTRU': ('Blu', 'Blue', '#1E3A8A'),
    'ALBASTRI': ('Blu', 'Blue', '#1E3A8A'),
    'VERDE': ('Verde', 'Green', '#166534'),
    'ROZ': ('Rosa', 'Pink', '#F9A8D4'),
    'CREM': ('Crema', 'Cream', '#EDE9E1'),
    'GRI': ('Grigio', 'Grey', '#6B7280'),
    'MARO': ('Marrone', 'Brown', '#6B4423'),
    'MOV': ('Viola', 'Purple', '#6D28D9'),
    'VISINIU': ('Bordeaux', 'Burgundy', '#7F1D1D'),
    'PORTOCALIU': ('Arancione', 'Orange', '#EA580C'),
    'ROSU': ('Rosso', 'Red', '#B91C1C'),
    'COLOR': ('Multicolore', 'Multicolour', '#D9B679'),
}
# Unknown / '???' colours land here so the owner can spot them in the admin.
COLOR_UNKNOWN = ('TODO_CONFIRM', 'TODO_CONFIRM', '#9CA3AF')

# --- Words appearing inside NUME, for the Italian/English product name ---
# Longest-first so multi-word phrases win over their parts.
NAME_WORDS = [
    ('COSTUM INTREG DE BAIE', 'Costume da bagno intero', 'One-piece swimsuit'),
    ('COSTUM DE BAIE INTREG', 'Costume da bagno intero', 'One-piece swimsuit'),
    ('COSTUM DE BAIE', 'Costume da bagno', 'Swimsuit'),
    ('COSTUME DE BAIE', 'Costume da bagno', 'Swimsuit'),
    ('COSTUM BAIE', 'Costume da bagno', 'Swimsuit'),
    ('SHORT DE PLAJA', 'Shorts da spiaggia', 'Beach shorts'),
    ('GEANTA DE PLAJA', 'Borsa da spiaggia', 'Beach bag'),
    ('DE BARBATI', 'Uomo', 'Men'),
    ('DE FEMEI', 'Donna', 'Women'),
    ('DE DAMA', 'Donna', 'Women'),
    ('CU GLUGA', 'con cappuccio', 'hooded'),
    ('PANTALONI SCURTI', 'Shorts', 'Shorts'),
    ('JEANS SCURTI', 'Shorts di jeans', 'Denim shorts'),
    ('TRENING', 'Tuta', 'Tracksuit'),
    ('SALOPETA', 'Tuta intera', 'Jumpsuit'),
    ('PORTOFEL', 'Portafoglio', 'Wallet'),
    ('BORSETA', 'Marsupio', 'Belt bag'),
    ('SNEAKERS', 'Sneakers', 'Sneakers'),
    ('SLIDES', 'Ciabatte', 'Slides'),
    ('PAPUCI', 'Ciabatte', 'Slides'),
    ('PANTALONI', 'Pantaloni', 'Trousers'),
    ('COMPLEU', 'Completo', 'Set'),
    ('JACHETA', 'Giacca', 'Jacket'),
    ('CAMASA', 'Camicia', 'Shirt'),
    ('ROCHIE', 'Vestito', 'Dress'),
    ('TRICOU', 'T-shirt', 'T-shirt'),
    ('HOODIE', 'Hoodie', 'Hoodie'),
    ('GEANTA', 'Borsa', 'Bag'),
    ('SOSETE', 'Calze', 'Socks'),
    ('BLUZA', 'Felpa', 'Sweatshirt'),
    ('CUREA', 'Cintura', 'Belt'),
    ('FUSTA', 'Gonna', 'Skirt'),
    ('VESTA', 'Gilet', 'Vest'),
    ('BASCA', 'Cappello', 'Cap'),
    ('JEANS', 'Jeans', 'Jeans'),
    ('SHORT', 'Shorts', 'Shorts'),
    # colour adjectives as they appear in names (incl. plural/feminine forms)
    ('ALBASTRII', 'Blu', 'Blue'),
    ('ALBASTRI', 'Blu', 'Blue'),
    ('ALBASTRA', 'Blu', 'Blue'),
    ('ALBASTRU', 'Blu', 'Blue'),
    ('PORTOCALIU', 'Arancione', 'Orange'),
    ('VISINIU', 'Bordeaux', 'Burgundy'),
    ('NEGRII', 'Neri', 'Black'),
    ('NEGRI', 'Neri', 'Black'),
    ('NEAGRA', 'Nero', 'Black'),
    ('NEGRU', 'Nero', 'Black'),
    ('ALBII', 'Bianchi', 'White'),
    ('ALBI', 'Bianchi', 'White'),
    ('ALBE', 'Bianche', 'White'),
    ('ALBA', 'Bianco', 'White'),
    ('ALB', 'Bianco', 'White'),
    ('VERZI', 'Verdi', 'Green'),
    ('VERDE', 'Verde', 'Green'),
    ('GRI', 'Grigio', 'Grey'),
    ('MARO', 'Marrone', 'Brown'),
    ('CREM', 'Crema', 'Cream'),
    ('ROZ', 'Rosa', 'Pink'),
    ('MOV', 'Viola', 'Purple'),
    ('ROSU', 'Rosso', 'Red'),
    # gender markers
    ('BARBATI', 'Uomo', 'Men'),
    ('BARBAT', 'Uomo', 'Men'),
    ('DAMA', 'Donna', 'Women'),
    ('FEMEI', 'Donna', 'Women'),
    ('COPII', 'Bambini', 'Kids'),
    ('UNISEX', 'Unisex', 'Unisex'),
    # misc descriptors
    ('SCURTI', 'Corti', 'Short'),
    ('SCURT', 'Corto', 'Short'),
    ('LUNGI', 'Lunghi', 'Long'),
    ('LUNG', 'Lungo', 'Long'),
    ('LOGO', 'Logo', 'Logo'),
    ('TRANSPARENTA', 'Trasparente', 'Sheer'),
    ('TRANSPARENT', 'Trasparente', 'Sheer'),
    ('PORTOCALIE', 'Arancione', 'Orange'),
    ('PORTOCALII', 'Arancioni', 'Orange'),
    ('HANORAC', 'Felpa con cappuccio', 'Hoodie'),
    ('COLANTI', 'Leggings', 'Leggings'),
    ('INTREG', 'Intero', 'One-piece'),
    ('PIESE', 'pezzi', 'piece'),
    ('COSTUM', 'Costume', 'Suit'),
    ('BAIE', 'da bagno', 'swim'),
    ('PLAJA', 'da spiaggia', 'beach'),
    ('MAIEU', 'Canotta', 'Tank top'),
    ('GLUGA', 'cappuccio', 'hood'),
    ('PLIC', 'Pochette', 'Clutch'),
    ('BODY', 'Body', 'Bodysuit'),
    ('PIELE', 'Pelle', 'Leather'),
    ('CU', 'con', 'with'),
    ('SI', 'e', 'and'),
    ('DE', 'di', 'of'),
]


def cell_text(cell):
    return ''.join(cell.itertext()).strip()


def num(value):
    """Parse a spreadsheet number; the source uses comma decimals ('37,5')."""
    if not value:
        return None
    try:
        return float(value.replace(',', '.'))
    except ValueError:
        return None


def slugify(value):
    value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode()
    value = re.sub(r'[^a-zA-Z0-9]+', '-', value).strip('-').lower()
    return re.sub(r'-{2,}', '-', value)


def read_sheets(path):
    """Yield (sheet_name, rows) where rows is a list of cell-text lists."""
    root = ET.fromstring(zipfile.ZipFile(path).read('content.xml'))
    for table in root.iter(TABLE + 'table'):
        rows = []
        for r in table.findall('table:table-row', NS):
            repeat = int(r.get(TABLE + 'number-rows-repeated', 1))
            row = []
            for c in r.findall('table:table-cell', NS):
                # A huge trailing repeat is spreadsheet padding, not data.
                span = min(int(c.get(TABLE + 'number-columns-repeated', 1)), 50)
                row += [cell_text(c)] * span
            # Ignore rows repeated en masse (empty padding at sheet bottom).
            for _ in range(min(repeat, 5)):
                rows.append(row)
        yield table.get(TABLE + 'name'), rows


def translate_name(raw, brand):
    """Turn 'TRICOU TH LOGO BARBATI' into ('T-shirt Logo Uomo', 'Logo T-shirt Men')."""
    text = re.sub(r'\?+', ' ', raw.upper())
    text = re.sub(r'\s+', ' ', text).strip()
    # Drop the brand if the owner already repeated it in the name.
    for token in [brand.upper()] + brand.upper().split():
        if len(token) > 2:
            text = re.sub(r'\b%s\b' % re.escape(token), ' ', text)
    # Match longest phrases first ("COSTUM DE BAIE" must beat "DE"), swapping
    # each hit for a placeholder so later entries cannot re-match inside it.
    slots, remaining = [], text
    for src, it, en in NAME_WORDS:
        pattern = r'\b%s\b' % re.escape(src)
        while re.search(pattern, remaining):
            slots.append((it, en))
            remaining = re.sub(pattern, ' \x00%d\x00 ' % (len(slots) - 1), remaining, count=1)

    it_parts, en_parts, leftovers = [], [], []
    for token in remaining.split():
        hit = re.fullmatch(r'\x00(\d+)\x00', token)
        if hit:
            it, en = slots[int(hit.group(1))]
            it_parts.append(it)
            en_parts.append(en)
        else:
            # Unknown token (model codes, abbreviations) — keep it verbatim.
            leftovers.append(token)
            it_parts.append(token.title() if token.isalpha() else token)
            en_parts.append(token.title() if token.isalpha() else token)
    it_name = re.sub(r'\s+', ' ', ' '.join(it_parts)).strip() or raw.title()
    en_name = re.sub(r'\s+', ' ', ' '.join(en_parts)).strip() or raw.title()
    return it_name, en_name, leftovers


def parse():
    products = []
    warnings = []
    unknown_tokens = {}

    for path in sorted(glob.glob(os.path.join(IN_DIR, '*.ods'))):
        source = os.path.splitext(os.path.basename(path))[0]
        if source not in GENDER_BY_FILE:
            warnings.append(f'unmapped source file: {source}')
            continue
        gender_slug, gender_it, gender_en = GENDER_BY_FILE[source]

        for sheet, rows in read_sheets(path):
            brand = BRANDS.get(sheet.upper().strip())
            if not brand:
                warnings.append(f'{source}/{sheet}: unmapped brand, skipped')
                continue

            discount = None   # forward-filled down the sheet
            current = None    # product being accumulated
            # CATEGORIE and MARIME are also left blank once the owner has typed
            # them and carry down to the rows below (whole accessory sheets sit
            # on a single "UNIVERSAL" written at the top).
            last_category = ''
            last_size = ''

            for line_no, row in enumerate(rows[1:], start=2):
                row = [c.strip() for c in row] + [''] * 9
                sku, name, cat, color, size, qty, price = row[0], row[1], row[2], row[3], row[4], row[5], row[6]

                # A "Sconto X%" note lives past the VALOARE column and applies
                # from here down until the next note.
                note = next((c for c in row[9:] if c.strip()), '')
                match = re.search(r'(\d+)\s*%', note)
                if match:
                    discount = int(match.group(1))

                # Sheets end in hundreds of formula-only filler rows; anything
                # with no identity and no stock figures is one of those.
                if not (sku or name or size or qty or price):
                    continue

                if cat:
                    last_category = cat
                else:
                    cat = last_category
                if size:
                    last_size = size
                else:
                    size = last_size

                if sku:
                    # New product starts here. Rows the owner left unnamed are
                    # always sold-out leftovers (CANTITATE 0) — drop those; if
                    # one ever has stock, fall back to naming it by category.
                    if not name:
                        if not (num(qty) or 0):
                            current = None
                            continue
                        name = ' '.join(x for x in (cat, color) if x) or 'TODO_CONFIRM'
                        warnings.append(
                            f'{source}/{sheet} row {line_no}: SKU {sku} has stock but no NUME, '
                            f'named "{name}" from CATEGORIE + CULOARE')
                    it_name, en_name, leftovers = translate_name(name, brand)
                    for tok in leftovers:
                        unknown_tokens.setdefault(tok, 0)
                        unknown_tokens[tok] += 1
                    cat_key = cat.upper()
                    cat_entry = CATEGORIES.get(cat_key)
                    if not cat_entry:
                        warnings.append(f'{source}/{sheet} row {line_no}: unknown CATEGORIE "{cat}" for {sku}')
                    full_price = num(price) or 0.0
                    current = {
                        'sku': sku,
                        'source': source,
                        'sheet': sheet,
                        'brand': brand,
                        'raw_name': name,
                        'name_it': f'{brand} {it_name}'.strip(),
                        'name_en': f'{brand} {en_name}'.strip(),
                        'slug': slugify(f'{brand} {it_name} {sku}'),
                        'gender_slug': gender_slug,
                        'gender_it': gender_it,
                        'gender_en': gender_en,
                        'category': cat_entry[0] if cat_entry else None,
                        'category_it': cat_entry[1] if cat_entry else None,
                        'category_en': cat_entry[2] if cat_entry else None,
                        'raw_category': cat,
                        'discount_pct': discount,
                        'base_price': None,
                        'compare_at_price': None,
                        'variants': [],
                    }
                    products.append(current)

                if current is None:
                    continue
                if not size and not qty:
                    continue  # blank/formula filler row

                # Colour and price carry down from the product's first row when
                # the size rows leave them empty.
                row_color = color
                if not row_color and current['variants']:
                    row_color = current['variants'][-1]['raw_color']
                color_entry = COLORS.get(row_color.upper()) if row_color else None
                if not color_entry:
                    color_entry = COLOR_UNKNOWN
                    if row_color and row_color not in ('???', '????'):
                        warnings.append(f'{source}/{sheet} row {line_no}: unknown CULOARE "{row_color}"')

                row_price = num(price)
                if row_price is None and current['variants']:
                    row_price = current['variants'][-1]['full_price']

                size_value = size if size and size not in ('???', '????') else 'TODO_CONFIRM'
                if size_value == 'TODO_CONFIRM':
                    warnings.append(f'{source}/{sheet} row {line_no}: missing MARIME for {current["sku"]}')

                current['variants'].append({
                    'size': size_value,
                    'raw_color': row_color,
                    'color_it': color_entry[0],
                    'color_en': color_entry[1],
                    'color_hex': color_entry[2],
                    'quantity': int(num(qty) or 0),
                    'full_price': row_price or 0.0,
                })

    # Prices: the product's price is its cheapest variant's full price, reduced
    # by the block discount. compare_at_price only exists when a discount does.
    for p in products:
        p['stock_total'] = sum(v['quantity'] for v in p['variants'])
        # A product with nothing left in any size is imported but hidden.
        p['is_active'] = p['stock_total'] > 0
        # Price off the in-stock sizes; fall back to all sizes for hidden ones.
        prices = [v['full_price'] for v in p['variants'] if v['full_price'] and v['quantity']]
        if not prices:
            prices = [v['full_price'] for v in p['variants'] if v['full_price']]
        full = min(prices) if prices else 0.0
        if p['discount_pct']:
            p['compare_at_price'] = round(full, 2)
            p['base_price'] = round(full * (1 - p['discount_pct'] / 100), 2)
        else:
            p['base_price'] = round(full, 2)
            p['compare_at_price'] = None
        if not full:
            warnings.append(f'{p["sheet"]}/{p["sku"]}: no price found')

    # Many products share a NUME and differ only by colour ("SHORT DE PLAJA
    # PLEIN SPORT" x13). Append the colour when it is single and not already in
    # the name, so the listing does not show a wall of identical titles.
    for p in products:
        colors_it = {v['color_it'] for v in p['variants'] if v['color_it'] != 'TODO_CONFIRM'}
        if len(colors_it) != 1:
            continue
        color_it = next(iter(colors_it))
        color_en = next(v['color_en'] for v in p['variants'] if v['color_it'] == color_it)
        # Compare on the stem so "Nero" also matches an existing "Neri"/"Nera".
        stem = color_it[:-1].lower()
        if stem and stem not in p['name_it'].lower():
            p['name_it'] = f'{p["name_it"]} {color_it}'
            p['name_en'] = f'{p["name_en"]} {color_en}'
            p['slug'] = slugify(f'{p["name_it"]} {p["sku"]}')

    # Slugs must be unique — suffix collisions rather than lose a product.
    seen = {}
    for p in products:
        if p['slug'] in seen:
            seen[p['slug']] += 1
            p['slug'] = f'{p["slug"]}-{seen[p["slug"]]}'
            warnings.append(f'{p["sku"]}: duplicate slug, suffixed to {p["slug"]}')
        else:
            seen[p['slug']] = 1

    # Category tree: gender parents, with the categories actually used as children.
    tree = {}
    for p in products:
        if not p['category']:
            continue
        parent = tree.setdefault(p['gender_slug'], {
            'slug': p['gender_slug'], 'name_it': p['gender_it'], 'name_en': p['gender_en'],
            'children': {},
        })
        parent['children'].setdefault(p['category'], {
            'slug': f'{p["gender_slug"]}-{p["category"]}',
            'name_it': p['category_it'],
            'name_en': p['category_en'],
            'count': 0,
        })
        parent['children'][p['category']]['count'] += 1

    categories = []
    for parent in tree.values():
        children = sorted(parent['children'].values(), key=lambda c: -c['count'])
        categories.append({
            'slug': parent['slug'], 'name_it': parent['name_it'], 'name_en': parent['name_en'],
            'children': children,
        })

    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, 'w') as f:
        json.dump({'categories': categories, 'products': products, 'warnings': warnings}, f,
                  ensure_ascii=False, indent=2)

    variant_count = sum(len(p['variants']) for p in products)
    print(f'{len(products)} products, {variant_count} variants -> {OUT_PATH}')
    print(f'{len(categories)} parent categories, '
          f'{sum(len(c["children"]) for c in categories)} subcategories')
    if unknown_tokens:
        print('\nname tokens kept verbatim (no translation entry):')
        for tok, n in sorted(unknown_tokens.items(), key=lambda kv: -kv[1]):
            print(f'  {tok} ({n})')
    if warnings:
        print(f'\n{len(warnings)} warning(s):')
        for w in warnings[:40]:
            print(f'  {w}')
        if len(warnings) > 40:
            print(f'  ... and {len(warnings) - 40} more')


if __name__ == '__main__':
    parse()
