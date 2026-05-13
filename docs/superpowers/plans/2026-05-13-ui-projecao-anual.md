# UI Projeção Anual — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a interface reativa da projeção anual em `app/page.tsx` — controles (switch + button group), gráfico Recharts comparativo de 12 meses e card de economia anual — refatorando o `useEffect`/`setState` atual para `useMemo` derivado.

**Architecture:** Adiciona `recharts` como dependência. Em `app/page.tsx`: substitui `useEffect`+`setState` por `useMemo` derivado que devolve `{ resultado, projecao, erro }`. Adiciona estados `cenario100Verde` e `promocaoAtiva`. Renderiza nova seção full-width abaixo do grid principal com 3 subcomponentes locais inline (`BarraControles`, `GraficoProjecao`, `CardEconomiaAnual`) + `TooltipMes` customizado.

**Tech Stack:** Next.js 16, React 19, TypeScript 5, Tailwind v4, recharts (latest 2.x), lucide-react.

**Spec de referência:** `docs/superpowers/specs/2026-05-13-ui-projecao-anual-design.md`

**Restrições absolutas:**
- **NÃO modificar** `src/core/*` (motor matemático intacto).
- **NÃO criar** pasta `components/` nem extrair arquivos novos. Tudo inline em `app/page.tsx`.
- **NÃO adicionar** outras dependências além de `recharts`.
- O `useMemo` deve depender de **todos** os inputs (incluindo os 2 novos: `cenario100Verde`, `promocaoAtiva`).

---

## File Structure

| Arquivo | Tipo | Responsabilidade |
|---|---|---|
| `package.json` / `package-lock.json` | Modificar (`npm install`) | Adiciona `recharts` como dependency. |
| `app/page.tsx` | Modificar (refator completo) | Refatora useEffect→useMemo, adiciona 2 estados, adiciona seção full-width com 3 subcomponentes locais + TooltipMes, move `formatCurrency` para escopo de módulo. |

---

## Task 1: Instalar `recharts`

**Files:**
- Modify: `package.json`, `package-lock.json` (automaticamente via npm)

- [ ] **Step 1: Instalar recharts como dependência**

Rodar:
```bash
npm install recharts
```

Esperado: comando completa sem erros. `package.json` agora tem `"recharts": "^X.Y.Z"` em `dependencies`. `package-lock.json` atualizado.

- [ ] **Step 2: Verificar que o tsc segue limpo**

```bash
npx tsc --noEmit
```
Esperado: sem erros (recharts traz suas próprias types).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): adiciona recharts para o grafico da projecao anual"
```

---

## Task 2: Mover `formatCurrency` para escopo de módulo

**Files:**
- Modify: `app/page.tsx`

Atualmente `formatCurrency` está dentro de `App()` (linhas 46-51). Para os subcomponentes (`TooltipMes`, `CardEconomiaAnual`) usarem, precisa subir para o escopo do arquivo. Mudança puramente mecânica, sem alteração de lógica.

- [ ] **Step 1: Localizar a função `formatCurrency` em `app/page.tsx`**

Hoje está em:
```tsx
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };
```

Dentro do componente `App()`.

- [ ] **Step 2: Mover para escopo de módulo (acima da função `App()`)**

Recortar o bloco acima e colá-lo logo após a linha `import` final e antes de `function App() {`. Mudar `const formatCurrency = (value: number) =>` para `function formatCurrency(value: number): string`:

```tsx
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}
```

- [ ] **Step 3: Confirmar que `tsc` continua limpo**

```bash
npx tsc --noEmit
```
Esperado: sem erros. A função continua sendo chamada de dentro de `App()` (lookup léxico funciona).

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "refactor(ui): move formatCurrency para escopo de modulo"
```

---

## Task 3: Refatorar `useEffect`/`setState` → `useMemo` derivado

**Files:**
- Modify: `app/page.tsx`

Esta task substitui o bloco de `useState`/`useEffect`/setError/setResultado pelo `useMemo` derivado, **sem ainda** introduzir os novos estados (`cenario100Verde`, `promocaoAtiva`) — só corrige o pattern atual. A Task 4 adiciona os novos estados.

- [ ] **Step 1: Atualizar o import do React**

Linha atual (linha 3):
```ts
import { useState, useEffect } from 'react';
```

Substituir por:
```ts
import { useState, useMemo } from 'react';
```

- [ ] **Step 2: Remover os 2 `useState` de `resultado` e `erro`**

Bloco atual (dentro de `App()`, perto das linhas 17-18):
```tsx
  const [resultado, setResultado] = useState<SimulacaoComercial | null>(null);
  const [erro, setErro] = useState<string | null>(null);
```

