import type { DistribuidoraValores, ResultadoCalculoSG, SimulacaoComercial, PromocaoComercial, ProjecaoAnual } from './types';
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
    const tarifaSG = tarifaSgBruta;

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

    const faturaSGBase = Math.round((faturaSG + impostosConcessionaria + custoMinimoConcessionaria) * 100) / 100;
    
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

const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const;

const BANDEIRAS_CENARIO_MISTO = [
    'Verde', 'Verde', 'Verde', 'Verde', 'Verde', 'Verde',
    'Amarela', 'Amarela', 'Amarela',
    'Vermelha P1', 'Vermelha P1',
    'Vermelha P2',
] as const;

function calcularMesProjecao(
    nomeDistribuidora: string,
    descontoPercentual: number,
    consumoKwh: number,
    consumoMinimo: number,
    valorBandeiraKwh: number,
    promoZeraInjecao: boolean,
    promoMultiplicadorInjecao: number,
): { semSolarGrid: number; comSolarGrid: number } {
    const nomeNorm = normalizarNomeDistribuidora(nomeDistribuidora);

    if (!(nomeNorm in distribuidorasData)) {
        throw new Error(`Distribuidora não encontrada: ${nomeNorm}`);
    }

    const dados = distribuidorasData[nomeNorm];
    const { icmsNI, pisNI } = calcularImpostos(dados);

    const energiaInjetada = consumoKwh - consumoMinimo;

    const faturaSGInjecaoBruta =
        ((dados.TotalC - dados.TotalS * (descontoPercentual / 100) - icmsNI - pisNI) / 1000) * energiaInjetada;

    const faturaSGInjecaoFinal = promoZeraInjecao
        ? 0
        : faturaSGInjecaoBruta * promoMultiplicadorInjecao;

    const impostosNI = ((icmsNI + pisNI) / 1000) * energiaInjetada;
    const custoMinimoConcessionaria = (consumoMinimo / 1000) * dados.TotalC;
    const acrescimoBandeiraSG = (valorBandeiraKwh / 1000) * consumoMinimo;
    const acrescimoBandeiraConcessionaria = (valorBandeiraKwh / 1000) * consumoKwh;

    const semSolarGrid = (dados.TotalC / 1000) * consumoKwh + acrescimoBandeiraConcessionaria;
    const comSolarGrid = faturaSGInjecaoFinal + impostosNI + custoMinimoConcessionaria + acrescimoBandeiraSG;

    return { semSolarGrid, comSolarGrid };
}

export function calcularProjecaoAnual(params: {
    distribuidora: string;
    consumoKwh: number;
    descontoPercentual: number;
    consumoMinimo: number;
    cenario100Verde: boolean;
    promocaoAtiva: PromocaoComercial;
}): ProjecaoAnual {
    const { distribuidora, consumoKwh, descontoPercentual, consumoMinimo, cenario100Verde, promocaoAtiva } = params;

    const bandeirasDoAno: readonly string[] = cenario100Verde
        ? Array(12).fill('Verde')
        : BANDEIRAS_CENARIO_MISTO;

    const zeraInjecao: boolean[] = Array(12).fill(false);
    const multiplicadorInjecao: number[] = Array(12).fill(1.0);

    switch (promocaoAtiva) {
        case '1_GRATIS':
            zeraInjecao[0] = true;
            break;
        case '2_GRATIS':
            zeraInjecao[0] = true;
            zeraInjecao[1] = true;
            break;
        case '50_OFF':
            multiplicadorInjecao[0] = 0.5;
            break;
        case 'NENHUMA':
        default:
            break;
    }

    const paresBrutos: Array<{ sem: number; com: number }> = [];
    for (let i = 0; i < 12; i++) {
        const nomeBandeira = bandeirasDoAno[i];
        const valorBandeira = bandeirasTarifarias[nomeBandeira];
        if (valorBandeira === undefined) {
            throw new Error(`Bandeira tarifária desconhecida: ${nomeBandeira}`);
        }
        const { semSolarGrid, comSolarGrid } = calcularMesProjecao(
            distribuidora,
            descontoPercentual,
            consumoKwh,
            consumoMinimo,
            valorBandeira,
            zeraInjecao[i],
            multiplicadorInjecao[i],
        );
        paresBrutos.push({ sem: semSolarGrid, com: comSolarGrid });
    }

    let economiaBrutaAnual = 0;
    for (let i = 0; i < 12; i++) {
        economiaBrutaAnual += paresBrutos[i].sem - paresBrutos[i].com;
    }

    const dadosGrafico = paresBrutos.map((par, i) => ({
        name: NOMES_MESES[i],
        semSolarGrid: Math.round(par.sem * 100) / 100,
        comSolarGrid: Math.round(par.com * 100) / 100,
        economia: Math.round((par.sem - par.com) * 100) / 100,
    }));

    const economiaAnualTotal = Math.round(economiaBrutaAnual * 100) / 100;

    return { dadosGrafico, economiaAnualTotal };
}
