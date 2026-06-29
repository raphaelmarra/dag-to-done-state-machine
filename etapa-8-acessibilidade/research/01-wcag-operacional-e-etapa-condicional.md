# Pesquisa 01 — WCAG operacional vs estático + etapa condicional (estado-da-arte 2026)

> Fonte: search-specialist, 2026-06-29. 11 buscas + 6 fetches, fontes primárias (W3C/WAI, Deque, ITI/Section508).
> Resolveu as 3 tensões da etapa 8: condicionalidade (rodar sempre + N/A), arquétipo (some), movimento (evidência
> operacional). A etapa 8 é o "Gate A do runtime" — molde quase literal da etapa 7 (ADR 0028).

## A etapa 8 NÃO é redundante com o Gate A (prova quantitativa)
Deque Automated Accessibility Coverage Report (13.000+ páginas, ~300k issues), % automatizável POR critério:
- 1.4.3 Contrast: 83% (mas só p/ cor FIXA no CSS; dado dinâmico escapa).
- 4.1.2 Name/Role/Value: 54% (presença sim, adequação não).
- **2.4.3 Focus Order: 0% — só operacional.**
- **2.4.7 Focus Visible: 0% — só operacional.**
- **2.1.1 Keyboard: 2,49% — essencialmente só operacional.**
→ Focus Order/Visible/Keyboard são o NÚCLEO da etapa 8 e são 0-2,5% capturáveis estaticamente. O Gate A (lê
código) é cego (propriedades emergentes do runtime). A etapa cobre o EXATO complemento.
**Contradição resolvida:** cobertura "20-30%" (por critério) vs "57%" (Deque, por volume — contraste é 30% das
issues) vs "30-50%" (Playwright+axe). Não é conflito: métrica diferente. Para a etapa 8 a métrica é POR critério
(~30%), e o detalhe granular (Focus 0%) é o que importa — a média esconde o ponto.

## Critérios que SÓ se pegam operando a tela
2.1.1 Keyboard, 2.1.2 No Keyboard Trap, 2.4.3 Focus Order, 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured (2.2),
4.1.3 Status Messages/live regions (mudança dinâmica anunciada), 2.5.7 Dragging Movements (2.2), 1.4.10 Reflow.
Contraste "com dado real" (1.4.3): o que escapa do estático é texto sobre dado dinâmico (status colorido da API,
badge cuja cor depende do valor) — o scanner mede o CSS, só operando se vê o contraste real.

## Catálogo WCAG operacional por tipo (fonte: WCAG 2.2 A/AA + APG do W3C)
O mapa componente→critério é canônico (APG = a11y por widget). Por arquétipo:
- **FORMULÁRIO (MUTACAO):** 3.3.1 Error Identification, 3.3.2 Labels/Instructions, 3.3.3 Error Suggestion,
  4.1.3 Status Messages (erro/sucesso anunciado sem roubar foco), 2.4.3 Focus Order (foco vai ao 1º campo
  inválido), 1.4.3 Contrast.
- **MODAL/DRAWER (APG Dialog Pattern, só verificável operando):** foco entra ao abrir (1º interativo ou título);
  focus trap (Tab no último volta ao 1º, fundo inert); Escape fecha; foco RETORNA ao gatilho ao fechar; 4.1.2
  (role=dialog, aria-modal, aria-labelledby); 2.4.11 foco não obscurecido.
- **BOARD/drag-drop:** 2.5.7 Dragging Movements (alternativa de ponteiro único/teclado — kanban é o exemplo
  nominal do W3C); 2.1.1 Keyboard (mover via teclado); 4.1.3 Status (anunciar "movido de A p/ B pos 2"); 2.4.3
  (foco acompanha o item); 4.1.2.
→ Catálogo FIXO e pequeno (≈12-15), norma externa estável. Análogo às lentes do Gate A (fonte: APG vs USWDS/OWASP).

