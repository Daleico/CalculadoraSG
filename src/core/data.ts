import type { DistribuidoraValores } from './types';

export const distribuidorasData: Record<string, DistribuidoraValores> = {
    "RGE":          { TotalC: 1044.67, TotalS: 822.20, PIS: 43.27, ICMSTE: 66.35, ICMSTUSD: 112.84, regraIcmsNI: "CHEIO",  regraPisCofinsNI: "CHEIO", cipPorKwh: 0.07 },
    "EDP SP":       { TotalC: 1012.01, TotalS: 786.70, PIS: 41.41, ICMSTE: 77.15, ICMSTUSD: 106.75, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.08 },
    "ELEKTRO":      { TotalC: 1024.04, TotalS: 796.05, PIS: 41.90, ICMSTE: 74.38, ICMSTUSD: 111.71, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.07 },
    "COELBA":       { TotalC: 1112.32, TotalS: 837.72, PIS: 44.09, ICMSTE: 76.29, ICMSTUSD: 154.23, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.08 },
    "LIGHT":        { TotalC: 1131.63, TotalS: 823.56, PIS: 55.37, ICMSTE: 95.20, ICMSTUSD: 157.50, regraIcmsNI: "TUSD",   regraPisCofinsNI: "ISENTO", cipPorKwh: 0.12 },
    "CEMIG":        { TotalC: 1129.26, TotalS: 858.58, PIS: 64.62, ICMSTE: 76.15, ICMSTUSD: 129.91, regraIcmsNI: "ISENTO", regraPisCofinsNI: "CHEIO", cipPorKwh: 0.06 },
    "EQUATORIAL GO":{ TotalC: 1153.55, TotalS: 891.81, PIS: 51.90, ICMSTE: 76.27, ICMSTUSD: 133.57, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.09 },
    "EMR":          { TotalC: 1051.04, TotalS: 817.04, PIS: 43.00, ICMSTE: 82.91, ICMSTUSD: 108.08, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.07 },
    "ESS":          { TotalC: 959.34,  TotalS: 745.76, PIS: 39.25, ICMSTE: 75.29, ICMSTUSD: 99.04,  regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.07 },
    "ENEL RJ":      { TotalC: 1190.42, TotalS: 925.39, PIS: 48.70, ICMSTE: 68.59, ICMSTUSD: 147.74, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.09 },
    "CPFL PAULISTA":{ TotalC: 878.55,  TotalS: 675.53, PIS: 43.04, ICMSTE: 68.05, ICMSTUSD: 91.92,  regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.07 },
    "EQUATORIAL PI":{ TotalC: 1297.63, TotalS: 946.69, PIS: 55.10, ICMSTE: 93.58, ICMSTUSD: 202.26, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO", cipPorKwh: 0.10 },
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
