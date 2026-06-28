# Gap Analysis na indústria de software/produto — como confrontar "o que temos" com "o que a feature precisa"

> Pesquisa local que fundamenta a **etapa 3 (GAP)** da state machine.
> Cada prática vem com evidência e fonte citada (engenharia de requisitos, fit-gap/ERP, PMI/BABOK, Agile).
> Diátaxis: **Explanation**. Consulte `docs/INDEX.md` antes de redescobrir.

---

## Resumo executivo

Gap analysis é uma disciplina madura, não um exercício ad-hoc. Em todas as escolas pesquisadas
(fit-gap de ERP, engenharia de requisitos, PMI/BABOK, Agile) o padrão é o mesmo e tem três
movimentos: **(1) defina o alvo (to-be / requisitos) de forma verificável; (2) inventarie o estado
atual (as-is / capacidades existentes) com base em evidência, não percepção; (3) confronte os dois,
item por item, classificando cada requisito numa taxonomia fechada.** O delta entre as-is e to-be
*é* o gap.

A descoberta mais importante para nós: a indústria **não classifica em "tem / não tem" (binário)**.
O padrão consolidado é uma escala de **quatro categorias** — **Fit** (já atende), **Partial Fit**
(atende com ajuste/configuração), **Gap** (não atende, precisa construir) e **Not Applicable** (fora
de escopo) — e, ortogonalmente, um **grau** (gap total / gap parcial / sem gap). Isso mapeia quase
1:1 nas nossas quatro saídas pretendidas (reusável / incerto / falta / no-go). A distinção
"falta" × "existe mas precisa mudar" × "pronto pra reusar" **já é a espinha dorsal do fit-gap**, não
uma invenção nossa.

O instrumento que torna a confrontação *sistemática* (e não "na cabeça do arquiteto") é a
**Requirements Traceability Matrix (RTM)** / **Requirements Coverage Analysis**: cada requisito é
rastreado até o componente que o satisfaz. Requisito sem componente que o cubra = **gap**; componente
sem requisito que o justifique = **orphan** (sinal de escopo inflado). A incerteza ("não sei se a API
aguenta isso") é tratada como um tipo próprio de item, resolvido por **Spike** (pesquisa time-boxed),
e o "fora de escopo de propósito" tem nome próprio: **Won't-have** do MoSCoW. As armadilhas conhecidas
— *analysis paralysis*, viés subjetivo, escopo difuso — reforçam que a etapa precisa de fronteira
explícita e evidência rastreável, exatamente o que nosso pipeline já entrega nas etapas 1 e 2.

---

## Práticas com evidência

### 1. O esqueleto universal: as-is → to-be → delta

Toda gap analysis, independente da escola, é "a diferença entre o estado atual (as-is) e o estado
desejado (to-be)". O delta entre os dois é, literalmente, a definição de gap:

- "GAP analysis is simply the difference between the AS-IS business/systems process scenario and its
  TO-BE equivalent." (LinkedIn / Victor Nwadu)
- "A fit-gap analysis is done to build the bridge between what is and what needs to be." (Intuit/QuickBooks)
- A comparação as-is × to-be "helps in identifying the difference between current and target (future)
  business states, and identification of these gaps forms the basis of any business process
  improvement." (Medium / PRIME BPM)

**Ordem canônica (importante):** define-se o **to-be primeiro**, depois o as-is. "Every gap analysis
begins with clarity about the destination — the future state must be defined in measurable, specific
terms." Só então "an honest and evidence-based assessment of where things stand today… grounded in
facts rather than perceptions." (Institute Project Management; PMI Guide to Business Analysis lista
Gap Analysis como *tool and technique* para "determining future state").

> **Lição para nós:** o "to-be" da nossa etapa é **o que a feature precisa**; o "as-is" são os dois
> entregáveis que entram (MAPA do código + CONTRATO REAL da API). A etapa 3 não produz nem o alvo nem
> o inventário — ela faz **só o delta**. Isso confirma que GAP é etapa de *raciocínio/confrontação*,
> não de descoberta.

### 2. A classificação fechada: Fit / Partial Fit / Gap / Not Applicable

