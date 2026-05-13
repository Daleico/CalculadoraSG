# Design: Projeção Anual, Cenários de Bandeiras e Gatilhos Comerciais

**Data:** 2026-05-13
**Status:** Aprovado — aguardando plano de implementação

## Problema

A calculadora atual (`simularComercial`) produz um único mês isolado com matemática já homologada contra a planilha de referência. O time comercial precisa visualizar o comportamento financeiro da SolarGrid ao longo de 12 meses (Janeiro a Dezembro) para alimentar um futuro gráfico de barras, considerando:

1. Um **cenário misto realista** de bandeiras tarifárias distribuídas ao longo do ano, ou alternativamente um cenário 100% Verde para comparação.
2. **Gatilhos promocionais comerciais** que zeram ou descontam a injeção SG em meses específicos.
3. **Precisão idêntica** à da função mensal — sem arredondamento intermediário.

## Escopo

Dois arquivos afetados. **Zero modificação** em código existente — apenas adições.

| Arquivo | Mudança |
|---|---|
| `src/core/types.ts` | Adiciona `PromocaoComercial`, `PontoGraficoMensal`, `ProjecaoAnual`. |
| `src/core/calculator.ts` | Adiciona helper privado `calcularMesProjecao`, função pública `calcularProjecaoAnual`, e constantes de módulo `NOMES_MESES` e `BANDEIRAS_CENARIO_MISTO`. |

Funções intocadas: `normalizarNomeDistribuidora`, `calcularImpostos`, `calcularTarifaSG`, `simularComercial`.
Dados intocados: `distribuidorasData`, `bandeirasTarifarias`.
UI intocada: `app/page.tsx` (consumo do gráfico é tema de outro ciclo).

## Regra de Ouro: Arredondamento Tardio (Herdada)

Esta projeção respeita a mesma disciplina documentada em `2026-05-13-precision-refactor-design.md`:

- Toda aritmética interna usa floats nativos sem truncamento.
- `Math.round(x * 100) / 100` aparece **apenas** na montagem final do array de saída e do total anual.
- A soma anual usa os floats brutos de cada mês, **não** os valores já arredondados do array do gráfico — assim o total fecha com a planilha mesmo com propagação de centavos.

## Arquitetura

### 1. Tipos novos em `src/core/types.ts`

```ts
export type PromocaoComercial = 'NENHUMA' | '1_GRATIS' | '2_GRATIS' | '50_OFF';

export interface PontoGraficoMensal {
    name: string;            // 'Jan'..'Dez'
    semSolarGrid: number;    // R$ — fatura concessionária com bandeira do mês (2dp)
    comSolarGrid: number;    // R$ — fatura SG com bandeira do mês + promo do mês (2dp)
    economia: number;        // R$ — semSolarGrid − comSolarGrid (2dp)
}

export interface ProjecaoAnual {
    dadosGrafico: PontoGraficoMensal[]; // length === 12
    economiaAnualTotal: number;          // R$ — Σ economias brutas, 1 round final (2dp)
}
```

### 2. Constantes de módulo em `src/core/calculator.ts`

```ts
const NOMES_MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'] as const;

// Cenário misto: índice 0=Jan ... 11=Dez. Chaves batem com bandeirasTarifarias em data.ts.
const BANDEIRAS_CENARIO_MISTO = [
    'Verde','Verde','Verde','Verde','Verde','Verde',   // Jan–Jun (6)
    'Amarela','Amarela','Amarela',                      // Jul–Set (3)
    'Vermelha P1','Vermelha P1',                        // Out–Nov (2)
    'Vermelha P2',                                      // Dez (1)
] as const;
```

### 3. Helper privado `calcularMesProjecao` (não exportado)

```ts
function calcularMesProjecao(
    nomeDistribuidora: string,
    descontoPercentual: number,
    consumoKwh: number,
    consumoMinimo: number,
    valorBandeiraKwh: number,           // R$/MWh (mesmo formato de bandeirasTarifarias)
    promoZeraInjecao: boolean,          // true → faturaSG injeção = 0 neste mês
    promoMultiplicadorInjecao: number,  // 1.0 default, 0.5 para 50_OFF
): { semSolarGrid: number; comSolarGrid: number }
```

**Lógica (todos floats puros, zero arredondamento):**

```
nomeNorm    = normalizarNomeDistribuidora(nomeDistribuidora)
dados       = distribuidorasData[nomeNorm]          // lança se não existir
{icmsNI,pisNI} = calcularImpostos(dados)

energiaInjetada       = consumoKwh − consumoMinimo
faturaSGInjecaoBruta  = ((dados.TotalC − dados.TotalS*(descontoPercentual/100) − icmsNI − pisNI) / 1000) * energiaInjetada
faturaSGInjecaoFinal  = promoZeraInjecao ? 0 : faturaSGInjecaoBruta * promoMultiplicadorInjecao

impostosNI            = ((icmsNI + pisNI) / 1000) * energiaInjetada
custoMinimoConcess    = (consumoMinimo / 1000) * dados.TotalC
acrescimoBandeiraSG   = (valorBandeiraKwh / 1000) * consumoMinimo
acrescimoBandeiraConc = (valorBandeiraKwh / 1000) * consumoKwh

semSolarGrid = (dados.TotalC / 1000) * consumoKwh + acrescimoBandeiraConc
comSolarGrid = faturaSGInjecaoFinal + impostosNI + custoMinimoConcess + acrescimoBandeiraSG

return { semSolarGrid, comSolarGrid }
```

### 4. Função pública `calcularProjecaoAnual`

```ts
export function calcularProjecaoAnual(params: {
    distribuidora: string;
    consumoKwh: number;
    descontoPercentual: number;
    consumoMinimo: number;
    cenario100Verde: boolean;
    promocaoAtiva: PromocaoComercial;
}): ProjecaoAnual
```

