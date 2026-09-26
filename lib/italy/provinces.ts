/**
 * Italian province codes (sigle) as FatturaPA's `Provincia` expects them.
 * Sardinia is mid-reorganisation (regional law 9/2023), so both the current
 * (SU) and the re-established province codes (CI, OG, OT, VS) are accepted:
 * the customer picks their own, an extra option costs nothing, a missing one
 * blocks checkout.
 */
export const ITALIAN_PROVINCES: ReadonlyArray<readonly [code: string, name: string]> = [
  ['AG', 'Agrigento'], ['AL', 'Alessandria'], ['AN', 'Ancona'], ['AO', 'Aosta'],
  ['AP', 'Ascoli Piceno'], ['AQ', "L'Aquila"], ['AR', 'Arezzo'], ['AT', 'Asti'],
  ['AV', 'Avellino'], ['BA', 'Bari'], ['BG', 'Bergamo'], ['BI', 'Biella'],
  ['BL', 'Belluno'], ['BN', 'Benevento'], ['BO', 'Bologna'], ['BR', 'Brindisi'],
  ['BS', 'Brescia'], ['BT', 'Barletta-Andria-Trani'], ['BZ', 'Bolzano'], ['CA', 'Cagliari'],
  ['CB', 'Campobasso'], ['CE', 'Caserta'], ['CH', 'Chieti'], ['CI', 'Sulcis Iglesiente'],
  ['CL', 'Caltanissetta'], ['CN', 'Cuneo'], ['CO', 'Como'], ['CR', 'Cremona'],
  ['CS', 'Cosenza'], ['CT', 'Catania'], ['CZ', 'Catanzaro'], ['EN', 'Enna'],
  ['FC', 'Forlì-Cesena'], ['FE', 'Ferrara'], ['FG', 'Foggia'], ['FI', 'Firenze'],
  ['FM', 'Fermo'], ['FR', 'Frosinone'], ['GE', 'Genova'], ['GO', 'Gorizia'],
  ['GR', 'Grosseto'], ['IM', 'Imperia'], ['IS', 'Isernia'], ['KR', 'Crotone'],
  ['LC', 'Lecco'], ['LE', 'Lecce'], ['LI', 'Livorno'], ['LO', 'Lodi'],
  ['LT', 'Latina'], ['LU', 'Lucca'], ['MB', 'Monza e Brianza'], ['MC', 'Macerata'],
  ['ME', 'Messina'], ['MI', 'Milano'], ['MN', 'Mantova'], ['MO', 'Modena'],
  ['MS', 'Massa-Carrara'], ['MT', 'Matera'], ['NA', 'Napoli'], ['NO', 'Novara'],
  ['NU', 'Nuoro'], ['OG', 'Ogliastra'], ['OR', 'Oristano'], ['OT', 'Gallura Nord-Est Sardegna'],
  ['PA', 'Palermo'], ['PC', 'Piacenza'], ['PD', 'Padova'], ['PE', 'Pescara'],
  ['PG', 'Perugia'], ['PI', 'Pisa'], ['PN', 'Pordenone'], ['PO', 'Prato'],
  ['PR', 'Parma'], ['PT', 'Pistoia'], ['PU', 'Pesaro e Urbino'], ['PV', 'Pavia'],
  ['PZ', 'Potenza'], ['RA', 'Ravenna'], ['RC', 'Reggio Calabria'], ['RE', 'Reggio Emilia'],
  ['RG', 'Ragusa'], ['RI', 'Rieti'], ['RM', 'Roma'], ['RN', 'Rimini'],
  ['RO', 'Rovigo'], ['SA', 'Salerno'], ['SI', 'Siena'], ['SO', 'Sondrio'],
  ['SP', 'La Spezia'], ['SR', 'Siracusa'], ['SS', 'Sassari'], ['SU', 'Sud Sardegna'],
  ['SV', 'Savona'], ['TA', 'Taranto'], ['TE', 'Teramo'], ['TN', 'Trento'],
  ['TO', 'Torino'], ['TP', 'Trapani'], ['TR', 'Terni'], ['TS', 'Trieste'],
  ['TV', 'Treviso'], ['UD', 'Udine'], ['VA', 'Varese'], ['VB', 'Verbano-Cusio-Ossola'],
  ['VC', 'Vercelli'], ['VE', 'Venezia'], ['VI', 'Vicenza'], ['VR', 'Verona'],
  ['VS', 'Medio Campidano'], ['VT', 'Viterbo'], ['VV', 'Vibo Valentia'],
]

const CODES = new Set(ITALIAN_PROVINCES.map(([code]) => code))

export function isItalianProvince(code: string): boolean {
  return CODES.has(code)
}
