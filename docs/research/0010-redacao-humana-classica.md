# 0010 — Técnicas Clássicas de Redação Humana

> Pesquisa deliberadamente focada em **redação humana**. Serve de contraponto a uma pesquisa
> futura sobre *clareza-para-LLM*. A seção "Onde diverge de prompts para LLM" registra
> **hipóteses** sobre o que NÃO transfere — a ser validado contra a outra pesquisa.

## Resumo executivo

A redação humana clara converge em torno de poucos princípios robustos, repetidos por fontes
independentes (Strunk & White, Williams/Bizup, Plain Language, jornalismo, escrita acadêmica):

1. **Clareza nasce da estrutura sintática**, não do vocabulário sofisticado: sujeitos = personagens,
   verbos = ações (Williams). Nominalizações abstratas matam a clareza.
2. **Fluxo (coesão) vem do princípio velho→novo**: cada frase começa com informação já conhecida e
   termina com a nova/importante — que vira o "velho" da frase seguinte (Williams; tema-rema).
3. **Ênfase mora no fim da frase**; o início é o ponto de partida (tema).
4. **Coerência = uma ideia por unidade**: parágrafo com tópico único e topic sentence; texto com tese
   única. Transições explicitam relações.
5. **Concisão**: "omita palavras inúteis" — cada palavra deve trabalhar (Strunk).
6. **Ordem por importância**: pirâmide invertida — o essencial primeiro (jornalismo, NN/g, web).
7. **Voz ativa e palavras comuns** (Plain Language; Strunk).
8. **Paralelismo sintático**: ideias de igual peso em estrutura gramatical igual.

A maioria desses princípios visa um **leitor humano com memória de trabalho limitada, atenção que
decai e que abandona o texto**. Essa premissa é onde mora a possível divergência para LLMs.

## Princípios de redação humana

### A. Sintaxe que carrega o significado (Williams, *Style*)
- **Personagens como sujeitos, ações como verbos.** "Os leitores sentem a prosa como clara quando os
  sujeitos nomeiam personagens e os verbos nomeiam suas ações cruciais."
- **Evite nominalizações.** Transformar verbo em substantivo abstrato ("decidir"→"a decisão",
  "falhar"→"a falha") gera prosa opaca. Na revisão, devolva ao verbo.
- **Topic strings.** Mantenha referências/sujeitos consistentes ao longo do parágrafo para manter o
  leitor orientado.

### B. Coesão: o princípio velho→novo / tema-rema
- Comece a frase com **informação familiar** (mencionada antes ou conhecida em geral); termine com a
  **nova, complexa, importante**. O novo vira o velho que a próxima frase retoma. Isso cria "sensação
  de fluxo" que faz o texto "se sustentar" (Williams).
- Linguisticamente: **tema** (ponto de partida) antes do **rema** (o que se diz do tema); contrato
  **dado-novo** (given-new). Estruturas distintas mas alinhadas em texto bem ordenado.
- **Ênfase ao fim (end-focus / end-weight):** a posição final da frase carrega impacto máximo.

### C. Coerência: unidade e progressão
- **Unidade**: todo parágrafo gira em torno de **uma** ideia; toda ideia se liga à tese. Nada de
  desvios. **Topic sentence** (em geral a 1ª) anuncia o ponto.
- **Transições** (porém, portanto, por exemplo, além disso) tornam **explícitas** as relações lógicas
  entre frases, em vez de deixá-las implícitas.

### D. Concisão (Strunk & White)
- "Omita palavras inúteis": *"Uma frase não deve conter palavras desnecessárias, um parágrafo nenhuma
  frase desnecessária... que cada palavra conte."* Não significa frases curtas, e sim que cada palavra
  trabalhe. Williams complementa: corte preenchimento, redundâncias, troque locuções por uma palavra,
  prefira afirmativas a negativas.

### E. Voz, vocabulário, paralelismo (Strunk; Plain Language)
- **Voz ativa** por padrão ("João jogou a bola", não "A bola foi jogada por João"); passiva só quando
  justificada.
- **Palavras comuns do dia a dia**; termos técnicos só quando necessários e explicados no 1º uso.
- **Paralelismo**: ideias de igual valor em mesma forma gramatical ("ler, escrever e pintar", não
  "ler, escrever e a pintura").
- **Frases de 15–20 palavras em média**; comprimento variado (Plain Language).

### F. Macroestrutura: pirâmide invertida
- O **mais importante primeiro** (quem/o quê/quando/onde/porquê), depois detalhes em ordem
  decrescente. Leitor pode parar a qualquer ponto e ainda entender o essencial. Originou-se do
  telégrafo; reforçado para leitura em tela (NN/g): pessoas escaneiam, não leem linearmente.

## Onde diverge de prompts para LLM (hipóteses)

> Hipóteses a confrontar com a pesquisa de clareza-para-LLM. Premissa-chave: muito da redação humana
> otimiza para **memória de trabalho frágil, atenção que decai e risco de abandono**. Um LLM processa
> o contexto inteiro de uma vez e não "desiste no meio". Logo:

