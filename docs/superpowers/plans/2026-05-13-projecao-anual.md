# Projeção Anual SG — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar `calcularProjecaoAnual` em `src/core/calculator.ts` — função que projeta o resultado financeiro SG em 12 meses, com cenários de bandeira (100% Verde ou misto Jan-Dez) e gatilhos promocionais, preservando a regra de arredondamento tardio.

**Architecture:** Helper privado `calcularMesProjecao` produz floats puros para 1 mês; função pública `calcularProjecaoAnual` orquestra o loop de 12 meses, monta vetores de bandeira/promo por índice, e aplica `Math.round` apenas na montagem final do `dadosGrafico` e do `economiaAnualTotal`. Validação por script `tsx` rodando os 4 cenários de sanity contra a planilha.

**Tech Stack:** TypeScript 5, Next.js 16, Node 20+. Nenhuma dependência nova; `tsx` invocado via `npx` para o script de validação.

**Spec de referência:** `docs/superpowers/specs/2026-05-13-projecao-anual-design.md`

**Restrições absolutas:**
- **NÃO modificar** `normalizarNomeDistribuidora`, `calcularImpostos`, `calcularTarifaSG`, `simularComercial`.
- **NÃO modificar** `distribuidorasData` nem `bandeirasTarifarias` em `data.ts`.
- **NÃO adicionar** `Math.round`, `toFixed`, `parseFloat(...toFixed)` no helper privado nem dentro do loop principal — apenas na montagem do objeto de retorno final.
- **NÃO** tocar em `app/page.tsx`.

---

## File Structure

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `src/core/types.ts` | Modificar (append) | Adiciona `PromocaoComercial`, `PontoGraficoMensal`, `ProjecaoAnual`. |
| `src/core/calculator.ts` | Modificar (append) | Adiciona constantes `NOMES_MESES`, `BANDEIRAS_CENARIO_MISTO`; helper privado `calcularMesProjecao`; função pública `calcularProjecaoAnual`. |
| `scripts/validar-projecao.ts` | Criar | Executa 4 cenários de sanity, imprime relatório comparável com a planilha de referência. |

---

## Task 1: Adicionar tipos novos em `types.ts`

**Files:**
- Modify: `src/core/types.ts` (append no final do arquivo, após a linha 43)

- [ ] **Step 1: Append os três novos tipos no final de `src/core/types.ts`**

Adicionar exatamente este bloco após a `interface SimulacaoComercial` (depois da linha 43):

```ts

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
}
```

- [ ] **Step 2: Verificar que o TypeScript compila**

Rodar:
```bash
npx tsc --noEmit
```
Esperado: sem erros. Se houver erro de compilação não relacionado (vindo de `app/`), ignorar — só não pode haver erro novo em `src/core/types.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/core/types.ts
git commit -m "feat(types): adiciona tipos da projecao anual e promocoes"
```

---

## Task 2: Adicionar constantes de módulo em `calculator.ts`

**Files:**
- Modify: `src/core/calculator.ts` (append no final do arquivo, após a linha 117)

- [ ] **Step 1: Adicionar import do tipo `PromocaoComercial`**

Editar a primeira linha do arquivo:

```ts
import type { DistribuidoraValores, ResultadoCalculoSG, SimulacaoComercial } from './types';
```

Substituir por:

```ts
import type { DistribuidoraValores, ResultadoCalculoSG, SimulacaoComercial, PromocaoComercial, ProjecaoAnual } from './types';
```

- [ ] **Step 2: Append constantes de cenário no final do arquivo (após linha 117)**

Adicionar:

```ts

const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const;

const BANDEIRAS_CENARIO_MISTO: readonly string[] = [
    'Verde', 'Verde', 'Verde', 'Verde', 'Verde', 'Verde',
    'Amarela', 'Amarela', 'Amarela',
    'Vermelha P1', 'Vermelha P1',
    'Vermelha P2',
];
```

- [ ] **Step 3: Verificar compilação**

```bash
npx tsc --noEmit
```
Esperado: sem erros novos.

- [ ] **Step 4: Commit**

```bash
git add src/core/calculator.ts
git commit -m "feat(calc): adiciona constantes de meses e cenario misto de bandeiras"
```

---

## Task 3: Implementar helper privado `calcularMesProjecao`

**Files:**
- Modify: `src/core/calculator.ts` (append após as constantes da Task 2)

- [ ] **Step 1: Append o helper no final do arquivo**

Adicionar exatamente:

```ts

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
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```
Esperado: sem erros novos. A função usa `normalizarNomeDistribuidora`, `distribuidorasData`, e `calcularImpostos`, todos já importados/definidos no arquivo.

- [ ] **Step 3: Commit**

```bash
git add src/core/calculator.ts
git commit -m "feat(calc): adiciona helper privado calcularMesProjecao"
```

---

## Task 4: Implementar função pública `calcularProjecaoAnual`

**Files:**
- Modify: `src/core/calculator.ts` (append após o helper da Task 3)

- [ ] **Step 1: Append a função pública no final do arquivo**

Adicionar exatamente:

```ts

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
```

- [ ] **Step 2: Verificar compilação**

