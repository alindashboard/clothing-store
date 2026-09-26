# Tracciamento, cookie e statistiche — scheda tecnica per la revisione legale

**Sito:** kayaoutlet.com · **Titolare:** LABIS POP DRAGOS COSMIN, ditta individuale (insegna KAYA Studio Outlet), Via Acque Alte 12, 04100 Latina (LT) · P.IVA 03361320595 · REA LT-335179
**Stato:** bozza tecnica redatta dallo sviluppatore, **non ancora validata da un legale**.
**Ultimo aggiornamento:** 2026-09-26

Questo documento descrive *come funziona davvero* il sito, così che la revisione legale
possa confrontarlo con l'informativa pubblicata (`/it/privacy`) e con il banner cookie.
Ogni modifica tecnica che tocca dati personali, cookie o tempi di conservazione va
registrata qui (sezione 8) nello stesso momento in cui viene pubblicata.

---

## 1. Registro degli strumenti che memorizzano o leggono dati sul dispositivo

| Nome | Tipo | Chi lo imposta | Consenso richiesto? | Contenuto / scopo | Durata |
|---|---|---|---|---|---|
| `kaya-cookie-consent` | localStorage | Nostro (script) | No — tecnico | La scelta sul banner (`granted`/`denied`) e la data | 12 mesi, poi il banner ricompare |
| `cart-storage` | localStorage | Nostro (script) | No — tecnico | Contenuto del carrello | Fino allo svuotamento |
| `NEXT_LOCALE` | Cookie | Nostro (libreria next-intl) | No — tecnico | Lingua scelta, solo se diversa da quella del browser | Sessione |
| Ultimo ordine (`sessionStorage`) | sessionStorage | Nostro (script) | No — tecnico | Riepilogo dell'ordine appena effettuato, letto dalla pagina di conferma | Fino alla chiusura della scheda |
| `kaya-internal-visitor` | localStorage | Nostro (script) | No — solo dispositivi dello staff | Esclude i dispositivi del personale dalle statistiche; impostato solo aprendo l'area admin | Illimitata |
| Cookie di autenticazione Supabase (`sb-…`) | Cookie | Nostro | No — tecnico | Sessione di login dell'area admin (solo staff) | Sessione di login |
| **`kaya_vid`** | Cookie HttpOnly, prima parte | **Nostro server** | **Sì** | Codice casuale (UUID) per riconoscere lo stesso browser e collegare visite e ordini — vedi sezione 3 | **Max 13 mesi dal consenso, non rinnovato** |
| `_fbp`, `_fbc` | Cookie | Meta Pixel | Sì | Misurazione e pubblicità Meta | Secondo Meta |
| `_ga`, `_ga_*` | Cookie | Google Analytics 4 | Sì | Misurazione e pubblicità Google (collegato a Google Ads) | Secondo Google |
| Cookie di Google Maps (es. `NID`, `AEC`) | Cookie di terza parte (iframe) | Google, tramite la mappa incorporata in `/store` | Sì — oppure tocco su «Mostra la mappa» (solo per quella visualizzazione) | Funzionamento della mappa e finalità proprie di Google | Secondo Google |

Nessuno strumento soggetto a consenso viene caricato prima che il visitatore clicchi
«Accetta». Vercel Web Analytics (statistiche del fornitore di hosting) **non** memorizza
nulla sul dispositivo e gira senza consenso — vedi sezione 2.

## 2. Statistiche senza cookie (attive dal 2026-09-18, senza consenso)

