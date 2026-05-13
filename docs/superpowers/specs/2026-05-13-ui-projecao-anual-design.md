# Design: Interface Reativa da Projeção Anual (Gráfico + Controles)

**Data:** 2026-05-13
**Status:** Aprovado — aguardando plano de implementação
**Depende de:** `2026-05-13-projecao-anual-design.md` (motor matemático, já integrado em `main`)

## Problema

O motor `calcularProjecaoAnual` está homologado mas inacessível para o usuário final. Precisamos de uma interface visual que:

1. Exponha os dois novos inputs (`cenario100Verde`, `promocaoAtiva`) com controles touch-friendly.
2. Renderize os 12 meses retornados em `dadosGrafico` como um BarChart comparativo (Sem SG vs Com SG).
3. Destaque `economiaAnualTotal` em um card de impacto.
4. Reaja instantaneamente a qualquer mudança de input — sem clique de "calcular".

Adicionalmente, o `useEffect` + `setState` atual de `app/page.tsx` dispara o warning de lint `react-hooks/set-state-in-effect` (Next 16 / React 19). O escopo deste spec inclui a refatoração para `useMemo` derivado.

## Escopo

Dois arquivos modificados, uma dependência adicionada. **Zero alteração no core matemático** (`src/core/*`).

| Arquivo | Mudança |
|---|---|
| `package.json` / `package-lock.json` | Adiciona `recharts` (latest 2.x, compatível com React 19) |
| `app/page.tsx` | Refatora `useEffect`/`setState` em `useMemo` derivado; adiciona estados `cenario100Verde` e `promocaoAtiva`; adiciona seção full-width com BarraControles + GraficoProjecao + CardEconomiaAnual; ~3 subcomponentes locais inline |

## Decisões de Design Registradas

- **Layout:** seção nova fica **full-width** dentro de `max-w-5xl mx-auto`, abaixo do `grid lg:grid-cols-12`. Não compete por espaço com a coluna de inputs.
- **Cor:** barra "Com SolarGrid" usa **solar-500** (`#f59e0b`, dourado da marca). Barra "Sem SolarGrid" usa **slate-600** (`#475569`, cinza-azulado neutro). Economia mantém **emerald** (paleta existente para savings).
- **Reatividade:** `useMemo` derivado substitui o `useEffect`/`setState` atual. Computação síncrona, sem state extra. Corrige o lint warning `react-hooks/set-state-in-effect` de quebra.
- **Componentes:** tudo inline em `app/page.tsx` como subcomponentes locais (sem nova pasta `components/`). Mantém a convenção single-file da app.
- **Animação:** Recharts traz `animationDuration={600}` nas barras. Switch e ButtonGroup têm `transition-colors duration-200`.

## Arquitetura

### 1. Dependência nova

```bash
npm install recharts
```

Recharts 2.13+ suporta React 19 (testado em produção pela comunidade). Latest 2.15+ recomendado.

### 2. Estado em `app/page.tsx`

Adicionar dois `useState`:

```ts
const [cenario100Verde, setCenario100Verde] = useState<boolean>(false);
const [promocaoAtiva, setPromocaoAtiva] = useState<PromocaoComercial>('NENHUMA');
```

Import necessário: `import type { PromocaoComercial, ProjecaoAnual } from '../src/core/types';`
Import necessário: `import { calcularProjecaoAnual } from '../src/core/calculator';`

### 3. Refatoração `useEffect` → `useMemo` derivado

**Antes** (atual, dispara lint warning):
```ts
const [resultado, setResultado] = useState<SimulacaoComercial | null>(null);
const [erro, setErro] = useState<string | null>(null);

useEffect(() => {
    try { ... setResultado(res); setErro(null); }
    catch (err) { setResultado(null); setErro(...); }
}, [distribuidora, desconto, consumo, consumoMinimo]);
```

**Depois:**
```ts
const { resultado, projecao, erro } = useMemo(() => {
    const numDesconto = Number(desconto);
    const numConsumo  = Number(consumo);

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

Remove os dois `useState` (`resultado`, `erro`) e o `useEffect` inteiro.

Tipos do retorno do `useMemo`:
- `resultado: SimulacaoComercial | null`
- `projecao: ProjecaoAnual | null`
- `erro: string | null`

### 4. Estrutura JSX da nova seção

Logo após o fechamento do `<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">` atual e antes do fechamento do container `max-w-5xl`:

