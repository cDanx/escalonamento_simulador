# Spec de Conteúdo — Escalonador de Processos
> Documento para o Claude Code implementar as etapas educacionais antes do simulador.

---

## Visão Geral da Sequência

```
[Módulo 1: Processos] → [Quiz 1] → [Módulo 2: Estados] → [Quiz 2] → [Módulo 3: Algoritmos] → [Quiz 3] → [Vídeo Demo] → [Simulador]
```

Cada módulo tem: conteúdo explanatório → quiz avaliativo → feedback → próximo módulo.
O aluno só avança se acertar o mínimo de 70% no quiz (sugestão: 5 de 7 questões).

---

## MÓDULO 1 — Processos

### Tela de conteúdo

**Título:** O que é um Processo?

**Bloco 1 — Definição**
> Um processo é um programa em execução. Quando você abre um navegador, um editor de texto ou um jogo, o sistema operacional cria um processo para cada um deles.
>
> Um processo não é apenas o código do programa — ele carrega consigo tudo que precisa para rodar: os dados que está usando, o ponto onde parou de executar e informações sobre os recursos que ocupa.

**Bloco 2 — O que um processo contém?**
> Cada processo possui um **contexto**, que é o conjunto de informações que o sistema operacional precisa guardar para poder pausar e retomar a execução desse processo a qualquer momento. O contexto inclui:
>
> - O **código** do programa que está sendo executado
> - Os **dados** em uso (variáveis, resultados parciais)
> - O **estado atual** (em qual instrução o processo está)
> - Referências à **memória** alocada para ele

**Bloco 3 — Tipos de Processo**
> Processos se comportam de formas diferentes dependendo do que fazem. Existem dois perfis principais:

**Card: CPU Bound**
> Um processo é **CPU bound** quando passa a maior parte do tempo realizando cálculos no processador.
>
> **Exemplos:** renderização de vídeo, compressão de arquivos, simulações científicas, mineração de criptomoeda.
>
> **Característica:** usa pouco disco ou rede, mas ocupa o processador por longos períodos.

**Card: IO Bound**
> Um processo é **IO Bound** quando passa a maior parte do tempo esperando por operações de entrada e saída — leitura de arquivos, acesso à rede, input do usuário.
>
> **Exemplos:** navegador carregando uma página, editor de texto aguardando digitação, programa lendo um banco de dados.
>
> **Característica:** usa pouco processador, mas passa muito tempo bloqueado esperando dados chegarem.

**Bloco 4 — Por que isso importa?**
> Saber se um processo é CPU bound ou IO bound ajuda o sistema operacional a tomar decisões mais inteligentes sobre quem deve usar o processador agora.
>
> Se todos os processos forem CPU bound, o processador fica sobrecarregado. Se forem IO bound, ele fica ocioso esperando. Um bom escalonador leva isso em conta.

---

### Quiz 1 — Processos (7 questões)

**Instrução ao aluno:** Responda as questões abaixo. Você precisa acertar pelo menos 5 para avançar.

---

**Q1 — Múltipla escolha**
> O que melhor define um **processo** em um sistema operacional?

- A) Um arquivo salvo no disco rígido
- B) Um programa em execução, com seu contexto e recursos associados ✅
- C) Um algoritmo escrito pelo programador
- D) Uma instrução isolada executada pelo processador

**Feedback correto:** Exato! Um processo é mais do que o código — é o programa *rodando*, com tudo que ele precisa para continuar.
**Feedback incorreto:** Um processo é um programa *em execução*, não apenas o arquivo em disco. Ele carrega contexto, dados e estado.

---

**Q2 — Múltipla escolha**
> Qual das alternativas abaixo é um exemplo típico de processo **CPU bound**?

- A) Um programa aguardando o usuário digitar
- B) Um navegador carregando uma página web
- C) Um software de renderização de vídeo ✅
- D) Um sistema de arquivos lendo dados do disco

**Feedback correto:** Correto! Renderização de vídeo exige muito processamento contínuo — praticamente não espera por IO.
**Feedback incorreto:** Processos CPU bound ficam a maior parte do tempo calculando no processador. Renderização de vídeo é o exemplo clássico.