| Princípio humano | Hipótese para LLM |
|---|---|
| **Evitar repetição / elegância e variação lexical** | Provavelmente **atrapalha**. Variar o termo da mesma instrução cria sinônimos que o modelo pode tratar como conceitos distintos. Para LLM: **repetir a instrução-chave** e usar **vocabulário consistente** (um conceito = um termo) tende a ajudar. A "deselegância" de repetir é uma feature, não bug. |
| **Concisão extrema ("omita palavras inúteis")** | **Parcial.** Cortar ruído ajuda, mas redundância *deliberada* (reafirmar a regra crítica, dar exemplo + contraexemplo) pode aumentar aderência. Concisão para LLM ≠ minimizar tokens; é maximizar sinal. |
| **Prosa fluida com transições** | Possivelmente **menos útil que listas/estrutura explícita**. LLMs parecem responder bem a marcadores, numeração, headings, delimitadores (XML/markdown) que tornam a estrutura *parseável*. Transições suaves importam menos que rótulos claros. |
| **Velho→novo / tema-rema (coesão de fluxo)** | **Provavelmente transfere em parte** como ordenação lógica, mas o LLM não depende da "ponte" frase-a-frase para não se perder. Ordem importa mais por **precedência/condicionamento** (instrução antes do conteúdo) do que por fluência. |
| **Ênfase no fim da frase** | Para LLM, efeitos de **posição** existem (primazia/recência no contexto), mas operam em escala de prompt inteiro, não de fim-de-frase. Colocar a instrução crítica no início **e** no fim pode ser melhor que confiar só no fim. |
| **Voz ativa, palavras comuns, frases curtas** | **Transfere bem.** Reduz ambiguidade para humano e máquina. Baixo risco. |
| **Pirâmide invertida (essencial primeiro)** | **Transfere bem e talvez mais forte**: pôr objetivo/instrução/restrições antes do material bruto condiciona o processamento. |
| **Paralelismo sintático** | **Transfere bem**: estrutura paralela em listas de regras reduz ambiguidade e facilita o modelo aplicar uniformemente. |
| **Unidade (uma ideia por parágrafo)** | **Transfere, reforçado**: uma instrução por item/bloco evita instruções compostas que o modelo cumpre pela metade. |

**Síntese da hipótese:** o que é puramente **estético/anti-tédio para humanos** (variação lexical,
evitar repetição, prosa elegante, transições fluidas) é o **principal candidato a descartar** em
prompts. O que é **estrutural/lógico** (clareza sintática, voz ativa, ordem por importância,
paralelismo, uma-ideia-por-bloco) tende a **transferir ou até se fortalecer**.

## Aplicação ao nosso CORE

O CORE é um meta-prompt que **gera briefings**. Recomendações iniciais (a refinar após a pesquisa de
clareza-para-LLM):

1. **Importar do humano (alta confiança):** voz ativa, verbos de ação, palavras comuns, paralelismo
   nas listas de regras (R1–R9), uma-instrução-por-item, e pirâmide invertida — o briefing abre com
   *o que fazer / o que produzir / o que será verificado* antes de qualquer detalhe.
2. **Inverter conscientemente para LLM:** preferir **vocabulário consistente** a variação elegante
   (um conceito = sempre o mesmo termo no CORE e no briefing gerado); permitir **repetição
   deliberada** da restrição crítica (ex.: o output schema) no início e perto do ponto de uso.
3. **Estrutura > fluência:** o briefing gerado deve ser **listável e delimitado** (headings, blocos,
   schema explícito), não prosa corrida — coerência via rótulos, não via transições.
4. **Manter de Williams o núcleo:** sujeitos concretos, evitar nominalizações abstratas nas regras
   ("Verifique X", não "É necessária a verificação de X") — bom para humano e máquina.
5. **A validar (M4):** antes de cristalizar qualquer destas como regra do CORE, testar contra um caso
   real de briefing gerado e comparar com a pesquisa de clareza-para-LLM. Até lá, vive como hipótese.

## Fontes

- [Williams, *Style: Lessons in Clarity and Grace* — Wikipedia](https://en.wikipedia.org/wiki/Style:_Lessons_in_Clarity_and_Grace)
- [Lessons from Joseph M. Williams & Joseph Bizup (Antoine Buteau)](https://www.antoinebuteau.com/lessons-from-joseph-m-williams-joseph-bizup/)
- [The best book on writing is *Style* (Experience Machines)](https://experiencemachines.substack.com/p/the-best-book-on-writing-is-style)
- [The Elements of Style — Wikipedia](https://en.wikipedia.org/wiki/The_Elements_of_Style)
- ["Omit needless words": Strunk & White turns 50 — Cornell Chronicle](https://news.cornell.edu/stories/2009/03/omit-needless-words-elements-style-turns-50)
- [Strunk & White: 11 Composition Principles — Gotham Writers](https://www.writingclasses.com/toolbox/tips-masters/strunk-white-11-composition-principles)
- [Strunk, *The Elements of Style* (texto integral, PDF)](https://faculty.washington.edu/heagerty/Courses/b572/public/StrunkWhite.pdf)
- [Topic and comment — Wikipedia](https://en.wikipedia.org/wiki/Topic_and_comment)
- [Information structure — Wikipedia](https://en.wikipedia.org/wiki/Information_structure)
- [Top 10 Principles for Plain Language — National Archives](https://www.archives.gov/open/plain-writing/10-principles.html)
- [The Elements of Plain Language — plainlanguage.gov](https://www.plainlanguage.gov/resources/articles/elements-of-plain-language/)
- [Inverted pyramid (journalism) — Wikipedia](https://en.wikipedia.org/wiki/Inverted_pyramid_(journalism))
- [Inverted Pyramid: Writing for Comprehension — Nielsen Norman Group](https://www.nngroup.com/articles/inverted-pyramid/)
- [Paragraph Unity, Coherence, and Development — Wheaton College](https://www.wheaton.edu/academics/services/writing-center/writing-resources/paragraph-unity-coherence-and-development/)
- [Connecting Ideas Through Transitions — UW–Madison Writing Center](https://writing.wisc.edu/handbook/style/connectingideas/)
