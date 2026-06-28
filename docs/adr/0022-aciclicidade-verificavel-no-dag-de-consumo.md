# 0022 — Aciclicidade verificável no DAG de dependências de consumo

- Status: accepted
- Data: 2026-06-28
- Relacionado: CORE-DAG v4.0 (regra A2; A5 condensação fica PROVISÓRIA — ver ABERTO A010); ADR 0016

## Contexto e Problema
O CORE-DAG v3.0 **assumia** aciclicidade por construção: A2 dizia "nunca crie aresta de volta". A
pesquisa (`research/0011`) mostrou que isso *impõe* o DAG em vez de *verificá-lo* — e pode mascarar
um ciclo genuíno (A depende de B e B depende de A na mesma relação), produzindo um grafo que mente
sobre a ordem real. A fonte teórica original (modelo de relações do CRM) dizia "não é DAG, é grafo
cíclico" — mas falava de **relações de dados**, não de **dependência de consumo**.

## Decisão
1. **Domínio fixado:** o DAG modela **dependência de consumo** ("para X funcionar, Y precisa existir
   antes"), não relações de dados. Nesse domínio, forçar aciclicidade é o *Acyclic Dependencies
   Principle* (Robert C. Martin) — decisão sólida e nomeada.
2. **Aciclicidade verificável (A2):** antes de afirmar direção única, o executor **testa o caminho de
   volta** ("nesta mesma relação, o provedor também depende do consumidor?"). A aciclicidade é um
   resultado verificado, não um axioma.

## Motivo
Resolve a contradição aparente com a fonte CRM (domínios diferentes — `research/0011`/`0013`) e alinha
com M4 ("testar antes de cristalizar"): A2 deixa de ser suposição e vira verificação. Validado: no CRM
(0 ciclos, com verificação declarada por aresta) e em teste sintético de import circular (declarou o
ciclo corretamente).

## Consequências
A regra de **condensação** (ciclo real → super-nó SCC, A5) entra no CORE como **PROVISÓRIA** — validada
só em sintético, aguardando um ciclo real (ABERTO A010). A parte verificável de A2 está cristalizada.