---

**Q3 — Múltipla escolha**
> Um processo **IO bound** se caracteriza por:

- A) Usar intensamente o processador por longos períodos
- B) Nunca precisar de memória
- C) Passar a maior parte do tempo esperando por operações de entrada/saída ✅
- D) Executar mais rápido que processos CPU bound

**Feedback correto:** Isso mesmo! Processos IO bound ficam bloqueados esperando dados — do disco, da rede, do usuário.
**Feedback incorreto:** IO bound significa que o gargalo é a entrada/saída, não o processador. O processo passa mais tempo esperando do que calculando.

---

**Q4 — Verdadeiro ou Falso**
> Um processo é exatamente a mesma coisa que o arquivo executável (.exe, .app) armazenado no disco.

- A) Verdadeiro
- B) Falso ✅

**Feedback correto:** Correto! O executável é apenas o código em disco. O processo é o programa *rodando*, com memória alocada, estado de execução e contexto.
**Feedback incorreto:** O arquivo em disco é estático. O processo é dinâmico — existe apenas enquanto o programa está sendo executado.

---

**Q5 — Múltipla escolha**
> O **contexto de um processo** serve para:

- A) Guardar o código-fonte do programa
- B) Permitir que o sistema operacional pause e retome a execução do processo ✅
- C) Aumentar a velocidade de execução do processo
- D) Definir qual algoritmo de escalonamento será usado

**Feedback correto:** Perfeito! O contexto é o "estado salvo" do processo — sem ele, o SO não poderia pausar um processo e continuar de onde parou.
**Feedback incorreto:** O contexto guarda as informações necessárias para retomar a execução: em qual instrução parou, quais dados estavam em uso, etc.

---

**Q6 — Múltipla escolha**
> Em um computador com vários programas abertos ao mesmo tempo, cada programa corresponde a:

- A) Um único processo compartilhado entre todos os programas
- B) Um processo próprio, gerenciado pelo sistema operacional ✅
- C) Um arquivo temporário criado pelo processador
- D) Uma thread do sistema operacional

**Feedback correto:** Exato! Cada programa aberto gera um (ou mais) processos. O SO gerencia todos eles.
**Feedback incorreto:** Cada programa em execução tem seu próprio processo, com contexto e recursos independentes.

---

**Q7 — Cenário**
> Joana está usando seu computador e percebe que um programa está consumindo quase 100% do processador, enquanto outro programa quase não usa CPU mas fica constantemente acessando o disco. Qual afirmação está correta?

- A) Ambos os programas são IO bound
- B) O programa que usa 100% de CPU é IO bound, e o outro é CPU bound
- C) O programa que usa 100% de CPU é CPU bound, e o que acessa muito o disco é IO bound ✅
- D) Ambos os programas são CPU bound

**Feedback correto:** Correto! Alto uso de CPU = CPU bound. Acesso constante a disco (IO) com baixo uso de CPU = IO bound.
**Feedback incorreto:** CPU bound = usa muito o processador. IO bound = passa o tempo em operações de entrada/saída (disco, rede). São perfis opostos.

---

## MÓDULO 2 — Estados de um Processo

### Tela de conteúdo

**Título:** A Vida de um Processo: Estados e Transições

**Bloco 1 — Por que estados existem?**
> Em um sistema com vários processos rodando ao mesmo tempo, o processador só consegue executar **um processo por vez** (em um núcleo). Para gerenciar isso, o sistema operacional rastreia em qual situação cada processo se encontra — isso é o **estado** do processo.

**Bloco 2 — Os 5 estados**

**Estado: NEW (Novo)**
> O processo foi criado, mas ainda não está pronto para executar. O sistema operacional está alocando recursos para ele (memória, identificador de processo). É o estado inicial de todo processo.
>
> *Analogia: você se inscreveu em uma fila, mas ainda não recebeu sua senha.*

