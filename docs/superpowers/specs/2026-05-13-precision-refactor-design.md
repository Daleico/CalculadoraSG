# Design: Refatoração de Precisão Total (6 Casas Decimais) — Padrão ANEEL

**Data:** 2026-05-13  
**Status:** Implementado

## Problema

A Tarifa SG exibida no app divergia do Excel de referência porque:

1. `data.ts` tinha valores numéricos com 2–3 casas decimais (truncados em relação à fonte ANEEL)
2. `calculator.ts` aplicava `Number(tarifaSgBruta.toFixed(4))` na linha 40 — arredondamento prematuro que propagava erro ao calcular a fatura
3. `faturaSGBase` somava três sub-totais independentemente arredondados, acumulando erro de centavos
4. A UI exibia a Tarifa SG unitária com apenas 4dp

## Escopo

Três arquivos afetados, zero mudança de interfaces públicas:

| Arquivo | Mudança |
|---|---|
| `src/core/data.ts` | Valores numéricos substituídos pelos brutos do Excel (até 10dp) |
| `src/core/calculator.ts` | Remove `toFixed(4)` intermediário; `faturaSGBase` soma bruta → 1 round final |
| `app/page.tsx` | Exibição de `tarifaSG_kWh` de 4dp → 6dp |

## Regra de Ouro: Arredondamento Tardio

- Toda aritmética interna usa floats nativos sem truncamento
- O único `Math.round(...* 100) / 100` permitido é no `faturaSGBase` final, antes de entrar no objeto de retorno da simulação
- A UI formata para exibição; nunca o motor matemático

## Mudanças Aplicadas

### `src/core/data.ts`

Todos os valores `TotalC`, `TotalS`, `PIS`, `ICMSTE`, `ICMSTUSD` atualizados com os números brutos da aba "Base de Dados" do arquivo `Cópia de Calculadora de Tarifas - Comercial DEZ atualizado.xlsx`.

As propriedades `regraIcmsNI` e `regraPisCofinsNI` foram preservadas sem alteração.

### `src/core/calculator.ts`

```ts
// Antes (linha 40):
const tarifaSG = Number(tarifaSgBruta.toFixed(4));

// Depois:
const tarifaSG = tarifaSgBruta;
```

```ts
// Antes (linhas 74-76):
const faturaSGBase =
    Math.round(faturaSG * 100) / 100 +
    Math.round(impostosConcessionaria * 100) / 100 +
    Math.round(custoMinimoConcessionaria * 100) / 100;

// Depois:
const faturaSGBase = Math.round((faturaSG + impostosConcessionaria + custoMinimoConcessionaria) * 100) / 100;
```

### `app/page.tsx`

```ts
// Antes:
minimumFractionDigits: 4, maximumFractionDigits: 4

// Depois:
minimumFractionDigits: 6, maximumFractionDigits: 6
```

## Verificação

Para validar: Equatorial GO + 15% desconto + 1000 kWh + monofásico (30 kWh)

- `tarifaSG` esperado: `~0.963155` (espelho do Excel)
- `faturaSGBase` = soma bruta de faturaSG + impostos + custoMínimo, arredondada uma vez
