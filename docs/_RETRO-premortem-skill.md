# _RETRO — Pré-mortem cético da skill `criar-state-machine` (Fase 5 da A022)

> **Status:** ⚠️ WIP/Active. Pré-mortem ADVERSARIAL da arquitetura (Fase 4) ANTES de escrever a skill. Dois
> verificadores INDEPENDENTES (agentes `auditor-v2` e `code-reviewer`, 2026-06-30), perspectivas complementares:
> auditor → generalidade cross-domínio; reviewer → coerência interna + viabilidade. **VEREDITO CONVERGENTE: a skill
> NÃO pode ser escrita como está — aciona o loop 5→4/3 do plano.** A convergência independente nos mesmos furos
> críticos é o sinal de que são reais.

---

## Veredito consolidado

**Os dois verificadores, sem se ver, chegaram ao mesmo "não".** O design é bem-ancorado e cuidadosamente cruzado —
o que torna os furos mais significativos (não são desleixo, são premissas erradas). Há **3 furos CRÍTICOS** que exigem
ajuste da arquitetura antes da Fase 6, **6 ALTOS** tratáveis com ajuste de texto, e o resto declarável como limite.

## Os 3 furos CRÍTICOS (exigem correção antes de escrever)

### C1 — As "fábricas F3/F4/F6/F7 extraídas de graça" NÃO EXISTEM (pré-trabalho escondido) — `code-reviewer`
A Fase 4 afirma 3× (Decisão 4 + tabela) que o scaffold entrega "fábricas genéricas extraídas de graça". **Verificado no
código:** `regraCircuitoComportamentoCriterio` (`pipeline.config.mjs:366`), `regraVeredictoA11y` (:730),
`regraInconclusivoComMotivo` (:767), `regraCriteriosDoDesignCobertos` (:801) são funções `(output)` que **hardcodam**
nomes de campo de domínio (`three_amigos`, `criterios_aceitacao`, `MOTIVOS_INCONCLUSIVO`, `criterios`). Só ~4 funções
no arquivo inteiro são fábricas reais (retornam closure). A Fase 1 as listou como **perguntas ABERTAS com "?"**; a Fase
4 as declarou **fato consumado**. Extrair isso de um arquivo de 99 KB é refatoração real com testes — **provavelmente o
maior bloco de esforço de todo o projeto da skill**, apresentado como custo zero. **É o risco de cronograma nº 1.**
**Correção:** ou (a) rebaixar para "o scaffold inclui essas regras como EXEMPLOS de domínio que o operador reescreve"
(honesto, menos ambicioso), ou (b) adicionar uma FASE explícita de pré-trabalho "extrair as fábricas no `v1/` antes de
empacotar o scaffold" — e contabilizar o esforço. Não deixar como "de graça".

### C2 — Premissas de software disfarçadas de 🟢 "universal" — `auditor-v2`
Vários itens marcados 🟢 "100% copiável" carregam pressupostos de "ambiente computável" que não existem em domínios de
criação (vídeo, roteiro, pesquisa qualitativa). O insight de ESCALA é decisivo: *"o CORE-DAG n=1 compromete uma etapa;
a skill n=1 compromete o motor de TODOS os projetos criados com ela — cada 🟢 incorreto é um bug latente que se
multiplica."* Os principais (ver lista completa abaixo): `regraEvidenciaObrigatoria` (exige "evidência mecânica" — não
existe para um roteirista definindo personagem → reprova outputs legítimos sem diagnóstico), `confianca_enum` (taxonomia
Explore-lê-código/fiscal-toca-rede sem análogo em tarefa criativa), `regraAncoraRastreavel` (pressupõe ids tipo
`GAP-01`), `regraCensoConfrontado` (pressupõe etapa de "fontes"), o briefing P0/P1/P2 (criticidade de software).
**Correção:** reclassificar esses 🟢 → ⚪ no inventário; a Fase C deve guiar o operador a DEFINIR o que conta como
evidência/certeza/rastreabilidade NO SEU DOMÍNIO antes de instanciar as fábricas — não pressupor "passa os parâmetros e
pronto".

### C3 — A skill não cabe em uma skill (colapso de tamanho/formato) — `code-reviewer`
As skills reais do ambiente têm **4.4 KB (`manter-governanca`) e 8.1 KB (`upstream-contrib`)**, single-file, ~75–167
linhas. A proposta é SKILL.md (6 fases + dot-graph + tabelas + checklists + DoD) **+ 6 recursos + scaffold de 6+
arquivos** — uma ordem de grandeza acima do teto. Risco: o operador-agente se perde entre 6 fases → 6 recursos → 6
arquivos de scaffold. **Correção:** SKILL.md = SÓ a tabela das 6 fases (1 linha cada: objetivo | gatilho HITL |
recurso), o dot-graph e o DoD; teto ≤ 8 KB; os 8 passos vivem 100% em `META-METODO-DESTILAR-CORE.md`. Fundir recursos
pequenos (PROBES-CDM e TRIAGEM viram seções do meta-método) → alvo 3 recursos. **Se mesmo enxuto estourar, reabrir a
Decisão 1** (a Fase D viraria uma skill composta) — mas isso briga com "uma única skill", então é DECISÃO DO OPERADOR,
não minha; o blueprint deve apresentar o trade-off, não assumir que cabe.