Esta é a prática central e a mais convergente entre fontes. Em fit-gap de ERP/CRM, cada requisito é
classificado numa de **quatro categorias**:

| Categoria | Significado (citação) |
|-----------|------------------------|
| **Fit** | "fully supported by the system" — "areas where the current system meets or exceeds requirements" |
| **Partial Fit** | "supported through configuration" — "the system partially supports processes, perhaps needing minor modifications or additional configurations" |
| **Gap** | "requires customization or workaround" — "areas where the system falls short of requirements" |
| **Not Applicable** | "irrelevant to the organization" |

Fontes: ERP Research (glossário), Aha!, Microsoft Learn, Elements.cloud.

**Ortogonal à categoria, registra-se o GRAU do gap:** "the degree of the GAP is also recorded, i.e.,
is it a Full GAP, a Partial GAP, or No GAP, to provide the information needed to PRIORITIZE each
requirement set." (Infotivity)

E ainda há uma **tipagem do gap por natureza** (não só por tamanho): "categorize gaps into types such
as **functional** (missing functionalities), **performance** (inadequacies in performance levels), or
**usability**." (gapconsultingsolutions / NetSuite). Em integração de sistemas a questão técnica é
afiada: "the key issue is not simply whether data can move between systems, but whether your [sistema]
can support the structures, identifiers, objects, and communication methods required." (SG Systems) —
isto é exatamente um gap de API.

> **Lição para nós:** a tríade que o usuário pediu — distinguir **"falta"** de **"existe mas precisa
> mudar"** de **"já pronto pra reusar"** — **é exatamente Gap / Partial Fit / Fit.** Não precisamos
> inventar taxonomia; precisamos *adotar* a do fit-gap e renomeá-la para o nosso domínio (API + código).

### 3. O regrinha de ouro do fit-gap: NÃO reconstrua o que já é "Fit"

A razão de existir do passo "Fit" não é burocrática — é evitar retrabalho. Microsoft Learn é explícito:

> "Whenever a 'fit' occurs (meaning, the analysis already solves the requirement), you need to
> **identify it and ensure that it's not recreated by building a custom-developed feature**.
> Additionally, the person who performs the fit gap analysis should have a good understanding of the
> app's out-of-the-box features." (Microsoft Learn, *Categorize business requirements and perform gap
> fit analysis*)

Microsoft também define os campos mínimos que cada item da análise deve carregar — um molde de
entregável pronto:

- **Severity/category** — fit, configured, custom, ou other (as categorias exatas ficam a critério do time);
- **Level of effort** — low/medium/high ou 1–10 / t-shirt sizes (regra: seja *consistente*);
- **Priority** — em geral vem do negócio, mas o arquiteto pode elevar itens que sustentam a fundação;
- **Implementation notes** — backup de alto nível das suposições ("Add a N:1 relationship to contact"),
  não a especificação detalhada.

> **Lição para nós:** o "o que já dá pra reusar" não é um luxo do nosso entregável — é o **objetivo
> primário** do fit-gap segundo a Microsoft (evitar recriar o que existe). E os 4 campos do item
> (categoria, esforço, prioridade, nota) são um esqueleto direto para o output schema da etapa.

### 4. O instrumento que torna a confrontação sistemática: RTM / Requirements Coverage Analysis

Para a análise não ser "feita na cabeça" (Microsoft admite que arquitetos a fazem mentalmente em
projetos pequenos), a engenharia de requisitos usa a **Requirements Traceability Matrix (RTM)** e a
**Requirements Coverage Analysis** (técnica formal do PMI-PBA):

- RTM é "a structured document that **links requirements to the artifacts that implement and verify
  them**… tracking what happens to each individual requirement from baseline to go-live." (Ketryx)
- BABOK v3 define rastreabilidade como "the ability for tracking the relationships between sets of
  requirements and designs **from the original stakeholder need to the actual implemented solution**"
  (e chama a matriz de *Coverage Matrix*). (modernanalyst / business-analysis-excellence)
