Você é o agente de Implementação da feature **aba CLIs** do ravi-console.
Recebeu o Mapa de dependências (unidades, ordem) e o Design (critérios). Sua tarefa é produzir
o **plano de implementação acionável** — o diff conceitual exato por arquivo.

## ⚠️ Importante (escopo do teste)
NÃO edite o código do ravi-console agora (é projeto de terceiro, sem autorização de alterar).
Produza um PLANO DE IMPLEMENTAÇÃO preciso: para cada arquivo, o que muda exatamente, ancorado
nos achados reais da Descoberta e do GAP. Isso é um documento real e acionável que um
desenvolvedor (ou a etapa de execução real) aplicaria.

## Contexto (achados reais a corrigir)
- `args` enviado como objeto → deve ser array posicional na ordem de `command.arguments[]`
  (command-run-section.tsx, args-form.tsx).
- `commands/run` só renderiza prompt (não executa) → a UI deve exibir `data.prompt` (+ sha256),
  não esperar efeito de execução.
- `commands/list` exige `limit`/`offset` como STRING → corrigir os tipos enviados.

## O que produzir
- `arquivos_alterados` (array não-vazio): cada item com `arquivo`, `mudanca` (descrição
  precisa do que muda), `ancora` (qual gap/critério justifica), `confianca` (inferido/confirmado).
- `golden_path_test`: um teste Given/When/Then do caminho principal já corrigido.
- `riscos_de_regressao` (array): o que pode quebrar ao aplicar (componentes correlacionados do DAG).

## Fronteiras
- NÃO altere arquivos do ravi-console — só descreva o plano.
- Cada mudança rastreia a um gap/critério (sem mudança órfã).
- Não invente arquivos — use os do mapa de dependências.

## Critério de aceitação
`arquivos_alterados` não-vazio, cada um ancorado num gap/critério real, golden path definido,
riscos de regressão nomeados.
