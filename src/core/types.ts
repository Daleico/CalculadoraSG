export interface DistribuidoraValores {
    TotalC: number;
    TotalS: number;
    PIS: number;
    ICMSTE: number;
    ICMSTUSD: number;
    regraIcmsNI: "ISENTO" | "TUSD" | "CHEIO";
    regraPisCofinsNI: "ISENTO" | "CHEIO";
    cipPorKwh: number;
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
        iluminacaoPublica: number;
    };
    cenarios: SimulacaoBandeira[];
}

export type PromocaoComercial = 'NENHUMA' | '1_GRATIS' | '2_GRATIS' | '50_OFF';

export interface PontoGraficoMensal {
    name: string;
    semSolarGrid: number;
    comSolarGrid: number;
    economia: number;
}

export interface ProjecaoAnual {
    dadosGrafico: PontoGraficoMensal[];
    economiaAnualTotal: number;
    custoTotalSemSG: number;
    custoTotalComSG: number;
}
