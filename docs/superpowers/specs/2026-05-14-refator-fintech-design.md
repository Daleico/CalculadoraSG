# Design: Refator UX Fintech — Bandeiras por Mês, Card Unificado, Bulk Edit

**Data:** 2026-05-14
**Status:** Aprovado — autorizado a seguir direto para plano e implementação
**Depende de:** `2026-05-13-projecao-anual-design.md` (motor) e `2026-05-13-ui-projecao-anual-design.md` (UI v1)

## Problema

A UI v1 da projeção anual (já em produção) tem duas limitações de usabilidade reportadas pelo time comercial:

1. **Granularidade pobre de bandeira.** Só dois cenários possíveis: 100% Verde ou misto-padrão (Jan-Jun Verde, Jul-Set Amarela, Out-Nov P1, Dez P2). Vendedores querem ajustar mês a mês para refletir a realidade da região do cliente ou conversas com a concessionária.
2. **Layout fragmentado.** Três cards visualmente separados (controles, gráfico, card anual) competem por atenção. O usuário não consegue rapidamente correlacionar "ajustei um botão → vejo o impacto agregado". Falta a sensação de "dashboard unificado" que dashboards financeiros modernos transmitem.

Adicionalmente, o gráfico atual mostra 24 barras (12 Sem SG + 12 Com SG). O time achou ruidoso — a barra "Sem SG" é referência de contexto, não a métrica que o cliente compra. Move-se para uma única série visual.

## Escopo

Refator amplo, mas concentrado. Quatro arquivos de código + um de script.

| Arquivo | Mudança |
|---|---|
| `src/core/types.ts` | + `custoTotalSemSG`, `custoTotalComSG` em `ProjecaoAnual` |
| `src/core/data.ts` | + `BANDEIRAS_PADRAO: readonly NomeBandeira[]` exportada |
| `src/core/calculator.ts` | Refator `calcularProjecaoAnual`: troca `cenario100Verde` por `bandeirasMensais`. Devolve os 2 novos totais. Remove `BANDEIRAS_CENARIO_MISTO` local (migrada para `data.ts`). |
| `scripts/validar-projecao.ts` | Atualiza 4 chamadas para nova assinatura. Imprime os novos totais. |
| `app/page.tsx` | Substitui 3 subcomponentes por 4 novos + popover de bulk-edit. Card unificado. Novo estado `bandeirasMensais` + 3 estados auxiliares de popover. |

## Quebras de Compatibilidade

- `calcularProjecaoAnual` muda assinatura: remove `cenario100Verde: boolean`, adiciona `bandeirasMensais: readonly NomeBandeira[]`. **Todos** os call sites (page.tsx + validar-projecao.ts) são atualizados na mesma feature.
- `ProjecaoAnual` ganha 2 campos obrigatórios. Como apenas `calcularProjecaoAnual` constrói esse objeto e a UI atualiza imediatamente, sem impacto externo.

## Regra de Ouro: Arredondamento Tardio (Herdada)

Mesma disciplina dos specs anteriores:
- Floats puros internamente no loop.
- Os dois novos totais (`custoTotalSemSG`, `custoTotalComSG`) somam sobre `paresBrutos` (floats brutos), arredondam **uma única vez** no fim. Não somam os valores já arredondados de `dadosGrafico`.

## Decisões de Design Registradas

- **Chaves de bandeira:** mantém Title Case existente (`'Verde' | 'Amarela' | 'Vermelha P1' | 'Vermelha P2'` — o type `NomeBandeira` já estabelecido em `data.ts`). A grafia UPPER_SNAKE_CASE do enunciado original foi descritiva, não literal.
- **Bulk-edit:** popover ancorado overlay (não modal nem drawer), com backdrop semi-transparente.
- **Seleção de meses:** grid 4×3 de botões toggle.
- **Seleção de bandeira no popover:** 4 chips coloridos (cor = bandeira).
- **Default `BANDEIRAS_PADRAO`:** vive em `src/core/data.ts` (coerente com a localização das outras constantes de domínio).
- **Gráfico:** só barra "Com SolarGrid". Bolinhas coloridas no eixo X indicam a bandeira de cada mês.
- **Tooltip:** mantém Sem/Com/Economia (campo `semSolarGrid` continua presente no `dadosGrafico` mesmo sem barra visível).
- **Rodapé unificado:** dentro do mesmo card, com separação visual via `bg-gray-950/40 border-t`.

