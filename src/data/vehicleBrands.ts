export const vehicleBrands: Record<string, string[]> = {
  "Mercedes-Benz": [
    "Sprinter", "Sprinter City", "Sprinter Transfer", "Sprinter Tourer",
    "Vito", "Vito Tourer", "V-Klasa",
    "Tourismo", "Tourismo RH", "Tourismo RHD",
    "Travego", "Intouro", "Citaro",
    "Conecto", "Integro",
    "O 350", "O 404", "O 580",
  ],
  "Volkswagen": [
    "Crafter", "Crafter Grand California",
    "Transporter", "Transporter Caravelle", "Transporter Kombi",
    "Multivan", "California",
    "Caddy", "Caddy Maxi",
    "ID. Buzz",
  ],
  "Ford": [
    "Transit", "Transit Custom", "Transit Kombi",
    "Tourneo", "Tourneo Custom", "Tourneo Connect", "Tourneo Courier",
    "E-Transit",
  ],
  "Renault": [
    "Master", "Master Grand", "Master Combi",
    "Trafic", "Trafic SpaceClass", "Trafic Combi",
    "Kangoo",
  ],
  "Fiat": [
    "Ducato", "Ducato Combi", "Ducato Maxi",
    "Scudo",
    "Talento",
    "Doblò", "Doblò Maxi",
  ],
  "Peugeot": [
    "Boxer", "Boxer Combi",
    "Expert", "Expert Combi",
    "Traveller", "Traveller Business", "Traveller Long",
    "Rifter",
    "e-Expert",
  ],
  "Citroën": [
    "Jumper", "Jumper Combi",
    "Jumpy", "Jumpy Combi",
    "SpaceTourer", "SpaceTourer Business",
    "Berlingo",
    "ë-Jumpy",
  ],
  "Opel": [
    "Movano", "Movano Combi",
    "Vivaro", "Vivaro Combi", "Vivaro Life",
    "Zafira Life", "Zafira-e Life",
    "Combo Life",
  ],
  "Iveco": [
    "Daily", "Daily Minibus", "Daily Tourys",
    "Crossway", "Crossway Low Entry",
    "Evadys", "Magelys",
    "Urbanway",
  ],
  "MAN": [
    "TGE", "TGE Kombi",
    "Lion's Coach", "Lion's Coach C",
    "Lion's Intercity", "Lion's City",
    "Lion's Regio",
    "Neoplan Cityliner", "Neoplan Tourliner", "Neoplan Skyliner",
  ],
  "Scania": [
    "Touring", "Touring HD",
    "Interlink", "Interlink HD", "Interlink MD", "Interlink LD",
    "Citywide", "Citywide LE", "Citywide LF",
    "Irizar i6S Scania",
  ],
  "Volvo": [
    "9700", "9900", "9500",
    "7900", "7900 Electric", "7900 Hybrid",
    "8900", "B8R", "B11R",
  ],
  "Setra": [
    "S 511 HD", "S 515 HD", "S 516 HD", "S 517 HD",
    "S 531 DT",
    "S 415 GT-HD", "S 416 GT-HD",
    "S 415 NF", "S 415 UL",
    "ComfortClass", "TopClass",
  ],
  "Solaris": [
    "Urbino 10", "Urbino 12", "Urbino 15", "Urbino 18",
    "Urbino Electric",
    "InterUrbino",
    "Vacanza",
  ],
  "Irizar": [
    "i6", "i6S", "i8",
    "i4", "i3",
    "ie bus", "ie tram",
    "Century",
  ],
  "Toyota": [
    "HiAce", "HiAce Commuter",
    "Coaster",
    "Proace", "Proace City", "Proace Verso",
  ],
  "Hyundai": [
    "H350",
    "Staria",
    "County", "Universe",
    "Elec City",
  ],
  "Kia": [
    "Carnival",
  ],
  "Isuzu": [
    "NovoCiti", "NovoCiti Life",
    "Novo", "NovoLux",
    "Turquoise", "Visigo", "Citiport",
  ],
  "Temsa": [
    "HD 13", "HD 12",
    "Maraton", "Safari",
    "LD 13", "MD 9",
    "Avenue",
  ],
  "Otokar": [
    "Navigo", "Navigo T", "Navigo C",
    "Doruk", "Sultan",
    "Territo", "Ulyso",
    "Vectio",
  ],
  "Autosan": [
    "Sancity", "Sanliturbo",
    "A10", "A1112",
  ],
  "Solbus": [
    "Solcity 11", "Solcity 12",
    "Solway",
  ],
  "Yutong": [
    "TC9", "TC12", "TC14",
    "ZK6122H9", "ZK6127H",
    "ICe 12", "E12",
    "U12",
  ],
  "BYD": [
    "K9", "K7", "K12A",
    "C9", "C10", "C12",
    "eBus 12",
  ],
  "Neoplan": [
    "Cityliner", "Cityliner C",
    "Tourliner", "Tourliner C",
    "Skyliner",
    "Jetliner",
  ],
  "VDL": [
    "Futura FHD2", "Futura FMD2", "Futura FDD2",
    "Citea", "Citea LLE", "Citea SLF",
  ],
  "Van Hool": [
    "EX", "EX11H", "EX16H",
    "TX", "TDX",
    "A-Series",
  ],
};

export const brandNames = Object.keys(vehicleBrands);

export function getModelsForBrand(brand: string): string[] {
  return vehicleBrands[brand] || [];
}
