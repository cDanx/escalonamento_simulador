# Simulador de Escalonamento de Processos (Objeto de Aprendizagem)

## 📌 Sobre o Projeto
Este projeto é um Objeto de Aprendizagem web focado no ensino de Sistemas Operacionais, especificamente na gestão e **Escalonamento de Processos**. O sistema foi projetado para apoiar alunos na compreensão da teoria por trás dos estados de um processo, seu ciclo de vida, e na aplicação prática das regras dos principais algoritmos de escalonamento.

O desenvolvimento e a estruturação pedagógica seguem a abordagem **IMA-CID** (Integrated Modeling Approach – Conceptual, Instructional, and Didactic), garantindo o alinhamento entre o domínio computacional, os objetivos de aprendizagem (baseados na Taxonomia de Bloom) e as estratégias de interface e avaliação.

---

## 🧠 Metodologia IMA-CID

### 1. Modelo Conceitual (O Domínio)
O conteúdo abordado no sistema é estruturado através de um mapeamento conceitual das entidades do domínio operacional. 

![Mapa Conceitual do Escalonador](MapaConceitual.jpg)

Os principais conceitos mapeados incluem:
* **Processos:** Diferenciação entre *CPU Bound* e *I/O Bound*.
* **Estados e Ciclo de Vida:** Transições lógicas entre *New (Novo)*, *Ready (Apto)*, *Running (Executando)*, *Blocked (Bloqueado)* e *Terminated (Encerrado)*, engatilhadas por chamadas de sistema, preempção ou entradas e saídas.
* **Algoritmos de Escalonamento:** Regras e comportamentos de algoritmos como *FIFO (First In First Out)*, *SJF (Shortest Job First)*, *SRTF (Shortest Remaining Time First)* e *Round Robin* (utilizando o conceito de quantum).

### 2. Modelo Instrucional (Objetivos e Taxonomia)
As metas de aprendizado do aluno foram mapeadas e categorizadas para direcionar o tipo de avaliação exigida:

* **Requisito 01 | Taxonomia: Memorizar**
  * *Objetivo:* Listar e definir os estados de um processo.
  * *Avaliação:* "Quiz de Entrada" e Glossário Interativo, onde o aluno associa o nome do estado à sua definição técnica.
* **Requisito 02 | Taxonomia: Memorizar**
  * *Objetivo:* Listar e definir os principais algoritmos de escalonamento.
  * *Avaliação:* Cartões de memória (flashcards) e questões de seleção múltipla (ex: "Qual algoritmo usa fatias de tempo/quantum?").
* **Requisito 03 | Taxonomia: Compreender**
  * *Objetivo:* Compreender o ciclo de vida de um processo e suas transições.
  * *Avaliação:* Dinâmica visual onde o aluno deve clicar no "gatilho" correto para que o processo mude de estado.
* **Requisito 04 | Taxonomia: Aplicar**
  * *Objetivo:* Aplicar regras de algoritmos de escalonamento ao gerenciar uma fila de processos em diferentes cenários.
  * *Avaliação:* O simulador interativo (O Jogo).

### 3. Modelo Didático (Arquitetura e Interface)
A navegação e a experiência do usuário estão divididas em módulos lógicos, integrados a um sistema contínuo de rastreamento de erros e acertos para validação pedagógica.

![Fluxograma do Módulo Conceitual e Prático](modeloInstrucional.png)

#### 📖 Módulo Conceitual
Focado na fundamentação teórica através de ciclos explanatórios e avaliativos.
* **Processos:** Conteúdo didático textual seguido por um Quiz sobre os tipos de processos, visando a contextualização inicial.
* **Estados:** Explanação sobre cada estado e transição, seguida por um Quiz de fixação.
* **Algoritmos:** Conteúdo focado no funcionamento dos algoritmos, seguido de avaliação para garantir a memorização das características operacionais.

#### 🎮 Módulo Prático
Focado na aplicação em ambiente de simulação.
* **O Escalonador:** Inicia com material visual (vídeo didático) demonstrando a ação dos algoritmos. Em seguida, o aluno é direcionado ao conteúdo simulativo (O Jogo), onde aplica ativamente todos os conhecimentos de processos e estados construídos no módulo anterior.

---

## 🛠️ Tecnologias Utilizadas
* **Frontend:** React (Plataforma Web)
* **Telemetria Pedagógica:** Rastreamento interno de métricas (erros e acertos) para validação do aprendizado do aluno.

---

## 🚀 Como Executar o Projeto

1. Clone o repositório:
```bash
   git clone https://github.com/cDanx/escalonamento_simulador
