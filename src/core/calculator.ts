import type { DistribuidoraValores, ResultadoCalculoSG, SimulacaoComercial } from './types';
import { distribuidorasData, bandeirasTarifarias } from './data';

export function normalizarNomeDistribuidora(nome: string): string {
    let nomeNorm = nome.trim().toUpperCase();
    if (nomeNorm.includes("CPFL")) {
        nomeNorm = "CPFL PAULISTA";
    }
    return nomeNorm;
}

export function calcularImpostos(dados: DistribuidoraValores): { icmsNI: number, pisNI: number } {
    let icmsNI = 0;
    if (dados.regraIcmsNI === "CHEIO") {
        icmsNI = dados.ICMSTE + dados.ICMSTUSD;
    } else if (dados.regraIcmsNI === "TUSD") {
        icmsNI = dados.ICMSTUSD;
    }

    const pisNI = dados.regraPisCofinsNI === "CHEIO" ? dados.PIS : 0;

    return { icmsNI, pisNI };
}

export function calcularTarifaSG(nomeDistribuidora: string, descontoPercentual: number): ResultadoCalculoSG {
    const nomeNorm = normalizarNomeDistribuidora(nomeDistribuidora);
    
    if (!(nomeNorm in distribuidorasData)) {
        throw new Error(`Distribuidora não encontrada: ${nomeNorm}`);
    }

    const dados = distribuidorasData[nomeNorm];
    const { icmsNI, pisNI } = calcularImpostos(dados);

    // 1. Isole o cálculo do desconto financeiro (apenas sobre o TotalS)
    const valorDesconto = dados.TotalS * (descontoPercentual / 100);

    // 2. Subtraia o valorDesconto e os impostos do TotalC
    const tarifaSgBruta = (dados.TotalC - valorDesconto - icmsNI - pisNI) / 1000;
    const tarifaSG = Number(tarifaSgBruta.toFixed(4));

    return {
        tarifaSG,
        tarifaSgBruta,
        detalhes: {
            distribuidora: nomeNorm,
            descontoPercentual,
            icmsNI,
            pisNI,
            valorDesconto
        }
    };
}

export function simularComercial(nomeDistribuidora: string, descontoPercentual: number, consumoKwh: number, consumoMinimo: number): SimulacaoComercial {
    const resultadoTarifa = calcularTarifaSG(nomeDistribuidora, descontoPercentual);
    const tarifaSG_kWh = resultadoTarifa.tarifaSG;
    const tarifaSgBruta = resultadoTarifa.tarifaSgBruta;
    
    const nomeNorm = resultadoTarifa.detalhes.distribuidora;
    const dados = distribuidorasData[nomeNorm];
    const { icmsNI, pisNI } = resultadoTarifa.detalhes;

    const faturaAtualBase = (dados.TotalC / 1000) * consumoKwh;
    
    // Novo cálculo rigoroso da Fatura SG respeitando o custo mínimo
    const energiaInjetada = consumoKwh - consumoMinimo;
    // Fórmulas exatas de "Arredondamento Tardio" exigidas para bater a Fatura e os Impostos
    const faturaSG = ((dados.TotalC - (dados.TotalS * (descontoPercentual / 100)) - icmsNI - pisNI) / 1000) * energiaInjetada;
    const impostosConcessionaria = ((icmsNI + pisNI) / 1000) * energiaInjetada;
    const custoMinimoConcessionaria = (consumoMinimo / 1000) * dados.TotalC;

    const faturaSGBase =
        Math.round(faturaSG * 100) / 100 +
        Math.round(impostosConcessionaria * 100) / 100 +
        Math.round(custoMinimoConcessionaria * 100) / 100;
    
    const economiaBase = faturaAtualBase - faturaSGBase;

    console.log("--- DEBUG DE CÁLCULO ---");
    console.log(`Distribuidora usada no cálculo: ${nomeNorm}`);
    console.log(`Tarifa SG calculada: ${tarifaSgBruta}`);
    console.log(`Fatura SG final: ${faturaSG}`);

    const cenarios = Object.entries(bandeirasTarifarias).map(([nomeBandeira, valorBandeira]) => {
        // Concessionária: bandeira incide sobre o consumo total do cliente
        const acrescimoConcessionaria = (valorBandeira / 1000) * consumoKwh;
        // SolarGrid blindada: bandeira incide apenas sobre o consumo mínimo (30/50/100 kWh)
        const acrescimoSG = (valorBandeira / 1000) * consumoMinimo;

        const faturaConcessionariaCenario = faturaAtualBase + acrescimoConcessionaria;
        const faturaSGCenario = faturaSGBase + acrescimoSG;
        const economiaCenario = faturaConcessionariaCenario - faturaSGCenario;

        // Desconto % = economia real sobre o custo de energia (TotalS × consumo total)
        const descontoPercentualEquivalente = (economiaCenario / (dados.TotalS * (consumoKwh / 1000))) * 100;

        return {
            nome: nomeBandeira,
            faturaConcessionaria: faturaConcessionariaCenario,
            faturaSG: faturaSGCenario,
            economia: economiaCenario,
            descontoPercentualEquivalente
        };
    });

    return {
        tarifaSG_kWh,
        faturaAtualBase,
        faturaSGBase,
        economiaBase,
        detalhesFatura: {
            energiaInjetada,
            faturaSG,
            custoMinimoConcessionaria,
            impostosConcessionaria
        },
        cenarios
    };
}