**Estado: READY (Pronto)**
> O processo está pronto para executar e aguardando o processador ficar disponível. Pode haver vários processos em READY ao mesmo tempo — eles ficam em uma fila esperando sua vez.
>
> *Analogia: você tem a senha na mão e está esperando ser chamado.*

**Estado: RUNNING (Executando)**
> O processo está efetivamente usando o processador agora. Em um sistema com um único núcleo, apenas um processo pode estar RUNNING a cada momento.
>
> *Analogia: você está sendo atendido no guichê.*

**Estado: BLOCKED (Bloqueado)**
> O processo está esperando por algo externo para continuar — uma leitura de disco, uma resposta de rede, uma entrada do usuário. Enquanto espera, ele libera o processador para outros processos.
>
> *Analogia: você está sendo atendido, mas precisa buscar um documento. Você sai do guichê e fica em espera.*

**Estado: TERMINATED (Encerrado)**
> O processo terminou sua execução, seja porque concluiu sua tarefa ou porque foi encerrado forçadamente. O sistema operacional libera os recursos que ele ocupava.
>
> *Analogia: seu atendimento terminou. Você saiu.*

**Bloco 3 — Diagrama de transições**

```
         admitido
[NEW] ──────────────→ [READY]
                         │  ↑
              escalonado │  │ preempção
                         ↓  │
                      [RUNNING] ──────────→ [TERMINATED]
                         │
              aguarda IO │
                         ↓
                      [BLOCKED]
                         │
              IO concluído│
                         ↓
                      [READY]
```

**Bloco 4 — Transições explicadas**

| Transição | De → Para | Quando ocorre |
|---|---|---|
| Admitido | NEW → READY | SO termina de preparar o processo |
| Escalonado | READY → RUNNING | Escalonador escolhe o processo para executar |
| Preempção | RUNNING → READY | Tempo esgotado ou processo de maior prioridade aparece |
| Aguarda IO | RUNNING → BLOCKED | Processo solicita operação de entrada/saída |
| IO concluído | BLOCKED → READY | A operação esperada foi concluída |
| Encerramento | RUNNING → TERMINATED | Processo termina sua execução |

**Bloco 5 — Preempção**
> **Preempção** é quando o sistema operacional interrompe um processo que está RUNNING e o manda de volta para READY — sem que o processo tenha pedido isso.
>
> Isso acontece quando o tempo de CPU do processo esgota (no Round Robin, por exemplo) ou quando um processo mais urgente precisa executar.
>
> Nem todos os algoritmos usam preempção — veremos isso no próximo módulo.

---

### Quiz 2 — Estados (7 questões)

**Instrução ao aluno:** Responda as questões abaixo. Você precisa acertar pelo menos 5 para avançar.

---

**Q1 — Múltipla escolha**
> Um processo que acabou de ser criado pelo sistema operacional, mas ainda não pode executar, está no estado:

- A) READY
- B) RUNNING
- C) NEW ✅
- D) BLOCKED

**Feedback correto:** Correto! NEW é o estado inicial — o processo existe, mas o SO ainda está preparando seus recursos.
**Feedback incorreto:** Quando um processo é criado, ele entra no estado NEW. Só vai para READY quando o SO termina de alocá-lo.

---

**Q2 — Múltipla escolha**
> Vários processos podem estar no estado READY ao mesmo tempo?

- A) Não, apenas um processo pode estar READY por vez
- B) Sim, eles ficam em fila esperando o processador ✅
- C) Não, READY é exclusivo como o estado RUNNING
- D) Sim, mas apenas se forem do mesmo tipo (CPU bound ou IO bound)

**Feedback correto:** Exato! A fila de READY pode ter muitos processos aguardando — o escalonador decide quem vai para RUNNING.
**Feedback incorreto:** Muitos processos podem estar prontos ao mesmo tempo. Eles ficam em uma fila de espera — o escalonador escolhe quem executa.

---

**Q3 — Múltipla escolha**
> Um processo está lendo um arquivo grande do disco. Enquanto espera a leitura terminar, ele está no estado:

- A) READY
- B) RUNNING
- C) NEW
- D) BLOCKED ✅

