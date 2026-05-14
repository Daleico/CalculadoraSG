# Refator UX Fintech — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refatorar a UI da projeção anual para um card unificado tipo dashboard fintech, com gráfico de uma única série, indicadores de bandeira por mês no eixo X, popover de edição em massa de bandeiras, e rodapé com economia + custos totais. Atualizar `calcularProjecaoAnual` para receber `bandeirasMensais` (12 posições) em vez de `cenario100Verde`, e devolver `custoTotalSemSG` / `custoTotalComSG`.

**Architecture:** Refator multi-camada. Core: nova assinatura do calculator + 2 campos novos no `ProjecaoAnual` + constante `BANDEIRAS_PADRAO` migrada para `data.ts`. UI: substitui 3 subcomponentes locais por 4 novos (`BotoesPromocao`, `GraficoProjecao` simplificado com `TickComBandeira`, `RodapeProjecao`, `PopoverBandeiras`). Mesmo padrão "tudo inline em `app/page.tsx`". Mantém a regra de arredondamento tardio.

**Tech Stack:** TypeScript 5, Next.js 16, React 19, Tailwind v4, recharts 3.8.1, lucide-react.

**Spec de referência:** `docs/superpowers/specs/2026-05-14-refator-fintech-design.md`

**Restrições absolutas:**
- **NÃO** modificar `simularComercial`, `calcularTarifaSG`, `calcularImpostos`, `normalizarNomeDistribuidora`, `calcularMesProjecao`.
- **NÃO** adicionar dependências.
- **NÃO** criar arquivos novos (manter convenção "tudo em `app/page.tsx`").
- A soma dos totais usa floats brutos de `paresBrutos`, arredonda 1 vez no fim — **mesma regra de ouro** do refactor de precisão.

---

## File Structure

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `src/core/types.ts` | Modificar | + `custoTotalSemSG`, `custoTotalComSG` em `ProjecaoAnual` |
| `src/core/data.ts` | Modificar | + `BANDEIRAS_PADRAO: readonly NomeBandeira[]` exportada |
| `src/core/calculator.ts` | Modificar | Refator `calcularProjecaoAnual` (assinatura + retorno). Remove `BANDEIRAS_CENARIO_MISTO` local. |
| `scripts/validar-projecao.ts` | Modificar | Atualiza 4 chamadas. Imprime os novos totais. Bound do delta R$ 0,06 mantido. |
| `app/page.tsx` | Modificar | Substitui 3 subcomponentes por 4 novos + popover. Layout unificado. Novo estado `bandeirasMensais` + 3 auxiliares. |

---

## Task 1: Atualizar `ProjecaoAnual` em `types.ts`

**Files:**
- Modify: `C:\Users\daniel.leiner_solarg\Desktop\calculadorasg-next\src\core\types.ts`

- [ ] **Step 1: Editar interface `ProjecaoAnual`**

Localizar:
```ts
export interface ProjecaoAnual {
    dadosGrafico: PontoGraficoMensal[];
    economiaAnualTotal: number;
}
```

Substituir por:
```ts
export interface ProjecaoAnual {
    dadosGrafico: PontoGraficoMensal[];
    economiaAnualTotal: number;
    custoTotalSemSG: number;
    custoTotalComSG: number;
}
```

- [ ] **Step 2: Verificar tsc**

```bash
npx tsc --noEmit
```

Esperado: erros em `calculator.ts` e `app/page.tsx` (porque ainda não retornam os 2 novos campos). Pode mostrar mensagens como "Property 'custoTotalSemSG' is missing in type ...". Continuar — Tasks 3 e 5 resolvem.

Se houver erro **NÃO relacionado** a `custoTotalSemSG`/`custoTotalComSG`, STOP e reportar.

- [ ] **Step 3: Commit**

```bash
git add src/core/types.ts
git commit -m "feat(types): adiciona custoTotalSemSG e custoTotalComSG em ProjecaoAnual"
```

---

## Task 2: Adicionar `BANDEIRAS_PADRAO` em `data.ts`

**Files:**
- Modify: `C:\Users\daniel.leiner_solarg\Desktop\calculadorasg-next\src\core\data.ts`

- [ ] **Step 1: Adicionar constante exportada no final do arquivo**

Adicionar após a const `bandeirasTarifarias`:

```ts

export const BANDEIRAS_PADRAO: readonly NomeBandeira[] = [
    'Verde', 'Verde', 'Verde', 'Verde', 'Verde', 'Verde',
    'Amarela', 'Amarela', 'Amarela',
    'Vermelha P1', 'Vermelha P1',
    'Vermelha P2',
];
```