## Arquitetura

### 1. `src/core/types.ts`

```ts
// PontoGraficoMensal e PromocaoComercial permanecem.
export interface ProjecaoAnual {
    dadosGrafico: PontoGraficoMensal[];
    economiaAnualTotal: number;
    custoTotalSemSG: number;   // NEW
    custoTotalComSG: number;   // NEW
}
```

### 2. `src/core/data.ts`

```ts
export type NomeBandeira = 'Verde' | 'Amarela' | 'Vermelha P1' | 'Vermelha P2';

export const bandeirasTarifarias: Record<NomeBandeira, number> = {
    "Verde": 0,
    "Amarela": 18.85,
    "Vermelha P1": 44.63,
    "Vermelha P2": 78.77
};

// NEW
export const BANDEIRAS_PADRAO: readonly NomeBandeira[] = [
    'Verde', 'Verde', 'Verde', 'Verde', 'Verde', 'Verde',
    'Amarela', 'Amarela', 'Amarela',
    'Vermelha P1', 'Vermelha P1',
    'Vermelha P2',
];
```

### 3. `src/core/calculator.ts`

**Remove:**

```ts
// REMOVE — migrada para data.ts
const BANDEIRAS_CENARIO_MISTO = [...] as const;
```

**Atualiza import (já tem `NomeBandeira`; adiciona se faltar):**

```ts
import { distribuidorasData, bandeirasTarifarias, type NomeBandeira } from './data';
```

**Refator de `calcularProjecaoAnual`:**

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

### 4. `scripts/validar-projecao.ts`

Substitui as 4 chamadas. Em cenários 1 e 2 (antes `cenario100Verde: true`) → `bandeirasMensais: Array(12).fill('Verde')`. Em cenários 3 e 4 (antes `cenario100Verde: false`) → `bandeirasMensais: BANDEIRAS_PADRAO` (importar de `data.ts`).

Imprimir, ao fim de cada cenário, os 2 novos totais:

```
  Economia anual total:           R$ X.XXX,XX
  Custo total sem SolarGrid:      R$ Y.YYY,YY
  Custo total com SolarGrid:      R$ Z.ZZZ,ZZ
```

Sanity check: `custoTotalSemSG − custoTotalComSG ≈ economiaAnualTotal` (delta ≤ R$ 0,03 por propagação de centavos).

### 5. Estados em `app/page.tsx`

**Substitui** `const [cenario100Verde, setCenario100Verde] = useState<boolean>(false);` por:

```ts
import { distribuidorasData, BANDEIRAS_PADRAO } from '../src/core/data';
import type { NomeBandeira } from '../src/core/data';
// ... outros imports

const [bandeirasMensais, setBandeirasMensais] = useState<readonly NomeBandeira[]>(BANDEIRAS_PADRAO);
const [isMenuBandeirasOpen, setIsMenuBandeirasOpen] = useState<boolean>(false);
const [mesesSelecionados, setMesesSelecionados] = useState<number[]>([]);
const [bandeiraSelecionadaTemp, setBandeiraSelecionadaTemp] = useState<NomeBandeira>('Verde');
```

Mantém `promocaoAtiva`. O `useMemo` muda dependências (remove `cenario100Verde`, adiciona `bandeirasMensais`) e passa `bandeirasMensais` para `calcularProjecaoAnual`. Desestrutura `custoTotalSemSG`/`custoTotalComSG` no retorno.

### 6. JSX — card unificado

Substitui a `<section>` atual (3 subcomponentes empilhados) por:

