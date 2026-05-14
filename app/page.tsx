"use client";

import { useState, useMemo } from 'react';
import { distribuidorasData } from '../src/core/data';
import { simularComercial, calcularProjecaoAnual } from '../src/core/calculator';
import type { SimulacaoComercial, PromocaoComercial, ProjecaoAnual } from '../src/core/types';
import { Zap, Percent, AlertCircle, Building2, TrendingDown, Lightbulb, Calculator, BarChart3, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatYAxisTick(v: number): string {
  return `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
}

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
                    aria-label="Ativar Cenário 100% Bandeira Verde"
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
                                aria-pressed={ativo}
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

function GraficoProjecao({ dados }: { dados: ProjecaoAnual['dadosGrafico'] }) {
    return (
        <div className="bg-gray-900 rounded-3xl shadow-xl ring-1 ring-white/10 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-solar-500" />
                <h3 className="text-lg font-semibold text-white">Projeção Anual</h3>
            </div>
            <div className="h-[280px] sm:h-[340px] md:h-[360px] w-full">
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
                            tickFormatter={formatYAxisTick}
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

function App() {
  const [distribuidora, setDistribuidora] = useState<string>('CEMIG');
  const [desconto, setDesconto] = useState<number | string>(15);
  const [consumo, setConsumo] = useState<number | string>(1000);
  const [consumoMinimo, setConsumoMinimo] = useState<number>(30);
  const [cenario100Verde, setCenario100Verde] = useState<boolean>(false);
  const [promocaoAtiva, setPromocaoAtiva] = useState<PromocaoComercial>('NENHUMA');

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

  const getBandeiraColor = (nome: string) => {
    if (nome.includes('Verde')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (nome.includes('Amarela')) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    if (nome.includes('Vermelha P1')) return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    if (nome.includes('Vermelha P2')) return 'text-red-400 bg-red-500/10 border-red-500/20';
    return 'text-gray-400 bg-gray-800';
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 relative bg-gray-950 font-sans">
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

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-solar-500" />
                    Consumo Médio (kWh)
                  </label>
                  <input
                    type="number"
                    value={consumo}
                    onChange={(e) => setConsumo(e.target.value)}
                    className="block w-full bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-2 focus:ring-solar-500 focus:border-solar-500 p-3.5 shadow-inner"
                    placeholder="Ex: 1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Percent className="w-4 h-4 text-solar-500" />
                    Desconto Negociado (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={desconto}
                    onChange={(e) => setDesconto(e.target.value)}
                    className="block w-full bg-gray-950 border border-gray-800 text-white rounded-xl focus:ring-2 focus:ring-solar-500 focus:border-solar-500 p-3.5 shadow-inner"
                    placeholder="Ex: 15"
                  />
                </div>
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

      </div>
    </div>
  );
}

export default App;