- [ ] **Step 2: Verificar tsc**

```bash
npx tsc --noEmit
```

Esperado: mesmos erros da Task 1 ainda presentes. Nenhum erro novo. `BANDEIRAS_PADRAO` ainda não é importada em lugar nenhum — TS não reclama de export não consumido.

- [ ] **Step 3: Commit**

```bash
git add src/core/data.ts
git commit -m "feat(data): exporta constante BANDEIRAS_PADRAO de 12 bandeiras"
```

---

## Task 3: Refatorar `calcularProjecaoAnual` em `calculator.ts`

**Files:**
- Modify: `C:\Users\daniel.leiner_solarg\Desktop\calculadorasg-next\src\core\calculator.ts`

- [ ] **Step 1: Remover a constante local `BANDEIRAS_CENARIO_MISTO`**

Localizar e **remover** o bloco (linhas ~115-121):

```ts

const BANDEIRAS_CENARIO_MISTO = [
    'Verde', 'Verde', 'Verde', 'Verde', 'Verde', 'Verde',
    'Amarela', 'Amarela', 'Amarela',
    'Vermelha P1', 'Vermelha P1',
    'Vermelha P2',
] as const;
```

Deixar `NOMES_MESES` intacta.

- [ ] **Step 2: Substituir a função `calcularProjecaoAnual` inteira**

Localizar o bloco atual da função (linhas ~159 até ~225):

```ts
export function calcularProjecaoAnual(params: {
    distribuidora: string;
    consumoKwh: number;
    descontoPercentual: number;
    consumoMinimo: number;
    cenario100Verde: boolean;
    promocaoAtiva: PromocaoComercial;
}): ProjecaoAnual {
    // ... corpo inteiro
}
```

Substituir por:

```ts
export function calcularProjecaoAnual(params: {
    distribuidora: string;
    consumoKwh: number;
    descontoPercentual: number;
    consumoMinimo: number;
    bandeirasMensais: readonly NomeBandeira[];
    promocaoAtiva: PromocaoComercial;
}): ProjecaoAnual {
    const { distribuidora, consumoKwh, descontoPercentual, consumoMinimo, bandeirasMensais, promocaoAtiva } = params;

    if (bandeirasMensais.length !== 12) {
        throw new Error(`bandeirasMensais deve ter 12 posicoes, recebido ${bandeirasMensais.length}`);
    }

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
        const nomeBandeira = bandeirasMensais[i];
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
    let custoSemBrutoAnual = 0;
    let custoComBrutoAnual = 0;
    for (let i = 0; i < 12; i++) {
        economiaBrutaAnual += paresBrutos[i].sem - paresBrutos[i].com;
        custoSemBrutoAnual += paresBrutos[i].sem;
        custoComBrutoAnual += paresBrutos[i].com;
    }

    const dadosGrafico = paresBrutos.map((par, i) => ({
        name: NOMES_MESES[i],
        semSolarGrid: Math.round(par.sem * 100) / 100,
        comSolarGrid: Math.round(par.com * 100) / 100,
        economia: Math.round((par.sem - par.com) * 100) / 100,
    }));

    const economiaAnualTotal = Math.round(economiaBrutaAnual * 100) / 100;
    const custoTotalSemSG = Math.round(custoSemBrutoAnual * 100) / 100;
    const custoTotalComSG = Math.round(custoComBrutoAnual * 100) / 100;

    return { dadosGrafico, economiaAnualTotal, custoTotalSemSG, custoTotalComSG };
}
```

Mudanças-chave:
- Param `cenario100Verde: boolean` → `bandeirasMensais: readonly NomeBandeira[]`.
- Removido o ternário `cenario100Verde ? Array(12).fill('Verde') : BANDEIRAS_CENARIO_MISTO`.
- Loop usa `bandeirasMensais[i]` direto.
- Guard de length adicionado.
- 2 acumuladores novos (`custoSemBrutoAnual`, `custoComBrutoAnual`) somando floats brutos.
- 2 totais novos no return, arredondados 1 vez.

- [ ] **Step 3: Verificar tsc**

```bash
npx tsc --noEmit
```

Esperado: ainda erro em `app/page.tsx` (chamada antiga com `cenario100Verde`) e em `scripts/validar-projecao.ts`. Esses são Tasks 4 e 5. Nenhum erro em `calculator.ts` ou `data.ts` ou `types.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/core/calculator.ts
git commit -m "refactor(calc): troca cenario100Verde por bandeirasMensais e devolve totais"
```

---

## Task 4: Atualizar `scripts/validar-projecao.ts`