Remover este bloco inteiro.

- [ ] **Step 3: Substituir o `useEffect` por `useMemo` derivado**

Bloco atual (linhas 20-44):
```tsx
  useEffect(() => {
    try {
      const numDesconto = Number(desconto);
      const numConsumo = Number(consumo);

      if (isNaN(numDesconto) || isNaN(numConsumo) || numConsumo <= 0 || numDesconto < 0) {
        setResultado(null);
        setErro('Preencha um consumo e desconto válidos.');
        return;
      }

      if (numConsumo <= consumoMinimo) {
        setResultado(null);
        setErro('O consumo total deve ser maior que o consumo mínimo da conexão.');
        return;
      }

      const res = simularComercial(distribuidora, numDesconto, numConsumo, consumoMinimo);
      setResultado(res);
      setErro(null);
    } catch (err: unknown) {
      setResultado(null);
      setErro(err instanceof Error ? err.message : 'Erro ao processar simulação.');
    }
  }, [distribuidora, desconto, consumo, consumoMinimo]);
```

Substituir por:

```tsx
  const { resultado, erro } = useMemo<{
    resultado: SimulacaoComercial | null;
    erro: string | null;
  }>(() => {
    const numDesconto = Number(desconto);
    const numConsumo = Number(consumo);

    if (isNaN(numDesconto) || isNaN(numConsumo) || numConsumo <= 0 || numDesconto < 0) {
      return { resultado: null, erro: 'Preencha um consumo e desconto válidos.' };
    }

    if (numConsumo <= consumoMinimo) {
      return { resultado: null, erro: 'O consumo total deve ser maior que o consumo mínimo da conexão.' };
    }

    try {
      const res = simularComercial(distribuidora, numDesconto, numConsumo, consumoMinimo);
      return { resultado: res, erro: null };
    } catch (err: unknown) {
      return {
        resultado: null,
        erro: err instanceof Error ? err.message : 'Erro ao processar simulação.',
      };
    }
  }, [distribuidora, desconto, consumo, consumoMinimo]);
```

- [ ] **Step 4: Verificar `tsc` e `lint`**

```bash
npx tsc --noEmit
npm run lint
```

Esperado:
- `tsc`: limpo
- `lint`: o erro `react-hooks/set-state-in-effect` na linha 26 deve **desaparecer**. Pode aparecer 1 warning sobre `useEffect` agora não usado no import (mas o Step 1 já removeu o import).

- [ ] **Step 5: Smoke test no browser**

```bash
npm run dev
```

Abrir `http://localhost:3000`, mudar inputs (distribuidora, consumo, desconto, tipo de conexão), confirmar que:
- Os 3 cards de destaque atualizam em tempo real.
- A composição da nova fatura atualiza.
- A tabela de bandeiras atualiza.
- Erros aparecem quando consumo ≤ mínimo ou inválido.

Parar o dev server com Ctrl+C após validar.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "refactor(ui): substitui useEffect+setState por useMemo derivado"
```

---

## Task 4: Adicionar estados `cenario100Verde` e `promocaoAtiva` + estender `useMemo`

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Atualizar imports de `src/core/`**

Imports atuais (linhas 4-6):
```ts
import { distribuidorasData } from '../src/core/data';
import { simularComercial } from '../src/core/calculator';
import type { SimulacaoComercial } from '../src/core/types';
```

Substituir por:
```ts
import { distribuidorasData } from '../src/core/data';
import { simularComercial, calcularProjecaoAnual } from '../src/core/calculator';
import type { SimulacaoComercial, PromocaoComercial, ProjecaoAnual } from '../src/core/types';
```

- [ ] **Step 2: Adicionar 2 estados em `App()`, logo após `consumoMinimo`**

Bloco atual (perto da linha 13):
```tsx
  const [consumoMinimo, setConsumoMinimo] = useState<number>(30);
```

Adicionar imediatamente após:
```tsx
  const [cenario100Verde, setCenario100Verde] = useState<boolean>(false);
  const [promocaoAtiva, setPromocaoAtiva] = useState<PromocaoComercial>('NENHUMA');
```

- [ ] **Step 3: Estender o `useMemo` para também derivar `projecao`**

Substituir o `useMemo` atual (da Task 3) por:

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
        cenario100Verde,
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
  }, [distribuidora, desconto, consumo, consumoMinimo, cenario100Verde, promocaoAtiva]);
```

- [ ] **Step 4: Verificar `tsc`**