```bash
npx tsc --noEmit
```
Esperado: sem erros novos. Se aparecer erro `'PromocaoComercial' is declared but never used` ou similar, é porque o import da Task 2 não foi feito — voltar e adicionar.

- [ ] **Step 3: Verificar lint**

```bash
npm run lint
```
Esperado: sem erros novos em `src/core/calculator.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/core/calculator.ts
git commit -m "feat(calc): adiciona calcularProjecaoAnual com cenarios e promos"
```

---

## Task 5: Criar script de validação `scripts/validar-projecao.ts`

**Files:**
- Create: `scripts/validar-projecao.ts`

- [ ] **Step 1: Criar o diretório `scripts/` na raiz do projeto**

Em PowerShell:
```powershell
New-Item -ItemType Directory -Path scripts -Force
```

- [ ] **Step 2: Criar `scripts/validar-projecao.ts` com este conteúdo exato**

```ts
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
console.log(`      delta            = ${formatCurrency(Math.abs(mensal.economiaBase * 12 - baseline.economiaAnualTotal))} (deve ser ≤ R$ 0,12)`);

// Sanity 2: 100% Verde + 1_GRATIS — Janeiro sem injeção SG
imprimirCenario('Cenário 2: 100% Verde, 1_GRATIS (Janeiro grátis)', true, '1_GRATIS');

// Sanity 3: Cenário misto, sem promo — Jul-Set amarela, Out-Nov P1, Dez P2
imprimirCenario('Cenário 3: Misto Jan-Dez, sem promo', false, 'NENHUMA');

// Sanity 4: Cruzado — Misto + 2_GRATIS — Jan/Fev sem injeção
imprimirCenario('Cenário 4: Misto Jan-Dez, 2_GRATIS', false, '2_GRATIS');

console.log('\n========================================');
console.log('  FIM. Compare os valores com a planilha.');
console.log('========================================');
```

- [ ] **Step 3: Rodar o script**

```bash
npx tsx scripts/validar-projecao.ts
```

Esperado:
- 4 blocos de cenário impressos com 12 linhas cada.
- Cenário 1: as 12 linhas devem ser idênticas entre si (todos os meses Verde, sem promo).
- `delta` do sanity check entre `12 × economiaBase` e `economiaAnualTotal` ≤ R$ 0,12 (margem de 1 centavo por mês de propagação de arredondamento).
- Cenário 2: linha "Jan" tem `Com SG` reduzido em relação às demais (sem injeção); Fev-Dez idênticos ao baseline.
- Cenário 3: Jan-Jun idênticos (Verde), Jul-Set idênticos (Amarela maior), Out-Nov idênticos (P1 ainda maior), Dez (P2 máximo).
- Cenário 4: Jan e Fev com `Com SG` reduzido (sem injeção); demais seguem o padrão misto do Cenário 3.

Se algum padrão falhar, **parar** e inspecionar o código antes de seguir.

- [ ] **Step 4: Compare os valores impressos com a planilha de referência**

Abrir a planilha `Cópia de Calculadora de Tarifas - Comercial DEZ atualizado.xlsx` (mesma referência do refactor de precisão) e:
- Confirmar que `Cenário 1` linha de Janeiro bate centavo a centavo com a aba de cálculo mensal para Equatorial GO + 15% + 1000 kWh + monofásico.
- Confirmar que o `economiaAnualTotal` do Cenário 1 ≈ 12 × economia mensal da planilha.

Se houver divergência > R$ 0,10 em qualquer cenário, abrir issue documentando antes de commitar.

- [ ] **Step 5: Commit**

```bash
git add scripts/validar-projecao.ts
git commit -m "chore(scripts): adiciona validador manual da projecao anual"
```

---

## Self-Review Concluída

**Spec coverage:**
- Tipos novos → Task 1 ✓
- Constantes `NOMES_MESES` e `BANDEIRAS_CENARIO_MISTO` → Task 2 ✓
- Helper `calcularMesProjecao` com fórmulas exatas e zero arredondamento → Task 3 ✓
- Função pública `calcularProjecaoAnual` com vetores de promo, loop, soma anual em float, arredondamento final → Task 4 ✓
- Regra de arredondamento tardio respeitada (4× round por mês + 1 anual, todos em "saída") → Task 4 ✓
- Cenários de sanity (4 do spec) → Task 5 ✓
- Não modificar `simularComercial`/`calcularTarifaSG`/`calcularImpostos` → enforced nas restrições do header ✓
- `consumoMinimo: number` (não enum) → Task 4 assinatura ✓
- Promo afeta apenas injeção limpa → Task 3 lógica (`faturaSGInjecaoFinal` aplica promo antes de somar com `impostosNI + custoMinimoConcessionaria + acrescimoBandeiraSG`) ✓

**Placeholder scan:** Nenhum "TBD" / "TODO" / "handle edge cases". Todos os blocos de código são completos e copiáveis.

**Type consistency:** `PromocaoComercial`, `PontoGraficoMensal`, `ProjecaoAnual` são definidos na Task 1 e usados na Task 4 com os mesmos nomes. `calcularMesProjecao` tem a mesma assinatura na Task 3 e na chamada da Task 4. Chaves de bandeira (`'Verde'`, `'Amarela'`, `'Vermelha P1'`, `'Vermelha P2'`) batem com `data.ts`.