**Feedback correto:** Correto! O processo está aguardando uma operação de IO. Ele vai para BLOCKED e libera o processador.
**Feedback incorreto:** Quando um processo espera por IO (disco, rede, teclado), ele vai para BLOCKED — liberando o processador para outros processos.

---

**Q4 — Ordenação**
> Coloque os estados na ordem correta do ciclo de vida típico de um processo simples que não realiza IO:

*(Arrastar para ordenar)*
- [ ] TERMINATED
- [ ] NEW
- [ ] RUNNING
- [ ] READY

**Resposta correta:** NEW → READY → RUNNING → TERMINATED

**Feedback correto:** Perfeito! Esse é o caminho básico: criado, pronto, executando, encerrado.
**Feedback incorreto:** A sequência é: NEW (criado) → READY (aguardando CPU) → RUNNING (executando) → TERMINATED (finalizado).

---

**Q5 — Múltipla escolha**
> O que é **preempção**?

- A) O processo pede voluntariamente para parar de executar
- B) O processo termina sua execução normalmente
- C) O sistema operacional interrompe o processo e o manda de volta para READY ✅
- D) O processo é movido de BLOCKED para RUNNING diretamente

**Feedback correto:** Exato! Preempção é o SO tirando o processador de um processo à força — sem que o processo tenha pedido.
**Feedback incorreto:** Preempção é involuntária — o SO interrompe o processo (por tempo esgotado ou prioridade) e o retorna para READY.

---

**Q6 — Cenário**
> Um processo estava RUNNING e solicitou uma leitura de arquivo. A leitura vai demorar alguns milissegundos. O que acontece com esse processo?

- A) Ele continua RUNNING e aguarda a leitura terminar sem liberar o processador
- B) Ele vai para TERMINATED pois não pode mais executar
- C) Ele vai para BLOCKED e o processador é liberado para outro processo ✅
- D) Ele vai diretamente para NEW para ser reiniciado

**Feedback correto:** Correto! O processo vai para BLOCKED, liberando o processador. Quando a leitura terminar, ele volta para READY.
**Feedback incorreto:** Ao solicitar IO, o processo vai para BLOCKED — não faz sentido manter o processador parado esperando. Outro processo assume.

---

**Q7 — Verdadeiro ou Falso**
> Um processo pode ir diretamente do estado BLOCKED para o estado RUNNING, sem passar por READY.

- A) Verdadeiro
- B) Falso ✅

**Feedback correto:** Correto! Quando o IO termina, o processo volta para READY — ele entra na fila e espera o escalonador escolhê-lo novamente.
**Feedback incorreto:** Ao sair de BLOCKED, o processo sempre vai para READY primeiro. Nunca diretamente para RUNNING — ele precisa ser escalonado novamente.

---

## MÓDULO 3 — Algoritmos de Escalonamento

### Tela de conteúdo

**Título:** Como o Sistema Operacional Decide Quem Executa Agora?

**Bloco 1 — O problema do escalonamento**
> Com vários processos em READY ao mesmo tempo e apenas um processador disponível, alguém precisa decidir: **quem executa agora?**
>
> Essa decisão é tomada pelo **escalonador**, e a regra que ele segue é o **algoritmo de escalonamento**.
>
> Diferentes algoritmos priorizam coisas diferentes: alguns são simples e justos, outros são eficientes mas complexos. Nenhum é perfeito para todos os casos.

**Bloco 2 — Conceitos importantes antes de começar**

**Burst de CPU**
> É o tempo que um processo usa o processador de forma contínua antes de precisar de IO ou terminar. Algoritmos como SJF e SRTF tomam decisões com base nisso.

**Quantum**
> É um limite de tempo máximo que um processo pode usar o processador de uma vez. Após o quantum, o processo sofre preempção e volta para READY. Usado no Round Robin.

**Tempo de espera**
> Quanto tempo o processo ficou na fila READY esperando para executar. Bons algoritmos tentam minimizar isso.

**Turnaround**
> O tempo total desde que o processo foi criado até ser finalizado. Inclui tempo de espera + tempo de execução.