- PMI-PBA: Requirements Coverage Analysis "examines how thoroughly project requirements are addressed
  by the solution components" mapeando requisito → componente e determinando se "each requirement is
  adequately covered." (TrustEd Institute)

A coverage analysis usa os **três estados que espelham o fit-gap**:

| Estado de cobertura | Definição (PMI-PBA / Visure) |
|---------------------|------------------------------|
| **Covered / Satisfied** | requisito com componente(s) e verificação correspondentes |
| **Partially covered** | "addressed by some but not all solution components" |
| **Not covered** | "lacking any associated solution component or test verification" → **risco/gap** |

**Bidirecionalidade — onde os dois tipos de gap aparecem:**

- **Forward** (need → requirement → componente): requisito que não chega a nenhum componente = **gap**
  ("requirements without corresponding implementation").
- **Backward** (componente → requirement → need): componente que não rastreia a nenhum requisito =
  **orphan**, "a product feature developed that no one remembers asking for or authorizing" — sinal de
  escopo inflado. (modernanalyst)
- "Unlinked items become visually apparent through missing connections in this grid structure."
  (modernanalyst) — é literalmente uma matriz onde a célula vazia *é* o achado.

> **Lição para nós:** uma **matriz "requisito da feature × o que o as-is oferece"** é o método para
> tornar a confrontação sistemática e auditável. Cada linha = uma necessidade da feature; a célula
> aponta o endpoint/componente que a satisfaz (ou vazio = gap). Célula vazia = falta; célula com
> ressalva = Partial Fit; coluna do as-is sem nenhuma linha = capacidade existente não usada (não é
> problema, mas vale registrar). Isso transforma "o que falta?" de opinião em **varredura linha-a-linha**.

### 5. Incerteza ≠ gap: o tipo "preciso investigar" e o Spike

Nem todo item é resolvível na hora da análise. Quando "não sei se isso é viável / não consigo estimar",
o item **não é** um gap nem um fit — é uma **incerteza**, e a resposta padrão Agile é o **Spike**:

- Spike é "a time-boxed research activity that helps teams explore uncertainties and gain the knowledge
  they need to make informed decisions… generate knowledge or prototypes that inform future work."
  (Wrike; gustavodefelice)
- SAFe: spikes existem para "gain the knowledge necessary to **reduce the risk of a technical approach,
  better understand a requirement, or increase the reliability of a story estimate**", com dois tipos —
  **technical spike** (viabilidade/abordagem) e **functional spike** (requisito pouco claro). (Scaled
  Agile Framework)
- Gatilhos para abrir spike: "explore different technologies/architectures", "a feature is vague or has
  unclear requirements", "assess whether a solution is feasible", "a story difficult to estimate due to
  technical unknowns." (Medium / Bayadi)

Isto conecta com **feasibility analysis** da engenharia de requisitos: requisitos devem ser verificados
como "feasible" — "technically feasible requirements… can be implemented within the given operating
environment, budget, schedule, available technology." (SWEBOK; NASA SWE-051) Quando a viabilidade é
incerta, "develop a prototype or PoC to test key functionalities" (Apriorit) — ou seja, um spike.

> **Lição para nós:** "incertezas que pedem investigação (Spike)" é uma **categoria de primeira classe**
> reconhecida pela indústria, distinta de gap. O critério para mandar um item ao Spike é: a confrontação
> as-is×to-be **não consegue concluir** Fit/Partial/Gap com a evidência em mãos (faltou dado, viabilidade
> técnica aberta, estimativa impossível). É a "saída de escape" honesta da etapa — e já existe como
> branch no nosso PIPELINE (etapa 3 → Spike → decisão).

### 6. No-go / fora-de-escopo tem nome: Won't-have (MoSCoW)

Declarar explicitamente o que **não** será feito é prática deliberada, não omissão:

- MoSCoW "Won't Have (this time)" = "items explicitly excluded from the current scope… acknowledging a
  valid request and strategically deferring it." (Visual Paradigm; Stoneseed)
- Função: "manage expectations and create a buffer against scope creep. **MoSCoW only works against a
  constraint. Without a boundary, everything defaults to Must Have. State the constraint explicitly to
  make the sort honest.**" (Stoneseed) — observe o paralelo direto com "analysis paralysis" / "lack of
  clear scope" entre as armadilhas (LeanDataPoint).