## Os 6 furos ALTOS (ajuste de texto, sem redesenho estrutural)

- **A1 — "Copiar o motor" e "extrair fábricas" são operações incompatíveis na Fase C** (`code-reviewer`). Cópia mecânica
  ≠ refatoração. Separar: `pipeline.engine.mjs` (fábricas puras) é PRODUZIDO por extração ANTES da skill (= C1); a Fase C
  copia o pronto + gera o template vazio. Declarar a extração como pré-skill.
- **A2 — O motor copiado JÁ contém HITL de domínio** (`code-reviewer`). 11 ocorrências de HITL em `dag.mjs`, 89 em
  `pipeline.config.mjs`. `gerarDossieAprovacao` hardcoda `design_output`/`gate_*_output` (F2); `ETAPA_CENSO_FONTES` mistura
  gênero invariante + conteúdo (F9). A Fase C diz "HITL nenhum" mas isso é sobre o PROCESSO de cópia — mascara que o
  ARTEFATO copiado tem HITL de domínio embutido. Tornar configurável ou documentar reescrita.
- **A3 — O passo 4 (verificação de ajuste) não é operável** (AMBOS convergiram). "O termo cabe ou estou forçando?" sem
  critério = teatro de rigor (viés de confirmação — o próprio doc admite). **Correção (o próprio caso `tagNamespace` dá a
  forma):** transformar em checklist de PREDIÇÕES FALSIFICÁVEIS — "liste o que o termo canônico PREVÊ que deveria ser
  verdadeiro no seu caso; verifique cada predição; ache um contra-exemplo onde o termo NÃO se aplica e confirme que seu
  caso difere; pergunte a alguém do domínio se o vocabulário soa natural ou forçado." Sem isso o passo é decorativo.
- **A4 — A Fase B não tem proteção real contra ancoragem** (`auditor-v2`). O `pipeline.config.template.mjs` vazio JÁ
  carrega a forma do dev web (nomes `ETAPA_CENSO_FONTES`, `corePath`, comentários PT-BR de dev) — ancoragem não precisa de
  conteúdo preenchido. E o `task-decomposition-expert` que critica granularidade é calibrado para 10–15 etapas de
  software. **Correção:** template com nomes abstratos (`ETAPA_A`); a Fase B começa por "descreva em prosa o que sua
  execução entrega" ANTES de mostrar qualquer anatomia.
- **A5 — O gate de pré-requisitos (Fase A) não filtra os casos mais perigosos** (`auditor-v2`). Filtra "motor separado?"
  mas não "o output é verificável por um terceiro que não fez o trabalho?", "há conceito de advance-bloqueado?". Um
  pipeline de pesquisa qualitativa passa no H3 mas falha nos não-filtrados — e o operador só descobre na Fase E.
  **Correção:** +3 perguntas no `CHECKLIST-PRE-REQUISITOS.md` sobre verificabilidade do output e natureza do executor.
- **A6 — Critério de "CORE crítico" para HITL é subjetivo → colapsa para "sempre" ou "nunca"** (`code-reviewer`). "Etapas
  que viram lei" não é um predicado que um agente avalia consistentemente. **Correção (coerente com M-T5, defesa
  mecânica):** HITL obrigatório SE a etapa é um gate (veredito binário) OU triagem marcou esforço-F. Booleano, não juízo.

## Furos MÉDIOS/BAIXOS (declarar como limite)

- **M1 — Fase E dá falsa confiança** (`auditor-v2`): `general-purpose` simulando o operador "passa" no encadeamento mesmo
  com COREs semanticamente errados (infere além do briefing). Exigir executor genuinamente sem acesso ao repo, ou ônus da
  prova "usou SÓ o briefing?".
- **M2 — `gerarDossieAprovacao` reescrito do zero é perigoso** (`auditor-v2`): é a peça HITL mais sensível; reescrever sem
  guia gera dossiês com campos `undefined`. Extrair como `gerarDossieAprovacao(listaDeCamposAExtrair)` ou guiar a reescrita.
- **M3 — `regraOrdemTopologica` pressupõe DAG, não pipeline linear** (`auditor-v2`): operador de domínio linear herda
  fábrica que não entende. +checklist de seleção de fábricas na Fase C.
- **B1 — Sobreposição Fase E vs. passo 7.4** (`code-reviewer`): 7.4 = encadeamento incremental (etapa i com i-1); E =
  full-path 1×. Declarar a diferença ou fundir (reduz fadiga do A6).