## Agentes de IA verificando a11y (2026) — o salto e o limite
- **Determinístico (maduro):** Playwright dirige a tela (`page.keyboard.press('Tab')`, lê `document.activeElement`,
  detecta foco preso, Escape fecha + foco retornou). `@axe-core/playwright` roda o estático no browser real.
- **Raciocínio (novidade 2026):** agentes "raciocinam se um alt text descreve a imagem, se um dropdown anuncia
  seu estado". Parte do "julgamento humano" migrou p/ a IA: adequação do alt, sentido da ordem de foco.
- **Limite duro (TODAS as fontes):** "No automated or AI tool fully substitutes for testing with a real screen
  reader". Sobra p/ humano: a experiência VIVIDA (anúncio confuso/verboso, fluxo que frustra). A IA julga a forma
  semântica; o humano a qualidade vivida. → etapa 8 (operacional + semântico) ≠ etapa 10 (screen reader real).

## Etapa CONDICIONAL: rodar sempre + N/A (NÃO pular) — convergência de 2 mundos
- **CI/CD (Azure/AWS/Harness):** pular gera FALSO-VERDE — "stage pulado aparece como concluído com sucesso",
  indistinguível de "não se aplicava" / "rodou e passou" / "foi esquecido". Pipelines de compliance rodam e
  registram o porquê ("audit-ready pipelines continuously collect evidence").
- **a11y (VPAT/Section508):** 4 níveis — supports / partially / does not support / **not applicable**. N/A EXIGE
  justificativa em "Remarks". WCAG-EM: reporta CADA critério, não omite.
- → As DUAS indústrias convergem contra pular. É exatamente o padrão coberta/descoberta/nao_aplicavel do Gate A
  (ADR 0028) — validação convergente independente.

## O output substantivo vs vazio (verificável SEM rodar a tela)
Achado a11y substantivo (WCAG-EM + VPAT): descrição + passos p/ reproduzir + critério WCAG + severidade +
localização + sugestão acionável. O porteiro NÃO roda a tela → valida FORMA, mas forma CARA DE FINGIR:
1. Todo critério do catálogo declarado (nenhum em silêncio) — espelha L1.
2. nao_aplicavel exige motivo auditável — espelha L2.
3. **Critério COBERTO cita `evidencia_operacional` concreta** (seletor focado, tecla, activeElement, output do
   axe) — a âncora que SÓ existe se a tela foi operada. ITEM NOVO DECISIVO: distingue gate operacional de leitura.
4. Violação ⟹ ≥1 issue acionável (localização + critério WCAG + severidade + ação); sem violação órfã — espelha C1.
5. Veredito binário coerente com bloqueantes — espelha V1/V3.
6. Limite epistêmico declarado: o porteiro valida forma/presença/coerência, NÃO se o foco DE FATO entrou →
   substância vai p/ etapa 10 (humano + screen reader). Declarar o que "fica p/ o screen reader humano".

## RECOMENDAÇÃO
(a) Rodar sempre + N/A com motivo. (b) Catálogo WCAG operacional FIXO (dado) — exceção honesta a M1 (norma
externa estável e finita; o dinâmico é a SITUAÇÃO por critério, não o catálogo); igual às lentes do Gate A.
(c) Porteiro exige: todos declarados; N/A com motivo; COBERTO com evidencia_operacional; violação→issue; veredito
coerente; limite declarado. **"A etapa 8 é o Gate A do runtime"** — CORE-GATEA é molde quase literal do CORE-A11Y.

## Lacuna p/ futuro
Spike: o motor poderia RE-RODAR o artefato Playwright anexado (transformar evidencia_operacional de "presença
declarada" em "fato re-verificável") — único modo de o porteiro tocar a substância sem humano. Território original.

## Fontes principais
- W3C APG Dialog Pattern · WCAG 2.2 Understanding (2.4.7/2.4.11/2.5.7/3.3.x) · WCAG-EM 2.0 (draft 2026)
- Deque Automated Accessibility Coverage Report · ITI/Section508 VPAT/ACR · qaskills.sh (IA a11y 2026) · TestParty
- Playwright Accessibility testing · Azure/AWS/Harness CI conditions (skip vs always)
