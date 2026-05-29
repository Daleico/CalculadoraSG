"use client";

/* eslint-disable @next/next/no-img-element */

import { Suspense, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { distribuidorasData, BANDEIRAS_PADRAO } from '../../src/core/data';
import { simularComercial, calcularProjecaoAnual } from '../../src/core/calculator';
import type { PromocaoComercial } from '../../src/core/types';
import './proposta.css';

// ---------- helpers (portados do gerador HTML) ----------
function parseMoney(v: string): number {
  if (v == null) return NaN;
  let s = String(v).trim().replace(/[^0-9.,]/g, '');
  if (s === '') return NaN;
  if (s.includes('.') && s.includes(',')) { s = s.replace(/\./g, '').replace(',', '.'); }
  else if (s.includes(',')) { s = s.replace(',', '.'); }
  else if ((s.match(/\./g) || []).length > 1) { s = s.replace(/\./g, ''); }
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}
const fmtBRL = (n: number) => isNaN(n) ? '—' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number) => isNaN(n) ? '—' : n.toLocaleString('pt-BR', { maximumFractionDigits: 0 });

function BigBRL({ n }: { n: number }) {
  if (isNaN(n)) return <>R$ —</>;
  const i = Math.floor(n);
  const c = Math.round((n - i) * 100).toString().padStart(2, '0');
  return <>R$ {i.toLocaleString('pt-BR')}<span className="u">,{c}</span></>;
}

type Benef = 'nenhum' | '50' | 'gratis';

function benefToPromo(b: Benef): PromocaoComercial {
  if (b === '50') return '50_OFF';
  if (b === 'gratis') return '1_GRATIS';
  return 'NENHUMA';
}

function plus7(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().slice(0, 10);
}

function formatDateBR(v: string): string {
  if (!v) return '—';
  const [y, m, d] = v.split('-');
  return `${d}/${m}/${y}`;
}