**Preempção**
> Quando o SO interrompe um processo que está executando para dar o processador a outro. Algoritmos **preemptivos** fazem isso; **não-preemptivos** deixam o processo terminar seu burst antes de trocar.

---

**Bloco 3 — FIFO (First In, First Out)**

> Também chamado de **FCFS (First Come, First Served)**.
>
> **Regra:** o primeiro processo que entrou na fila é o primeiro a executar. Simples assim.
>
> **Tipo:** Não-preemptivo — uma vez que um processo começa, ele executa até terminar ou ir para BLOCKED.

**Exemplo:**
```
Processos:  P1 (burst 8ms) → P2 (burst 4ms) → P3 (burst 2ms)
Chegaram nessa ordem.

Execução: [P1: 0-8] [P2: 8-12] [P3: 12-14]

Tempo de espera:
  P1: 0ms (foi o primeiro)
  P2: 8ms (esperou P1 terminar)
  P3: 12ms (esperou P1 e P2)
Média: 6,6ms
```

**Vantagens:** simples de implementar, sem starvation (todo processo eventualmente executa).
**Desvantagens:** processos curtos ficam presos atrás de processos longos — o **efeito comboio**.

---

**Bloco 4 — SJF (Shortest Job First)**

> **Regra:** entre os processos prontos, o que tiver o **menor burst de CPU** executa primeiro.
>
> **Tipo:** Não-preemptivo — o processo escolhido executa até terminar seu burst.

**Exemplo:**
```
Processos: P1 (burst 8ms), P2 (burst 4ms), P3 (burst 2ms)
Todos chegam ao mesmo tempo (t=0).

Execução: [P3: 0-2] [P2: 2-6] [P1: 6-14]

Tempo de espera:
  P1: 6ms
  P2: 2ms
  P3: 0ms
Média: 2,6ms  ← muito melhor que FIFO!
```

**Vantagens:** minimiza o tempo médio de espera — é ótimo matematicamente para esse critério.
**Desvantagens:** precisa saber o burst antecipadamente (nem sempre possível). Processos longos podem sofrer **starvation** se processos curtos continuam chegando.

---

**Bloco 5 — SRTF (Shortest Remaining Time First)**

> É a versão **preemptiva** do SJF.
>
> **Regra:** sempre executa o processo com o **menor tempo restante** de burst. Se um processo novo chega com burst menor que o restante do processo atual, o atual sofre preempção.

**Exemplo:**
```
t=0: P1 chega (burst 8ms) → começa executar
t=2: P2 chega (burst 4ms)
     P1 tem 6ms restantes, P2 tem 4ms → P2 preempção P1!
t=6: P2 termina, P1 volta (6ms restantes)
t=12: P1 termina... mas se P3 (2ms) chegasse em t=3, seria escolhido em t=6.

Vantagem: tempo médio de espera ainda menor que SJF não-preemptivo.
```

**Vantagens:** ótimo para minimizar tempo médio de espera com chegadas dinâmicas.
**Desvantagens:** alto overhead de troca de contexto. Starvation ainda possível para processos longos.

---

**Bloco 6 — Round Robin (RR)**

> **Regra:** cada processo recebe um **quantum** de tempo para executar. Após o quantum, vai para o fim da fila READY e o próximo processo executa.
>
> **Tipo:** Preemptivo por definição — o quantum garante que ninguém monopoliza o processador.

**Exemplo com quantum = 3ms:**
```
Processos: P1 (burst 8ms), P2 (burst 4ms), P3 (burst 2ms)
Todos chegam em t=0.

[P1: 0-3] [P2: 3-6] [P3: 6-8] [P1: 8-11] [P2: 11-12] [P1: 12-14]

P3 terminou em t=8 (usou 2ms de 3ms disponíveis)
P2 terminou em t=12 (2a rodada: precisava de 1ms)
P1 terminou em t=14 (3a rodada: precisava de 2ms)
```

**O impacto do quantum:**
> - Quantum **pequeno** → muitas trocas de contexto, overhead alto, mas resposta rápida
> - Quantum **grande** → comportamento parecido com FIFO, menos overhead

