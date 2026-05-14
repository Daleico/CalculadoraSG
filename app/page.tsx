"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { distribuidorasData, BANDEIRAS_PADRAO } from '../src/core/data';
import type { NomeBandeira } from '../src/core/data';
import { simularComercial, calcularProjecaoAnual } from '../src/core/calculator';
import type { SimulacaoComercial, PromocaoComercial, ProjecaoAnual } from '../src/core/types';
import { Zap, Percent, AlertCircle, Building2, TrendingDown, Lightbulb, Calculator, BarChart3, Pencil, X, ChevronUp, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatYAxisTick(v: number): string {
  return `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

function useIsDesktop(breakpoint: number = 1024): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const apply = () => setIsDesktop(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [breakpoint]);

  return isDesktop;
}

function SwitchComparativo({
  ativo,
  onChange,
}: {
  ativo: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ativo}
      aria-label="Alternar visão comparativa de custo"
      onClick={() => onChange(!ativo)}
      className={`group inline-flex items-center gap-3 rounded-xl border px-3.5 py-2 transition-colors ${
        ativo
          ? 'border-solar-500/40 bg-solar-500/[0.07]'
          : 'border-gray-800 bg-gray-950/60 hover:border-gray-700'
      }`}
    >
      <span
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
          ativo ? 'bg-solar-500' : 'bg-gray-700'
        }`}
      >
        <span
          className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
            ativo ? 'translate-x-[18px]' : 'translate-x-[3px]'
          }`}
        />
      </span>
      <span className="text-sm font-medium text-gray-200 whitespace-nowrap">
        Ver Comparativo de Custo
      </span>
    </button>
  );
}

function CustomNumberInput({
  value,
  onChange,
  icon: Icon,
  label,
  placeholder,
  step = 1
}: {
  value: number | string;
  onChange: (val: number | string) => void;
  icon: any;
  label: string;
  placeholder: string;
  step?: number;
}) {
  const handleIncrement = () => {
    const current = Number(value) || 0;
    if (step === 1) {
       onChange(Math.floor(current) + 1);
    } else {
       onChange(current + step);
    }
  };

  const handleDecrement = () => {
    const current = Number(value) || 0;
    if (step === 1) {
       onChange(Math.ceil(current) - 1);
    } else {
       onChange(Math.max(0, current - step));
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
        <Icon className="w-4 h-4 text-solar-500" />
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="custom-number-input block w-full bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-2 focus:ring-solar-500 focus:border-solar-500 p-3.5 pr-14 shadow-inner"
          placeholder={placeholder}
          step="any"
        />
        <div className="absolute right-2 flex flex-col gap-0.5">
          <button
            type="button"
            onClick={handleIncrement}
            className="flex items-center justify-center w-8 h-5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-t-md transition-colors border border-gray-700"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={handleDecrement}
            className="flex items-center justify-center w-8 h-5 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-b-md transition-colors border border-gray-700 border-t-0"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
}


type PontoMes = ProjecaoAnual['dadosGrafico'][number];
type PontoMesEnriquecido = PontoMes & { __index: number };

function TooltipMes({
    active,
    payload,
    bandeirasMensais,
}: {
    active?: boolean;
    payload?: Array<{ payload: PontoMesEnriquecido }>;
    bandeirasMensais?: readonly NomeBandeira[];
}) {
    if (!active || !payload || payload.length === 0) return null;
    const ponto = payload[0].payload;
    const bandeira = bandeirasMensais ? bandeirasMensais[ponto.__index] : undefined;
    const corBandeira = bandeira ? CORES_BANDEIRAS[bandeira] : '#9ca3af';

    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 shadow-2xl min-w-[220px]">
            <div className="flex items-center justify-between gap-4 mb-3">
                <p className="text-sm font-semibold text-white">{ponto.name}</p>
                {bandeira && (
                    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: corBandeira }} />
                        {bandeira}
                    </span>
                )}
            </div>
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
    onToggleBandeira?: (i: number) => void;
    orientation?: 'x' | 'y';
}) {
    const { x = 0, y = 0, payload, bandeirasMensais, onToggleBandeira, orientation = 'x' } = props;
    if (!payload) return null;
    const cor = CORES_BANDEIRAS[bandeirasMensais[payload.index]];

    if (orientation === 'y') {
        return (
            <g
                transform={`translate(${x},${y})`}
                onClick={() => onToggleBandeira?.(payload.index)}
                style={{ cursor: onToggleBandeira ? 'pointer' : 'default' }}
                className="group outline-none"
            >
                <title>Clique para alterar a bandeira</title>
                <rect x={-58} y={-14} width={56} height={28} fill="transparent" />
                <text
                    x={-20}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    fill="#9ca3af"
                    fontSize={12}
                    className="group-hover:text-white transition-colors"
                >
                    {payload.value}
                </text>
                <rect
                    x={-14}
                    y={-3}
                    width={8}
                    height={6}
                    rx={2}
                    fill={cor}
                    className="group-hover:opacity-80 transition-opacity"
                />
            </g>
        );
    }

    return (
        <g
            transform={`translate(${x},${y})`}
            onClick={() => onToggleBandeira?.(payload.index)}
            style={{ cursor: onToggleBandeira ? 'pointer' : 'default' }}
            className="group outline-none"
        >
            <title>Clique para alterar a bandeira</title>
            <rect x={-20} y={0} width={40} height={32} fill="transparent" />
            <text x={0} y={0} dy={12} textAnchor="middle" fill="#9ca3af" fontSize={12} className="group-hover:text-white transition-colors">
                {payload.value}
            </text>
            <rect x={-8} y={20} width={16} height={6} rx={2} fill={cor} className="group-hover:opacity-80 transition-opacity" />
        </g>
    );
}

const COR_ECONOMIA = '#10B981';        // emerald-500 — visão padrão (economia)
const COR_SEM_SG   = '#EF4444';        // red-500    — Sem SolarGrid (custo alto, alerta)
const COR_COM_SG   = '#F59E0B';        // solar-500  — Com SolarGrid (custo reduzido)

function GraficoProjecao({
    dados,
    bandeirasMensais,
    onToggleBandeira,
    visualizacaoComparativa,
}: {
    dados: ProjecaoAnual['dadosGrafico'];
    bandeirasMensais: readonly NomeBandeira[];
    onToggleBandeira: (i: number) => void;
    visualizacaoComparativa: boolean;
}) {
    const isDesktop = useIsDesktop();

    const dadosEnriquecidos = useMemo(
        () => dados.map((d, i) => ({ ...d, __index: i })),
        [dados],
    );

    // Visão padrão (economia): domínio comprimido para destacar a variação mensal
    const economiaDomain = useMemo<[number, number]>(() => {
        const vals = dados.map((d) => d.economia);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const diff = max - min;
        if (diff < Math.max(1, max * 0.005)) {
            return [0, Math.max(max * 1.1, 1)];
        }
        const padding = Math.max(diff * 0.15, max * 0.02);
        return [Math.max(0, min - padding), max + padding];
    }, [dados]);

    // Visão comparativa (overlay): a barra mais alta sempre é semSolarGrid
    const comparativoDomain = useMemo<[number, number]>(() => {
        const max = Math.max(...dados.map((d) => d.semSolarGrid));
        return [0, max * 1.08];
    }, [dados]);

    const valueDomain = visualizacaoComparativa ? comparativoDomain : economiaDomain;

    const containerHeight = isDesktop
        ? (visualizacaoComparativa ? 420 : 380)
        : (visualizacaoComparativa ? 560 : 480);

    const tickColor = '#9ca3af';
    const gridColor = '#1f2937';
    const axisColor = '#374151';

    const tooltipNode = (
        <Tooltip
            content={<TooltipMes bandeirasMensais={bandeirasMensais} />}
            cursor={{ fill: '#1f2937', opacity: 0.4 }}
        />
    );

    const titleNode = (
        <div className="flex items-center justify-between gap-3 mb-5 lg:mb-6">
            <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-solar-500" />
                <h3 className="text-base lg:text-lg font-semibold text-white">Projeção Anual</h3>
            </div>
            {visualizacaoComparativa ? (
                <span className="hidden sm:inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500">
                    <span
                        aria-hidden
                        className="inline-block w-2.5 h-2.5 rounded-sm ring-1 ring-white/10"
                        style={{ backgroundColor: COR_SEM_SG }}
                    />
                    <span>Sem</span>
                    <span className="text-gray-600 normal-case tracking-normal">vs.</span>
                    <span
                        aria-hidden
                        className="inline-block w-2.5 h-2.5 rounded-sm ring-1 ring-white/10"
                        style={{ backgroundColor: COR_COM_SG }}
                    />
                    <span>Com SolarGrid</span>
                </span>
            ) : (
                <span className="hidden sm:inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-gray-500">
                    <span
                        aria-hidden
                        className="inline-block w-2.5 h-2.5 rounded-sm ring-1 ring-white/10"
                        style={{ backgroundColor: COR_ECONOMIA }}
                    />
                    <span>Economia mensal</span>
                </span>
            )}
        </div>
    );

    // DESKTOP (lg+) — barras verticais, meses no XAxis
    if (isDesktop) {
        return (
            <div>
                {titleNode}
                <div style={{ height: containerHeight }} className="w-full">
                    <ResponsiveContainer width="100%" height="100%" className="focus:outline-none" style={{ outline: 'none' }}>
                        <BarChart
                            data={dadosEnriquecidos}
                            margin={{ top: 16, right: 12, bottom: 16, left: 4 }}
                            barCategoryGap={visualizacaoComparativa ? '22%' : '16%'}
                            barGap={4}
                            className="focus:outline-none"
                            style={{ outline: 'none' }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                            <XAxis
                                dataKey="name"
                                stroke={tickColor}
                                tickLine={false}
                                axisLine={{ stroke: axisColor }}
                                interval={0}
                                height={40}
                                tick={
                                    <TickComBandeira
                                        bandeirasMensais={bandeirasMensais}
                                        onToggleBandeira={onToggleBandeira}
                                        orientation="x"
                                    />
                                }
                            />
                            <YAxis
                                stroke={tickColor}
                                tickLine={false}
                                axisLine={{ stroke: axisColor }}
                                fontSize={12}
                                tickFormatter={formatYAxisTick}
                                domain={valueDomain}
                            />
                            {tooltipNode}
                            {visualizacaoComparativa ? (
                                <>
                                    {/* Maior — Sem SolarGrid (custo alto, em vermelho) */}
                                    <Bar
                                        dataKey="semSolarGrid"
                                        name="Sem SolarGrid"
                                        fill={COR_SEM_SG}
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={500}
                                    />
                                    {/* Menor — Com SolarGrid (custo reduzido, ao lado) */}
                                    <Bar
                                        dataKey="comSolarGrid"
                                        name="Com SolarGrid"
                                        fill={COR_COM_SG}
                                        radius={[4, 4, 0, 0]}
                                        animationDuration={500}
                                    />
                                </>
                            ) : (
                                <Bar dataKey="economia" name="Economia" fill={COR_ECONOMIA} radius={[6, 6, 0, 0]} animationDuration={500} />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        );
    }

    // MOBILE / TABLET (<lg) — barras horizontais, meses no YAxis
    return (
        <div>
            {titleNode}
            <div style={{ height: containerHeight }} className="w-full">
                <ResponsiveContainer width="100%" height="100%" className="focus:outline-none" style={{ outline: 'none' }}>
                    <BarChart
                        data={dadosEnriquecidos}
                        layout="vertical"
                        margin={{ top: 8, right: 16, bottom: 16, left: 4 }}
                        barCategoryGap={visualizacaoComparativa ? '20%' : '14%'}
                        barGap={3}
                        className="focus:outline-none"
                        style={{ outline: 'none' }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                        <XAxis
                            type="number"
                            stroke={tickColor}
                            tickLine={false}
                            axisLine={{ stroke: axisColor }}
                            fontSize={11}
                            tickFormatter={formatYAxisTick}
                            domain={valueDomain}
                        />
                        <YAxis
                            type="category"
                            dataKey="name"
                            stroke={tickColor}
                            tickLine={false}
                            axisLine={{ stroke: axisColor }}
                            interval={0}
                            width={60}
                            tick={
                                <TickComBandeira
                                    bandeirasMensais={bandeirasMensais}
                                    onToggleBandeira={onToggleBandeira}
                                    orientation="y"
                                />
                            }
                        />
                        {tooltipNode}
                        {visualizacaoComparativa ? (
                            <>
                                {/* Maior — Sem SolarGrid (custo alto, em vermelho) */}
                                <Bar
                                    dataKey="semSolarGrid"
                                    name="Sem SolarGrid"
                                    fill={COR_SEM_SG}
                                    radius={[0, 4, 4, 0]}
                                    animationDuration={500}
                                />
                                {/* Menor — Com SolarGrid (custo reduzido, abaixo) */}
                                <Bar
                                    dataKey="comSolarGrid"
                                    name="Com SolarGrid"
                                    fill={COR_COM_SG}
                                    radius={[0, 4, 4, 0]}
                                    animationDuration={500}
                                />
                            </>
                        ) : (
                            <Bar dataKey="economia" name="Economia" fill={COR_ECONOMIA} radius={[0, 6, 6, 0]} animationDuration={500} />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function RodapeProjecao({ economiaAnualTotal, custoTotalSemSG, custoTotalComSG }: {
    economiaAnualTotal: number;
    custoTotalSemSG: number;
    custoTotalComSG: number;
}) {
    return (
        <div className="bg-gray-950/40 p-5 sm:p-6 lg:p-8 border-t border-gray-800 text-center relative overflow-hidden">
            <div className="absolute -bottom-4 -right-4 opacity-[0.07] pointer-events-none">
                <TrendingDown className="w-32 h-32 text-emerald-500" />
            </div>
            <div className="relative z-10">
                <p className="text-[10px] sm:text-xs lg:text-sm uppercase tracking-[0.2em] text-emerald-500 font-semibold mb-2 sm:mb-3">
                    Economia Total Estimada no Ano
                </p>
                <p className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-emerald-400 tabular-nums mb-3 sm:mb-4">
                    {formatCurrency(economiaAnualTotal)}
                </p>
                <p className="text-[11px] sm:text-xs lg:text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-0">
                    <span>
                        Custo total sem a SolarGrid: <span className="text-gray-300 font-medium">{formatCurrency(custoTotalSemSG)}</span>
                    </span>
                    <span className="hidden sm:inline mx-2 text-gray-700">|</span>
                    <span>
                        Custo total com a SolarGrid: <span className="text-solar-400 font-medium">{formatCurrency(custoTotalComSG)}</span>
                    </span>
                </p>
            </div>
        </div>
    );
}

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
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        dialogRef.current?.focus();
    }, []);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        const onTabKey = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            const focusables = dialog.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            if (focusables.length === 0) return;
            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            const active = document.activeElement as HTMLElement | null;
            if (e.shiftKey) {
                if (active === first || !dialog.contains(active)) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };

        dialog.addEventListener('keydown', onTabKey);
        return () => dialog.removeEventListener('keydown', onTabKey);
    }, []);

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
                ref={dialogRef}
                tabIndex={-1}
                role="dialog"
                aria-modal="true"
                aria-label="Personalizar bandeiras tarifárias"
                onClick={(e) => e.stopPropagation()}
                className="bg-gray-900 rounded-3xl shadow-2xl ring-1 ring-white/10 max-w-lg w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto focus:outline-none"
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
                    <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">1. Selecione a Bandeira</p>
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

                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs uppercase tracking-widest text-gray-500">2. Aplique aos Meses</p>
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

function App() {
  const [distribuidora, setDistribuidora] = useState<string>('CEMIG');
  const [desconto, setDesconto] = useState<number | string>(15);
  const [consumo, setConsumo] = useState<number | string>(1000);
  const [consumoMinimo, setConsumoMinimo] = useState<number>(30);
  const [bandeirasMensais, setBandeirasMensais] = useState<readonly NomeBandeira[]>(BANDEIRAS_PADRAO);
  const [promocaoAtiva, setPromocaoAtiva] = useState<PromocaoComercial>('NENHUMA');
  const [isMenuBandeirasOpen, setIsMenuBandeirasOpen] = useState<boolean>(false);
  const [mesesSelecionados, setMesesSelecionados] = useState<number[]>([]);
  const [bandeiraSelecionadaTemp, setBandeiraSelecionadaTemp] = useState<NomeBandeira>('Verde');
  const [visualizacaoComparativa, setVisualizacaoComparativa] = useState<boolean>(false);

  const triggerPopoverRef = useRef<HTMLButtonElement>(null);

  const handleClosePopover = useCallback(() => {
    setMesesSelecionados([]);
    setBandeiraSelecionadaTemp('Verde');
    setIsMenuBandeirasOpen(false);
    requestAnimationFrame(() => triggerPopoverRef.current?.focus());
  }, []);

  const handleAplicarBandeiras = useCallback((meses: number[], bandeira: NomeBandeira) => {
    setBandeirasMensais((prev) => {
      const next = [...prev];
      for (const i of meses) next[i] = bandeira;
      return next;
    });
    setMesesSelecionados([]);
    setBandeiraSelecionadaTemp('Verde');
    setIsMenuBandeirasOpen(false);
    requestAnimationFrame(() => triggerPopoverRef.current?.focus());
  }, []);

  const handleToggleBandeiraMes = useCallback((mesIndex: number) => {
    const TODAS: readonly NomeBandeira[] = ['Verde', 'Amarela', 'Vermelha P1', 'Vermelha P2'];
    setBandeirasMensais(prev => {
      const next = [...prev];
      const indexAtual = TODAS.indexOf(next[mesIndex]);
      next[mesIndex] = TODAS[(indexAtual + 1) % TODAS.length];
      return next;
    });
  }, []);

  const distribuidoras = Object.keys(distribuidorasData).sort();


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

  const getBandeiraColor = (nome: string) => {
    if (nome.includes('Verde')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (nome.includes('Amarela')) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    if (nome.includes('Vermelha P1')) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    if (nome.includes('Vermelha P2')) return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-gray-400 bg-gray-800';
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 relative bg-gray-950 font-sans">
      <style dangerouslySetInnerHTML={{__html: `
        .custom-number-input::-webkit-inner-spin-button, 
        .custom-number-input::-webkit-outer-spin-button { 
          -webkit-appearance: none; 
          margin: 0; 
        }
        .custom-number-input {
          -moz-appearance: textfield;
        }
        .recharts-wrapper, .recharts-wrapper *, .recharts-surface, .recharts-surface * {
          outline: none !important;
        }
      `}} />
      {/* Background Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-solar-500 rounded-full mix-blend-screen filter blur-[120px] opacity-10"></div>
        <div className="absolute top-1/3 -right-24 w-[400px] h-[400px] bg-orange-600 rounded-full mix-blend-screen filter blur-[100px] opacity-10"></div>
      </div>

      <div className="max-w-5xl mx-auto relative z-10">

        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-gray-900 rounded-2xl shadow-xl ring-1 ring-white/10">
              <Zap className="w-8 h-8 text-solar-500" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">Simulador SolarGrid</h1>
          <p className="text-gray-400 max-w-xl mx-auto">Calcule instantaneamente sua economia mensal livre de bandeiras tarifárias.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Inputs Section */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gray-900 rounded-3xl shadow-xl ring-1 ring-white/10 p-6 sm:p-8 backdrop-blur-sm">
              <h2 className="text-lg font-semibold text-white mb-6 border-b border-gray-800 pb-2">Configurações</h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-solar-500" />
                    Distribuidora
                  </label>
                  <select
                    value={distribuidora}
                    onChange={(e) => setDistribuidora(e.target.value)}
                    className="block w-full bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-2 focus:ring-solar-500 focus:border-solar-500 p-3.5 appearance-none shadow-inner"
                  >
                    {distribuidoras.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-solar-500" />
                    Tipo de Conexão (Mínimo)
                  </label>
                  <select
                    value={consumoMinimo}
                    onChange={(e) => setConsumoMinimo(Number(e.target.value))}
                    className="block w-full bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-2 focus:ring-solar-500 focus:border-solar-500 p-3.5 appearance-none shadow-inner"
                  >
                    <option value={30}>Monofásico (30 kWh)</option>
                    <option value={50}>Bifásico (50 kWh)</option>
                    <option value={100}>Trifásico (100 kWh)</option>
                  </select>
                </div>

                <CustomNumberInput
                  label="Consumo Médio (kWh)"
                  icon={Lightbulb}
                  value={consumo}
                  onChange={setConsumo}
                  placeholder="Ex: 1000"
                  step={100}
                />

                <CustomNumberInput
                  label="Desconto Negociado (%)"
                  icon={Percent}
                  value={desconto}
                  onChange={setDesconto}
                  placeholder="Ex: 15"
                  step={1}
                />
              </div>

              {erro && (
                <div className="mt-6 p-3 bg-red-950/50 border border-red-900 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                  <p className="text-sm text-red-200">{erro}</p>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="lg:col-span-8">
            {resultado && !erro ? (
              <div className="space-y-8 animate-fade-up">

                {/* Destaques (Bandeira Verde) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-gray-900 rounded-2xl p-6 ring-1 ring-white/5 shadow-lg">
                    <p className="text-sm font-medium text-gray-400 mb-1">Fatura Atual</p>
                    <p className="text-3xl font-bold text-gray-200">{formatCurrency(resultado.faturaAtualBase)}</p>
                    <p className="text-xs text-gray-500 mt-2">Bandeira Verde (Sem acréscimos)</p>
                  </div>

                  <div className="bg-gradient-to-br from-solar-600/20 to-gray-900 rounded-2xl p-6 ring-1 ring-solar-500/30 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Zap className="w-16 h-16 text-solar-500" />
                    </div>
                    <p className="text-sm font-medium text-solar-400 mb-1">Nova Fatura SolarGrid</p>
                    <p className="text-3xl font-bold text-white relative z-10">{formatCurrency(resultado.faturaSGBase)}</p>
                    <p className="text-xs text-gray-400 mt-2 relative z-10">Blindada contra bandeiras</p>
                  </div>

                  <div className="bg-emerald-950/30 rounded-2xl p-6 ring-1 ring-emerald-500/30 shadow-lg relative overflow-hidden">
                    <div className="absolute -bottom-2 -right-2 p-2 opacity-10">
                      <TrendingDown className="w-20 h-20 text-emerald-500" />
                    </div>
                    <p className="text-sm font-medium text-emerald-500 mb-1">Economia Mensal</p>
                    <p className="text-3xl font-bold text-emerald-400 relative z-10">{formatCurrency(resultado.economiaBase)}</p>
                    <p className="text-xs text-emerald-600/70 mt-2 relative z-10">Dinheiro de volta no bolso</p>
                  </div>
                </div>

                {/* Composição do Faturamento (Recibo) */}
                <div className="bg-gray-900 rounded-3xl shadow-xl ring-1 ring-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-solar-500" />
                    Composição da Nova Fatura SG
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-gray-400 text-sm">Energia Injetada SolarGrid</span>
                      <span className="text-gray-200 font-medium">{resultado.detalhesFatura.energiaInjetada.toFixed(0)} kWh</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-gray-400 text-sm">Tarifa SG (Valor Unitário)</span>
                      <span className="text-solar-400 font-medium">{resultado.tarifaSG_kWh.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 6, maximumFractionDigits: 6 })} / kWh</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-gray-400 text-sm">Fatura SG (Referente à injeção)</span>
                      <span className="text-solar-400 font-medium">{formatCurrency(resultado.detalhesFatura.faturaSG)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-gray-400 text-sm">Custo de Disponibilidade (Mínimo)</span>
                      <span className="text-gray-300 font-medium">{formatCurrency(resultado.detalhesFatura.custoMinimoConcessionaria)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-800">
                      <span className="text-gray-400 text-sm">Impostos Não Isentos (ICMS + PIS)</span>
                      <span className="text-gray-300 font-medium">{formatCurrency(resultado.detalhesFatura.impostosConcessionaria)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-200 font-semibold">Total a Pagar (Novo Valor)</span>
                      <span className="text-white font-bold text-xl">{formatCurrency(resultado.faturaSGBase)}</span>
                    </div>
                  </div>
                </div>

                {/* Tabela de Cenários */}
                <div className="bg-gray-900 rounded-3xl shadow-xl ring-1 ring-white/10 overflow-hidden">
                  <div className="p-6 border-b border-gray-800">
                    <h2 className="text-lg font-semibold text-white">Comparativo de Bandeiras Tarifárias</h2>
                    <p className="text-sm text-gray-400 mt-1">Veja sua economia disparar nas bandeiras vermelhas.</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-950/50 text-gray-400 text-xs uppercase tracking-wider">
                          <th className="p-4 font-medium">Bandeira</th>
                          <th className="p-4 font-medium">Concessionária</th>
                          <th className="p-4 font-medium">SolarGrid</th>
                          <th className="p-4 font-medium">Economia</th>
                          <th className="p-4 font-medium text-right">Desconto %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {resultado.cenarios.map((cenario) => (
                          <tr key={cenario.nome} className="hover:bg-gray-800/30 transition-colors">
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getBandeiraColor(cenario.nome)}`}>
                                {cenario.nome}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-gray-300">
                              {formatCurrency(cenario.faturaConcessionaria)}
                            </td>
                            <td className="p-4 text-sm font-medium text-solar-400">
                              {formatCurrency(cenario.faturaSG)}
                            </td>
                            <td className="p-4 text-sm text-emerald-400 font-medium">
                              {formatCurrency(cenario.economia)}
                            </td>
                            <td className="p-4 text-sm font-semibold text-emerald-400 text-right">
                              {cenario.descontoPercentualEquivalente.toFixed(2)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full min-h-[400px] bg-gray-900/50 rounded-3xl border border-dashed border-gray-800 flex flex-col items-center justify-center text-center p-8">
                <Zap className="w-12 h-12 text-gray-700 mb-4" />
                <p className="text-gray-400 font-medium">Aguardando dados da simulação</p>
                <p className="text-sm text-gray-500 mt-2">Preencha o consumo para visualizar os comparativos</p>
              </div>
            )}
          </div>

        </div>

        {resultado && projecao && !erro && (
          <section className="mt-8 animate-fade-up bg-gray-900 rounded-3xl ring-1 ring-white/10 shadow-xl overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-gray-800">
              <div className="flex flex-wrap items-start gap-x-6 gap-y-4 lg:items-center lg:justify-between">
                <BotoesPromocao promocaoAtiva={promocaoAtiva} onSelect={setPromocaoAtiva} />
                <div className="flex flex-wrap items-center gap-2 lg:gap-3">
                  <SwitchComparativo
                    ativo={visualizacaoComparativa}
                    onChange={setVisualizacaoComparativa}
                  />
                  <button
                    ref={triggerPopoverRef}
                    type="button"
                    onClick={() => setIsMenuBandeirasOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-gray-800 text-gray-200 ring-1 ring-gray-700 hover:bg-gray-700 hover:text-white transition-all duration-200"
                  >
                    <Pencil className="w-4 h-4" />
                    Personalizar Bandeiras
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 lg:p-6">
              <GraficoProjecao
                dados={projecao.dadosGrafico}
                bandeirasMensais={bandeirasMensais}
                onToggleBandeira={handleToggleBandeiraMes}
                visualizacaoComparativa={visualizacaoComparativa}
              />
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
            onAplicar={handleAplicarBandeiras}
            onClose={handleClosePopover}
          />
        )}

      </div>
    </div>
  );
}

export default App;