function GeradorPropostaInner() {
  const distribuidoras = useMemo(() => Object.keys(distribuidorasData).sort(), []);
  const sp = useSearchParams();

  // --- campos básicos (prefill via URL vindo do simulador) ---
  const [cliente, setCliente] = useState('');
  const [distribuidora, setDistribuidora] = useState(() => {
    const d = sp.get('distribuidora');
    return d && d.toUpperCase() in distribuidorasData ? d.toUpperCase() : 'CEMIG';
  });
  const [consumo, setConsumo] = useState(() => sp.get('consumo')?.trim() || '3000');
  const [desconto, setDesconto] = useState(() => sp.get('desconto')?.trim() || '20');
  const [fidelidade, setFidelidade] = useState('12');
  const [benef, setBenef] = useState<Benef>('nenhum');
  const [consultor, setConsultor] = useState('');
  const [validade, setValidade] = useState(() => plus7());
  const [blindagem, setBlindagem] = useState(true);

  // --- edição avançada (override manual da economia) ---
  const [avancado, setAvancado] = useState(false);
  const [manualAno, setManualAno] = useState('');
  const [manualMes, setManualMes] = useState('');
  const [manualPri, setManualPri] = useState('');

  // --- toast ---
  const [toast, setToast] = useState<{ msg: string; err: boolean } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = useCallback((msg: string, err = false) => {
    setToast({ msg, err });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const cardRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  // --- cálculo automático (reusa a lógica do simulador) ---
  const calc = useMemo<{ ano: number; mes: number; pri: number; erro: string | null }>(() => {
    const nd = Number(desconto);
    const nc = Number(consumo);
    const consumoMinimo = 30;

    if (!distribuidora) {
      return { ano: NaN, mes: NaN, pri: NaN, erro: 'Selecione uma distribuidora.' };
    }
    if (isNaN(nd) || isNaN(nc) || nc <= 0 || nd < 0) {
      return { ano: NaN, mes: NaN, pri: NaN, erro: 'Preencha um consumo e desconto válidos.' };
    }
    if (nc <= consumoMinimo) {
      return { ano: NaN, mes: NaN, pri: NaN, erro: 'O consumo deve ser maior que o mínimo (30 kWh).' };
    }

    try {
      const resultado = simularComercial(distribuidora, nd, nc, consumoMinimo);
      const projecao = calcularProjecaoAnual({
        distribuidora,
        consumoKwh: nc,
        descontoPercentual: nd,
        consumoMinimo,
        bandeirasMensais: BANDEIRAS_PADRAO,
        promocaoAtiva: benefToPromo(benef),
      });
      return {
        ano: projecao.economiaAnualTotal,
        mes: resultado.economiaBase,
        pri: projecao.dadosGrafico[0].economia,
        erro: null,
      };
    } catch (err: unknown) {
      return { ano: NaN, mes: NaN, pri: NaN, erro: err instanceof Error ? err.message : 'Erro ao calcular.' };
    }
  }, [distribuidora, consumo, desconto, benef]);

  // valores que vão para o card: manual (avançado) ou calculado
  const anoFinal = avancado ? parseMoney(manualAno) : calc.ano;
  const mesFinal = avancado ? parseMoney(manualMes) : calc.mes;
  const priFinal = avancado ? parseMoney(manualPri) : calc.pri;

  const handleToggleAvancado = (on: boolean) => {
    if (on) {
      setManualAno(!isNaN(calc.ano) ? fmtBRL(calc.ano) : '');
      setManualMes(!isNaN(calc.mes) ? fmtBRL(calc.mes) : '');
      setManualPri(!isNaN(calc.pri) ? fmtBRL(calc.pri) : '');
    }
    setAvancado(on);
  };

  const handleLimpar = () => {
    setCliente('');
    setConsultor('');
    setBenef('nenhum');
    setBlindagem(false);
    setAvancado(false);
    setValidade(plus7());
    showToast('Formulário limpo');
  };

  // --- selos / badges ---
  const badges = useMemo(() => {
    const out: Array<{ t: string; hot?: boolean }> = [];
    if (blindagem) out.push({ t: 'Blindagem de bandeira tarifária' });
    if (benef !== 'nenhum') {
      let t: string;
      if (!isNaN(priFinal)) t = `R$ ${fmtBRL(priFinal)} de economia no 1º mês`;
      else t = benef === '50' ? '50% OFF na 1ª fatura' : '1ª fatura grátis';
      out.push({ t, hot: true });
    }
    out.push({ t: 'Sem obras · Sem investimento' });
    return out;
  }, [blindagem, benef, priFinal]);

  // --- exportação (html2canvas) ---
  const buildCanvas = useCallback(async () => {
    if (document.fonts && document.fonts.ready) {
      try { await document.fonts.ready; } catch { /* ignore */ }
    }
    const html2canvas = (await import('html2canvas')).default;
    const wrap = wrapRef.current!;
    const card = cardRef.current!;
    const prev = wrap.style.transform;
    wrap.style.transform = 'none';
    try {
      return await html2canvas(card, {
        scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
        width: 1080, height: 1440, windowWidth: 1080, windowHeight: 1440,
      });
    } finally {
      wrap.style.transform = prev;
    }
  }, []);

  const fileName = useCallback(() => {
    const c = cliente.trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') || 'proposta';
    return `SolarGrid_${c}.png`;
  }, [cliente]);

  const downloadBlob = useCallback((blob: Blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName();
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1500);
  }, [fileName]);

  const [busy, setBusy] = useState<null | 'copy' | 'down'>(null);

  const copyImg = useCallback(async () => {
    setBusy('copy');
    try {
      const canvas = await buildCanvas();
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
      if (!blob) throw new Error('blob nulo');
      if (navigator.clipboard && 'ClipboardItem' in window) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showToast('Imagem copiada! Cole no WhatsApp 📋');
      } else {
        downloadBlob(blob);
        showToast('Cópia não suportada — baixei o PNG', true);
      }
    } catch (e) {
      console.error(e);
      showToast('Não consegui copiar. Tente "Baixar PNG"', true);
    } finally {
      setBusy(null);
    }
  }, [buildCanvas, downloadBlob, showToast]);

  const downImg = useCallback(async () => {
    setBusy('down');
    try {
      const canvas = await buildCanvas();
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'));
      if (!blob) throw new Error('blob nulo');
      downloadBlob(blob);
      showToast('PNG baixado!');
    } catch (e) {
      console.error(e);
      showToast('Erro ao gerar PNG', true);
    } finally {
      setBusy(null);
    }
  }, [buildCanvas, downloadBlob, showToast]);

  // --- valores derivados para o card ---
  const ndesc = desconto.trim().replace('%', '');
  const consumoNum = Number(consumo);

  return (
    <div className="sg-proposta">
      {/* Montserrat em pesos estáticos — necessária para o card exportado bater com o layout */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="app">

        {/* TOPBAR */}
        <div className="topbar">
          <div className="brand">
            <img src="/sg-logo.png" alt="SolarGrid" />
            <div className="pipe" />
            <h1>Gerador de Proposta · WhatsApp</h1>
          </div>
          <Link className="back" href="/">← Voltar ao Simulador</Link>
        </div>

        {/* LANÇAMENTO */}
        <div className="panel">
          <h2>Lançamento da proposta</h2>
          <div className="grid">
            <div className="field full">
              <label>Nome do cliente</label>
              <input type="text" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Ex: João Silva" />
            </div>

            <div className="field">
              <label>Distribuidora</label>
              <select value={distribuidora} onChange={(e) => setDistribuidora(e.target.value)}>
                {distribuidoras.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Consumo médio mensal</label>
              <div className="moneywrap">
                <span>kWh</span>
                <input type="text" value={consumo} onChange={(e) => setConsumo(e.target.value)} placeholder="3000" style={{ paddingLeft: 48 }} />
              </div>
            </div>

            <div className="field">
              <label>Desconto na tarifa líquida (%)</label>
              <input type="text" value={desconto} onChange={(e) => setDesconto(e.target.value)} placeholder="20" />
            </div>
            <div className="field">
              <label>Fidelidade (meses)</label>
              <select value={fidelidade} onChange={(e) => setFidelidade(e.target.value)}>
                <option value="12">12 meses</option>
                <option value="24">24 meses</option>
                <option value="36">36 meses</option>
                <option value="0">Sem fidelidade</option>
              </select>
            </div>

            <div className="field full">
              <label>Benefício comercial <span className="sub">(vira selo de &quot;economia no 1º mês&quot;)</span></label>
              <select value={benef} onChange={(e) => setBenef(e.target.value as Benef)}>
                <option value="nenhum">Nenhum</option>
                <option value="50">50% na primeira fatura</option>
                <option value="gratis">Primeira fatura grátis</option>
              </select>
            </div>

            {/* Economia calculada automaticamente (modo básico) */}
            {!avancado && (
              <div className="calcbox">
                <div className="ci">
                  <div className="k">Economia anual</div>
                  <div className="v hi">{isNaN(calc.ano) ? '—' : `R$ ${fmtBRL(calc.ano)}`}</div>
                </div>
                <div className="ci">
                  <div className="k">Economia mensal</div>
                  <div className="v">{isNaN(calc.mes) ? '—' : `R$ ${fmtBRL(calc.mes)}`}</div>
                </div>
                <div className="ci">
                  <div className="k">Economia 1º mês</div>
                  <div className="v">{isNaN(calc.pri) ? '—' : `R$ ${fmtBRL(calc.pri)}`}</div>
                </div>
              </div>
            )}

            {/* Campos de override manual (modo avançado) */}
            {avancado && (
              <>
                <div className="field">
                  <label>Economia anual <span className="sub">(manual)</span></label>
                  <div className="moneywrap"><span>R$</span><input type="text" value={manualAno} onChange={(e) => setManualAno(e.target.value)} placeholder="6.498,38" /></div>
                </div>
                <div className="field">
                  <label>Economia mensal <span className="sub">(manual)</span></label>
                  <div className="moneywrap"><span>R$</span><input type="text" value={manualMes} onChange={(e) => setManualMes(e.target.value)} placeholder="489,19" /></div>
                </div>
                <div className="field full">
                  <label>Economia no 1º mês <span className="sub">(manual)</span></label>
                  <div className="moneywrap"><span>R$</span><input type="text" value={manualPri} onChange={(e) => setManualPri(e.target.value)} placeholder="1.117,24" /></div>
                </div>
              </>
            )}

            <div className="field">
              <label>Nome do consultor</label>
              <input type="text" value={consultor} onChange={(e) => setConsultor(e.target.value)} placeholder="Seu nome" />
            </div>
            <div className="field">
              <label>Validade da proposta</label>
              <input type="date" value={validade} onChange={(e) => setValidade(e.target.value)} />
            </div>

            <div className="switchrow">
              <div className="txt">
                <b>Blindagem de bandeira tarifária</b>
                <small>Adiciona o selo de proteção contra aumento de bandeira</small>
              </div>
              <label className="switch">
                <input type="checkbox" checked={blindagem} onChange={(e) => setBlindagem(e.target.checked)} />
                <span className="slider" />
              </label>
            </div>

            <div className="switchrow">
              <div className="txt">
                <b>Edição avançada</b>
                <small>Libera os valores de economia para ajuste manual (sobrepõe o cálculo automático)</small>
              </div>
              <label className="switch">
                <input type="checkbox" checked={avancado} onChange={(e) => handleToggleAvancado(e.target.checked)} />
                <span className="slider" />
              </label>
            </div>

            {!avancado && calc.erro && <div className="errbox">{calc.erro}</div>}
          </div>

          <div className="actions">
            <button className="btn primary" onClick={copyImg} disabled={busy !== null}>
              {busy === 'copy' ? 'Gerando…' : 'Copiar imagem'}
            </button>
            <button className="btn ghost" onClick={downImg} disabled={busy !== null}>
              {busy === 'down' ? 'Gerando…' : 'Baixar PNG'}
            </button>
            <button className="btn text" onClick={handleLimpar}>Limpar</button>
            {toast && <span className={`toast show${toast.err ? ' err' : ''}`}>{toast.msg}</span>}
          </div>
        </div>

        {/* PREVIEW */}
        <div className="previewcol">
          <div className="frame">
            <div id="cardWrap" ref={wrapRef}>
              <div id="card" ref={cardRef}>
                <div className="deco-top" />
                <div className="deco-bot" />
                <div className="inner">
                  <div className="c-head">
                    <img src="/sg-logo.png" alt="SolarGrid" />
                    <div className="c-tag">Proposta de<br />Economia</div>
                  </div>

                  <div className="c-hi">{cliente.trim() ? `Olá, ${cliente.trim().split(' ')[0]}!` : 'Olá!'}</div>
                  <div className="c-sub">Veja quanto você passa a economizar com a SolarGrid:</div>

                  <div className="hero">
                    <div className="glow" />
                    <div className="lbl">Economia anual estimada</div>
                    <div className="big"><BigBRL n={anoFinal} /></div>
                    <div className="note">estimativa para os primeiros 12 meses</div>
                  </div>

                  <div className="month">
                    <div className="ml">
                      <div className="k">Por mês</div>
                      <div className="s">{ndesc ? `${ndesc}% de desconto na tarifa líquida de energia` : 'desconto na tarifa líquida de energia'}</div>
                    </div>
                    <div className="mv"><BigBRL n={mesFinal} /></div>
                  </div>

                  <div className="badges">
                    {badges.map((b, i) => (
                      <div key={i} className={`badge${b.hot ? ' hot' : ''}`}><span className="dot" />{b.t}</div>
                    ))}
                  </div>

                  <div className="details">
                    <div className="det"><div className="dk">Distribuidora</div><div className="dv">{distribuidora || '—'}</div></div>
                    <div className="det"><div className="dk">Consumo médio</div><div className="dv">{isNaN(consumoNum) || consumo.trim() === '' ? '—' : `${fmtInt(consumoNum)} kWh`}</div></div>
                    <div className="det hot"><div className="dk">Desconto na tarifa líquida</div><div className="dv">{ndesc ? `${ndesc}%` : '—'}</div></div>
                    <div className="det"><div className="dk">Fidelidade</div><div className="dv">{fidelidade === '0' ? 'Sem fidelidade' : `${fidelidade} meses`}</div></div>
                  </div>

                  <div className="strip">
                    <div className="st">Zero custo · Zero obra<br />Só economia</div>
                    <img src="/sg-logo-white.png" alt="SolarGrid" />
                  </div>

                  <div className="c-foot">
                    <div className="who" style={{ visibility: consultor.trim() ? 'visible' : 'hidden' }}>
                      Proposta preparada por <span>{consultor.trim() || '—'}</span>
                    </div>
                    <div className="val">Válida até <em>{formatDateBR(validade)}</em><small>Proposta detalhada na sequência</small></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="cap">Pré-visualização · exporta em 2160 × 2880 px (3:4)</div>
        </div>

      </div>
    </div>
  );
}

export default function GeradorProposta() {
  return (
    <Suspense fallback={null}>
      <GeradorPropostaInner />
    </Suspense>
  );
}