**Fluxo:**

1. **Resolve `bandeirasDoAno: readonly string[]` de length 12:**
   - `cenario100Verde === true`  → `Array(12).fill('Verde')`
   - `cenario100Verde === false` → `BANDEIRAS_CENARIO_MISTO`

2. **Resolve flags de promoção por índice de mês.** Vetores `zeraInjecao: boolean[12]` (default `false`) e `multiplicadorInjecao: number[12]` (default `1.0`):
   - `'1_GRATIS'` → `zeraInjecao[0] = true`
   - `'2_GRATIS'` → `zeraInjecao[0] = true; zeraInjecao[1] = true`
   - `'50_OFF'`   → `multiplicadorInjecao[0] = 0.5`
   - `'NENHUMA'`  → mantém defaults

3. **Loop `for i in 0..11`:**
   - `valorBandeira = bandeirasTarifarias[bandeirasDoAno[i]]`
   - `(sem_i, com_i) = calcularMesProjecao(distribuidora, descontoPercentual, consumoKwh, consumoMinimo, valorBandeira, zeraInjecao[i], multiplicadorInjecao[i])`
   - Acumula `{ sem: sem_i, com: com_i }` num array intermediário de 12 pares brutos.

4. **Soma anual em float:**
   `economiaBrutaAnual = Σ (sem_i − com_i)` sobre os 12 pares brutos.

5. **Monta `dadosGrafico`:** para cada `i ∈ 0..11`, arredonda para 2dp:
   ```ts
   {
     name: NOMES_MESES[i],
     semSolarGrid: Math.round(sem_i * 100) / 100,
     comSolarGrid: Math.round(com_i * 100) / 100,
     economia:     Math.round((sem_i - com_i) * 100) / 100,
   }
   ```

6. **Total anual:** `economiaAnualTotal = Math.round(economiaBrutaAnual * 100) / 100`.

7. Retorna `{ dadosGrafico, economiaAnualTotal }`.

## Tratamento de Casos-Limite

| Caso | Comportamento |
|---|---|
| `consumoKwh <= consumoMinimo` | `energiaInjetada` vira 0 ou negativa. A função **não** valida — segue o contrato de `simularComercial` (validação é responsabilidade da UI, conforme `app/page.tsx:31-35`). |
| Distribuidora inexistente | `normalizarNomeDistribuidora` + lookup em `distribuidorasData` lança o mesmo erro que `calcularTarifaSG`. |
| `promocaoAtiva` com valor desconhecido | TypeScript previne em tempo de compilação. Em runtime, o `switch` cai no default e mantém todos os meses neutros. |
| `cenario100Verde === true` + qualquer promoção | Promoção continua aplicada normalmente. Janeiro de `50_OFF` em ano 100% Verde fica com a injeção pela metade e demais meses sem alteração. |

## Cenários de Verificação (Sanity)

Para validar a implementação contra a planilha:

1. **Baseline:** `cenario100Verde=true, promocaoAtiva='NENHUMA'` ⇒ todos os 12 meses produzem `comSolarGrid` igual a `faturaSGBase` de `simularComercial`, e `semSolarGrid` igual a `faturaAtualBase`. `economiaAnualTotal ≈ 12 × economiaBase` (módulo erro de arredondamento ≤ R$0,01).

2. **Promo isolada:** `cenario100Verde=true, promocaoAtiva='1_GRATIS'` ⇒ Janeiro tem `comSolarGrid` igual a (custo mínimo + impostos NI) apenas. Demais meses idênticos ao baseline. `economiaAnualTotal` aumenta exatamente em `faturaSGInjecaoBruta` de Janeiro.

3. **Cenário misto puro:** `cenario100Verde=false, promocaoAtiva='NENHUMA'` ⇒ Jan–Jun batem com `cenarios['Verde']` de `simularComercial`. Jul–Set batem com `cenarios['Amarela']`. Out–Nov batem com `cenarios['Vermelha P1']`. Dez bate com `cenarios['Vermelha P2']`.

4. **Cruzado:** `cenario100Verde=false, promocaoAtiva='2_GRATIS'` ⇒ Jan e Fev têm `comSolarGrid` reduzido (sem injeção), mas mantêm o acréscimo de bandeira sobre o custo mínimo. Como Jan e Fev são Verde, o acréscimo é zero, mas a invariante de cálculo é mantida.

## Decisões de Design Registradas

- **`consumoMinimo: number` em vez de `tipoConexao` enum.** Mantém consistência com `simularComercial` e com o estado já existente na UI (`app/page.tsx:13`). Evita duplicar o mapeamento mono/bi/tri→30/50/100.
- **Bandeira blindada na SG.** Concessionária sofre acréscimo sobre consumo total; SG só sobre custo mínimo. É a mesma regra de `simularComercial` — preserva a tese comercial.
- **Promo afeta apenas a injeção limpa.** O acréscimo de bandeira sobre o custo mínimo continua sendo cobrado mesmo nos meses promocionais. Conforme o enunciado: "cliente paga apenas custo mínimo + impostos não isentos".
- **Tipos em `types.ts`.** Mantém a separação tipos/lógica do projeto.
- **Helper privado, não exportado.** Reutilizável internamente sem ampliar a superfície de API.

## Próximos Passos

1. Spec aprovado e commitado.
2. Plano de implementação detalhado (skill `writing-plans`).
3. Implementação (TDD recomendado dado o histórico de homologação contra planilha).
4. Validação contra a planilha de referência usando os 4 cenários de sanity.
5. (Futuro, fora deste spec) Integração no `app/page.tsx` com o componente de gráfico.