**Vantagens:** justo — cada processo recebe fatias iguais. Bom tempo de resposta para sistemas interativos.
**Desvantagens:** escolher o quantum certo é difícil. Turnaround pode ser pior que SJF.

---

**Bloco 7 — Comparativo rápido**

| Algoritmo | Preemptivo? | Precisa conhecer burst? | Starvation? | Melhor para |
|---|---|---|---|---|
| FIFO | Não | Não | Não | Sistemas batch simples |
| SJF | Não | Sim | Possível | Minimizar tempo médio de espera |
| SRTF | Sim | Sim | Possível | Chegadas dinâmicas, tempo mínimo |
| Round Robin | Sim | Não | Não | Sistemas interativos, tempo de resposta |

---

### Quiz 3 — Algoritmos (7 questões)

**Instrução ao aluno:** Responda as questões abaixo. Você precisa acertar pelo menos 5 para avançar.

---

**Q1 — Múltipla escolha**
> No algoritmo **FIFO**, qual processo executa primeiro?

- A) O processo com menor burst de CPU
- B) O processo com maior prioridade
- C) O processo que chegou primeiro na fila ✅
- D) O processo que está há mais tempo em BLOCKED

**Feedback correto:** Correto! FIFO é simples: primeiro a chegar, primeiro a ser atendido.
**Feedback incorreto:** FIFO = First In, First Out. A ordem de chegada é o único critério.

---

**Q2 — Múltipla escolha**
> O **efeito comboio** é um problema do FIFO onde:

- A) Processos curtos executam antes de processos longos
- B) Processos longos bloqueiam processos curtos que chegaram depois ✅
- C) O quantum é muito grande e causa lentidão
- D) O escalonador não consegue decidir quem executa

**Feedback correto:** Exato! No FIFO, se um processo longo está na frente, todos os processos curtos ficam presos atrás — como um comboio.
**Feedback incorreto:** O efeito comboio acontece quando processos longos monopolizam o processador, forçando processos curtos a esperar muito tempo.

---

**Q3 — Múltipla escolha**
> Qual é a principal diferença entre **SJF** e **SRTF**?

- A) SJF usa quantum, SRTF não usa
- B) SRTF é preemptivo — pode interromper o processo atual se um processo mais curto chegar ✅
- C) SJF é mais justo porque não causa starvation
- D) SRTF só funciona quando todos os processos chegam ao mesmo tempo

**Feedback correto:** Correto! SRTF é o SJF com preempção — se um processo com burst menor chegar, o atual é interrompido.
**Feedback incorreto:** A diferença fundamental é a preempção. SRTF pode interromper o processo atual; SJF não.

---

**Q4 — Cálculo simples**
> Três processos chegam juntos em t=0: P1 (burst 6ms), P2 (burst 2ms), P3 (burst 4ms). Usando **SJF**, qual a ordem de execução?

- A) P1 → P2 → P3
- B) P2 → P3 → P1 ✅
- C) P3 → P2 → P1
- D) P1 → P3 → P2

**Feedback correto:** Correto! SJF ordena do menor para o maior burst: P2 (2ms) → P3 (4ms) → P1 (6ms).
**Feedback incorreto:** SJF escolhe o processo com **menor** burst primeiro. Ordene: P2=2ms, P3=4ms, P1=6ms.

---

**Q5 — Múltipla escolha**
> No **Round Robin** com quantum = 4ms, o que acontece quando um processo tem burst de 3ms (menor que o quantum)?

- A) O processo executa por 4ms e é interrompido mesmo sem terminar
- B) O processo executa por 3ms, termina e libera o processador ✅
- C) O processo vai para BLOCKED automaticamente
- D) O quantum é ajustado para 3ms automaticamente

**Feedback correto:** Exato! O quantum é o máximo, não o mínimo. Se o processo terminar antes, ele simplesmente encerra.
**Feedback incorreto:** O quantum é um limite superior. O processo termina quando acabar seu burst, mesmo que o quantum ainda não tenha esgotado.

---

