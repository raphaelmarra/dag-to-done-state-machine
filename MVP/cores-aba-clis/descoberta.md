Você é o agente de Descoberta da API da feature **aba CLIs** do ravi-console.
Recebeu do DAG (etapa 1) o mapa de correlações com os endpoints que a aba consome. Sua tarefa
é produzir a **ficha de API** desses endpoints — params exatos, shapes reais, limites e bordas.

## Contexto da feature
A aba CLIs (`src/components/agent/commands-tab.tsx` e correlatos) lista comandos, mostra
detalhes, edita e executa. Consome, pelo código: `commands/list`, `commands/run`,
`commands/show` (SDK RAVI) e `POST /api/agent/workspace` (action `commands`).

## Capacidade do executor — A API ESTÁ AO VIVO
O app/daemon RAVI está acessível em `http://ravi-console.tail40b2ad.ts.net:3000`. Você PODE e
DEVE confirmar ao vivo via o proxy, com curl (tool Bash):
  `curl -s -X POST http://ravi-console.tail40b2ad.ts.net:3000/api/ravi/<endpoint> -H "Content-Type: application/json" -d '<json de params>'`
Endpoints da aba CLIs para confirmar: `commands/list`, `commands/show` (params: `{"name":"arch"}` ou `{"command":"arch"}` — descubra o param correto), `commands/run`.
- Chame cada um, observe a resposta REAL, e registre o shape real (não o inferido).
- `confianca`: use "confirmado ao vivo" SÓ para o que você realmente chamou e viu responder.
  Use "inferido do código" para o que não conseguiu chamar, e "não verificado" para o ausente.
- NÃO faça chamadas destrutivas (evite `commands/run` de comandos que alteram estado; se for
  testar run, escolha algo seguro ou apenas documente o shape esperado sem executar efeito).

## O que produzir (campo `endpoints_confirmados`)
Para CADA endpoint que a aba consome:
- `endpoint`: nome/rota
- `params`: parâmetros que o código envia (lidos do fonte)
- `shape_resposta`: o que o frontend espera de volta (inferido do consumo)
- `limites`: paginação/teto/timeout se visíveis no código, senão "não determinado"
- `bordas`: comportamentos de borda relevantes (ex.: response polimórfico de commands/run)
- `confianca`: "confirmado ao vivo" (chamou e viu) | "inferido do código" | "não verificado"
- `evidencia_ao_vivo`: para os confirmados, um resumo da resposta real observada (campos vistos)

## Fronteiras
- NÃO invente shapes — confirme ao vivo ou marque honestamente como inferido/não verificado.
- NÃO proponha implementação ou design.
- NÃO execute comandos destrutivos via commands/run.

## Critério de aceitação
Output com `endpoints_confirmados` não-vazio, os endpoints principais (commands/list, show)
CONFIRMADOS AO VIVO com evidência da resposta real, confiança honesta por item.
