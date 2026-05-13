/**
 * Script de validação manual da função calcularProjecaoAnual.
 *
 * Rodar com: npx tsx scripts/validar-projecao.ts
 *
 * Compara 4 cenários de sanity contra a planilha de referência.
 * Caso-base: Equatorial GO + 1000 kWh + 15% desconto + monofásico (30 kWh).
 */

import { calcularProjecaoAnual, simularComercial } from '../src/core/calculator';
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

function imprimirCenario(titulo: string, cenario100Verde: boolean, promo: PromocaoComercial) {
    console.log(`\n=== ${titulo} ===`);
    console.log(`  cenario100Verde=${cenario100Verde}, promocaoAtiva=${promo}`);

    const r = calcularProjecaoAnual({ ...INPUT_BASE, cenario100Verde, promocaoAtiva: promo });

    console.log('\n  Mês | Sem SG       | Com SG       | Economia');
    console.log('  ----+--------------+--------------+--------------');
    for (const p of r.dadosGrafico) {
        console.log(
            `  ${p.name.padEnd(3)} | ${formatCurrency(p.semSolarGrid).padStart(12)} | ` +
            `${formatCurrency(p.comSolarGrid).padStart(12)} | ${formatCurrency(p.economia).padStart(12)}`
        );
    }
    console.log(`\n  Economia anual total: ${formatCurrency(r.economiaAnualTotal)}`);
    return r;
}

console.log('========================================');
console.log('  VALIDAÇÃO calcularProjecaoAnual');
console.log(`  Input: ${JSON.stringify(INPUT_BASE)}`);
console.log('========================================');

// Sanity 1: Baseline — 100% Verde, sem promo
// Esperado: 12 meses idênticos. comSolarGrid = faturaSGBase de simularComercial.
const baseline = imprimirCenario('Cenário 1: 100% Verde, sem promo (baseline)', true, 'NENHUMA');

const mensal = simularComercial(INPUT_BASE.distribuidora, INPUT_BASE.descontoPercentual, INPUT_BASE.consumoKwh, INPUT_BASE.consumoMinimo);
console.log('\n  >>> Sanity check vs simularComercial mensal:');
console.log(`      faturaAtualBase  = ${formatCurrency(mensal.faturaAtualBase)}`);
console.log(`      faturaSGBase     = ${formatCurrency(mensal.faturaSGBase)}`);
console.log(`      economiaBase     = ${formatCurrency(mensal.economiaBase)}`);
console.log(`      12 × economiaBase= ${formatCurrency(mensal.economiaBase * 12)} (esperado ≈ economia anual)`);
console.log(`      delta            = ${formatCurrency(Math.abs(mensal.economiaBase * 12 - baseline.economiaAnualTotal))} (deve ser ≤ R$ 0,06)`);

// Sanity 2: 100% Verde + 1_GRATIS — Janeiro sem injeção SG
imprimirCenario('Cenário 2: 100% Verde, 1_GRATIS (Janeiro grátis)', true, '1_GRATIS');

// Sanity 3: Cenário misto, sem promo — Jul-Set amarela, Out-Nov P1, Dez P2
imprimirCenario('Cenário 3: Misto Jan-Dez, sem promo', false, 'NENHUMA');

// Sanity 4: Cruzado — Misto + 2_GRATIS — Jan/Fev sem injeção
imprimirCenario('Cenário 4: Misto Jan-Dez, 2_GRATIS', false, '2_GRATIS');

console.log('\n========================================');
console.log('  FIM. Compare os valores com a planilha.');
console.log('========================================');