**Q6 — Cenário**
> Um sistema precisa garantir que nenhum processo fique sem executar por muito tempo (sem starvation) e que o tempo de resposta seja bom para todos. Qual algoritmo é mais adequado?

- A) FIFO — porque é simples
- B) SJF — porque minimiza o tempo médio de espera
- C) SRTF — porque é o mais eficiente matematicamente
- D) Round Robin ✅ — porque distribui o processador igualmente entre todos

**Feedback correto:** Correto! Round Robin garante que todos os processos recebem fatias regulares de CPU — sem starvation e com bom tempo de resposta.
**Feedback incorreto:** Round Robin é o algoritmo projetado para fairness e tempo de resposta. SJF e SRTF podem causar starvation em processos longos.

---

**Q7 — Verdadeiro ou Falso**
> O algoritmo SRTF exige que o sistema operacional conheça antecipadamente o tempo de burst de cada processo.

- A) Verdadeiro ✅
- B) Falso

**Feedback correto:** Correto! Tanto SJF quanto SRTF precisam saber o burst para tomar sua decisão. Na prática, isso é estimado com base no histórico do processo.
**Feedback incorreto:** SRTF precisa saber o tempo restante de cada processo para decidir quem executa. Na prática real, esse valor é estimado — não conhecido com certeza.

---

## Notas de Implementação para o Claude Code

### Estrutura de componentes sugerida

```
/src
  /modules
    /processos
      ConteudoProcessos.tsx      ← Bloco 1-4 do módulo 1
      QuizProcessos.tsx          ← 7 questões do quiz 1
    /estados
      ConteudoEstados.tsx        ← Bloco 1-5 do módulo 2
      QuizEstados.tsx            ← 7 questões do quiz 2
    /algoritmos
      ConteudoAlgoritmos.tsx     ← Bloco 1-7 do módulo 3
      QuizAlgoritmos.tsx         ← 7 questões do quiz 3
    /video
      VideoDemo.tsx              ← Vídeo demonstrativo
  /simulator
    Simulador.tsx                ← O jogo (próxima etapa)
  /components
    ProgressBar.tsx              ← Progresso do aluno
    QuizCard.tsx                 ← Componente reutilizável de questão
    FeedbackModal.tsx            ← Feedback pós-resposta
    ModuleGate.tsx               ← Bloqueio de avanço (mínimo 5/7)
```

### Regras de navegação

- O aluno só avança para o próximo módulo após **5/7 acertos no quiz**
- Se reprovar, mostra quais questões errou com o feedback e permite **tentar novamente** (com questões embaralhadas)
- Mostrar progresso global (ex: "Módulo 2 de 4")
- Salvar progresso no localStorage para não perder ao recarregar

### Estado global sugerido (React context ou Zustand)

```typescript
interface LearningState {
  currentModule: 'processos' | 'estados' | 'algoritmos' | 'video' | 'simulador'
  quizResults: {
    processos: { score: number; passed: boolean } | null
    estados: { score: number; passed: boolean } | null
    algoritmos: { score: number; passed: boolean } | null
  }
  completedModules: string[]
}
```

### Comportamento do QuizCard

- Mostrar uma questão por vez (não todas juntas)
- Após selecionar resposta → mostrar feedback imediatamente (correto/incorreto + explicação)
- Botão "Próxima questão" após ver o feedback
- Ao final das 7 questões → mostrar pontuação + botão de avançar (se passou) ou tentar novamente (se não passou)
- Embaralhar ordem das questões e ordem das alternativas a cada tentativa

### Paleta sugerida (alinhada com o diagrama original)

```css
--cor-processos: #e91e8c;    /* rosa — módulo processos */
--cor-estados: #f57c00;      /* laranja — módulo estados */
--cor-algoritmos: #1565c0;   /* azul — módulo algoritmos */
--cor-pratico: #7b1fa2;      /* roxo — módulo prático/simulador */
--cor-acerto: #2e7d32;       /* verde escuro */
--cor-erro: #c62828;         /* vermelho escuro */
--bg: #121212;               /* fundo escuro */
--surface: #1e1e1e;
--text: #f5f5f5;
```