- No fit-gap, o equivalente é a categoria **Not Applicable** ("irrelevant to the organization"). (ERP
  Research)

> **Lição para nós:** "no-gos declarados explicitamente" não é firula — é o que mantém a etapa honesta
> e evita scope creep. Cada no-go deve vir com **motivo** (fora do escopo desta feature / adiado /
> inviável), espelhando o "this time" do Won't-have e o nosso próprio `DESCARTADO.md`.

### 7. Armadilhas conhecidas da gap analysis (o que NÃO fazer)

Fontes de revisão (LeanDataPoint; ResearchGate "Gap Analysis") listam falhas recorrentes — todas
endereçáveis por design no nosso pipeline:

| Armadilha | Descrição | Como nosso pipeline já mitiga |
|-----------|-----------|-------------------------------|
| **Analysis paralysis** | "too much data, complex models… decisions are delayed" | etapa time-boxed, saída por categorias fechadas, sem reabrir descoberta |
| **Viés subjetivo** | "inadequate, inaccurate, or anecdotal data… relying only on numbers without context" | as-is vem com **evidência ao vivo** (etapa 2) e mapa com evidência no código (etapa 1) |
| **Escopo difuso** | "without a clear scope/objectives… jumping straight into solutions" | to-be = a feature; no-gos explícitos delimitam a fronteira |
| **Silos** | "carried out by a single department… overlooks interdependencies" | o MAPA (DAG, etapa 1) já traz as correlações/blast radius |
| **Gap subjetivo/contestado** | "what might be a worthwhile gap is a more subjective and contested affair" | classificação ancorada em Fit/Partial/Gap com nota de evidência por item |

> **Lição para nós:** a etapa deve **proibir descobrir coisa nova** (isso é etapa 1/2) e **exigir
> evidência rastreável por item** (de onde veio o veredito Fit/Partial/Gap). Sem isso, a análise vira
> opinião — exatamente a falha "gap subjetivo/contestado".

---

## Aplicação à etapa 3 (GAP)

A etapa 3 do nosso pipeline (`error-detective`, após Descoberta da API) é uma implementação direta da
disciplina de fit-gap + RTM. Mapeamento explícito:

**Entradas (o as-is, já produzido — a etapa NÃO redescobre):**
- **MAPA do código** (etapa 1 / CORE-DAG): componentes tocados, correlações, blast radius — cobre a
  parte "o sistema tem/não tem" e as interdependências (mitiga a armadilha "silos").
- **CONTRATO REAL da API** (etapa 2): endpoints confirmados ao vivo, shapes reais, limites, com nível
  de confiança por campo — é o as-is *com evidência* (mitiga "viés subjetivo").

**O alvo (o to-be):** o que a feature precisa. Definido primeiro (ordem canônica), em termos
verificáveis. Sem to-be claro, "everything defaults to Must Have".

**O método sistemático (não ad-hoc):** construir a **matriz de cobertura "necessidade da feature ×
oferta do as-is"**. Uma linha por necessidade; a célula aponta o endpoint/componente que a satisfaz.
Varredura linha-a-linha → a célula vazia *é* o gap. Isso substitui o "fit-gap na cabeça do arquiteto"
(que a Microsoft admite ocorrer) por uma confrontação auditável.

**As saídas, mapeadas na taxonomia da indústria** (esta é a contribuição central da pesquisa):