**Files:**
- Modify: `C:\Users\daniel.leiner_solarg\Desktop\calculadorasg-next\scripts\validar-projecao.ts`

- [ ] **Step 1: Atualizar import**

Linha atual:
```ts
import { calcularProjecaoAnual, simularComercial } from '../src/core/calculator';
import type { PromocaoComercial } from '../src/core/types';
```

Substituir por:
```ts
import { calcularProjecaoAnual, simularComercial } from '../src/core/calculator';
import { BANDEIRAS_PADRAO } from '../src/core/data';
import type { NomeBandeira } from '../src/core/data';
import type { PromocaoComercial } from '../src/core/types';
```

- [ ] **Step 2: Substituir a função `imprimirCenario` inteira**

Localizar:
```ts
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
```

Substituir por (assinatura recebe `bandeirasMensais` em vez de `cenario100Verde`; imprime os 3 totais; sanity check interno entre custos e economia):

```ts
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
```

- [ ] **Step 3: Atualizar as 4 chamadas a `imprimirCenario`**

Localizar e substituir cada uma:

```ts
const baseline = imprimirCenario('Cenário 1: 100% Verde, sem promo (baseline)', true, 'NENHUMA');
```

→

```ts
const TODOS_VERDES: readonly NomeBandeira[] = Array(12).fill('Verde');
const baseline = imprimirCenario('Cenário 1: 100% Verde, sem promo (baseline)', TODOS_VERDES, 'NENHUMA');
```

(`TODOS_VERDES` é declarada uma vez antes do `baseline` e reutilizada no Cenário 2.)

Próxima:
```ts
imprimirCenario('Cenário 2: 100% Verde, 1_GRATIS (Janeiro grátis)', true, '1_GRATIS');
```

→

```ts
imprimirCenario('Cenário 2: 100% Verde, 1_GRATIS (Janeiro grátis)', TODOS_VERDES, '1_GRATIS');
```

Próxima:
```ts
imprimirCenario('Cenário 3: Misto Jan-Dez, sem promo', false, 'NENHUMA');
```

→

```ts
imprimirCenario('Cenário 3: Misto Jan-Dez, sem promo', BANDEIRAS_PADRAO, 'NENHUMA');
```

Próxima:
```ts
imprimirCenario('Cenário 4: Misto Jan-Dez, 2_GRATIS', false, '2_GRATIS');
```

→

```ts
imprimirCenario('Cenário 4: Misto Jan-Dez, 2_GRATIS', BANDEIRAS_PADRAO, '2_GRATIS');
```

- [ ] **Step 4: Rodar o script para validar**

```bash
npx tsx scripts/validar-projecao.ts
```

Esperado:
- Saída completa dos 4 cenários sem throw.
- Em cada cenário, a linha de sanity interno mostra delta ≤ R$ 0,03 (tipicamente R$ 0,00 a R$ 0,02).
- Cenário 1 baseline: `economiaAnualTotal = R$ 1.557,10`, `custoTotalSemSG = R$ 13.940,40`, `custoTotalComSG = R$ 12.383,30` (aprox — depende de arredondamentos de centavos).
- Cenário 2: `economiaAnualTotal` próximo a `R$ 2.508,66` (mesmo da v1).
- Cenário 3: `economiaAnualTotal` próximo a `R$ 1.774,94`.
- Cenário 4: `economiaAnualTotal` próximo a `R$ 3.678,07`.
- Sanity check externo (que já existia): `12 × economiaBase` vs `baseline.economiaAnualTotal`, delta ≤ R$ 0,06.

Se algum throw ou padrão inconsistente, STOP e reportar.

- [ ] **Step 5: Commit**

```bash
git add scripts/validar-projecao.ts
git commit -m "chore(scripts): atualiza validador para nova assinatura com bandeirasMensais"
```

---

## Task 5: Atualizar imports e estados em `app/page.tsx`

**Files:**
- Modify: `C:\Users\daniel.leiner_solarg\Desktop\calculadorasg-next\app\page.tsx`

Esta task atualiza só os imports e os useStates. Mantém JSX intacto temporariamente — a Task 6 reconstrói os subcomponentes e o JSX.

- [ ] **Step 1: Atualizar imports**

Linhas atuais (perto do topo):
```ts
import { distribuidorasData } from '../src/core/data';
import { simularComercial, calcularProjecaoAnual } from '../src/core/calculator';
import type { SimulacaoComercial, PromocaoComercial, ProjecaoAnual } from '../src/core/types';
import { Zap, Percent, AlertCircle, Building2, TrendingDown, Lightbulb, Calculator, BarChart3, Sparkles } from 'lucide-react';
```

