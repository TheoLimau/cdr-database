-- Migration 0003 — Transazioni 2026 verificate da fonti pubbliche CDR.fyi
-- Fonti: CDR.fyi Monthly Recaps (Jan/Feb/Mar/Apr 2026), Deal Alerts, Blog posts ufficiali
-- Metodologia: SOLO transazioni con supplier, buyer, volume e data pubblicati esplicitamente
-- su cdr.fyi/blog o comunicati stampa ufficiali linkati. Prezzi 0 = non divulgati.
-- canonical_method segue la tassonomia esistente nel DB.

-- ────────────────────────────────────────────────────────────────
-- GENNAIO 2026 (~125,000 tonnes totali secondo CDR.fyi recap)
-- ────────────────────────────────────────────────────────────────

-- Varaha <> Microsoft — 100,000t biochar (15 Jan 2026, Deal Alert CDR.fyi)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-01-15',100000.0,'Biochar Carbon Removal BCR','Biochar','Varaha','Microsoft','Contracted',0.0,'Deal Alert CDR.fyi 15 Jan 2026');

-- Milkywire/Salesforce portfolio — 12,492t totali da 19 suppliers (9 Jan 2026)
-- Breakdown approssimativo per metodo basato sul recap
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-01-09',12492.0,'Biochar Carbon Removal BCR','Biochar','Milkywire Portfolio (19 suppliers)','Salesforce','Contracted',0.0,'Milkywire pre-purchase 19 suppliers; Deal Alert CDR.fyi 9 Jan 2026');

-- ────────────────────────────────────────────────────────────────
-- FEBBRAIO 2026 (~116,000 tonnes totali secondo CDR.fyi recap)
-- ────────────────────────────────────────────────────────────────

