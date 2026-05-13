import type { DistribuidoraValores } from './types';

export const distribuidorasData: Record<string, DistribuidoraValores> = {
    "RGE":          { TotalC: 1044.67112,  TotalS: 822.20, PIS: 43.27368421, ICMSTE: 66.35448718,  ICMSTUSD: 112.8429487, regraIcmsNI: "CHEIO",  regraPisCofinsNI: "CHEIO"  },
    "EDP SP":       { TotalC: 1012.009159, TotalS: 786.70, PIS: 41.40526316, ICMSTE: 77.14987013,  ICMSTUSD: 106.754026,  regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO"  },
    "ELEKTRO":      { TotalC: 1021.887035, TotalS: 796.05, PIS: 41.89736842, ICMSTE: 73.52503209,  ICMSTUSD: 110.4146341, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO"  },
    "COELBA":       { TotalC: 1112.324083, TotalS: 837.72, PIS: 44.09052632, ICMSTE: 76.28751678,  ICMSTUSD: 154.2260403, regraIcmsNI: "CHEIO",  regraPisCofinsNI: "CHEIO"  },
    "LIGHT":        { TotalC: 1139.703634, TotalS: 841.73, PIS: 44.30157895, ICMSTE: 109.8221918,  ICMSTUSD: 143.849863,  regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO"  },
    "CEMIG":        { TotalC: 1104.475434, TotalS: 858.58, PIS: 45.18842105, ICMSTE: 74.16935065,  ICMSTUSD: 126.5376623, regraIcmsNI: "ISENTO", regraPisCofinsNI: "CHEIO"  },
    "EQUATORIAL GO":{ TotalC: 1161.699868, TotalS: 891.81, PIS: 46.93736842, ICMSTE: 81.035,       ICMSTUSD: 141.9175,    regraIcmsNI: "ISENTO", regraPisCofinsNI: "CHEIO"  },
    "EMR":          { TotalC: 1106.273338, TotalS: 817.04, PIS: 43.00210526, ICMSTE: 106.8928767,  ICMSTUSD: 139.3383562, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO"  },
    "ESS":          { TotalC: 959.3440328, TotalS: 745.76, PIS: 39.25052632, ICMSTE: 75.29376623,  ICMSTUSD: 99.03974026, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO"  },
    "ENEL RJ":      { TotalC: 1252.979394, TotalS: 925.39, PIS: 48.70473684, ICMSTE: 88.42493151,  ICMSTUSD: 190.459726,  regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO"  },
    "CPFL PAULISTA":{ TotalC: 869.0003144, TotalS: 675.53, PIS: 35.55421053, ICMSTE: 67.17974026,  ICMSTUSD: 90.73636364, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO"  },
    "EQUATORIAL PI":{ TotalC: 1107.888336, TotalS: 829.00, PIS: 43.63157895, ICMSTE: 69.96121622,  ICMSTUSD: 165.2955405, regraIcmsNI: "TUSD",   regraPisCofinsNI: "CHEIO"  },
};

export const bandeirasTarifarias: Record<string, number> = {
    "Verde": 0,
    "Amarela": 18.85,
    "Vermelha P1": 44.63,
    "Vermelha P2": 78.77
};