Substituir por:
```ts
import { distribuidorasData, BANDEIRAS_PADRAO } from '../src/core/data';
import type { NomeBandeira } from '../src/core/data';
import { simularComercial, calcularProjecaoAnual } from '../src/core/calculator';
import type { SimulacaoComercial, PromocaoComercial, ProjecaoAnual } from '../src/core/types';
import { Zap, Percent, AlertCircle, Building2, TrendingDown, Lightbulb, Calculator, BarChart3, Pencil, X } from 'lucide-react';
```

Mudanças:
- Adiciona `BANDEIRAS_PADRAO`, `NomeBandeira` de `data.ts`
- Remove `Sparkles` (não usado mais — era do switch da v1)
- Adiciona `Pencil` (botão Personalizar Bandeiras) e `X` (botão fechar popover)

- [ ] **Step 2: Substituir os estados de cenário e promoção**

Localizar o bloco atual (em `App()`, perto da linha ~171-172):

```tsx
  const [cenario100Verde, setCenario100Verde] = useState<boolean>(false);
  const [promocaoAtiva, setPromocaoAtiva] = useState<PromocaoComercial>('NENHUMA');
```

Substituir por:

```tsx
  const [bandeirasMensais, setBandeirasMensais] = useState<readonly NomeBandeira[]>(BANDEIRAS_PADRAO);
  const [promocaoAtiva, setPromocaoAtiva] = useState<PromocaoComercial>('NENHUMA');
  const [isMenuBandeirasOpen, setIsMenuBandeirasOpen] = useState<boolean>(false);
  const [mesesSelecionados, setMesesSelecionados] = useState<number[]>([]);
  const [bandeiraSelecionadaTemp, setBandeiraSelecionadaTemp] = useState<NomeBandeira>('Verde');
```

- [ ] **Step 3: Atualizar o `useMemo`**

Localizar o `useMemo` atual (perto das linhas ~177-211). Vai estar com `cenario100Verde` na chamada e na dep array.

Substituir o `useMemo` inteiro por:

```tsx
  const { resultado, projecao, erro } = useMemo<{
    resultado: SimulacaoComercial | null;
    projecao: ProjecaoAnual | null;
    erro: string | null;
  }>(() => {
    const numDesconto = Number(desconto);
    const numConsumo = Number(consumo);

    if (isNaN(numDesconto) || isNaN(numConsumo) || numConsumo <= 0 || numDesconto < 0) {
      return { resultado: null, projecao: null, erro: 'Preencha um consumo e desconto válidos.' };
    }

    if (numConsumo <= consumoMinimo) {
      return { resultado: null, projecao: null, erro: 'O consumo total deve ser maior que o consumo mínimo da conexão.' };
    }

    try {
      const resultado = simularComercial(distribuidora, numDesconto, numConsumo, consumoMinimo);
      const projecao = calcularProjecaoAnual({
        distribuidora,
        consumoKwh: numConsumo,
        descontoPercentual: numDesconto,
        consumoMinimo,
        bandeirasMensais,
        promocaoAtiva,
      });
      return { resultado, projecao, erro: null };
    } catch (err: unknown) {
      return {
        resultado: null,
        projecao: null,
        erro: err instanceof Error ? err.message : 'Erro ao processar simulação.',
      };
    }
  }, [distribuidora, desconto, consumo, consumoMinimo, bandeirasMensais, promocaoAtiva]);
```

Chave: substitui `cenario100Verde` por `bandeirasMensais` na chamada e na dep array.

- [ ] **Step 4: Verificar tsc**

```bash
npx tsc --noEmit
```

Esperado: erros remanescentes APENAS no JSX que ainda chama `BarraControles` com props que não existem mais (`cenario100Verde`, `onToggleCenario`). A Task 6 resolve isso.

Se aparecer erro em outro lugar, STOP e reportar.

- [ ] **Step 5: Commit (interim — JSX ainda quebrado, mas tsc só falha em pontos esperados)**

Antes do commit, verifique que os tipos da função estão completos. Caso `tsc` ainda mostre erros que NÃO são "props missing" no `<BarraControles ...>`, voltar e investigar.

```bash
git add app/page.tsx
git commit -m "feat(ui): refator de estados para bandeirasMensais e popover"
```

---

## Task 6: Reconstruir subcomponentes e JSX em `app/page.tsx`

**Files:**
- Modify: `C:\Users\daniel.leiner_solarg\Desktop\calculadorasg-next\app\page.tsx`