```tsx
{resultado && projecao && !erro && (
    <section className="mt-8 space-y-6">
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

Os 3 componentes são funções locais definidas no mesmo `app/page.tsx`, fora do `App()` principal.

### 5. Subcomponente `BarraControles`

```tsx
function BarraControles({ cenario100Verde, onToggleCenario, promocaoAtiva, onSelectPromocao }: {
    cenario100Verde: boolean;
    onToggleCenario: (v: boolean) => void;
    promocaoAtiva: PromocaoComercial;
    onSelectPromocao: (p: PromocaoComercial) => void;
}) {
    const promocoes: Array<{ valor: PromocaoComercial; label: string }> = [
        { valor: 'NENHUMA',  label: 'Nenhuma' },
        { valor: '1_GRATIS', label: '1º Mês Grátis' },
        { valor: '2_GRATIS', label: '2 Meses Grátis' },
        { valor: '50_OFF',   label: '50% OFF no 1º' },
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
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${ativo
                                    ? 'bg-solar-500 text-gray-950 ring-2 ring-solar-400 shadow-lg shadow-solar-500/20'
                                    : 'bg-gray-800 text-gray-400 ring-1 ring-gray-700 hover:bg-gray-700 hover:text-gray-200'}`}
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

### 6. Subcomponente `GraficoProjecao`

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
                    <BarChart data={dados} barGap={4} barCategoryGap="20%" margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                        <XAxis dataKey="name" stroke="#9ca3af" tickLine={false} axisLine={{ stroke: '#374151' }} fontSize={12} />
                        <YAxis stroke="#9ca3af" tickLine={false} axisLine={{ stroke: '#374151' }} fontSize={12}
                            tickFormatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} />
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

### 7. Subcomponente `TooltipMes`

Recebe `TooltipProps<number, string>` da recharts. Acessa `payload[0]?.payload` para pegar o ponto completo do mês.

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

`formatCurrency` é a função já existente em `App()`. Para o tooltip funcionar como subcomponente, ela precisa ser **movida para fora do `App()`** (escopo de módulo). Mudança mínima, sem alterar a função.

### 8. Subcomponente `CardEconomiaAnual`

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

### 9. Imports adicionais em `app/page.tsx`

```ts
import { useState, useMemo } from 'react';  // useEffect removido
import { distribuidorasData } from '../src/core/data';
import { simularComercial, calcularProjecaoAnual } from '../src/core/calculator';
import type { SimulacaoComercial, PromocaoComercial, ProjecaoAnual } from '../src/core/types';
import { Zap, Percent, AlertCircle, Building2, TrendingDown, Lightbulb, Calculator, BarChart3, Sparkles } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
```

Novos ícones do lucide: `BarChart3`, `Sparkles`. Demais já existem.

## Estado Final do Layout

```
┌─────────────────────────────────────────────────────────────┐
│                      Header (Zap + título)                   │
├──────────┬──────────────────────────────────────────────────┤
│          │  Destaques (3 cards: atual / SG / economia)      │
│  Inputs  ├──────────────────────────────────────────────────┤
│          │  Composição da Nova Fatura SG                    │
│ (col-4)  ├──────────────────────────────────────────────────┤
│          │  Comparativo de Bandeiras Tarifárias (tabela)    │
└──────────┴──────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐ ← NOVO (full-width)
│  [○──] Cenário 100% Verde       Gatilho: [N][1G][2G][50%]  │
├─────────────────────────────────────────────────────────────┤
│  📊 Projeção Anual (BarChart 12 meses × 2 barras)           │
├─────────────────────────────────────────────────────────────┤
│  ECONOMIA TOTAL ESTIMADA NO ANO                              │
│  R$ X.XXX,XX                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Testabilidade

UI não terá testes unitários (projeto sem framework de teste). Validação:

1. **Smoke test:** rodar `npm run dev`, abrir `localhost:3000`, mudar inputs e cenários, verificar que:
   - Cenário 100% Verde toggle → barras se uniformizam visualmente
   - Cada gatilho promo → Janeiro (e Fevereiro para 2_GRATIS) tem barra "Com SG" reduzida
   - Tooltip aparece ao hover sobre uma barra
   - Card de economia anual atualiza em tempo real

2. **Visual regression:** comparar valores impressos no card e tooltip com `scripts/validar-projecao.ts` para o mesmo input (Equatorial GO + 1000 kWh + 15% + mono).

3. **Lint:** `npm run lint` não deve apresentar o warning `react-hooks/set-state-in-effect` (que está no código atual).

## Restrições

- **NÃO modificar** `src/core/*`.
- **NÃO modificar** funções existentes em `app/page.tsx` exceto `App()` (refator do useEffect→useMemo) e mover `formatCurrency` para escopo de módulo (necessário para reuso em `TooltipMes` e `CardEconomiaAnual`). `getBandeiraColor` permanece dentro de `App()`.
- **NÃO criar** pasta `components/` nem extrair arquivos novos.
- **NÃO adicionar** outras dependências além de `recharts`.

## Próximos Passos

1. Spec aprovado e commitado.
2. Plano de implementação detalhado (skill `writing-plans`).
3. Implementação via subagentes.
4. Smoke test no browser local.
5. Push origin/main → deploy Vercel.