- **B2 — Degradação graciosa de subagentes não-especificada** (AMBOS): "roda inline" prometido mas não escrito. Cada passo
  que delega precisa da versão inline ao lado.

## Premissas de software disfarçadas de 🟢 universais (lista do auditor)

`contextoDeSubstituicao` (confianca_enum sem análogo criativo) · `montarBriefing` (G2 gaps P0/P1/P2 = criticidade de
software) · `regraEvidenciaObrigatoria` (evidência mecânica pressupõe diff/teste/API) · `regraAncoraRastreavel` (ids
`GAP-01`) · regras O/E/F/FR (pesquisa empírica feita em tarefas de software; "polaridade positiva" pode sufocar domínio
criativo) · `regraCensoConfrontado` (pressupõe etapa de "fontes"). **Todas copiam sem erro de sintaxe mas falham
SEMANTICAMENTE — o pior tipo: REPROVAM ou aprovam errado sem diagnóstico compreensível.**

## Os 4 furos do método: mitigados de verdade ou só declarados?

- **Furo 1 (n=1, réu=juiz):** SÓ DECLARADO. Para a skill é PIOR que para um CORE: a skill n=1 compromete o motor de todos
  os projetos. A declaração existe; a consequência da ESCALA não está destacada.
- **Furo 2 (cego não-independente):** PARCIAL, mas a arquitetura não incorpora a ressalva. Fase D diz "executor cego +
  adversário" — dois LLMs do mesmo modelo/ambiente/conversa são "variações de temperatura, não testemunhas".
- **Furo 3 (adversarial fácil):** mitigado no META-MÉTODO (passo 7.3), mas a skill delega ao operador SEM o roteiro do
  adversário. Quem não leu o `_RETRO` planta o ciclo óbvio de 2 nós.
- **Furo 4 (juiz=autor):** SÓ DECLARADO. "Teste do novato" ainda é julgamento (quem decide se o novato "usou só o
  briefing"?). Proteção operacional disponível (executor sem acesso ao repo) NÃO está prescrita na skill.

## Pré-trabalho não-contabilizado (o que a Fase 4 escondeu)

1. **Extrair as fábricas F3/F4/F6/F7** de `pipeline.config.mjs` em funções parametrizadas, com testes (= C1). O maior bloco.
2. **Construir o `pipeline.engine.mjs`** (não existe) — separar as fábricas genéricas das ~30 regras de domínio no arquivo de 99 KB.
3. **`pipeline.config.template.mjs` + `e2e.template.mjs` parametrizados** — não existem; escrever e validar rodando 1×.
4. **Separar HITL genérico do HITL de domínio** (F2 `gerarDossieAprovacao`, F9 `ETAPA_CENSO_FONTES`).
5. **Operacionalizar o passo 4** em procedimento (hoje é uma pergunta).

---

## Decisão do delegador (o loop 5→4/3)

Os achados são legítimos e convergentes. **Não escrevo a skill como está.** Em vez de um loop pesado (reabrir Fases 3-4
inteiras), aplico as correções como uma **REVISÃO DA ARQUITETURA (Fase 4-bis)** que reduz escopo e honestidade do
blueprint, registrada antes da Fase 6:
- **C1+A1+A2 + pré-trabalho 1–4:** reduzir a ambição do scaffold — NÃO prometer fábricas extraídas. O scaffold entrega o
  motor copiável (`dag.mjs`, que é genuinamente copiável) + as 4 fábricas REAIS que já existem + as regras de domínio
  marcadas "EXEMPLO — reescreva". A extração das F3/F4/F6/F7 vira **dívida em ABERTO** (trabalho futuro opcional do motor),
  não pré-requisito da skill. Isso desbloqueia a Fase 6 sem o maior bloco de esforço.
- **C2:** reclassificar os 🟢 semânticos → ⚪ e a Fase C/D ganham o passo "defina X no seu domínio".
- **C3:** SKILL.md estritamente ponteiro (≤8 KB); 3 recursos; "uma única skill" preservada (o trade-off de reabrir a
  Decisão 1 é registrado mas não acionado — cabe ao operador se a viabilidade brigar de novo na escrita).
- **A3+A6:** passo 4 vira checklist de predições falsificáveis; HITL-crítico vira booleano (gate OU esforço-F).
- **A4+A5:** template com nomes abstratos; +3 perguntas no checklist de pré-requisitos.
- **M1–M3, B1–B2, Furos 1–4:** declarados como LIMITES da skill (a Fase A força o aceite) — a Fase 7 é o único teste real.

Estas correções entram diretamente na Fase 6 (escrever a skill) como restrições de design — o `builder` recebe o
blueprint JÁ corrigido. Não há perda: o pré-mortem evitou escrever uma skill que prometia um scaffold inexistente.