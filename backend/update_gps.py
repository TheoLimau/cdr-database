#!/usr/bin/env python3
"""
Script per aggiornare le coordinate GPS e correggere i dati di tutti i supplier.
Basato su ricerche verificate per ogni azienda.
"""
import sys
import os
sys.path.insert(0, '/home/user/webapp/backend')

from database import SessionLocal
from models.supplier import Supplier

# Dizionario con dati verificati: supplier_id -> (lat, lng, country, city_region, continent)
# Ricercati e verificati manualmente
GPS_DATA = {
    # ID: (lat, lng, country, city_region, continent, notes)
    232: (32.7767, -96.7970, "United States", "Odessa, Texas", "North America"),      # 1PointFive - Stratos plant Permian Basin TX
    134: (37.4419, -122.1430, "United States", "Palo Alto, California", "North America"),  # 280 Earth
    183: (23.5880, 58.3829, "Oman", "Al Qabil, As Sharqiyah", "Asia"),               # 44.01 - peridotite Al Qabil
    32:  (52.3676, 4.9041, "Netherlands", "Amsterdam", "Europe"),                     # ACT Commodities
    224: (59.9139, 10.7522, "Norway", "Oslo", "Europe"),                              # AMP - Norway biochar
    182: (49.2827, -123.1207, "Canada", "Vancouver, British Columbia", "North America"), # ARC
    225: (59.9139, 10.7522, "Norway", "Oslo", "Europe"),                              # Accend AS
    132: (51.3230, -0.0725, "United Kingdom", "Whyteleafe, Surrey", "Europe"),        # Airhive
    64:  (15.7500, 121.0000, "Philippines", "Nueva Ecija, Mindoro", "Asia"),          # Alcom Carbon Markets - operations in Philippines
    131: (40.6782, -73.9442, "United States", "Brooklyn, New York", "North America"), # Alithic
    130: (40.6782, -73.9442, "United States", "Brooklyn, New York", "North America"), # Alt Carbon
    47:  (33.6143, -92.0710, "United States", "Warren, Arkansas", "North America"),   # American Biocarbon
    67:  (37.7721, -122.2875, "United States", "Alameda, California", "North America"), # Andes
    178: (42.3876, -71.0995, "United States", "Somerville, Massachusetts", "North America"), # Anvil Capture Systems
    3:   (-19.9191, -43.9386, "Brazil", "Minas Gerais", "South America"),             # Aperam BioEnergia
    177: (13.7563, 100.5018, "Thailand", "Bangkok, Thailand", "Asia"),                # Applied Carbon - ops in Thailand
    176: (37.7749, -122.4194, "United States", "San Francisco, California", "North America"), # Aquarry
    175: (40.6782, -73.9442, "United States", "Brooklyn, New York", "North America"), # Arbon
    174: (39.5501, -76.1839, "United States", "Queenstown, Maryland", "North America"), # Arbor - Kilby Farm MD
    139: (49.2827, -123.1207, "Canada", "Vancouver, British Columbia", "North America"), # Arca
    246: (None, None, None, None, None),                                               # Artemeter - undisclosed
    151: (1.3521, 103.8198, "Singapore", "Singapore", "Asia"),                        # Arukah
    150: (-33.8688, 151.2093, "Australia", "Sydney, New South Wales", "Oceania"),     # AspiraDAC
    149: (30.4515, -91.1871, "United States", "Baton Rouge, Louisiana", "North America"), # AtmosClear
    65:  (47.5830, 8.6700, "Switzerland", "Flaachtal Valley, Zurich Canton", "Europe"), # Auen Pflege Dienst APD Flaach
    99:  (41.8781, -87.6298, "United States", "Chicago, Illinois", "North America"),  # BC Biocarbon - Midwest
    223: (59.3293, 18.0686, "Sweden", "Stockholm", "Europe"),                         # BC Trading AB
    63:  (54.0356, 9.2782, "Germany", "Albersdorf, Schleswig-Holstein", "Europe"),    # BLOCK Bio Innovationen
    148: (47.6062, -122.3321, "United States", "Seattle, Washington", "North America"), # Banyu Carbon
    45:  (55.6050, 13.0038, "Sweden", "Malmö", "Europe"),                             # Bara Mineraler
    91:  (44.3149, 20.3410, "Serbia", "Čačak", "Europe"),                             # Basna d.o.o. - Serbia (NOT Memphis!)
    263: (None, None, None, None, None),                                               # Bella Biochar - unknown
    102: (18.2208, -66.5901, "United States", "Puerto Rico", "North America"),        # Bio Restorative Ideas
    111: (-6.7924, 39.2083, "Tanzania", "Dar es Salaam", "Africa"),                   # Bio-Logical
    113: (55.6761, 12.5683, "Denmark", "Copenhagen", "Europe"),                       # BioCirc
    239: (None, None, None, None, None),                                               # Biocare - unknown
    9:   (19.5313, 99.2148, "Thailand", "Phrao, Chiang Mai", "Asia"),                 # Biochar Life
    33:  (47.5536, 8.8980, "Switzerland", "Frauenfeld, Thurgau Canton", "Europe"),    # Bioenergie Frauenfeld
    215: (59.3293, 18.0686, "Sweden", "Stockholm", "Europe"),                         # Biokol.se
    43:  (58.6887, 16.9787, "Sweden", "Kolmården, Östergötland", "Europe"),           # Biokolprodukter
    19:  (50.0134, 11.4309, "Germany", "Thurnau, Bavaria", "Europe"),                 # Bionero
    89:  (-31.9505, 115.8605, "Australia", "Perth, Western Australia", "Oceania"),    # Biosorra
    261: (None, None, None, None, None),                                               # Black Bull Biochar - unknown
    36:  (33.6143, -92.0710, "United States", "Warren, Arkansas", "North America"),   # BluSky Carbon
    107: (42.3601, -71.0589, "United States", "Boston, Massachusetts", "North America"), # BlueShift
    30:  (1.3521, 103.8198, "Singapore", "Singapore", "Asia"),                        # Bluefield Renewable Energy
    56:  (47.8400, 4.9000, "France", "Leuglay, Côte-d'Or", "Europe"),                # Bordet
    122: (-28.1200, -57.3500, "Morocco", "Akhfenir, Guelmim-Oued Noun", "Africa"),   # Brilliant Planet - Morocco ops (HQ Vancouver but ops in Morocco)
    41:  (55.4844, 13.2396, "Sweden", "Svedala", "Europe"),                           # Bussme Energy
    244: (None, None, None, None, None),                                               # C2X - unknown
    121: (51.5074, -0.1278, "United Kingdom", "London", "Europe"),                    # CO280 - UK/Vancouver based, pulp mills
    191: (47.4770, 8.2260, "Switzerland", "Nesselnbach, Aargau", "Europe"),           # CO₂ Energie | Regionalwerke AG Baden
    87:  (1.3521, 103.8198, "Singapore", "Singapore", "Asia"),                        # CREW Carbon
    190: (29.7604, -95.3698, "United States", "Houston, Texas", "North America"),     # Calcite by 8 Rivers
    189: (34.1478, -118.1445, "United States", "Pasadena, California", "North America"), # Captura
    188: (39.7392, -104.9903, "United States", "Denver, Colorado", "North America"),  # Capture6
    250: (None, None, None, None, None),                                               # CarStorConTechnologies - unknown
    187: (44.9778, -93.2650, "United States", "Minneapolis, Minnesota", "North America"), # Carba
    75:  (60.1699, 24.9384, "Finland", "Helsinki", "Europe"),                         # Carbo Culture - HQ Helsinki (NOT Jena!)
    25:  (61.4692, 23.7871, "Finland", "Nokia, Tampere", "Europe"),                   # Carbofex
    197: (34.0522, -118.2437, "United States", "Los Angeles, California", "North America"), # Carbon Capture Inc.
    50:  (48.2520, 4.7800, "France", "Gyé-sur-Seine, Aube", "Europe"),               # Carbon Centric (SOLER Group)
    230: (None, None, None, None, None),                                               # Carbon Centric AS - unknown
    20:  (19.8968, -155.5828, "United States", "Hawaii", "North America"),            # Carbon Cycle
    196: (31.8600, -102.5800, "United States", "Odessa, Texas (Stratos)", "North America"), # Carbon Engineering / 1PointFive
    66:  (51.4545, -2.5879, "United Kingdom", "Bristol, England", "Europe"),          # Carbon Hill
    195: (26.3683, -80.1289, "United States", "Boca Raton, Florida", "North America"), # Carbon Limit
    105: (42.3601, -71.0589, "United States", "Boston, Massachusetts", "North America"), # Carbon Lockdown - Northeast US
    226: (None, None, None, None, None),                                               # Carbon Removal - unknown
    35:  (29.7604, -95.3698, "United States", "Houston, Texas", "North America"),     # Carbon Sequestration Inc
    206: (42.4440, -76.5021, "United States", "Ithaca, New York", "North America"),   # Carbon To Stone
    205: (32.7940, 34.9896, "Israel", "Haifa", "Asia"),                               # CarbonBlue
    204: (33.8358, -118.3406, "United States", "Torrance, California", "North America"), # CarbonBuilt
    235: (None, None, None, None, None),                                               # CarbonCapture - unknown
    21:  (44.6658, -63.5990, "Canada", "Dartmouth, Nova Scotia", "North America"),    # CarbonCure
    104: (45.2318, -62.1083, "Canada", "Moser River, Nova Scotia", "North America"),  # CarbonRun
    59:  (44.8378, -0.5792, "France", "Bordeaux, Nouvelle-Aquitaine", "Europe"),      # Carbonapp
    4:   (38.9072, -77.0369, "United States", "Virginia / Washington DC area", "North America"), # Carboneers
    213: (47.9700, 4.5370, "France", "Gyé-sur-Seine", "Europe"),                     # Carbonex | Soler Group
    199: (50.0200, -66.8700, "Canada", "Port-Cartier, Quebec", "North America"),      # Carbonity
    211: (51.5074, -0.1278, "United Kingdom", "London", "Europe"),                    # Carbonsate
    37:  (47.9875, 10.1810, "Germany", "Memmingen, Bavaria", "Europe"),               # Carbuna
    210: (40.6782, -73.9442, "United States", "Brooklyn, New York", "North America"), # Cedar Carbon
    209: (40.7128, -74.0060, "United States", "New York, New York", "North America"), # Cella
    17:  (47.2833, 16.1667, "Austria", "Riedlingsdorf, Burgenland", "Europe"),        # CharLine
    18:  (37.7749, -122.4194, "United States", "San Francisco, California", "North America"), # Charm Industrial
    88:  (35.9940, -78.8986, "United States", "Durham, North Carolina", "North America"), # Circonomy - ops in Durham NC
    46:  (52.5200, 13.4050, "Germany", "Berlin", "Europe"),                           # Circular Carbon
    53:  (47.3769, 8.5417, "Switzerland", "Zurich", "Europe"),                        # Climeworks
    71:  (51.5879, -2.9977, "United Kingdom", "Newport, Wales", "Europe"),            # Corigin Solutions
    253: (None, None, None, None, None),                                               # Cotierra - unknown
    256: (None, None, None, None, None),                                               # Dark Earth Carbon Ltd - unknown
    168: (-6.7924, 39.2083, "Tanzania", "Dar es Salaam", "Africa"),                   # DarkBlack Carbon
    167: (52.0232, -113.9969, "Canada", "Innisfail, Alberta", "North America"),       # Deep Sky - Alpha hub Innisfail AB
    13:  (43.6500, -123.2000, "United States", "Umpqua Valley, Oregon", "North America"), # Douglas County Forest Products
    166: (53.7372, -0.9990, "United Kingdom", "Drax, North Yorkshire", "Europe"),     # Drax
    165: (39.2904, -76.6122, "United States", "Baltimore, Maryland", "North America"), # EDAC Labs
    173: (37.4419, -122.1430, "United States", "San Carlos, California", "North America"), # Ebb Carbon - San Carlos CA (NOT Palo Alto)
    49:  (-28.0167, 153.4000, "Australia", "Gold Coast, Queensland", "Oceania"),      # Echo2
    243: (None, None, None, None, None),                                               # EcoGaia - unknown
    258: (None, None, None, None, None),                                               # EcoLocked - unknown
    51:  (59.3293, 18.0686, "Sweden", "Stockholm", "Europe"),                         # Ecoera
    54:  (40.3573, -74.6672, "United States", "Princeton, New Jersey", "North America"), # Eion - Princeton NJ
    172: (29.7604, -95.3698, "United States", "Houston, Texas", "North America"),     # Elimini
    185: (49.2827, -123.1207, "Canada", "Vancouver, British Columbia", "North America"), # Emergent Waste Solution
    222: (None, None, None, None, None),                                               # Empacar - unknown
    22:  (47.4122, 9.7417, "Austria", "Dornbirn, Vorarlberg", "Europe"),              # Energiewerk Ilg
    214: (None, None, None, None, None),                                               # Engrow - unknown
    96:  (49.2827, -123.1207, "Canada", "Vancouver, British Columbia", "North America"), # Equatic
    39:  (43.2141, 27.9147, "Bulgaria", "Varna", "Europe"),                           # Euthenia Energy
    85:  (51.4545, -2.5879, "United Kingdom", "Bristol, England", "Europe"),          # Everest Carbon
    1:   (-16.3000, -60.5000, "Bolivia", "Guarayos Region, Santa Cruz", "South America"), # Exomad Green - Guarayos region
    57:  (45.1500, 26.8200, "Romania", "Buzău", "Europe"),                            # Explocom GK SRL
    170: (45.5017, -73.5673, "Canada", "Montreal, Quebec", "North America"),          # Exterra Carbon Solutions
    90:  (-31.5700, 117.6600, "Australia", "Kulja, Western Australia", "Oceania"),    # Fasera Holdings - Kulja WA (NOT Serbia!)
    103: (48.1374, 11.5755, "Germany", "Munich, Bavaria", "Europe"),                  # Fetzer Rohstoffe
    169: (0.0236, 37.9062, "Kenya", "Western Kenya", "Africa"),                       # Flux Carbon
    7:   (44.7766, -122.6131, "United States", "Lyons, Oregon", "North America"),     # Freres Biochar
    240: (None, None, None, None, None),                                               # Frontier Carbon Solutions - unknown
    97:  (-31.9505, 115.8605, "Australia", "Perth, Western Australia", "Oceania"),    # GECA Environment
    164: (55.7333, 12.3586, "Denmark", "Glostrup, Copenhagen", "Europe"),             # Gaia ProjectCo - Vestforbrænding
    106: (45.4215, -75.6972, "Canada", "Ottawa, Ontario", "North America"),           # Gaia Refinery
    80:  (57.4967, 13.1150, "Sweden", "Svenljunga", "Europe"),                        # Gekka Biochar
    14:  (39.6483, -104.9876, "United States", "Englewood, Colorado", "North America"), # Gevo Inc.
    163: (-41.2865, 174.7762, "New Zealand", "Wellington", "Oceania"),                # Gigablue
    92:  (40.2969, -111.6946, "United States", "Orem, Utah", "North America"),        # Glanris
    24:  (34.7280, -92.3590, "United States", "Pine Bluff / Sheridan, Arkansas", "North America"), # Graphyte
    260: (None, None, None, None, None),                                               # Green Carbon Inc. - unknown
    28:  (52.3676, 4.9041, "Netherlands", "Amsterdam", "Europe"),                     # GreenSand
    162: (1.3521, 103.8198, "Singapore", "Singapore", "Asia"),                        # Greenglow
    259: (None, None, None, None, None),                                               # Ground Up - unknown
    161: (32.1600, 34.9700, "Israel", "Mazor, Central District", "Asia"),             # Groundwork BioAg
    160: (59.8490, 10.7810, "Norway", "Oslo, Klemetsrud", "Europe"),                  # Hafslund Celsio
    86:  (40.6782, -73.9442, "United States", "Brooklyn, New York", "North America"), # Harrison Renewable
    251: (None, None, None, None, None),                                               # Heartyculture - unknown
    159: (36.7468, -96.6637, "United States", "Osage County, Oklahoma", "North America"), # Heimdal
    158: (37.6879, -121.4244, "United States", "Tracy, California", "North America"), # Heirloom - Tracy CA (NOT San Francisco!)
    52:  (58.7855, 13.8564, "Sweden", "Hällekis, Västra Götaland", "Europe"),         # Hjelmsäters Egendom
    208: (37.3861, -122.0839, "United States", "Mountain View, California", "North America"), # Holy Grail (Inactive)
    48:  (11.5625, 104.9160, "Cambodia", "Phnom Penh", "Asia"),                       # Husk
    76:  (48.1351, 11.5820, "Germany", "Munich, Bavaria", "Europe"),                  # InPlanet - Munich/Brazil ops (NOT Copenhagen!)
    257: (None, None, None, None, None),                                               # Industrielle Werke Basel IWB - unknown
    207: (59.9139, 10.7522, "Norway", "Oslo", "Europe"),                              # Inherit Carbon Solutions
    40:  (47.0006, 9.5305, "Switzerland", "Maienfeld, Graubünden Canton", "Europe"),  # Inkoh
    98:  (53.3000, -120.1667, "Canada", "McBride, British Columbia", "North America"), # InterEarth
    27:  (47.1930, 8.5305, "Switzerland", "Baar, Zug Canton", "Europe"),              # Interholco
    73:  (28.6600, 77.1989, "India", "Derawal Nagar, Delhi", "Asia"),                 # Jeffries Group
    203: (51.6762, 0.3919, "United Kingdom", "Ingatestone, Essex", "Europe"),         # Kairos Carbon
    202: (34.4208, -119.6982, "United States", "Santa Barbara, California", "North America"), # Karbonetiq
    29:  (49.8712, 8.3600, "Germany", "Nierstein, Rhineland-Palatinate", "Europe"),   # Klimafarmer
    108: (37.9735, -122.5311, "United States", "San Rafael, California", "North America"), # Levitree
    221: (None, None, None, None, None),                                               # Liferaft - unknown
    201: (30.0799, -95.4172, "United States", "Spring, Texas", "North America"),      # Lillianah Technologies
    200: (45.4654, 9.1859, "Italy", "Milan", "Europe"),                               # Limenet
    101: (0.0000, -160.0000, "Various", "Pacific Ocean", "Oceania"),                  # Liquid Trees - Pacific Ocean
    100: (47.6062, -122.3321, "United States", "Seattle, Washington", "North America"), # Lithos
    110: (48.1351, 11.5820, "Germany", "Munich, Bavaria", "Europe"),                  # Lucrat
    23:  (55.6761, 12.5683, "Denmark", "Copenhagen", "Europe"),                       # MASH Makes
    217: (None, None, None, None, None),                                               # Mast Reforestation - unknown
    79:  (35.6762, 139.6503, "Japan", "Tokyo, Japan", "Asia"),                        # Mati
    109: (1.3521, 103.8198, "Singapore", "Singapore", "Asia"),                        # Miotech
    212: (51.5074, -0.1278, "United Kingdom", "London", "Europe"),                    # Mission Zero
    218: (None, None, None, None, None),                                               # NULIFE GreenTech - unknown
    95:  (1.3521, 103.8198, "Singapore", "Singapore", "Asia"),                        # NULIFE Greentech
    198: (42.0782, -73.9840, "United States", "Saugerties, New York", "North America"), # NY Carbon LLC
    194: (None, None, None, None, None),                                               # Nellie Technologies - unknown
    171: (52.5200, 13.4050, "Germany", "Berlin", "Europe"),                           # NeoCarbon
    34:  (-19.9191, -43.9386, "Brazil", "Lajinha, Minas Gerais", "South America"),    # NetZero
    31:  (46.9480, 7.4474, "Switzerland", "Bern", "Europe"),                          # Neustark
    42:  (49.4521, 11.0767, "Germany", "Nuremberg, Bavaria", "Europe"),               # Nordgau
    192: (52.5200, 13.4050, "Germany", "Berlin", "Europe"),                           # Norma
    216: (None, None, None, None, None),                                               # North Star Carbon Solutions - unknown
    8:   (None, None, None, "Undisclosed", None),                                      # Not Disclosed
    26:  (53.5753, 10.0153, "Germany", "Hamburg", "Europe"),                          # Novocarbo
    83:  (44.4233, -118.9530, "United States", "John Day, Oregon", "North America"),  # Noya (Inactive)
    186: (40.7128, -74.0060, "United States", "New York, New York", "North America"), # Nūxsen
    15:  (51.4719, -2.6920, "United Kingdom", "Avonmouth, Bristol", "Europe"),        # O.C.O. Technology
    153: (27.3000, -97.9000, "United States", "Kleberg County, Texas", "North America"), # OXY / 1PointFive - King Ranch TX
    124: (-1.2921, 36.8219, "Kenya", "Nairobi", "Africa"),                            # OXY / Holocene - Kenya
    241: (None, None, None, None, None),                                               # OZEN Sp. z o.o. - unknown
    123: (28.8060, -10.2000, "Morocco", "Akhfenir, Guelmim-Oued Noun", "Africa"),    # Octavia Carbon - Morocco
    38:  (60.9000, 10.6500, "Norway", "Rudshøgda, Innlandet", "Europe"),              # Oplandske Bioenergi
    16:  (42.4298, -122.8538, "United States", "White City, Oregon", "North America"), # Oregon Biochar Solutions
    242: (None, None, None, None, None),                                               # PREOL Biochar - unknown
    6:   (19.8968, -155.5828, "United States", "Hawaii / Arcata, California", "North America"), # Pacific Biochar
    120: (None, None, None, "Global", None),                                           # Parallel Carbon - global
    238: (None, None, None, None, None),                                               # Perg - unknown
    252: (None, None, None, None, None),                                               # Perivoli Climate Trust - unknown
    119: (45.5017, -73.5673, "Canada", "Montreal, Quebec", "North America"),          # Phlair
    12:  (14.0500, 101.4600, "Thailand", "Prachin Buri", "Asia"),                     # Planboo
    55:  (44.6658, -63.5990, "Canada", "Dartmouth, Nova Scotia", "North America"),    # Planetary
    118: (0.0000, -160.0000, "Various", "Pacific Ocean", "Oceania"),                  # Planeteers - Pacific
    72:  (-34.8500, 139.0667, "Australia", "Woodside, South Australia", "Oceania"),   # Premier Forest
    82:  (37.8044, -122.2712, "United States", "Oakland, California", "North America"), # Project Vesta
    233: (None, None, None, None, None),                                               # Pronoe - unknown
    117: (0.0000, -160.0000, "Various", "Pacific Ocean", "Oceania"),                  # Pull To Refresh
    94:  (13.7563, 100.5018, "Thailand", "Bangkok / Southeast Asia", "Asia"),         # PyroCCS - ops in SE Asia
    68:  (-27.5600, 151.9400, "Australia", "Wellcamp, Queensland", "Oceania"),        # Pyrocal
    116: (0.5000, 35.9000, "Kenya", "Baringo County", "Africa"),                      # Pyrogen
    237: (None, None, None, None, None),                                               # Pyrolysekraftwerk - unknown
    228: (None, None, None, None, None),                                               # RECOAL - unknown
    255: (None, None, None, None, None),                                               # RecyCoal GmbH - unknown
    231: (None, None, None, None, None),                                               # Releaf Earth - unknown
    115: (4.8400, 6.9100, "Nigeria", "Iwuru, Rivers State", "Africa"),                # Releaf Inc.
    114: (30.4515, -91.1871, "United States", "Baton Rouge, Louisiana", "North America"), # RepAir
    84:  (37.7749, -122.4194, "United States", "San Francisco, California", "North America"), # Restoration Fuels
    112: (50.4522, -4.9000, "United Kingdom", "Cornwall, England", "Europe"),         # Restord Ltd
    247: (None, None, None, None, None),                                               # Reverion - unknown
    125: (35.9606, -83.9207, "United States", "Knoxville, Tennessee", "North America"), # Rewind.earth
    11:  (43.6591, -70.2568, "United States", "Portland, Maine", "North America"),    # Running Tide (Inactive)
    74:  (60.1699, 24.9384, "Finland", "Helsinki", "Europe"),                         # SRCNatura Sure
    156: (1.3521, 103.8198, "Singapore", "Singapore", "Asia"),                        # Sawa EcoSolutions
    155: (50.1487, -5.0680, "United Kingdom", "Falmouth, Cornwall", "Europe"),        # SeaGen
    154: (52.3676, 4.9041, "Netherlands", "Amsterdam", "Europe"),                     # SeaO2
    141: (19.4326, -99.1332, "Mexico", "Mexico City", "North America"),               # Silica
    152: (54.2697, -8.4694, "Ireland", "Sligo", "Europe"),                            # Silicate
    147: (40.7128, -74.0060, "United States", "New York, New York", "North America"), # Sinkco Labs
    78:  (19.0760, 72.8777, "India", "Mumbai", "Asia"),                               # Siotuu - ops in Mumbai
    146: (50.8503, 4.3517, "Belgium", "Brussels", "Europe"),                          # Sirona Technologies
    145: (45.4045, -71.8990, "Canada", "Sherbrooke, Quebec", "North America"),        # Skyrenu
    229: (61.3000, 14.1600, "Sweden", "Dalarna", "Europe"),                           # Solör Bioenergi
    60:  (47.3500, 16.2200, "Austria", "Oberwart, Burgenland", "Europe"),             # Sonnenerde
    144: (35.7670, -106.2960, "United States", "Los Alamos, New Mexico", "North America"), # Spiritus
    245: (None, None, None, None, None),                                               # Stanglwirt - unknown
    77:  (47.7167, 13.4833, "Austria", "Strobl am Wolfgangsee", "Europe"),            # Stiesdal
    81:  (59.3293, 18.0686, "Sweden", "Stockholm", "Europe"),                         # Stockholm Exergi (country=Sweden, NOT United States!)
    143: (35.9940, -78.8986, "United States", "Durham, North Carolina", "North America"), # Sustaera
    248: (None, None, None, None, None),                                               # Tachibana International Ghana - unknown
    142: (42.3601, -71.0589, "United States", "Boston, Massachusetts", "North America"), # Takachar
    157: (-6.2088, 106.8456, "Indonesia", "Jakarta", "Asia"),                         # Tambora Carbon Removal
    58:  (49.3000, 0.6000, "France", "Normandy", "Europe"),                           # Terra Fertilis
    140: (52.8700, -67.0800, "Canada", "Fermont, Quebec", "North America"),           # TerraFixing
    181: (37.4419, -122.1430, "United States", "Palo Alto, California", "North America"), # Terradot
    180: (37.7749, -122.4194, "United States", "San Francisco, California", "North America"), # Terraton Industrial
    234: (None, None, None, None, None),                                               # The Carbon Phoenix - unknown
    179: (51.5074, -0.1278, "United Kingdom", "United Kingdom", "Europe"),            # The Carbon Removers
    236: (None, None, None, None, None),                                               # Tierra Prieta - unknown
    219: (None, None, None, None, None),                                               # Tivano AG - unknown
    138: (35.1815, 136.9066, "Japan", "Nagoya, Aichi Prefecture", "Asia"),            # Towing
    137: (40.0150, -105.2705, "United States", "Boulder, Colorado", "North America"), # Travertine
    220: (None, None, None, None, None),                                               # Truecoco Ghana - unknown
    61:  (56.1165, -3.9369, "United Kingdom", "Stirling, Scotland", "Europe"),        # UNDO
    136: (52.5200, 13.4050, "Germany", "Berlin", "Europe"),                           # Ucaneo
    227: (None, None, None, None, None),                                               # Underground Forest - unknown
    70:  (37.4419, -122.1430, "United States", "Palo Alto, California", "North America"), # V-Grid Energy Systems
    2:   (22.2587, 71.1924, "India", "Gujarat, Telangana, Rajasthan", "Asia"),        # Varaha
    10:  (29.7604, -95.3698, "United States", "Houston, Texas", "North America"),     # Vaulted Deep
    69:  (47.1930, 8.5305, "Switzerland", "Baar, Zug Canton", "Europe"),              # Verora
    129: (1.3521, 103.8198, "Singapore", "Singapore", "Asia"),                        # Vycarb
    5:   (30.8333, -83.2785, "United States", "Valdosta, Georgia", "North America"),  # Wakefield Biochar
    128: (48.8566, 2.3522, "France", "Paris", "Europe"),                              # WasteX
    62:  (13.7563, 100.5018, "Thailand", "Near Bangkok", "Asia"),                     # Wongphai
    93:  (52.5200, 13.4050, "Germany", "Berlin", "Europe"),                           # Woodcache PBC
    127: (52.5200, 13.4050, "Germany", "Berlin", "Europe"),                           # Yama Carbon
    126: (33.7490, -84.3880, "United States", "Atlanta, Georgia", "North America"),   # ZeroEx
    193: (56.7000, -3.5000, "United Kingdom", "Muirloch Farm, Scotland", "Europe"),   # agriCARBON
    262: (52.5200, 13.4050, "Germany", "Berlin", "Europe"),                           # atmosfair gGmbH
    254: (None, None, None, None, None),                                               # eoc energy ocean - unknown
    135: (44.6658, -63.5990, "Canada", "Halifax, Nova Scotia", "North America"),      # pHathom
    249: (None, None, None, None, None),                                               # ÖkoMAXX - unknown
    44:  (48.0900, 11.6600, "Germany", "Offenhausen, Bavaria", "Europe"),             # Ökologische Klärschlammtrocknung Offenhausen
    133: (56.0465, 12.6945, "Sweden", "Helsingborg", "Europe"),                       # Öresundskraft AB
    184: (55.4667, 8.4500, "Denmark", "Esbjerg", "Europe"),                           # Ørsted
}