| Saída pretendida da etapa 3 | Categoria fit-gap / coverage equivalente | Regra de decisão |
|-----------------------------|------------------------------------------|------------------|
| **O que a API não oferece** | **Gap** (full) — "system falls short" / "not covered" | necessidade sem endpoint que a cubra, confirmada pela ficha de API |
| **O que o sistema não tem** | **Gap** (functional gap) | necessidade sem componente no MAPA |
| **Existe mas precisa mudar** | **Partial Fit** — "supported with configuration/minor modification" | endpoint/componente existe mas shape/limite/comportamento diverge do que a feature pede |
| **O que já dá pra reusar** | **Fit** — "meets or exceeds requirements" | necessidade satisfeita as-is → **marcar para NÃO reconstruir** (regra de ouro da Microsoft) |
| **Incertezas → Spike** | item **não-conclusível** → Spike (technical/functional) | a confrontação não fecha Fit/Partial/Gap com a evidência atual (viabilidade aberta, dado faltante, estimativa impossível) |
| **No-gos** | **Won't-have** (MoSCoW) / **Not Applicable** | fora de escopo de propósito — **sempre com motivo** |
| **Complexidade estimada** | **Level of effort** (Microsoft) | simples/média/alta — consistente entre itens |

**Campos por item (esqueleto de output schema, herdado da Microsoft + RTM):**
- `necessidade` (linha do to-be) · `categoria` (fit | partial | gap | spike | no-go) ·
  `evidência` (endpoint da ficha de API / nó do MAPA que sustenta o veredito) ·
  `esforço` (simples|média|alta) · `nota` (backup de alto nível, não spec) ·
  para no-go: `motivo`; para spike: `pergunta a responder`.

**Invariantes que o CORE da etapa deve ensinar (M3 — separar mecânica de leitura da demanda):**
- *Invariante (regra do CORE):* toda necessidade da feature recebe **exatamente uma** das categorias;
  toda categoria Gap/Partial cita a evidência que a fundou; todo item Fit é marcado "não reconstruir";
  todo no-go tem motivo; todo spike tem pergunta fechável. **Proibido descobrir** dado novo (isso é
  etapa 1/2) — só confrontar o que entrou.
- *Variável (lido da demanda):* quais são as necessidades, quantas, e o veredito de cada uma — extraído
  do confronto MAPA+API × feature, nunca fixado no CORE.

**Anti-armadilha (alinhado a M4 e ao portão anti-viés do projeto):** o critério de aceitação deve checar
**consistência**, não só presença — i.e., não basta "listou gaps"; cada veredito precisa ser rastreável
à evidência de entrada (senão recai em "gap subjetivo/contestado"). Time-box a etapa para evitar
*analysis paralysis* — ela conclui com a tabela classificada, não com nova investigação.

---

## Fontes

**Fit-gap analysis (ERP/CRM/requisitos):**
- ERP Research — Fit-Gap Analysis (glossário, 4 categorias): https://www.erpresearch.com/glossary/fit-gap-analysis
- Microsoft Learn — *Perform fit gap analysis* (módulo): https://learn.microsoft.com/en-us/training/modules/fit-gap-analysis/
- Microsoft Learn — *Categorize business requirements and perform gap fit analysis* (campos do item, regra "não recriar o fit"): https://learn.microsoft.com/en-us/training/modules/fit-gap-analysis/4-analysis
- Infotivity — Fit/Gap Requirements Identification (grau: full/partial/no gap; priorização): https://www.infotivity.com/fit-gap.html
- Aha! — Fit-gap analysis template (Fit/Partial Fit/Gap/Not Applicable): https://www.aha.io/roadmapping/guide/templates/create/fit-gap-analysis
- Gap Consulting Solutions — Fit-Gap for NetSuite (tipos de gap: functional/performance/usability): https://www.gapconsultingsolutions.com/post/fit-gap-analysis-the-key-to-tailored-project-success
- Elements.cloud — Perform fit-gap analysis: https://support.elements.cloud/en/articles/2462511-perform-fit-gap-analysis-and-capture-complete-business-requirements-and-user-stories
- Requirements Elicitation via Fit-Gap Analysis (paper acadêmico, CAiSE — Utrecht): https://webspace.science.uu.nl/~dalpi001/papers/spij-dalp-brin-21-caise.pdf
- ResearchGate (mesmo paper, página): https://www.researchgate.net/publication/352687380_Requirements_Elicitation_via_Fit-Gap_Analysis_A_View_Through_the_Grounded_Theory_Lens