A maior task. Remove 3 subcomponentes antigos (`BarraControles`, `GraficoProjecao` v1, `CardEconomiaAnual`), adiciona 4 novos (`BotoesPromocao`, `GraficoProjecao` v2 com `TickComBandeira`, `RodapeProjecao`, `PopoverBandeiras`). Mantém `TooltipMes`. Reescreve a `<section>` do JSX para o card unificado.

- [ ] **Step 1: Remover `BarraControles` inteira**

Localizar a função `BarraControles` (módulo-scope, ~linhas 17-77) e **remover inteira**, incluindo a linha em branco que separa do bloco seguinte.

- [ ] **Step 2: Substituir `GraficoProjecao` inteira**

Localizar a função `GraficoProjecao` (~linhas 107-145, depois do `TooltipMes`).

Substituir por (a versão simplificada + `TickComBandeira` + constante `CORES_BANDEIRAS` + `formatYAxisTick` que já existem do polish, OK manter):

```tsx
const CORES_BANDEIRAS: Record<NomeBandeira, string> = {
    'Verde': '#10b981',
    'Amarela': '#eab308',
    'Vermelha P1': '#f97316',
    'Vermelha P2': '#ef4444',
};

function TickComBandeira(props: {
    x?: number;
    y?: number;
    payload?: { value: string; index: number };
    bandeirasMensais: readonly NomeBandeira[];
}) {
    const { x = 0, y = 0, payload, bandeirasMensais } = props;
    if (!payload) return null;
    const cor = CORES_BANDEIRAS[bandeirasMensais[payload.index]];
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={12} textAnchor="middle" fill="#9ca3af" fontSize={12}>
                {payload.value}
            </text>
            <circle cx={0} cy={22} r={3} fill={cor} />
        </g>
    );
}

function GraficoProjecao({ dados, bandeirasMensais }: {
    dados: ProjecaoAnual['dadosGrafico'];
    bandeirasMensais: readonly NomeBandeira[];
}) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-solar-500" />
                <h3 className="text-lg font-semibold text-white">Projeção Anual</h3>
            </div>
            <div className="h-[300px] sm:h-[360px] md:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={dados}
                        margin={{ top: 8, right: 8, bottom: 16, left: 8 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#9ca3af"
                            tickLine={false}
                            axisLine={{ stroke: '#374151' }}
                            interval={0}
                            tick={<TickComBandeira bandeirasMensais={bandeirasMensais} />}
                            height={40}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            tickLine={false}
                            axisLine={{ stroke: '#374151' }}
                            fontSize={12}
                            tickFormatter={formatYAxisTick}
                        />
                        <Tooltip content={<TooltipMes />} cursor={{ fill: '#1f2937', opacity: 0.4 }} />
                        <Bar dataKey="comSolarGrid" name="Com SolarGrid" fill="#f59e0b" radius={[4, 4, 0, 0]} animationDuration={600} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
```

Atenção: a constante `CORES_BANDEIRAS` deve aparecer **antes** de `TickComBandeira`. Coloque-as imediatamente antes do `function GraficoProjecao` (substituindo o conteúdo anterior dele).

Mudanças versus v1:
- Remove `<Legend>`.
- Remove `<Bar dataKey="semSolarGrid">`.
- `radius={[4, 4, 0, 0]}` (era `[6, 6, 0, 0]`).
- `XAxis` ganha `tick={<TickComBandeira ...>}` + `interval={0}` + `height={40}`.
- Container ganha `h-[300px] sm:h-[360px] md:h-[400px]` (era `h-[280px] sm:h-[340px] md:h-[360px]`).
- Remove margem inferior do `<div className="bg-gray-900 rounded-3xl shadow-xl ring-1 ring-white/10 p-6 sm:p-8">` — agora o card pai (no JSX da App) provê o container. O componente devolve só `<div>` simples sem ring/bg próprio.

- [ ] **Step 3: Substituir `CardEconomiaAnual` por `RodapeProjecao`**

Localizar a função `CardEconomiaAnual` (~linhas 148-164).

Substituir por:

