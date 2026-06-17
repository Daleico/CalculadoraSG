import type { DistribuidoraValores } from './types';

export const distribuidorasData: Record<string, DistribuidoraValores> = {
    "RGE":          { TotalC: 1042.74, TotalS: 822.20, PIS: 43.27, ICMSTE: 65.64, ICMSTUSD: 111.63, regraIcmsNI: "CHEIO",  regraPisCofinsNI: "CHEIO", cipPorKwh: 0.07 },
    "EDP SP":       { TotalC: 1009.88, TotalS: 786.70, PIS: 41.41, ICMSTE: 76.26, ICMSTUSD: 105.52, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.08 },
    "ELEKTRO":      { TotalC: 1021.89, TotalS: 796.05, PIS: 41.90, ICMSTE: 73.53, ICMSTUSD: 110.41, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.07 },
    "COELBA":       { TotalC: 1162.17, TotalS: 877.73, PIS: 46.20, ICMSTE: 69.93, ICMSTUSD: 168.31, regraIcmsNI: "CHEIO",  regraPisCofinsNI: "CHEIO", cipPorKwh: 0.08 },
    "LIGHT":        { TotalC: 1219.61, TotalS: 880.56, PIS: 46.35, ICMSTE: 100.39, ICMSTUSD: 192.32, regraIcmsNI: "TUSD",  regraPisCofinsNI: "ISENTO", cipPorKwh: 0.12 },
    "CEMIG":        { TotalC: 1159.55, TotalS: 903.29, PIS: 47.54, ICMSTE: 71.68, ICMSTUSD: 137.04, regraIcmsNI: "ISENTO", regraPisCofinsNI: "CHEIO", cipPorKwh: 0.06 },
    "EQUATORIAL GO":{ TotalC: 1158.95, TotalS: 891.81, PIS: 46.94, ICMSTE: 80.03, ICMSTUSD: 140.17, regraIcmsNI: "CHEIO",  regraPisCofinsNI: "CHEIO", cipPorKwh: 0.09 },
    "EMR":          { TotalC: 1048.83, TotalS: 817.04, PIS: 43.00, ICMSTE: 81.96, ICMSTUSD: 106.83, regraIcmsNI: "ISENTO", regraPisCofinsNI: "CHEIO", cipPorKwh: 0.07 },
    "ESS":          { TotalC: 957.33,  TotalS: 745.76, PIS: 39.25, ICMSTE: 74.42, ICMSTUSD: 97.90,  regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.07 },
    "ENEL RJ":      { TotalC: 1469.67, TotalS: 1061.10, PIS: 55.85, ICMSTE: 109.49, ICMSTUSD: 243.23, regraIcmsNI: "TUSD",  regraPisCofinsNI: "CHEIO", cipPorKwh: 0.09 },
    "CPFL PAULISTA":{ TotalC: 949.23,  TotalS: 739.45, PIS: 38.92, ICMSTE: 67.06, ICMSTUSD: 103.81, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.07 },
    "EQUATORIAL PI":{ TotalC: 1365.09, TotalS: 946.69, PIS: 49.83, ICMSTE: 116.59, ICMSTUSD: 251.98, regraIcmsNI: "CHEIO",  regraPisCofinsNI: "CHEIO", cipPorKwh: 0.10 },
    "CEEE":         { TotalC: 1042.49, TotalS: 822.00, PIS: 43.26, ICMSTE: 74.03, ICMSTUSD: 103.19, regraIcmsNI: "CHEIO",  regraPisCofinsNI: "CHEIO", cipPorKwh: 0.10 },
};

export type NomeBandeira = 'Verde' | 'Amarela' | 'Vermelha P1' | 'Vermelha P2';

export const bandeirasTarifarias: Record<NomeBandeira, number> = {
    "Verde": 0,
    "Amarela": 18.85,
    "Vermelha P1": 44.63,
    "Vermelha P2": 78.77
};

export const BANDEIRAS_PADRAO: readonly NomeBandeira[] = [
    'Verde', 'Verde', 'Verde', 'Verde', 'Verde', 'Verde',
    'Amarela', 'Amarela', 'Amarela',
    'Vermelha P1', 'Vermelha P1',
    'Vermelha P2',
];