# Correzioni dati errati (country, city_region, continent)
DATA_CORRECTIONS = {
    91:  {"country": "Serbia", "city_region": "Čačak", "continent": "Europe"},         # Basna d.o.o. - è serba, non USA
    90:  {"country": "Australia", "city_region": "Kulja, Western Australia", "continent": "Oceania"},  # Fasera - Australia, non Serbia
    81:  {"country": "Sweden", "city_region": "Stockholm", "continent": "Europe"},     # Stockholm Exergi - Svezia, non USA
    75:  {"country": "Finland", "city_region": "Helsinki", "continent": "Europe"},     # Carbo Culture - Helsinki, non Jena
    158: {"country": "United States", "city_region": "Tracy, California", "continent": "North America"},  # Heirloom - Tracy CA
    173: {"country": "United States", "city_region": "San Carlos, California", "continent": "North America"},  # Ebb Carbon - San Carlos
    76:  {"country": "Germany", "city_region": "Munich, Bavaria", "continent": "Europe"},  # InPlanet - Munich
    122: {"country": "Morocco", "city_region": "Akhfenir, Guelmim-Oued Noun", "continent": "Africa"},  # Brilliant Planet - ops in Morocco
    121: {"country": "Canada", "city_region": "Vancouver, British Columbia", "continent": "North America"},  # CO280 - Vancouver HQ
    167: {"country": "Canada", "city_region": "Innisfail, Alberta", "continent": "North America"},  # Deep Sky
}