```bash
npx tsc --noEmit
```
Esperado: limpo. Os tipos `PromocaoComercial` e `ProjecaoAnual` já existem em `src/core/types.ts`.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat(ui): adiciona estados cenario100Verde e promocaoAtiva no useMemo"
```

---

## Task 5: Adicionar imports do Recharts e novos ícones

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Atualizar import do `lucide-react`**

Linha atual (linha 7):
```ts
import { Zap, Percent, AlertCircle, Building2, TrendingDown, Lightbulb, Calculator } from 'lucide-react';
```

Substituir por (adicionando `BarChart3` e `Sparkles`):
```ts
import { Zap, Percent, AlertCircle, Building2, TrendingDown, Lightbulb, Calculator, BarChart3, Sparkles } from 'lucide-react';
```

- [ ] **Step 2: Adicionar import do recharts logo abaixo**

Adicionar nova linha após o import do lucide-react:
```ts
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
```

- [ ] **Step 3: Verificar `tsc`**

```bash
npx tsc --noEmit
```

Esperado: limpo. Se algum import disparar erro de "declared but never used", ignore por enquanto — a Task 6 vai consumir todos.

- [ ] **Step 4: Commit (interim)**

```bash
git add app/page.tsx
git commit -m "feat(ui): adiciona imports do recharts e novos icones do lucide"
```

---

## Task 6: Adicionar subcomponentes locais (`BarraControles`, `TooltipMes`, `GraficoProjecao`, `CardEconomiaAnual`)

**Files:**
- Modify: `app/page.tsx`

Esta task define os 4 subcomponentes locais no nível de módulo, **fora** de `App()`, logo após `formatCurrency`. Eles ainda não são chamados — a Task 7 os monta na JSX.

- [ ] **Step 1: Adicionar `BarraControles` após `formatCurrency`**

Localizar a função `formatCurrency` (escopo de módulo, criada na Task 2). Logo após o `}` que fecha ela, adicionar:

```tsx
function BarraControles({
    cenario100Verde,
    onToggleCenario,
    promocaoAtiva,
    onSelectPromocao,
}: {
    cenario100Verde: boolean;
    onToggleCenario: (v: boolean) => void;
    promocaoAtiva: PromocaoComercial;
    onSelectPromocao: (p: PromocaoComercial) => void;
}) {
    const promocoes: Array<{ valor: PromocaoComercial; label: string }> = [
        { valor: 'NENHUMA', label: 'Nenhuma' },
        { valor: '1_GRATIS', label: '1º Mês Grátis' },
        { valor: '2_GRATIS', label: '2 Meses Grátis' },
        { valor: '50_OFF', label: '50% OFF no 1º' },
    ];

    return (
        <div className="bg-gray-900 rounded-3xl shadow-xl ring-1 ring-white/10 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-gray-800">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-gray-300">Cenário 100% Bandeira Verde</span>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={cenario100Verde}
                    onClick={() => onToggleCenario(!cenario100Verde)}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${cenario100Verde ? 'bg-emerald-500' : 'bg-gray-700'}`}
                >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-200 ${cenario100Verde ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>

            <div className="pt-5">
                <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Gatilho Comercial</p>
                <div className="flex flex-wrap gap-2">
                    {promocoes.map(({ valor, label }) => {
                        const ativo = promocaoAtiva === valor;
                        return (
                            <button
                                key={valor}
                                type="button"
                                onClick={() => onSelectPromocao(valor)}
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
        </div>
    );
}
```

- [ ] **Step 2: Adicionar `TooltipMes` logo após `BarraControles`**

```tsx
type PontoMes = ProjecaoAnual['dadosGrafico'][number];

function TooltipMes({ active, payload }: { active?: boolean; payload?: Array<{ payload: PontoMes }> }) {
    if (!active || !payload || payload.length === 0) return null;
    const ponto = payload[0].payload;

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl min-w-[200px]">
            <p className="text-sm font-semibold text-white mb-3">{ponto.name}</p>
            <div className="space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Sem SolarGrid</span>
                    <span className="text-gray-200 font-medium">{formatCurrency(ponto.semSolarGrid)}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-gray-400">Com SolarGrid</span>
                    <span className="text-solar-400 font-medium">{formatCurrency(ponto.comSolarGrid)}</span>
                </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
                <span className="text-xs uppercase tracking-wider text-emerald-500">Economia</span>
                <span className="text-base font-bold text-emerald-400">{formatCurrency(ponto.economia)}</span>
            </div>
        </div>
    );
}
```

- [ ] **Step 3: Adicionar `GraficoProjecao` logo após `TooltipMes`**

```tsx
function GraficoProjecao({ dados }: { dados: ProjecaoAnual['dadosGrafico'] }) {
    return (
        <div className="bg-gray-900 rounded-3xl shadow-xl ring-1 ring-white/10 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-solar-500" />
                <h3 className="text-lg font-semibold text-white">Projeção Anual</h3>
            </div>
            <div className="h-[360px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={dados}
                        barGap={4}
                        barCategoryGap="20%"
                        margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#9ca3af"
                            tickLine={false}
                            axisLine={{ stroke: '#374151' }}
                            fontSize={12}
                        />
                        <YAxis
                            stroke="#9ca3af"
                            tickLine={false}
                            axisLine={{ stroke: '#374151' }}
                            fontSize={12}
                            tickFormatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                        />
                        <Tooltip content={<TooltipMes />} cursor={{ fill: '#1f2937', opacity: 0.4 }} />
                        <Legend wrapperStyle={{ paddingTop: 12 }} iconType="circle" />
                        <Bar dataKey="semSolarGrid" name="Sem SolarGrid" fill="#475569" radius={[6, 6, 0, 0]} animationDuration={600} />
                        <Bar dataKey="comSolarGrid" name="Com SolarGrid" fill="#f59e0b" radius={[6, 6, 0, 0]} animationDuration={600} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
```

- [ ] **Step 4: Adicionar `CardEconomiaAnual` logo após `GraficoProjecao`**

```tsx
function CardEconomiaAnual({ valor }: { valor: number }) {
    return (
        <div className="bg-gradient-to-br from-emerald-950/40 to-gray-900 rounded-3xl p-8 sm:p-10 ring-1 ring-emerald-500/30 shadow-xl relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 opacity-10 pointer-events-none">
                <TrendingDown className="w-32 h-32 text-emerald-500" />
            </div>
            <div className="relative z-10 text-center">
                <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-emerald-500 mb-3 font-semibold">
                    Economia Total Estimada no Ano
                </p>
                <p className="text-4xl sm:text-5xl lg:text-6xl font-bold text-emerald-400 tabular-nums">
                    {formatCurrency(valor)}
                </p>
            </div>
        </div>
    );
}
```

- [ ] **Step 5: Verificar `tsc`**

```bash
npx tsc --noEmit
```
Esperado: limpo. Os 4 subcomponentes estão definidos mas ainda não são chamados — TS pode reclamar de "declared but never used"? Não, são funções `function` declaradas em escopo de módulo, não acionam essa regra.

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat(ui): adiciona subcomponentes locais do bloco de projecao anual"
```

---

## Task 7: Montar a seção JSX da projeção

**Files:**
- Modify: `app/page.tsx`

Esta task chama os 4 subcomponentes da Task 6 dentro do return de `App()`, em uma `<section>` full-width abaixo do grid existente.

- [ ] **Step 1: Localizar o ponto de inserção**

Procurar pelo trecho que fecha o grid principal e o container `max-w-5xl mx-auto`. Estrutura atual:

```tsx
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Inputs Section */}
          <div className="lg:col-span-4 space-y-6"> ... </div>

          {/* Results Section */}
          <div className="lg:col-span-8"> ... </div>

        </div>
      </div>
    </div>
```

Inserir a nova `<section>` entre o fechamento `</div>` do grid (a primeira linha após o último `<div>`) e o fechamento `</div>` do `max-w-5xl`.

- [ ] **Step 2: Adicionar a seção condicional logo após o `</div>` que fecha o grid**

Inserir:

```tsx
        </div>

        {resultado && projecao && !erro && (
          <section className="mt-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

      </div>
```

**Atenção:** A linha `</div>` que fecha o grid (`<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">`) é mantida. A `<section>` aparece depois dela, e o `</div>` final (que fecha `<div className="max-w-5xl mx-auto relative z-10">`) também é mantido.

- [ ] **Step 3: Verificar `tsc` e `lint`**

```bash
npx tsc --noEmit
npm run lint
```
Esperado:
- `tsc`: limpo
- `lint`: nenhum erro novo. O erro pré-existente `react-hooks/set-state-in-effect` deve estar resolvido desde a Task 3.

- [ ] **Step 4: Smoke test completo no browser**

```bash
npm run dev
```

Abrir `http://localhost:3000` e verificar:

1. **Layout:** abaixo do grid de inputs + cards + tabela, aparece a nova seção full-width.
2. **Switch:** clicar no toggle "Cenário 100% Bandeira Verde" alterna entre cinza (off) e verde (on). O gráfico re-renderiza: com on, as 12 barras "Sem SG" ficam todas iguais; com off, há degraus visíveis (Verde → Amarela → P1 → P2).
3. **Button group:** clicar em "1º Mês Grátis" destaca o botão em dourado, e a barra de Janeiro "Com SG" diminui visualmente. Trocar para "2 Meses Grátis" estende o efeito para Fevereiro. Trocar para "50% OFF" reduz Janeiro pela metade. Voltar para "Nenhuma" zera as promos.
4. **Tooltip:** passar o mouse sobre uma barra abre o card flutuante com mês, valores Sem/Com SG e economia em verde.
5. **Card anual:** o valor "ECONOMIA TOTAL ESTIMADA NO ANO" muda instantaneamente conforme os switches/buttons/inputs mudam.
6. **Reatividade do form:** mudar consumo de 1000 → 2000 deve disparar a re-renderização do gráfico inteiro.
7. **Edge case:** zerar o consumo → seção desaparece (porque `projecao === null`). Voltar para 1000 → seção reaparece.

Parar o dev server com Ctrl+C após validar.

- [ ] **Step 5: Validação numérica cruzada**

Em outro terminal (sem parar o dev server), rodar o validador:

```bash
npx tsx scripts/validar-projecao.ts
```

Confirmar que o `economiaAnualTotal` impresso no Cenário 1 (R$ 1.557,10 para Equatorial GO + 1000 kWh + 15% + mono) bate com o valor exibido no card anual da UI quando os inputs forem os mesmos (`EQUATORIAL GO`, `1000`, `15%`, `Monofásico 30 kWh`, switch OFF, promo `Nenhuma`).

- [ ] **Step 6: Commit**

```bash
git add app/page.tsx
git commit -m "feat(ui): renderiza secao da projecao anual com controles e grafico"
```

---

## Self-Review Concluída

**Spec coverage:**
- Estado `cenario100Verde` (boolean) → Task 4 Step 2 ✓
- Estado `promocaoAtiva` (PromocaoComercial) → Task 4 Step 2 ✓
- Import e chamada de `calcularProjecaoAnual` → Task 4 Steps 1 e 3 ✓
- `dadosGrafico` consumido pelo BarChart → Task 6 Step 3, Task 7 Step 2 ✓
- `economiaAnualTotal` no card → Task 6 Step 4, Task 7 Step 2 ✓
- Switch Tailwind elegante (toggle button) → Task 6 Step 1 ✓
- ButtonGroup com 4 opções e destaque visual no ativo → Task 6 Step 1 ✓
- BarChart Recharts com 12 meses × 2 barras → Task 6 Step 3 ✓
- Cor "Sem SG" cinza (slate-600 `#475569`) → Task 6 Step 3 ✓
- Cor "Com SG" solar-500 (`#f59e0b`) → Task 6 Step 3 ✓
- Tooltip customizado com nome do mês + Sem/Com SG + economia em verde destaque → Task 6 Step 2 ✓
- Card "ECONOMIA TOTAL ESTIMADA NO ANO" em caixa alta + fonte grande → Task 6 Step 4 ✓
- Reatividade instantânea (useMemo recomputa em qualquer dep change) → Task 4 Step 3 ✓
- Transições visuais suaves (animationDuration={600}, transition-colors duration-200) → Task 6 Steps 1 e 3 ✓
- Layout full-width abaixo do grid → Task 7 Step 2 ✓
- Tudo inline em app/page.tsx (sem nova pasta) → toda a estrutura ✓
- Recharts como única dep nova → Task 1 ✓
- Refator useEffect→useMemo (fix de lint) → Task 3 ✓
- `formatCurrency` em escopo de módulo (necessário para subcomponentes) → Task 2 ✓
- Imports atualizados (lucide BarChart3+Sparkles; recharts) → Task 5 ✓

**Placeholder scan:** nenhum "TBD" / "TODO" / "handle edge cases" no plano. Todos os passos de código contêm o texto exato a inserir.

**Type consistency:**
- `PromocaoComercial` (importado de `../src/core/types`) usado consistentemente em Task 4 Step 2, Task 6 Step 1, Task 6 Step 2 (via `PontoMes`).
- `ProjecaoAnual` usado em Task 4 Step 1/3, Task 6 Steps 2/3, e Task 7 Step 2.
- `SimulacaoComercial` mantido em Task 3 e estendido em Task 4 (não renomeado).
- `formatCurrency` definido em Task 2 com signature `(value: number): string` e usado consistentemente em Task 6 Steps 2 e 4 com `formatCurrency(ponto.X)` e `formatCurrency(valor)`.
- Props dos subcomponentes (`cenario100Verde`, `onToggleCenario`, `promocaoAtiva`, `onSelectPromocao`, `dados`, `valor`) batem entre as definições (Task 6) e as chamadas (Task 7).