```tsx
function RodapeProjecao({ economiaAnualTotal, custoTotalSemSG, custoTotalComSG }: {
    economiaAnualTotal: number;
    custoTotalSemSG: number;
    custoTotalComSG: number;
}) {
    return (
        <div className="bg-gray-950/40 p-6 sm:p-8 border-t border-gray-800 text-center relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 opacity-[0.07] pointer-events-none">
                <TrendingDown className="w-32 h-32 text-emerald-500" />
            </div>
            <div className="relative z-10">
                <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-emerald-500 font-semibold mb-3">
                    Economia Total Estimada no Ano
                </p>
                <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-emerald-400 tabular-nums mb-4">
                    {formatCurrency(economiaAnualTotal)}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                    Custo total sem a SolarGrid: <span className="text-gray-300 font-medium">{formatCurrency(custoTotalSemSG)}</span>
                    <span className="mx-2 text-gray-700">|</span>
                    Custo total com a SolarGrid: <span className="text-solar-400 font-medium">{formatCurrency(custoTotalComSG)}</span>
                </p>
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Adicionar `BotoesPromocao` (substituto do button group do BarraControles)**

Inserir antes de `GraficoProjecao`:

```tsx
function BotoesPromocao({ promocaoAtiva, onSelect }: {
    promocaoAtiva: PromocaoComercial;
    onSelect: (p: PromocaoComercial) => void;
}) {
    const promocoes: Array<{ valor: PromocaoComercial; label: string }> = [
        { valor: 'NENHUMA', label: 'Nenhuma' },
        { valor: '1_GRATIS', label: '1º Mês Grátis' },
        { valor: '2_GRATIS', label: '2 Meses Grátis' },
        { valor: '50_OFF', label: '50% OFF no 1º' },
    ];

    return (
        <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-widest text-gray-500">Gatilho Comercial</p>
            <div className="flex flex-wrap gap-2">
                {promocoes.map(({ valor, label }) => {
                    const ativo = promocaoAtiva === valor;
                    return (
                        <button
                            key={valor}
                            type="button"
                            aria-pressed={ativo}
                            onClick={() => onSelect(valor)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                                ativo
                                    ? 'bg-solar-500 text-gray-950 ring-2 ring-solar-400 shadow-lg shadow-solar-500/20'
                                    : 'bg-gray-800 text-gray-400 ring-1 ring-gray-700 hover:bg-gray-700 hover:text-gray-200'
                            }`}
                        >
                            {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
```

- [ ] **Step 5: Adicionar `PopoverBandeiras` no final do bloco de subcomponentes**

Inserir imediatamente após `RodapeProjecao`:

```tsx
function PopoverBandeiras({
    bandeirasMensais,
    mesesSelecionados,
    bandeiraSelecionadaTemp,
    onChangeMesesSelecionados,
    onChangeBandeiraTemp,
    onAplicar,
    onClose,
}: {
    bandeirasMensais: readonly NomeBandeira[];
    mesesSelecionados: number[];
    bandeiraSelecionadaTemp: NomeBandeira;
    onChangeMesesSelecionados: (meses: number[]) => void;
    onChangeBandeiraTemp: (b: NomeBandeira) => void;
    onAplicar: (meses: number[], bandeira: NomeBandeira) => void;
    onClose: () => void;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const todosNomes: readonly string[] = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const todasBandeiras: readonly NomeBandeira[] = ['Verde','Amarela','Vermelha P1','Vermelha P2'];

    function toggleMes(i: number) {
        if (mesesSelecionados.includes(i)) {
            onChangeMesesSelecionados(mesesSelecionados.filter((m) => m !== i));
        } else {
            onChangeMesesSelecionados([...mesesSelecionados, i]);
        }
    }

    function toggleTodos() {
        if (mesesSelecionados.length === 12) onChangeMesesSelecionados([]);
        else onChangeMesesSelecionados(Array.from({ length: 12 }, (_, i) => i));
    }

    const aplicarHabilitado = mesesSelecionados.length > 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label="Personalizar bandeiras tarifárias"
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 rounded-3xl shadow-2xl ring-1 ring-white/10 max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">Personalizar Bandeiras</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs uppercase tracking-widest text-gray-500">1. Selecione os Meses</p>
                        <button
                            type="button"
                            onClick={toggleTodos}
                            className="text-xs text-solar-400 hover:text-solar-300 transition-colors"
                        >
                            {mesesSelecionados.length === 12 ? 'Limpar' : 'Selecionar todos'}
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        {todosNomes.map((nome, i) => {
                            const ativo = mesesSelecionados.includes(i);
                            const corBandeiraAtual = CORES_BANDEIRAS[bandeirasMensais[i]];
                            return (
                                <button
                                    key={i}
                                    type="button"
                                    aria-pressed={ativo}
                                    onClick={() => toggleMes(i)}
                                    className={`relative py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        ativo
                                            ? 'bg-solar-500 text-gray-950 ring-2 ring-solar-400'
                                            : 'bg-gray-800 text-gray-300 ring-1 ring-gray-700 hover:bg-gray-700'
                                    }`}
                                >
                                    {nome}
                                    <span
                                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full"
                                        style={{ background: corBandeiraAtual }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-6">
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">2. Aplicar Bandeira</p>
                    <div className="flex flex-wrap gap-2">
                        {todasBandeiras.map((bandeira) => {
                            const ativa = bandeiraSelecionadaTemp === bandeira;
                            const cor = CORES_BANDEIRAS[bandeira];
                            return (
                                <button
                                    key={bandeira}
                                    type="button"
                                    aria-pressed={ativa}
                                    onClick={() => onChangeBandeiraTemp(bandeira)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 bg-gray-800 ring-1 ${
                                        ativa ? 'ring-2 ring-white text-white' : 'ring-gray-700 text-gray-300 hover:bg-gray-700'
                                    }`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: cor }} />
                                    {bandeira}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={() => onAplicar(mesesSelecionados, bandeiraSelecionadaTemp)}
                        disabled={!aplicarHabilitado}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            aplicarHabilitado
                                ? 'bg-solar-500 text-gray-950 ring-2 ring-solar-400 shadow-lg shadow-solar-500/20'
                                : 'bg-gray-800 text-gray-600 ring-1 ring-gray-800 cursor-not-allowed'
                        }`}
                    >
                        Aplicar Alteração
                    </button>
                </div>
            </div>
        </div>
    );
}
```

**Atenção:** o `useEffect` dentro de `PopoverBandeiras` exige importar `useEffect` no topo. Step 6 cuida disso.

- [ ] **Step 6: Adicionar `useEffect` aos imports do React**

Linha atual:
```ts
import { useState, useMemo } from 'react';
```

Substituir por:
```ts
import { useState, useMemo, useEffect } from 'react';
```

- [ ] **Step 7: Reescrever a `<section>` da projeção no JSX de `App()`**

Localizar a `<section>` atual (aparece após o fechamento do grid principal, dentro do bloco `{resultado && projecao && !erro && (...)}`):

```tsx
        {resultado && projecao && !erro && (
          <section className="mt-8 space-y-6 animate-fade-up">
            <BarraControles
              cenario100Verde={cenario100Verde}
              onToggleCenario={setCenario100Verde}
              promocaoAtiva={promocaoAtiva}
              onSelectPromocao={setPromocaoAtiva}
            />
            <GraficoProjecao dados={projecao.dadosGrafico} />
            <CardEconomiaAnual valor={projecao.economiaAnualTotal} />
          </section>
        )}
```

Substituir por:

```tsx
        {resultado && projecao && !erro && (
          <section className="mt-8 animate-fade-up bg-gray-900 rounded-3xl ring-1 ring-white/10 shadow-xl overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-gray-800">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <BotoesPromocao promocaoAtiva={promocaoAtiva} onSelect={setPromocaoAtiva} />
                <button
                  type="button"
                  onClick={() => setIsMenuBandeirasOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-800 text-gray-200 ring-1 ring-gray-700 hover:bg-gray-700 hover:text-white transition-all duration-200 self-start lg:self-auto"
                >
                  <Pencil className="w-4 h-4" />
                  Personalizar Bandeiras
                </button>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <GraficoProjecao dados={projecao.dadosGrafico} bandeirasMensais={bandeirasMensais} />
            </div>

            <RodapeProjecao
              economiaAnualTotal={projecao.economiaAnualTotal}
              custoTotalSemSG={projecao.custoTotalSemSG}
              custoTotalComSG={projecao.custoTotalComSG}
            />
          </section>
        )}

        {isMenuBandeirasOpen && (
          <PopoverBandeiras
            bandeirasMensais={bandeirasMensais}
            mesesSelecionados={mesesSelecionados}
            bandeiraSelecionadaTemp={bandeiraSelecionadaTemp}
            onChangeMesesSelecionados={setMesesSelecionados}
            onChangeBandeiraTemp={setBandeiraSelecionadaTemp}
            onAplicar={(meses, bandeira) => {
              setBandeirasMensais((prev) => {
                const next = [...prev];
                for (const i of meses) next[i] = bandeira;
                return next;
              });
              setMesesSelecionados([]);
              setIsMenuBandeirasOpen(false);
            }}
            onClose={() => {
              setMesesSelecionados([]);
              setIsMenuBandeirasOpen(false);
            }}
          />
        )}
```

- [ ] **Step 8: Verificar tsc e lint**

```bash
npx tsc --noEmit
npm run lint
```

Esperado:
- `tsc`: clean.
- `lint`: clean. Warnings de "defined but never used" sumiram porque tudo é consumido agora. Pode aparecer warning se `Calculator` (lucide) ficou sem uso — checar e remover do import se for o caso.

Se `lint` reclamar de algum import não usado, ajustar a linha do `lucide-react`.

- [ ] **Step 9: Smoke build**

```bash
npm run build
```

Esperado: build success em ~10s. Warning de ResponsiveContainer no SSG é aceitável (mesmo da v1). Se houver erro de build, STOP e reportar.

- [ ] **Step 10: Smoke dev server (background, ~10s)**

```bash
npm run dev
```

Rodar em background. Aguardar ~10s. Confirmar log "Ready in NNNms" sem erros. Encerrar.

- [ ] **Step 11: Commit**

```bash
git add app/page.tsx
git commit -m "feat(ui): card unificado fintech com bulk-edit de bandeiras"
```

---

## Self-Review Concluída

**Spec coverage:**
- `ProjecaoAnual` ganha `custoTotalSemSG`, `custoTotalComSG` → Task 1 ✓
- `BANDEIRAS_PADRAO` em `data.ts` → Task 2 ✓
- `calcularProjecaoAnual` refator (assinatura + retorno + remove `BANDEIRAS_CENARIO_MISTO`) → Task 3 ✓
- Guard de length nas bandeiras mensais → Task 3 Step 2 ✓
- Acumuladores `custoSemBrutoAnual`, `custoComBrutoAnual` somando floats brutos → Task 3 Step 2 ✓
- `validar-projecao.ts` atualizado (4 chamadas) + impressão dos 2 totais + sanity interno → Task 4 ✓
- Imports atualizados (`BANDEIRAS_PADRAO`, `NomeBandeira`, `Pencil`, `X`; remove `Sparkles`) → Task 5 Step 1 / Task 6 Step 6 ✓
- Estados novos (`bandeirasMensais`, `isMenuBandeirasOpen`, `mesesSelecionados`, `bandeiraSelecionadaTemp`) → Task 5 Step 2 ✓
- `useMemo` com nova dep array e nova call signature → Task 5 Step 3 ✓
- 4 subcomponentes novos (`BotoesPromocao`, `GraficoProjecao` v2, `RodapeProjecao`, `PopoverBandeiras`) → Task 6 Steps 2-5 ✓
- Constantes `CORES_BANDEIRAS` + helper `TickComBandeira` → Task 6 Step 2 ✓
- `<Legend>` removida, só 1 `<Bar>`, radius `[4,4,0,0]` → Task 6 Step 2 ✓
- Custom XAxis tick com bolinha colorida + `interval={0}` + `height={40}` → Task 6 Step 2 ✓
- Card unificado JSX (topo + gráfico + rodapé) → Task 6 Step 7 ✓
- Popover com Esc, backdrop click, X button, disabled state, aria-modal → Task 6 Step 5 + Step 7 ✓
- `useEffect` import → Task 6 Step 6 ✓
- Subcomponentes antigos removidos (`BarraControles`, `CardEconomiaAnual`) → Task 6 Steps 1, 3 ✓
- `BarraControles` removido → Task 6 Step 1 ✓
- `useEffect` no popover com cleanup → Task 6 Step 5 ✓
- Smoke build + dev → Task 6 Steps 9-10 ✓

**Placeholder scan:** nenhum "TBD" / "TODO" / "handle edge cases". Cada step tem o código exato.

**Type consistency:**
- `NomeBandeira` (de `data.ts`) usado consistentemente em Tasks 2, 4, 5, 6.
- `bandeirasMensais: readonly NomeBandeira[]` é a mesma assinatura em Task 3 (param da função), Task 5 (state), Task 6 (props dos subcomponentes).
- `ProjecaoAnual` tem 4 campos (2 novos) — consumidos por Task 5 (destructure), Task 6 (props do RodapeProjecao).
- `CORES_BANDEIRAS` referenciada em `TickComBandeira` e `PopoverBandeiras` — declarada antes de ambos (Task 6 Step 2).
- `PromocaoComercial` continua o mesmo type — usado em `BotoesPromocao` (Task 6 Step 4) e no `useMemo` (Task 5).

**Ordem dos commits:**
1. Task 1: types (campos opcionais? não — obrigatórios, mas a UI ainda não consome, então TS reclama em outros lugares — esperado e documentado)
2. Task 2: data (constante exportada — TS limpo, ainda não consumida)
3. Task 3: calculator (consumo de `bandeirasMensais` + retorno completo — fecha o gap dos types da Task 1)
4. Task 4: script (atualiza call site, valida e imprime — fecha o gap do calculator)
5. Task 5: page.tsx imports + states + useMemo (JSX ainda quebrado)
6. Task 6: page.tsx subcomponentes + JSX (fecha o gap)

Cada commit deixa o repositório com `tsc` parcialmente quebrado entre Tasks 1-5 e totalmente verde a partir de Task 6 final. Documentado em cada Task qual erro é esperado.