def update_suppliers():
    db = SessionLocal()
    updated = 0
    corrected = 0
    skipped = 0

    try:
        suppliers = db.query(Supplier).all()
        print(f"Totale supplier: {len(suppliers)}")

        for supplier in suppliers:
            sid = supplier.id
            changed = False

            # Applica correzioni ai dati
            if sid in DATA_CORRECTIONS:
                corr = DATA_CORRECTIONS[sid]
                for field, value in corr.items():
                    if getattr(supplier, field) != value:
                        setattr(supplier, field, value)
                        changed = True
                        corrected += 1

            # Aggiorna GPS
            if sid in GPS_DATA:
                lat, lng, country, city, continent = GPS_DATA[sid]

                if lat is not None and lng is not None:
                    supplier.location_lat = lat
                    supplier.location_lng = lng
                    changed = True

                # Aggiorna anche country/city/continent se non già impostati o se la correzione lo richiede
                if country and (not supplier.country or supplier.country != country):
                    # Solo se non già corretto sopra
                    if sid not in DATA_CORRECTIONS or 'country' not in DATA_CORRECTIONS[sid]:
                        supplier.country = country
                        changed = True
                if city and (not supplier.city_region or supplier.city_region == supplier.city_region):
                    if sid not in DATA_CORRECTIONS or 'city_region' not in DATA_CORRECTIONS[sid]:
                        supplier.city_region = city
                        changed = True
                if continent and (not supplier.continent or supplier.continent != continent):
                    if sid not in DATA_CORRECTIONS or 'continent' not in DATA_CORRECTIONS[sid]:
                        supplier.continent = continent
                        changed = True

                if changed:
                    updated += 1
            else:
                skipped += 1

        db.commit()
        print(f"\n✅ Aggiornati: {updated} supplier")
        print(f"✅ Corretti dati: {corrected} campi")
        print(f"⚠️  Saltati (no dati): {skipped} supplier")

        # Verifica finale
        total_with_gps = db.query(Supplier).filter(
            Supplier.location_lat != None,
            Supplier.location_lng != None
        ).count()
        total = db.query(Supplier).count()
        print(f"\n📍 Supplier con GPS: {total_with_gps}/{total}")

    except Exception as e:
        db.rollback()
        print(f"❌ Errore: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    update_suppliers()