**Cosa registriamo** (tabella `analytics_events` sul database Supabase), per ogni evento:
tipo di evento (visualizzazione pagina, visualizzazione prodotto, aggiunta al carrello,
avvio checkout, acquisto, risposta al banner cookie), percorso della pagina, lingua,
pagina di provenienza (referrer), parametri `utm_*` del link di arrivo, prodotto e
categoria, metodo di pagamento e valore (solo per l'acquisto), tipo di dispositivo
(mobile/desktop), paese (dall'header del provider), data e ora.

**Come contiamo i visitatori:** `visitor_hash = sha256(sale fisso + IP + user-agent + data UTC)`,
troncato a 16 caratteri. Cambia ogni giorno, quindi non permette di riconoscere la stessa
persona in giorni diversi. **L'indirizzo IP non viene mai salvato**: è usato solo in memoria
per calcolare l'hash.

**Base giuridica dichiarata:** legittimo interesse (art. 6.1.f) a statistiche aggregate.
Nulla viene memorizzato né letto sul dispositivo, quindi non si applica l'art. 122 del Codice
Privacy (consenso per cookie). **Da confermare** (vedi domande, sezione 7).

**Vercel Web Analytics:** statistiche analoghe raccolte dal fornitore di hosting, senza
cookie (identificatore giornaliero calcolato lato server secondo la documentazione Vercel).

**Esclusioni:** i dispositivi dello staff (che hanno aperto l'area admin) non vengono
registrati né qui né in Meta, Google e Vercel.

**Conservazione:** eventi cancellati dopo **25 mesi** (vedi sezione 5 sul meccanismo).

## 3. Identificativo persistente `kaya_vid` e collegamento con gli ordini (dal 2026-09-24, con consenso)

**Scopo:** capire come i clienti arrivano all'acquisto — visitatori che tornano, prodotti
rivisti in giorni diversi, fonte della prima e dell'ultima visita prima di un ordine,
numero di visite e giorni prima dell'acquisto.

**Funzionamento:**
1. Il visitatore clicca «Accetta» sul banner.
2. Il browser chiama `POST /api/analytics/visitor`; il **nostro server** risponde impostando
   il cookie `kaya_vid` = UUID casuale. Attributi: `HttpOnly` (non leggibile da nessuno script
   della pagina, Meta Pixel e Google Analytics inclusi), `Secure`, `SameSite=Lax`, dominio
   kayaoutlet.com, `Max-Age` = 13 mesi. **La scadenza non viene prolungata** dalle visite
   successive.
3. Ogni evento statistico di quel browser registra anche `visitor_id` = il codice del cookie.
4. Se il visitatore effettua un ordine, l'ordine (che contiene nome, email, indirizzo)
   registra lo stesso `visitor_id`. **Da questo momento la cronologia di navigazione di quel
   browser è collegata a una persona identificata** → questo è il punto più delicato
   (possibile profilazione, art. 22 / considerando 71 GDPR: nessuna decisione automatizzata
   viene presa, l'uso è solo statistico interno).
5. Il collegamento è visibile solo allo staff nell'area admin (`/admin/analytics`, scheda
   «Visitors & orders»): tabella per ordine con fonte prima/ultima visita, numero di visite,
   giorni all'acquisto, numero di prodotti visti.

**Chi non accetta:** nessun cookie `kaya_vid`, `visitor_id` resta vuoto, i suoi ordini non
vengono collegati a nulla. Continua solo la statistica senza cookie della sezione 2.

**Revoca:** link «Preferenze cookie» nel footer di ogni pagina → riapre il banner → «Rifiuta»
chiama `DELETE /api/analytics/visitor` (il server cancella `kaya_vid`), cancella i cookie
`_ga*`, `_gid`, `_gcl*`, `_fbp`, `_fbc` e ricarica la pagina, così Meta Pixel e Google
Analytics non vengono più caricati. I dati già registrati **non** vengono cancellati alla
revoca: il collegamento viene rimosso alla scadenza dei 13 mesi (sezione 5). → **Da valutare**
se la revoca debba anche cancellare subito il collegamento già registrato (sezione 7).

**Base giuridica dichiarata:** consenso (art. 6.1.a e art. 122 Codice Privacy), raccolto con
un unico consenso insieme a Meta Pixel e Google Analytics.

**Dove sono i dati:** database Supabase del progetto (regione del server: TODO_CONFIRM),
nessuna comunicazione a terzi.

## 4. Meccanismo del consenso

- Banner in fondo alla pagina alla prima visita; due pulsanti di pari evidenza
  «Accetta» / «Rifiuta»; link all'informativa. Nessuna scelta pre-impostata, nessun
  consenso da scorrimento.
- **Un solo consenso** copre tre finalità: statistiche con `kaya_vid` e collegamento ordini,
  Meta Pixel, Google Analytics/Ads. Non esiste una scelta granulare per singola finalità.
- La scelta dura **12 mesi**, poi il banner ricompare (implementato dal 2026-09-24; prima di
  questa data la scelta non scadeva mai, benché l'informativa indicasse già 12 mesi).
- La risposta al banner viene contata (evento `consent_granted` / `consent_denied`, senza
  cookie) per sapere quale quota di traffico copre la sezione 3.

## 5. Tempi di conservazione applicati nel codice

| Dato | Termine | Come viene applicato |
|---|---|---|
| Eventi statistici (`analytics_events`) | 25 mesi | Funzione SQL `purge_expired_visitor_ids()` |
| `visitor_id` su eventi e ordini | 13 mesi dall'evento/ordine | Stessa funzione (azzera il campo) |
| Cookie `kaya_vid` nel browser | 13 mesi dal consenso | Scadenza del cookie |
| Scelta sul banner | 12 mesi | Data salvata con la scelta |
| Ordini | 10 anni (obbligo fiscale) | Nessuna cancellazione automatica |

**Limite noto:** la funzione di cancellazione viene eseguita ogni volta che lo staff apre le
statistiche in admin, non da un job programmato. Se nessuno apre le statistiche per mesi, la
cancellazione slitta. Soluzione possibile: job giornaliero (`pg_cron` su Supabase).

## 6. Incongruenze trovate e corrette

- **2026-09-24** — L'informativa dichiarava che il banner ricompare dopo 12 mesi; il codice
  conservava la scelta per sempre. Corretto nel codice.
- **2026-09-24** — Le statistiche senza cookie della sezione 2 (attive dal 2026-09-18) e
  Vercel Web Analytics non erano descritte nell'informativa. Aggiunte.
- **2026-09-24** — L'unico modo per cambiare la scelta era cancellare i dati del sito dal
  browser. Aggiunto il link «Preferenze cookie» nel footer.

## 7. Domande per il legale

1. Il legittimo interesse è una base adeguata per le statistiche senza cookie della sezione 2
   (hash giornaliero di IP + user-agent, IP non salvato)? Serve una valutazione di
   bilanciamento scritta?
2. Il collegamento tra navigazione e ordini (sezione 3.4) richiede un consenso **separato**
   dal consenso marketing di Meta/Google, o basta il consenso unico attuale con
   l'informativa aggiornata? Serve un pannello «Personalizza» con scelte per finalità?
3. Alla revoca del consenso, i collegamenti già registrati vanno cancellati subito?
4. 13 mesi per `kaya_vid` e 25 mesi per gli eventi sono termini adeguati?
5. Serve una DPIA per il collegamento navigazione–ordini, dati i volumi ridotti?
6. Testo del banner: è sufficientemente chiaro che «Accetta» include il collegamento con gli
   ordini?
7. Ragione sociale, P. IVA e regione dei server Supabase da inserire nell'informativa.

## 8. Registro delle modifiche

| Data | Modifica | Informativa aggiornata? |
|---|---|---|
| 2026-09-09 | Banner cookie; Meta Pixel caricato solo con consenso | Sì |
| 2026-09-18 | Statistiche proprie senza cookie (`analytics_events`), Vercel Web Analytics | No → corretto il 2026-09-24 |
| 2026-09-23 | Google Analytics 4 (collegato a Google Ads), solo con consenso | Sì |
| 2026-09-23 | Esclusione dei dispositivi dello staff da tutte le statistiche | Non necessario |
| 2026-09-24 | Registrazione dei parametri `utm_*` del link di arrivo | Sì (2026-09-24) |
| 2026-09-24 | Cookie `kaya_vid` e collegamento visite–ordini, con consenso | Sì (2026-09-24) |
| 2026-09-24 | Scadenza della scelta dopo 12 mesi; link «Preferenze cookie»; revoca con cancellazione dei cookie | Sì (2026-09-24) |
| 2026-09-24 | Cancellazione automatica: eventi dopo 25 mesi, `visitor_id` dopo 13 mesi | Sì (2026-09-24) |
| 2026-09-26 | Nessun nuovo strumento. Informativa: dati del titolare dalla visura camerale; aggiunti Stripe (pagamenti con carta) e WhatsApp tra i destinatari; nuove condizioni generali di vendita | Sì (2026-09-26) |
| 2026-09-26 | Mappa Google Maps nella pagina del negozio: prima si caricava sempre (cookie Google senza consenso); ora solo con consenso o dopo un tocco su «Mostra la mappa», valido per quella sola visualizzazione | Sì (2026-09-26) |