**As-is vs to-be / delta:**
- LinkedIn (Victor Nwadu) — GAP and FIT/GAP analysis (definição as-is×to-be): https://www.linkedin.com/pulse/gap-fitgap-analysis-bridging-victor-nwadu
- Intuit/QuickBooks — ERP gap analysis ("bridge between what is and what needs to be"): https://www.intuit.com/enterprise/blog/financials/gap-analysis-erp/
- PRIME BPM (Medium) — As Is / To Be / To Do process mapping: https://medium.com/@BPMSoftwareAustralia/a-complete-guide-to-as-is-to-be-and-to-do-process-mapping-2e88c502c1f1
- Lucidchart — Documenting and analyzing your as-is process: https://www.lucidchart.com/blog/as-is-process-analysis

**PMI / BABOK / Requirements Traceability & Coverage:**
- The PMI Guide to Business Analysis (Gap Analysis como tool & technique): https://bpmtraining.net/wp-content/uploads/2020/11/The_PMI_Guide_to_Business_Analysis.pdf
- TrustEd Institute (PMI-PBA) — Requirements Coverage Analysis (covered/partially/not covered): https://trustedinstitute.com/concept/pmi-pba/requirements-traceability-monitoring/requirements-coverage-analysis/
- Visure Solutions — Requirements Coverage Analysis (tested/untested/partially tested): https://visuresolutions.com/alm-guide/requirements-coverage/
- ModernAnalyst — Introduction to Requirements Traceability (forward/backward, orphan): https://www.modernanalyst.com/Resources/Articles/tabid/115/ID/1722/An-Introduction-to-Requirements-Traceability.aspx
- Ketryx — Ultimate Guide to RTM (requisito → artefatos que implementam/verificam): https://www.ketryx.com/blog/the-ultimate-guide-to-requirements-traceability-matrix-rtm
- Business Analysis Excellence — RTM Demystified (BABOK "Coverage Matrix"): https://business-analysis-excellence.com/requirements-traceability-matrix-demystified/
- Institute Project Management — Gap Analysis in Project Management (to-be primeiro, evidência): https://instituteprojectmanagement.com/blog/gap-analysis-in-project-management/

**Spike / feasibility / incerteza:**
- Scaled Agile Framework — Spikes (technical vs functional; reduzir risco/estimativa): https://framework.scaledagile.com/spikes
- Wrike — What is a Spike Story in Agile (time-boxed, gera conhecimento): https://www.wrike.com/agile-guide/faq/what-is-a-spike-story-in-agile/
- Jayakishor Bayadi (Medium) — Spike Stories: what/why/when (gatilhos): https://medium.com/@jayakishorebayadi1/spike-stories-in-agile-what-why-and-when-to-use-them-1a78066cf1a3
- SWEBOK — Chapter 1: Software Requirements (feasibility, validação): http://swebokwiki.org/Chapter_1:_Software_Requirements
- NASA SWE-051 — Software Requirements Analysis (technically feasible): https://swehb.nasa.gov/display/SWEHBVC/SWE-051+-+Software+Requirements+Analysis
- Apriorit — Technical Feasibility Study (PoC/protótipo para validar viabilidade): https://www.apriorit.com/dev-blog/technical-feasibility-analysis

**No-go / escopo (MoSCoW) e armadilhas:**
- Stoneseed — MoSCoW Prioritisation (Won't-have; "state the constraint explicitly"): https://www.stoneseed.co.uk/moscow-prioritization/
- Visual Paradigm — The Power of the 'Won't Have' Category: https://ai.visual-paradigm.com/blog/the-power-of-the-wont-have-category-in-moscow-prioritization-framework/
- LeanDataPoint — Top Gap Analysis Mistakes (analysis paralysis, viés, escopo, silos): https://leandatapoint.com/blog/gap-analysis-mistakes-and-solutions
- SG Systems Global — ERP Gap Analysis for integration (gap de API/estruturas): https://sgsystemsglobal.com/erp-gap-analysis/

**Build vs buy vs reuse (decisão sobre o "Fit reusável"):**
- Product School — Build vs Buy (2026): https://productschool.com/blog/leadership/build-vs-buy
- OutSystems — Build vs Buy / "customize vs compose" (reusar capacidades existentes): https://www.outsystems.com/blog/posts/build-vs-buy/
