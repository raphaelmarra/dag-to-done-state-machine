# research/0016 — Destilação de conhecimento em meta-prompts: estado da arte (Fase 2 da A022)

> **Origem:** Fase 2 do plano `docs/superpowers/plans/2026-06-30-skill-replicavel-state-machines.md`, executada pelo
> agente `search-specialist` em 2026-06-30. Pesquisa web com fontes primárias citadas. Funda o meta-método (Fase 3).
> **Status:** insumo de descoberta (não cristaliza nada). **Achado mais acionável (anti-viés):** o "batismo +
> expansão" precisa de um passo de VERIFICAÇÃO DE AJUSTE ao termo canônico — senão vira viés de confirmação (a
> Grounded Theory adverte contra forçar o achado no termo pronto). Ver Veredito.

---

## Resumo executivo

- **Nosso "CORE = meta-prompt que gera o briefing da etapa" é o padrão "conductor→experts"** de Suzgun & Kalai
  (Stanford/OpenAI, 2024). Validado na literatura. Falta o *loop de verificação dentro da geração* que o conductor deles faz.
- **Maior lacuna: ausência de otimização orientada por métrica.** DSPy (Stanford) *compila* o prompt de exemplos +
  métrica e re-otimiza; nós destilamos à mão (M2) e congelamos em ADR — sem passo de "compilar contra casos e medir".
- **Nosso M2 é, em vocabulário formal, "Externalização → Combinação" do modelo SECI.** Ganhamos nome canônico — e
  descobrimos que falta a 4ª fase: **Internalização** (o método volta a ser tácito pela prática repetida).
- **M4 é fraco perto da Cognitive Task Analysis.** A CTA tem técnicas formais de elicitação (Critical Decision Method,
  think-aloud, probes) muito mais rigorosas que "escrever um briefing perfeito".
- **"Batismo + expansão pelo nome canônico" NÃO tem nome formal único** — é composto de três técnicas reais
  (Externalização nomeada / ontology grounding / sensitizing concepts). Adotar o vocabulário, COM a ressalva anti-viés.
- **Golden Path / Paved Road é o análogo organizacional**, mas entrega mais que nós: gerador + tutorial-do-porquê +
  dono + ciclo de manutenção. Nosso CORE explica o critério mas não tem dono nem ciclo de revisão por etapa.
- **ExpeL e Voyager apontam o que ainda não trilhamos:** destilar o método dos próprios casos automaticamente (vs.
  nossa destilação manual). Reusável: indexar/recuperar skills por descrição semântica; "só entra na biblioteca o que
  passou na auto-verificação".

## 1. Meta-prompting / automatic prompt engineering

**1a. Meta-Prompting (conductor→experts)** — Suzgun & Kalai, arXiv 2401.12954. Um LLM "conductor" task-agnóstico
decompõe, instancia experts e VERIFICA antes de integrar (+17% sobre baselines). Reusar: é a validação do nosso padrão.
Falta: o loop de verificação DENTRO da geração (no nosso pipeline a verificação está no porteiro ENTRE etapas).

**1b. APE** — Zhou et al., ICLR 2023 (arXiv 2211.01910). A instrução é um PROGRAMA a ser otimizado por busca + score,
não uma redação a fixar. Supera baseline humano em 19/24 tarefas. Falta-nos uma "função de score" do CORE; APE sugere
que 1-2 casos (M4) é pouco para confiar.

**1c. DSPy** — Stanford NLP (github.com/stanfordnlp/dspy). Signatures (WHAT) / Modules (HOW) / Optimizers (medir-e-
melhorar). **A mais importante p/ nós:** quase isomórfica ao nosso (schema=contrato / CORE=regras / porteiro=aceitação),
MAS DSPy *fecha o loop com métrica e re-compila* — nós paramos em "cristalizar em ADR". Tensão com M1: DSPy é até MAIS
dinâmico (descobre o texto do prompt em runtime de compilação); se levarmos M1 a sério, deveríamos ter um "compilador
de CORE" contra casos.

## 2. Knowledge distillation aplicada a PROMPTS

**COLLEAGUE.SKILL** (arXiv 2605.31264) converte traces humanos em pacotes de skill (SKILL.md/work.md/persona.md/
manifest). Cinco propriedades-alvo: **portable, inspectable, composable, correctable, governable** — excelente DoD p/
nossa skill. Separa **work track (capacidades) × persona track (estilo)** = nosso M3 (invariante × leitura da demanda).
**Lacuna grave que eles assumem e nós deveríamos:** não garantem fidelidade ao expert; falta-nos um passo de
*verificação de fidelidade* da destilação. Risco: destilar o que ACHAMOS que o expert faz (M2 introspectivo), não o que ele faz.