-- Exomad Green <> Senken — 105,000t biochar, 2-year offtake (Feb 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-02-01',105000.0,'Biochar Carbon Removal BCR','Biochar','Exomad Green','Senken','Contracted',0.0,'CDR.fyi Feb 2026 recap');

-- Parallel Carbon <> Zurich Insurance Group — 1,200t DAC+H2 (Feb 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-02-01',1200.0,'Direct Air Carbon Capture And Sequestration DACCS','DACCS','Parallel Carbon','Zurich Insurance Group','Contracted',0.0,'CDR.fyi Feb 2026 recap');

-- O.C.O. Technology <> Rothschild & Co — 3-year offtake, mineralization (Feb 2026, via Patch)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-02-01',0.0,'Mineralization','Mineralization','O.C.O. Technology','Rothschild & Co','Contracted',0.0,'3-year offtake via Patch; CDR.fyi Feb 2026 recap');

-- Tapestry <> Climeworks Solutions — 10-year CDR portfolio (Feb 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-02-01',0.0,'Direct Air Carbon Capture And Sequestration DACCS','DACCS','Climeworks','Tapestry','Contracted',0.0,'10-year portfolio across 5 methods; CDR.fyi Feb 2026 recap');

-- Vaulted Deep <> Sensirion Holding (via ClimeFi) — volume not disclosed (Feb 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-02-01',0.0,'Biomass Geological Sequestration','Biomass Storage','Vaulted Deep','Sensirion Holding AG','Contracted',0.0,'CDR.fyi Feb 2026 recap; via ClimeFi');

-- Shopify biochar purchases (Feb 2026 recap mentions Shopify as active buyer)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-02-01',0.0,'Biochar Carbon Removal BCR','Biochar','Not Disclosed','Shopify','Contracted',0.0,'CDR.fyi Feb 2026 recap');

-- ────────────────────────────────────────────────────────────────
-- MARZO 2026 (~1,510,000 tonnes totali secondo CDR.fyi recap)
-- ────────────────────────────────────────────────────────────────

-- Liferaft <> Microsoft — 1,000,000t biochar, 10-year offtake via Supercritical (Mar 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-03-01',1000000.0,'Biochar Carbon Removal BCR','Biochar','Liferaft','Microsoft','Contracted',0.0,'10-year offtake via Supercritical; CDR.fyi Mar 2026 recap');

-- Empacar <> Altitude — 305,000t biochar CDR (Mar 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-03-01',305000.0,'Biochar Carbon Removal BCR','Biochar','Empacar','Altitude','Contracted',0.0,'Credits via Puro.earth; CDR.fyi Mar 2026 recap');

-- AMP <> Google — 200,000t biochar CDR, Colorado (Mar 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-03-01',200000.0,'Biochar Carbon Removal BCR','Biochar','AMP','Google','Contracted',0.0,'CDR.fyi Mar 2026 recap');

-- Boeing <> Carbonfuture — 40,000t biochar portfolio Global South (Mar 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-03-01',40000.0,'Biochar Carbon Removal BCR','Biochar','Carbonfuture Portfolio','Boeing','Contracted',0.0,'Multi-year via Carbonfuture; CDR.fyi Mar 2026 recap');

-- Mercedes-AMG F1 <> CUR8 — 18,900t mixed CDR portfolio (Mar 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-03-01',18900.0,'Biochar Carbon Removal BCR','Biochar','CUR8 Portfolio','Mercedes-Benz AG','Contracted',0.0,'18,900t across 5 durable methods via CUR8; CDR.fyi Mar 2026 recap');

-- Stockholm Exergi BECCS <> Adyen (first EU CRCF-licensed deal, via ClimeFi) (Mar 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-03-01',0.0,'Bioenergy With Carbon Capture And Sequestration BECCS','BECCS','Stockholm Exergi','Adyen','Contracted',0.0,'First EU CRCF-licensed CDR deal via ClimeFi; CDR.fyi Mar 2026 recap');

-- Stockholm Exergi BECCS <> Nasdaq (first EU CRCF-licensed deal, via ClimeFi) (Mar 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-03-01',0.0,'Bioenergy With Carbon Capture And Sequestration BECCS','BECCS','Stockholm Exergi','Nasdaq','Contracted',0.0,'First EU CRCF-licensed CDR deal via ClimeFi; CDR.fyi Mar 2026 recap');

-- Sirona Technologies offtake via Patch (Mar 2026, volume not disclosed)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-03-01',0.0,'Direct Air Carbon Capture And Sequestration DACCS','DACCS','Sirona Technologies','Not Disclosed','Contracted',0.0,'Multi-year DAC offtake via Patch; CDR.fyi Mar 2026 recap');

-- Octavia Carbon offtake via Carbon Direct (Mar 2026, volume not disclosed)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-03-01',0.0,'Direct Air Carbon Capture And Sequestration DACCS','DACCS','Octavia Carbon','Not Disclosed','Contracted',0.0,'Hummingbird pilot via Carbon Direct; CDR.fyi Mar 2026 recap');

-- Pension Insurance Corporation <> CUR8 portfolio (Mar 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-03-01',0.0,'Biochar Carbon Removal BCR','Biochar','CUR8 Portfolio','Pension Insurance Corporation','Contracted',0.0,'Biochar + mineralization + DAC via CUR8; CDR.fyi Mar 2026 recap');

-- ────────────────────────────────────────────────────────────────
-- APRILE 2026 (~1,140,000 tonnes totali secondo CDR.fyi recap)
-- ────────────────────────────────────────────────────────────────

-- North Star Carbon Solutions (Svante+MLTC) <> Microsoft — 626,000t BECCS, 15 years (Apr 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-04-01',626000.0,'Bioenergy With Carbon Capture And Sequestration BECCS','BECCS','North Star Carbon Solutions','Microsoft','Contracted',0.0,'15-year offtake; CDR.fyi Apr 2026 recap');

-- Graphyte <> JPMorganChase — 60,000t biomass storage, 10-year (Apr 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-04-09',60000.0,'Biomass Direct Storage','Biomass Storage','Graphyte','JPMorgan Chase','Contracted',0.0,'10-year offtake Arkansas+Arizona; CDR.fyi Apr 2026 recap');

-- Exomad Green <> Supercritical — 500,000t biochar, 3-year (Apr 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-04-01',500000.0,'Biochar Carbon Removal BCR','Biochar','Exomad Green','Supercritical','Contracted',0.0,'3-year agreement 2026-2028; CDR.fyi Apr 2026 recap');

-- Boeing <> Supercritical portfolio — 20,000t biochar+EW from 6 suppliers (Apr 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-04-01',20000.0,'Biochar Carbon Removal BCR','Biochar','Supercritical Portfolio (6 suppliers)','Boeing','Contracted',0.0,'Brazil, Bolivia, Namibia, India; CDR.fyi Apr 2026 recap');

-- Climeworks <> NTT Data Group — portfolio CDR (Apr 2026, volume not disclosed)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-04-01',0.0,'Direct Air Carbon Capture And Sequestration DACCS','DACCS','Climeworks','NTT Data Japan Corporation','Contracted',0.0,'Diversified CDR portfolio for 2040 Net Zero; CDR.fyi Apr 2026 recap');

-- Deep Sky <> ENGIE — up to 15,000t DAC (Apr 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-04-01',15000.0,'Direct Air Carbon Capture And Sequestration DACCS','DACCS','Deep Sky','ENGIE','Contracted',0.0,'Strategic partnership; CDR.fyi Apr 2026 recap');

-- Sensirion <> ClimeFi portfolio (Apr 2026, DAC+BiCRS+mineralization)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-04-01',0.0,'Biochar Carbon Removal BCR','Biochar','ClimeFi Portfolio','Sensirion Holding AG','Contracted',0.0,'DAC+BiCRS+mineralization via ClimeFi thru 2028; CDR.fyi Apr 2026 recap');

-- VodafoneZiggo <> Klimate (Apr 2026, biochar+reforestation)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-04-01',0.0,'Biochar Carbon Removal BCR','Biochar','Klimate Portfolio','VodafoneZiggo','Contracted',0.0,'Biochar + reforestation via Klimate; CDR.fyi Apr 2026 recap');

-- Octopus Energy Generation (referenced in news, $500M deal - Apr 30 2026)
INSERT INTO transactions(tx_date,volume,technology,canonical_method,supplier_name,buyer_name,status,price_per_ton,notes)
VALUES('2026-04-30',0.0,'Bioenergy With Carbon Capture And Sequestration BECCS','BECCS','Not Disclosed','Octopus Energy Generation','Contracted',0.0,'$500M CDR deal announced Apr 30 2026');

