export interface DistribuidoraValores {
    TotalC: number;
    TotalS: number;
    PIS: number;
    ICMSTE: number;
    ICMSTUSD: number;
    regraIcmsNI: "ISENTO" | "TUSD" | "CHEIO";
    regraPisCofinsNI: "ISENTO" | "CHEIO";
}

export interface ResultadoCalculoSG {
    tarifaSG: number;
    tarifaSgBruta: number;
    detalhes: {
        distribuidora: string;
        descontoPercentual: number;
        icmsNI: number;
        pisNI: number;
        valorDesconto: number;
    };
}

export interface SimulacaoBandeira {
    nome: string;
    faturaConcessionaria: number;
    faturaSG: number;
    economia: number;
    descontoPercentualEquivalente: number;
}

export interface SimulacaoComercial {
    tarifaSG_kWh: number;
    faturaAtualBase: number;
    faturaSGBase: number;
    economiaBase: number;
    detalhesFatura: {
        energiaInjetada: number;
        faturaSG: number;
        custoMinimoConcessionaria: number;
        impostosConcessionaria: number;
    };
    cenarios: SimulacaoBandeira[];
}
