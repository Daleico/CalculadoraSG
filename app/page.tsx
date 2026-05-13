"use client";

import { useState, useEffect } from 'react';
import { distribuidorasData } from '../src/core/data';
import { simularComercial } from '../src/core/calculator';
import type { SimulacaoComercial } from '../src/core/types';
import { Zap, Percent, AlertCircle, Building2, TrendingDown, Lightbulb, Calculator } from 'lucide-react';

function App() {
  const [distribuidora, setDistribuidora] = useState<string>('CEMIG');
  const [desconto, setDesconto] = useState<number | string>(15);
  const [consumo, setConsumo] = useState<number | string>(1000);
  const [consumoMinimo, setConsumoMinimo] = useState<number>(30);

  const distribuidoras = Object.keys(distribuidorasData).sort();

  const [resultado, setResultado] = useState<SimulacaoComercial | null>(null);
  const [erro, setErro] = useState<string | null>(null);

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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

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
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

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
      </div>
    </div>
  );
}

export default App;
