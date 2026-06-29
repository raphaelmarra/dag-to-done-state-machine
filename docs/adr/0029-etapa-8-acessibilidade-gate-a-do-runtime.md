# 0029 — Etapa 8 (Acessibilidade): o "Gate A do runtime" com catálogo WCAG e evidência operacional

- Status: accepted
- Data: 2026-06-29
- Relacionado: CORE-A11Y (etapa 8); é o espelho da etapa 7 (ADR 0028) no eixo runtime; reusa `regrasExtras`
  (ADR 0024), o padrão `CATALOGO_*`+regra (ADR 0025), a injeção de catálogo no briefing (ADR 0028); generaliza
  a fábrica de motivo-substantivo da etapa 7; complementa ADR 0011 (acessibilidade entre Gate A e Gate B);
  abre A017.

## Contexto e Problema
A etapa 8 verifica a tela EM MOVIMENTO — foco, teclado, leitura de tela, contraste com dado real — não lendo o
código. É a 1ª etapa CONDICIONAL (a11y operacional rica só existe em telas com interação). Três tensões: (1) a
verificação ESTÁTICA (o que o Gate A leu) pega ~30% dos problemas WCAG, mas Focus Order/Keyboard são 0%–2,5%
automatizáveis estaticamente (Deque, 13k páginas) — então a etapa não é redundante, mas o que ela cobre é
JUSTAMENTE o que o porteiro (que valida JSON) não consegue re-verificar; (2) a condicionalidade num motor
LINEAR (não pula etapas); (3) o arquétipo, que a etapa 7 eliminou como entrada, parecia voltar.

## Decisão
**A etapa 8 é o "Gate A do runtime": mesmo esqueleto epistêmico da etapa 7, no eixo operacional.** Concretamente:
1. **Catálogo WCAG operacional injetado inteiro** (16 critérios, WCAG 2.2 A/AA + APG do W3C). O verificador
   opera a tela (Playwright+axe) e declara CADA critério `coberto`/`violado`/`nao_aplicavel`. A condicionalidade
   vira N/A com motivo (NÃO pular — VPAT e CI/CD de compliance convergem: pular gera falso-verde indistinguível
   de esquecimento). Isso elimina o arquétipo como entrada (a condicionalidade é declarada, não classificada).
2. **`evidencia_operacional` — o campo decisivo.** Cada critério carrega a âncora que SÓ existe se a tela foi
   operada (seletor focado, tecla, `activeElement`, medição do axe). É a defesa anti-teatro: o porteiro nunca
   vê a tela, mas vê o RASTRO de tê-la operado. A evidência precisa de SUBSTÂNCIA em TODA situação (não "ok"/
   "n/a" — `regraNaoAplicavelComMotivo` com `valorNA=null`).
3. **Veredito binário; reprovado é sucesso.** `veredito` ∈ {aprovado, reprovado}. Coerência (`regraVeredictoA11y`):
   reprovado⟹≥1 issue; aprovado⟹0 issue 'alta'. Issues acionáveis (localização+critério+ação); critério violado
   vira issue (circuito, ancorado por nome inteiro).
4. **Fronteira com a etapa 10.** `fica_para_humano` declara o que a IA não pode julgar: a IA 2026 julga a forma
   semântica ("o alt descreve a imagem?"), o humano + screen reader real julga a VIVÊNCIA ("o anúncio soa
   verboso? a ordem de foco frustra?"). Gate B (9) re-verifica a autenticidade ao vivo; etapa 10 cobre a vivência.
5. **Executor `web-accessibility-checker`** (opera a tela); confiança = "verificado operando a tela" /
   "julgamento semântico (falível)".

## Motivo
Decidido com pesquisa de estado-da-arte 2026 (WCAG operacional; Deque por-critério prova a não-redundância;
VPAT+CI/CD convergem contra pular) + simetria com a etapa 7. Validado pela rotina 0→4 contra 2 casos de
arquétipos OPOSTOS, ambos OPERADOS ao vivo (Playwright+axe real): aba CLIs (MUTACAO+LISTA, cobertura plena, 6
violações) e detalhe de produto (DETALHE read-only, que VALIDOU a condicionalidade — 9/17 N/A com motivo real).
Anti-viés saturado (3 verificadores) achou e FECHOU: violação órfã ancorada no 1º token (regressão vs. etapa 7);
`coberto` com evidência oca passando (a defesa anti-teatro era cosmética); + lacunas de doc. A
`regraNaoAplicavelComMotivo` foi GENERALIZADA em fábrica no momento M4 exato (2º caso, eixo de variação revelado,
ambos os call sites convertidos) — beneficiando a etapa 7 também.

## Consequências
**A tese de amortização é confirmada no caso mais forte do pipeline:** ZERO mecanismo de motor novo (o
placeholder `{catalogo_lentes}` já era genérico); ~85% dado/conteúdo, ~15% regras-clone da etapa 7. As 3 regras
"novas" são clones estruturais (não fábricas — corretamente: têm lógica divergente, fábrica precoce seria
abstração prematura). O catálogo WCAG é DADO — exceção HONESTA a M1: é norma EXTERNA finita; o dinâmico é a
SITUAÇÃO de cada critério, não o catálogo (trocar de projeto não edita o catálogo). **Limites epistêmicos
declarados por seção:** o porteiro valida a FORMA da verificação (cobertura, evidência substantiva presente,
coerência), NÃO que a tela foi operada, que o achado é verdadeiro, que o dado era real, nem distingue
feature-sem-tela de fuga. **Dívida A017:** a etapa pressupõe uma tela operável — para uma feature sem UI, tudo
vira N/A indistinguível de fuga (o falso-verde que D-1 combateu, um nível acima); a correção (sinal
`tem_interface` derivado do estado) é decisão de fundação adiada por M4. **Atualiza ADR 0011** (acessibilidade):
agora com catálogo WCAG injetado inteiro + evidência operacional + condicionalidade por N/A (não filtrada por
arquétipo).
