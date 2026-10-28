# PROJECT_STATE

## Concluído
- Fase 1: arquitetura, navegação (5 abas + botão +), tela Hoje, persistência local, tema claro/escuro/auto, backup JSON, PWA instalável.
- Hoje: saudação, data, resumo contextual + aviso de sobrecarga (>8 pendentes), progresso do dia, 3 prioridades, agenda do dia, tarefas (inclui atrasadas), hábitos do dia, atalhos Vida, revisão do dia.
- Captura rápida (+): tarefa, compromisso ou anotação (despejo mental).
- Visual v2: moderno e didático. Cada seção em cartão com ícone colorido + explicação curta; anel de progresso; guia de 3 passos (some ao fechar, settings.guideDone); hábitos em blocos com emoji.

- Lista de compras (#/compras): listas Mercado/Farmácia/Casa/Filha; "2 leite" entende quantidade; seção automática na ordem do mercado (aprende correções); sugestões do histórico; Básicos da casa (pré-cadastrados, editáveis); no carrinho + limpar comprados; atalho no Hoje e tipo "Compra" no botão Adicionar.

- Correções do teste (v4): virada do dia automática (useToday + key); salvar ao sair (useAutosave); backup mescla por updatedAt e usa Compartilhar no iPhone; storage.persist; versão antiga aberta recarrega (onversionchange/onblocked); excluir com Desfazer; "Não consegui fazer" (Hoje/Amanhã/1 semana/Não vou mais fazer); atrasada concluída fica visível; anel ponderado (prioridades 50%, tarefas 30%, hábitos 20%); botão Adicionar some ao rolar; layout 320px; SW abre do cache e atualiza em segundo plano; lembrete de backup semanal.
- Próximos dias (aba Calendário, lista provisória) e Anotações (despejo mental com virar tarefa/arquivar).
- Leitura bíblica (#/biblia): 6 escopos x 4 durações, leitura do dia no Hoje, marca hábito Bíblia, atraso + recalcular. Só referências, sem texto bíblico. Links YouVersion (bible.com/bible/{id}/{USFM}.{cap}.{sigla}; NVI 129, NAA 1840, ARC 212, NVT 1930), botão "Marcar como lida" (destaca ao voltar do link), estado "Leitura de hoje concluída" + adiantar. Plano individual (não compartilhar por ora).
- Ciclo menstrual (#/ciclo): registro por dia (fluxo, sintomas, nota), média dos últimos 6 ciclos, previsão, fértil/ovulação estimados, cartão discreto no Hoje (desligável em Ajustes).

- v6 Vida e memórias (DB v4): Filmes/séries/livros (#/midia: quero/andamento/concluído/abandonado, nota, frase, com quem, páginas, temporada, meta anual de livros); Meu Ano (#/ano: palavra e versículo, Roda da Vida 12 áreas com radar e comparação, momentos do mês, perguntas de fechamento); Retrospectiva em cartões (#/retro/AAAA, sem dados do ciclo); Conquistas, Memórias da filha, Encontros a dois, Sonhos, Oração, Datas especiais (contagem regressiva) sobre lista genérica (components/collection.js). Hoje: palavra do ano, aviso de datas em até 14 dias, conquista rápida, lembrete do momento do mês. Vida em blocos com contadores.

- v7 Saúde (DB v5): Treino (#/treino: modelos Academia/Casa slim A-B-C, dias da semana, rodízio, execução com carga e última carga, cardio, edição de exercícios, histórico; marca hábito Exercício); Alimentação (#/alimentacao: 5 hábitos sem calorias, água em copos com meta, o que comi, semana; marca hábitos Água e Alimentação); Medidas (#/medidas: 6 medidas, gráfico e diferença); Exames (#/exames: por pessoa Eu/Olivia/+, periodicidade, próxima data automática, agendado, histórico, rotina sugerida adulta/criança, aviso de vencimento). Cartão "Saúde de hoje" no Hoje. Botão Adicionar só em Hoje, Calendário, Anotações e Vida.

- v8 Finanças (DB v6): aba Finanças com objetivos espelhando as "Metas" do protótipo Área Financeira do Cliente (guardado, alvo, faltam, prazo, anel %, dica "Para chegar lá: R$ X por mês", mesmo cálculo de meses), aportes e retiradas com histórico, ação do mês (uma só, com Feito), "Vale saber", resumo total; atalho no Hoje; cartão na retrospectiva. finGoals/finMonths com visibility 'shared' (Fase 2: marido vê e contribui).

- v9 Segurança: bloqueio por PIN (PBKDF2-SHA256 210k + sal; nunca guarda o PIN; pausa crescente após 5 erros; recusa PIN óbvio), Face ID/digital via WebAuthn (plataforma), bloqueio ao voltar do segundo plano (na hora/1/5/15 min), conteúdo borrado ao trocar de app, nada renderizado enquanto bloqueado; backup sempre com senha (AES-256-GCM, PBKDF2 210k); CSP estrita no index.html (só código do próprio app + Google Fonts) e no-referrer; nenhum innerHTML no código.
- v9 Simplicidade: Hoje personalizável (#/hoje/editar: mostrar/ocultar e ordenar 9 blocos; atalhos ocultos por padrão); "Fechar o dia" aparece sozinho às 17h; lupa no topo; busca geral (#/busca) em 16 coleções + atalhos de telas; Adicionar universal com 8 tipos (tarefa, compromisso, compra, anotação, conquista, Olivia, filme/livro, oração); aba Hábitos funcional (semana, % desde o início, criar, editar nome/ícone/dias, reordenar, remover); hábitos com dias aparecem no Hoje só nesses dias; Vida com "Onde anoto cada coisa?" e áreas ocultáveis em Ajustes; Ajustes reorganizado em Segurança, Backup, Áreas e Geral.

- v10 Cardápio da família (#/cardapio, DB v7: mealPlans id = segunda-feira da semana, recipes = receitas próprias): 25 receitas brasileiras simples (lib/recipes.js) com ingredientes por adulto, seção do mercado, modo de preparo e dica para a Olivia (engasgo, sem açúcar/sal extra); pessoas da casa com porção (adulto 1, criança 0,5) e refeições em casa (settings.family); semana sugerida sem repetir prato no dia, 2 jantares de sobras (almoço calculado em dobro) e domingo à noite livre; trocar refeição com busca; lista de compras da semana (de hoje em diante) com "já tenho", envia ao Mercado com source 'cardapio' e atualiza sem duplicar; receitas próprias com ingredientes em texto ("120 g frango"). Integra Saúde de hoje, Alimentação, Vida, busca.
- v11 Rotina da família: cada pessoa tem refeições de segunda a sexta (meals) e de fim de semana (weekend) e opção marmita (lunchbox, conta como comida de casa). Padrão: Day e Roger (marido) café + almoço de marmita + jantar; Manu (irmã) todas; Olivia só jantar (café também na escola) nos dias úteis (escola); fim de semana todos. Almoço de dia com marmita só sugere pratos que viajam bem (noBox) e mostra dica de marmita.

## Em andamento
- Nada.

## Próximos passos
- Fase 3 (Finanças): receitas, despesas, contas, planejado x realizado por categoria (mesmas categorias PF do protótipo: Moradia, Mercado, Transporte, Lazer e restaurantes, Saúde, Educação).
- Fase 3: preço estimado por item + "Registrar compra" vira despesa.
- Fase 2: login (link mágico) + casa compartilhada + sincronização Supabase (entra em store/repo.js).
- Fase 3: Finanças compartilhadas (combinar categorias com o marido antes).

## Bugs conhecidos
- Nenhum aberto. Limitação: um dia de menstruação marcado isolado vira novo ciclo (usuária corrige desmarcando).

## Decisões técnicas
- Sem build: Preact + htm vendorizado em js/lib/preact-htm.js. Rotas por hash.
- IndexedDB, 1 store por coleção (schema.js). Filtros em memória (volume pessoal pequeno).
- Todo registro: id, createdAt, updatedAt, deletedAt (exclusão lógica), householdId, createdBy, visibility.
- dayPlans: id = data (AAAA-MM-DD). habitLogs: id = habitId_data.
- Datas sempre em fuso local (lib/date.js).
- Ao publicar mudanças: subir VERSION em sw.js e incluir arquivos novos na lista FILES.
- Design: fonte Figtree; cores por seção em tokens.css (rose, lilac, teal, amber, blue) via classe tone-*.
- Compras: shoppingLists (ids fixos), shoppingItems, shoppingCatalog (id = lista:nome-normalizado; guarda seção, frequência e se é básico). Regras em lib/shopping.js. DB_VERSION 2; settings.seedVersion controla sementes.
- DB_VERSION 3: stores biblePlans (id 'active') e cycleLogs (id = data). cycleLogs, measures, foodLogs, exams e workoutLogs são ALWAYS_PRIVATE: nunca sincronizar/compartilhar sem pedido explícito.
- SW sem skipWaiting: nova versão entra na próxima abertura (evita mistura de versões).
- Registro 'years' (id = ano) guarda palavra, versículo, meta de livros e respostas: gravar sempre por saveYear() (lê antes de escrever).
- Segurança: o PIN é uma trava de tela, não criptografa o banco local. A proteção real dos dados fora do app é o backup com senha. Ao entrar a nuvem (Fase 2): RLS no Supabase, ALWAYS_PRIVATE nunca sobe, e adicionar o domínio do Supabase no connect-src da CSP.
- Prévia (artifact) não usa a CSP, pois o código fica embutido na página.
- Formulários em painel: o objeto 'item' passado ao EditSheet precisa ser estável (guardar em estado), senão o formulário se reinicia.
- Visibilidade padrão compartilhada: casamento, filha, casa, financeiro (schema.js).