```tsx
{resultado && projecao && !erro && (
    <section className="mt-8 animate-fade-up bg-gray-900 rounded-3xl ring-1 ring-white/10 shadow-xl overflow-hidden">
        {/* Topo: controles */}
        <div className="p-6 sm:p-8 border-b border-gray-800">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <BotoesPromocao promocaoAtiva={promocaoAtiva} onSelect={setPromocaoAtiva} />
                <button
                    type="button"
                    onClick={() => setIsMenuBandeirasOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-800 text-gray-200 ring-1 ring-gray-700 hover:bg-gray-700 hover:text-white transition-all duration-200"
                >
                    <Pencil className="w-4 h-4" />
                    Personalizar Bandeiras
                </button>
            </div>
        </div>

        {/* Gráfico */}
        <div className="p-6 sm:p-8">
            <GraficoProjecao dados={projecao.dadosGrafico} bandeirasMensais={bandeirasMensais} />
        </div>

        {/* Rodapé */}
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

### 7. Subcomponentes — 4 novos + 1 mantido

#### `BotoesPromocao`

Extraído do button group atual de `BarraControles`. Mesmo estilo visual:

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

#### `GraficoProjecao` (atualizado)

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

Observações:
- Sem `<Legend>` (uma série só).
- Sem `<Bar dataKey="semSolarGrid">`.
- `radius={[4, 4, 0, 0]}` (era `[6, 6, 0, 0]`).
- `XAxis` com `tick={<TickComBandeira ... />}` e `height={40}` para acomodar a bolinha + texto.
- `interval={0}` força todos os 12 ticks a aparecerem (default omitia alguns em telas pequenas).

#### `TooltipMes` — sem mudança estrutural

Já consome `payload[0].payload` que continua tendo todos os campos. Zero mudança.

#### `RodapeProjecao`

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

Detalhes: TrendingDown decorativo mantido com opacidade reduzida (`0.07` em vez de `0.1`) porque agora o rodapé é parte do card, não card próprio.

#### `PopoverBandeiras`

Overlay fixed, fechável por: click no backdrop, botão `✕`, tecla Esc, botão "Cancelar".

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

                {/* Passo 1: meses */}
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

                {/* Passo 2: bandeira */}
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

                {/* Ações */}
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

Detalhes:
- Click no backdrop fecha (event delegation; o card interior chama `stopPropagation`).
- `Esc` fecha via listener com cleanup.
- Cada botão de mês mostra uma bolinha embaixo refletindo a bandeira ATUAL do mês — sinaliza o estado antes da edição.
- Chips de bandeira têm dot colorido + nome.
- "Aplicar Alteração" disabled quando 0 meses selecionados.

### 8. Subcomponentes removidos

- `BarraControles` (substituído por `BotoesPromocao` inline + botão "Personalizar Bandeiras")
- `CardEconomiaAnual` (substituído por `RodapeProjecao` integrado)

Os imports `Sparkles` e `Calculator` provavelmente deixam de ser usados — limpar. Adicionar imports `Pencil` (botão Personalizar) e `X` (botão fechar popover) do lucide.

### 9. Reatividade

`useMemo` agora depende de `[distribuidora, desconto, consumo, consumoMinimo, bandeirasMensais, promocaoAtiva]`. Qualquer mudança aciona recálculo síncrono. O array `bandeirasMensais` é imutável (substituído por nova referência via `setBandeirasMensais([...prev, ...])` no `onAplicar` do popover), então o `useMemo` percebe a mudança via referência.

## Testabilidade

- **Validador script** confirma os 3 totais (`economiaAnualTotal`, `custoTotalSemSG`, `custoTotalComSG`) com sanity check `sem − com ≈ economia` (delta ≤ R$ 0,03).
- **Smoke test browser:**
  1. UI carrega com `BANDEIRAS_PADRAO` aplicada — bolinhas mostram 6V/3A/2P1/1P2.
  2. Click em "Personalizar Bandeiras" → popover abre.
  3. Click em 3 meses + chip "Vermelha P2" + "Aplicar Alteração" → bolinhas desses 3 meses ficam vermelhas, gráfico atualiza, totais sobem.
  4. Click "Selecionar todos" + "Verde" + "Aplicar" → todas bolinhas verdes, gráfico achatado, totais mínimos.
  5. Botão de promo "1_GRATIS" → barra Jan encolhe, totais mudam.
  6. Esc no popover → fecha sem aplicar.
- **Lint + tsc:** clean.

## Restrições

- **NÃO** mexer em `simularComercial`, `calcularTarifaSG`, `calcularImpostos`, `normalizarNomeDistribuidora` (continuam intactos).
- **NÃO** adicionar dependências.
- **NÃO** criar pasta `components/` — tudo segue inline em `app/page.tsx`.
- A regra de arredondamento tardio é mandatória: os 2 novos totais somam sobre os floats brutos, arredondam uma vez.

## Próximos Passos

1. Spec aprovado e commitado.
2. Plano de implementação detalhado (skill `writing-plans`).
3. Execução via subagentes (skill `subagent-driven-development`).
4. Validar script + smoke test browser local.
5. Push origin/main → Vercel deploy.
