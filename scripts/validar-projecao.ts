/**
 * Script de validação manual da função calcularProjecaoAnual.
 *
 * Rodar com: npx tsx scripts/validar-projecao.ts
 *
 * Compara 4 cenários de sanity contra a planilha de referência.
 * Caso-base: Equatorial GO + 1000 kWh + 15% desconto + monofásico (30 kWh).
 */

import { calcularProjecaoAnual, simularComercial } from '../src/core/calculator';
import { BANDEIRAS_PADRAO } from '../src/core/data';
import type { NomeBandeira } from '../src/core/data';
import type { PromocaoComercial } from '../src/core/types';

const INPUT_BASE = {
    distribuidora: 'EQUATORIAL GO',
    consumoKwh: 1000,
    descontoPercentual: 15,
    consumoMinimo: 30,
};

function formatCurrency(v: number): string {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function imprimirCenario(titulo: string, bandeirasMensais: readonly NomeBandeira[], promo: PromocaoComercial) {
    console.log(`\n=== ${titulo} ===`);
    console.log(`  bandeiras=[${bandeirasMensais.join(',')}]`);
    console.log(`  promocaoAtiva=${promo}`);

    const r = calcularProjecaoAnual({ ...INPUT_BASE, bandeirasMensais, promocaoAtiva: promo });

    console.log('\n  Mês | Sem SG       | Com SG       | Economia');
    console.log('  ----+--------------+--------------+--------------');
    for (const p of r.dadosGrafico) {
        console.log(
            `  ${p.name.padEnd(3)} | ${formatCurrency(p.semSolarGrid).padStart(12)} | ` +
            `${formatCurrency(p.comSolarGrid).padStart(12)} | ${formatCurrency(p.economia).padStart(12)}`
        );
    }
    console.log(`\n  Economia anual total:       ${formatCurrency(r.economiaAnualTotal)}`);
    console.log(`  Custo total sem SolarGrid:  ${formatCurrency(r.custoTotalSemSG)}`);
    console.log(`  Custo total com SolarGrid:  ${formatCurrency(r.custoTotalComSG)}`);
    const deltaInterno = Math.abs((r.custoTotalSemSG - r.custoTotalComSG) - r.economiaAnualTotal);
    console.log(`  Sanity (sem - com vs economia): delta ${formatCurrency(deltaInterno)} (deve ser ≤ R$ 0,03)`);
    return r;
}

console.log('========================================');
console.log('  VALIDAÇÃO calcularProjecaoAnual');
console.log(`  Input: ${JSON.stringify(INPUT_BASE)}`);
console.log('========================================');

// Sanity 1: Baseline — 100% Verde, sem promo
// Esperado: 12 meses idênticos. comSolarGrid = faturaSGBase de simularComercial.
const TODOS_VERDES: readonly NomeBandeira[] = Array(12).fill('Verde');
const baseline = imprimirCenario('Cenário 1: 100% Verde, sem promo (baseline)', TODOS_VERDES, 'NENHUMA');

const mensal = simularComercial(INPUT_BASE.distribuidora, INPUT_BASE.descontoPercentual, INPUT_BASE.consumoKwh, INPUT_BASE.consumoMinimo);
console.log('\n  >>> Sanity check vs simularComercial mensal:');
console.log(`      faturaAtualBase  = ${formatCurrency(mensal.faturaAtualBase)}`);
console.log(`      faturaSGBase     = ${formatCurrency(mensal.faturaSGBase)}`);
console.log(`      economiaBase     = ${formatCurrency(mensal.economiaBase)}`);
console.log(`      12 × economiaBase= ${formatCurrency(mensal.economiaBase * 12)} (esperado ≈ economia anual)`);
console.log(`      delta            = ${formatCurrency(Math.abs(mensal.economiaBase * 12 - baseline.economiaAnualTotal))} (deve ser ≤ R$ 0,06)`);

// Sanity 2: 100% Verde + 1_GRATIS — Janeiro sem injeção SG
imprimirCenario('Cenário 2: 100% Verde, 1_GRATIS (Janeiro grátis)', TODOS_VERDES, '1_GRATIS');

// Sanity 3: Cenário misto, sem promo — Jul-Set amarela, Out-Nov P1, Dez P2
imprimirCenario('Cenário 3: Misto Jan-Dez, sem promo', BANDEIRAS_PADRAO, 'NENHUMA');

// Sanity 4: Cruzado — Misto + 2_GRATIS — Jan/Fev sem injeção
imprimirCenario('Cenário 4: Misto Jan-Dez, 2_GRATIS', BANDEIRAS_PADRAO, '2_GRATIS');

console.log('\n========================================');
console.log('  FIM. Compare os valores com a planilha.');
console.log('========================================');
