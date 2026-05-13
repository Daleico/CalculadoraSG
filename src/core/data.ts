import type { DistribuidoraValores } from './types';

export const distribuidorasData: Record<string, DistribuidoraValores> = {
    "RGE":          { TotalC: 1044.67, TotalS: 822.20, PIS: 43.27, ICMSTE: 66.362, ICMSTUSD: 112.84,  regraIcmsNI: "CHEIO", regraPisCofinsNI: "CHEIO"  },
    "EDP SP":       { TotalC: 1012.01, TotalS: 786.70, PIS: 41.41, ICMSTE: 77.15,  ICMSTUSD: 106.75,  regraIcmsNI: "TUSD",  regraPisCofinsNI: "CHEIO"  },
    "ELEKTRO":      { TotalC: 1021.885, TotalS: 796.05, PIS: 41.90, ICMSTE: 73.53,  ICMSTUSD: 110.41,  regraIcmsNI: "TUSD",  regraPisCofinsNI: "CHEIO"  },
    "COELBA":       { TotalC: 1112.325, TotalS: 837.72, PIS: 44.084, ICMSTE: 76.28,  ICMSTUSD: 154.23,  regraIcmsNI: "CHEIO", regraPisCofinsNI: "CHEIO"  },
    "LIGHT":        { TotalC: 1139.705, TotalS: 841.73, PIS: 44.30, ICMSTE: 109.82, ICMSTUSD: 143.85,  regraIcmsNI: "TUSD",  regraPisCofinsNI: "ISENTO" },
    "CEMIG":        { TotalC: 1104.475, TotalS: 858.58, PIS: 45.19, ICMSTE: 74.17,  ICMSTUSD: 126.54,  regraIcmsNI: "ISENTO",regraPisCofinsNI: "CHEIO"  },
    "EQUATORIAL GO":{ TotalC: 1161.70, TotalS: 891.81, PIS: 46.94, ICMSTE: 81.04,  ICMSTUSD: 141.92,  regraIcmsNI: "TUSD",  regraPisCofinsNI: "CHEIO"  },
    "EMR":          { TotalC: 1106.275, TotalS: 817.04, PIS: 43.00, ICMSTE: 106.89, ICMSTUSD: 139.34,  regraIcmsNI: "TUSD",  regraPisCofinsNI: "CHEIO"  },
    "ESS":          { TotalC: 959.345,  TotalS: 745.76, PIS: 39.25, ICMSTE: 75.29,  ICMSTUSD: 99.04,   regraIcmsNI: "TUSD",  regraPisCofinsNI: "CHEIO"  },
    "ENEL RJ":      { TotalC: 1252.98, TotalS: 925.39, PIS: 48.70, ICMSTE: 88.42,  ICMSTUSD: 190.46,  regraIcmsNI: "TUSD",  regraPisCofinsNI: "CHEIO"  },
    "CPFL PAULISTA":{ TotalC: 869.00,  TotalS: 675.53, PIS: 35.55, ICMSTE: 67.18,  ICMSTUSD: 90.74,   regraIcmsNI: "TUSD",  regraPisCofinsNI: "CHEIO"  },
    "EQUATORIAL PI":{ TotalC: 1107.89, TotalS: 829.00, PIS: 43.63, ICMSTE: 69.96,  ICMSTUSD: 165.30,  regraIcmsNI: "TUSD",  regraPisCofinsNI: "CHEIO"  },
};

export const bandeirasTarifarias: Record<string, number> = {
    "Verde": 0,
    "Amarela": 18.85,
    "Vermelha P1": 44.63,
    "Vermelha P2": 78.77
};