## 3. Extração de conhecimento tácito (SECI, CTA)

**SECI (Nonaka & Takeuchi):** Socialização→Externalização→Combinação→Internalização. Externalização (tácito→explícito
via metáfora/conceito/modelo) é "o processo quintessencial". **Nosso M2 é literalmente Externalização → Combinação.**
Falta-nos a **Internalização** (o método virar fluente pela prática) e a **Socialização**. Ressalva: há crítica
empírica ao SECI — usar como vocabulário, não como lei.

**Cognitive Task Analysis + Critical Decision Method (Hoffman & Crandall; Brown/Power/Gore 2024):** protocolos formais
de elicitação do tácito — *probes* ("o que te fez decidir X?", "que pista um novato não veria?", "o que daria errado
se...?"). **Maior fonte de melhoria do nosso M2:** trocar "escrever o briefing perfeito" (introspecção) por um roteiro
de probes que extrai *cues* e heurísticas de decisão → viram as regras do CORE. CTA distingue *o que o expert diz que
faz* de *o que ele faz* — nosso método não. CTA recomendaria N > 1-2 casos.

## 4. Golden path / paved road

Spotify "Golden Path" / Netflix "Paved Road", materializados em Backstage Software Templates + Scaffolder. **Mais que o
template:** incluem tutorial-do-PORQUÊ (TechDocs), dono, caminhos de suporte, *teste com new-hire real* como QA, e
loops de feedback. Nossa SM já É um golden path executável. **O que eles têm a mais:** (a) separam gerador × tutorial-
do-porquê (nós misturamos critério e mecânica no CORE); (b) dono + ciclo de manutenção por path; (c) "teste do novato".
Reusar: cada CORE com um "teste do novato" (agente sem contexto executa só com o briefing?) + dono/ciclo. **Tensão com
M1:** golden paths são deliberadamente OPINATIVOS e FIXOS — a literatura argumenta que *fixar* é a fonte do ganho.
Revisitar onde M1 ajuda e onde atrapalha.

## 5. "Batismo + expansão" — tem nome formal?

**Não há termo único. É composto de três técnicas reais:**
- **Batismo (dar o nome canônico)** = **Externalização** (SECI) + **sensitizing concepts** (Grounded Theory,
  Blumer/Bowen). O nome torna o conceito comunicável/memorável (**labeling effect**, **boundary object**).
- **Expansão pelo nome** = **ontology/terminology grounding** (Jakulin & Mladenić 2005): ancorar o conceito local no nó
  canônico da literatura e HERDAR a vizinhança conceitual (o conceito "é maior"). Também o mecanismo do **pattern
  language** (Alexander → GoF: nomear o padrão conecta-o à rede).
- **Por que nomear destrava** = **boundary objects** (Star & Griesemer 1989) + **labeling effect** (PMC8770803).

## 6. Agentes que aprendem método de exemplos

**ExpeL (AAAI 2024):** abstrai insights cross-task de trajetórias de sucesso/falha; recupera por similaridade.
**Voyager:** skill library de código; uma skill só entra após *self-verification*, indexada por embedding da descrição,
recuperada por similaridade e composta. Reusar: (1) cada CORE com uma "descrição canônica" indexável; (2) admissão por
auto-verificação (M4 automatizado); (3) insights cross-etapa. Contradição: aprendem de MUITAS trajetórias; M4 (1-2
casos) é regime de dados pobre.

## Confronto: nosso método vs. a literatura

| Aspecto | O que fazemos | A literatura tem a mais | Ação sugerida |
|---|---|---|---|
| Forma do CORE | meta-prompt por etapa (conductor→expert) | loop de verificação DENTRO da geração | auto-verificação no gerador, não só no porteiro |
| Como o CORE nasce | escrito à mão (M2) | DSPy/APE COMPILAM de exemplos+métrica | criar "métrica de etapa" + passo de compilação/otimização |
| Elicitação do tácito | introspecção ("briefing perfeito") | CTA: probes do CDM, think-aloud, N experts | roteiro de probes (cues+heurísticas) no lugar do briefing perfeito |
| Validação | M4: 1-2 casos | ExpeL/Voyager/CTA: muitas trajetórias + auto-verificação; COLLEAGUE: revisão de fidelidade | subir N; passo de "verificação de fidelidade" da destilação |
| Vocabulário | M2/M3/M4 caseiros | SECI (Externalização/Combinação) + 4ª fase Internalização | mapear M2-M4 ↔ SECI; adicionar Internalização |
| Empacotamento | CORE+schema+porteiro | Golden Path: gerador × tutorial × dono × ciclo; COLLEAGUE: 5 propriedades | adotar as 5 propriedades como DoD; dono+ciclo por CORE |
| Reuso/recuperação | COREs estáticos | Voyager/ExpeL indexam por descrição e compõem | descrição canônica indexável por CORE |
| Filosofia | M1: dinâmico sempre | Golden Path: FIXAR deliberadamente é o ganho | mapear onde fixar > descobrir |

## Veredito sobre o "batismo + expansão"

**Tem nome único?** Não — é composto, mas cada metade tem técnica formal (boa notícia: não é folclore).
- "Batismo" = Externalização (SECI) + sensitizing concepts; justificado por labeling effect / boundary object.
- "Expansão" = ontology/terminology grounding (ancorar no nó canônico e herdar a vizinhança) + pattern language.

**O que adotar (com a RESSALVA ANTI-VIÉS — o achado mais acionável da pesquisa):**
1. Adotar o vocabulário de **grounding** para o passo de expansão.
2. Adotar **boundary object / labeling effect** como o PORQUÊ de nomear destravar reuso (não é estética).
3. **A literatura nos CONTRADIZ aqui:** a Grounded Theory adverte contra **forçar** o achado no termo pronto —
   sensitizing concepts são *ponto de partida*, e deve-se ir ALÉM deles. Tradução: depois do "batismo", o passo
   seguinte NÃO pode ser só "expandir e adotar tudo o que o termo carrega" — precisa de um passo de **VERIFICAÇÃO DE
   AJUSTE** ("o termo canônico realmente descreve nosso caso, ou estamos espremendo o achado no molde dele?"). Sem
   isso, "batismo + expansão" vira viés de confirmação com aparência de rigor. **Esta é a lacuna central do movimento
   como praticado hoje — e entrada direta para a Fase 3.**

## Fontes

1. arXiv 2401.12954 — Meta-Prompting (Suzgun & Kalai, Stanford/OpenAI). Primária.
2. arXiv 2211.01910 — APE (ICLR 2023). Primária.
3. github.com/stanfordnlp/dspy + docs de optimizers — DSPy, docs oficiais Stanford NLP. Primária.
4. arXiv 2605.31264 — COLLEAGUE.SKILL (destilação automatizada). Recente, validação limitada (autores ressalvam).
5. arXiv 2509.20820 — "Distilling Many-Shot ICL into a Cheat Sheet". Prompt distillation.
6. SECI model — Nonaka & Takeuchi (Wikipedia + knowledge-management-tools.net). Síntese do modelo seminal.
7. core.ac.uk/.../90222.pdf — "SECI model: empirical shortcomings". Crítica (anti-viés).
8. SAGE 10.1177/10944281241271216 — CTA (Brown/Power/Gore, 2024). Revisão acadêmica.
9. Semantic Scholar — Critical Decision Method (Hoffman & Crandall). Primária.
10. engineering.atspotify.com/.../golden-paths — Golden Paths (Spotify). Primária.
11. backstage.spotify.com/.../spotify-templates — Backstage Software Templates. Docs oficiais.
12. redhat.com/.../designing-golden-paths — Red Hat (perspectiva de plataforma).
13. aile3.ijs.si/.../JakulinOntologyGroundingSiKDD2005.pdf — Ontology Grounding (2005). Primária.
14. SAGE 10.1177/160940690600500304 — Bowen, "Grounded Theory and Sensitizing Concepts" (2006). Primária; ressalva anti-viés.
15. Wikipedia — Pattern Language (Alexander → GoF). Síntese do conceito seminal.
16. ScienceDirect — Boundary objects (Star & Griesemer 1989). Síntese acadêmica.
17. PMC8770803 — "The Explanatory Effect of a Label" (labeling effect). Primária.
18. arXiv 2308.10144 — ExpeL (AAAI 2024). Primária.
19. arXiv 2305.16291 + voyager.minedojo.org — Voyager. Primária + site oficial.