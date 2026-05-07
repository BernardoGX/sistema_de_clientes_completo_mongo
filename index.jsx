// Endereço base da API — onde o backend está rodando (porta 8000 na máquina local)
const API = "http://localhost:8000";

// Variável que guarda o ID do cliente em edição; null significa que estamos criando um novo
let idEditando = null;

// ── Busca e exibe todos os clientes ──────────────────────────────────────────

// "async" permite usar "await" dentro da função (execução assíncrona / sem travar o browser)
async function carregarClientes() {

  // fetch() dispara uma requisição HTTP GET para a rota /clientes da API
  // "await" pausa a função aqui até a resposta chegar
  const resposta = await fetch(`${API}/clientes`);

  // .json() lê o corpo da resposta e converte o texto JSON num array JavaScript
  // "await" pausa novamente até essa conversão terminar
  const clientes = await resposta.json();

  // Seleciona o elemento <tbody id="tabela-corpo"> do HTML onde as linhas serão inseridas
  const corpo = document.getElementById("tabela-corpo");

  // Seleciona o elemento que mostra "nenhum cliente cadastrado"
  const aviso = document.getElementById("mensagem-vazio");

  // Apaga todas as linhas antigas da tabela antes de redesenhar (evita duplicatas)
  corpo.innerHTML = "";

  // Se o array estiver vazio, exibe o aviso e sai da função imediatamente
  if (clientes.length === 0) {
    // "block" torna o elemento visível (por padrão estava "none")
    aviso.style.display = "block";
    // "return" encerra a função aqui — o código abaixo não é executado
    return;
  }

  // Se chegou aqui, existem clientes; esconde o aviso de lista vazia
  aviso.style.display = "none";

  // Percorre cada cliente do array um por um
  for (const c of clientes) {

    // Cria um elemento HTML <tr> (linha de tabela) na memória
    const linha = document.createElement("tr");

    // Define o conteúdo HTML interno da linha usando template literals (crase)
    // ${c.id}, ${c.nome} etc. inserem os valores reais do objeto cliente
    linha.innerHTML = `
      <td>${c.id}</td>
      <td>${c.nome}</td>
      <td>${c.email}</td>
      <td>${c.idade}</td>
      <td class="acoes">
        <!-- Botão Editar: ao clicar chama prepararEdicao() passando os dados do cliente -->
        <!-- escapar() garante que aspas simples no nome/email não quebrem o HTML -->
        <button class="btn-editar" onclick="prepararEdicao(${c.id}, '${escapar(c.nome)}', '${escapar(c.email)}', ${c.idade})">Editar</button>
        <!-- Botão Excluir: ao clicar chama excluir() passando apenas o ID -->
        <button class="btn-excluir" onclick="excluir(${c.id})">Excluir</button>
      </td>
    `;

    // Adiciona a linha criada como filho do <tbody>, tornando-a visível na página
    corpo.appendChild(linha);
  }
}

// ── Salva (cria ou atualiza) um cliente ──────────────────────────────────────

async function salvar() { 

  // Lê o valor do campo "campo-nome" e remove espaços extras nas pontas com .trim()
  const nome  = document.getElementById("campo-nome").value.trim();

  // Lê o valor do campo "campo-email" e remove espaços extras
  const email = document.getElementById("campo-email").value.trim();

  // Lê o valor do campo "campo-idade" e converte de texto para número inteiro com parseInt()
  const idade = parseInt(document.getElementById("campo-idade").value);

  // Verifica se algum campo está vazio ou se a idade não é um número válido (isNaN = "is Not a Number")
  if (!nome || !email || isNaN(idade)) {
    // Exibe uma notificação de erro para o usuário
    mostrarToast("Preencha todos os campos!");
    // Sai da função sem enviar nada
    return;
  }

  // Monta um objeto JavaScript com os três campos do formulário
  // { nome, email, idade } é um atalho para { nome: nome, email: email, idade: idade }
  const dados = { nome, email, idade };

  // Verifica se estamos no modo criação (idEditando === null) ou edição
  if (idEditando === null) {

    // ── MODO CRIAÇÃO ──
    // Envia uma requisição POST para /clientes com os dados no corpo (body)
    await fetch(`${API}/clientes`, {
      method: "POST",                                // método HTTP POST = criar recurso
      headers: { "Content-Type": "application/json" }, // informa ao servidor que o corpo é JSON
      body: JSON.stringify(dados),                   // converte o objeto JS para texto JSON
    });

    // Mostra confirmação de criação
    mostrarToast("Cliente criado com sucesso!");

  } else {

    // ── MODO EDIÇÃO ──
    // Envia uma requisição PUT para /clientes/{id} para atualizar o cliente existente
    await fetch(`${API}/clientes/${idEditando}`, {
      method: "PUT",                                 // método HTTP PUT = substituir/atualizar recurso
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    // Mostra confirmação de atualização
    mostrarToast("Cliente atualizado!");

    // Volta ao modo de criação (limpa idEditando e restaura o título do formulário)
    cancelarEdicao();
  }

  // Limpa os campos do formulário após salvar
  limparFormulario();

  // Recarrega a lista para refletir as mudanças
  carregarClientes();
}

// ── Preenche o formulário para editar um cliente existente ────────────────────

// Recebe os dados do cliente como parâmetros vindos do botão "Editar" na tabela
function prepararEdicao(id, nome, email, idade) {

  // Armazena o ID do cliente que será editado na variável global
  idEditando = id;

  // Preenche cada campo do formulário com os dados atuais do cliente
  document.getElementById("campo-nome").value  = nome;
  document.getElementById("campo-email").value = email;
  document.getElementById("campo-idade").value = idade;

  // Atualiza o título do formulário para indicar qual cliente está sendo editado
  document.getElementById("titulo-form").textContent = `Editando cliente #${id}`;

  // Torna o botão "Cancelar edição" visível (estava escondido no modo criação)
  document.getElementById("btn-cancelar").style.display = "block";

  // Rola a página suavemente até o topo, onde fica o formulário
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Cancela a edição e volta ao modo de criação ───────────────────────────────

function cancelarEdicao() {

  // Remove o ID em edição, voltando ao modo criação
  idEditando = null;

  // Apaga os valores dos campos do formulário
  limparFormulario();

  // Restaura o título original do formulário
  document.getElementById("titulo-form").textContent = "Novo Cliente";

  // Esconde o botão "Cancelar edição" novamente
  document.getElementById("btn-cancelar").style.display = "none";
}

// ── Exclui um cliente pelo ID ─────────────────────────────────────────────────

async function excluir(id) {

  // confirm() abre uma caixa de diálogo com OK/Cancelar; se o usuário cancelar, para aqui
  if (!confirm(`Tem certeza que deseja excluir o cliente #${id}?`)) return;

  // Envia uma requisição DELETE para /clientes/{id} — remove o cliente no backend
  await fetch(`${API}/clientes/${id}`, { method: "DELETE" });

  // Mostra confirmação de exclusão
  mostrarToast("Cliente excluído!");

  // Atualiza a tabela para remover o cliente da tela
  carregarClientes();
}

// ── Limpa os campos do formulário ─────────────────────────────────────────────

function limparFormulario() {
  // Define cada campo como string vazia, apagando o que estava digitado
  document.getElementById("campo-nome").value  = "";
  document.getElementById("campo-email").value = "";
  document.getElementById("campo-idade").value = "";
}

// ── Mostra uma notificação rápida (toast) na tela ─────────────────────────────

function mostrarToast(mensagem) {

  // Seleciona o elemento de notificação no HTML
  const toast = document.getElementById("toast");

  // Define o texto que será exibido na notificação
  toast.textContent = mensagem;

  // Adiciona a classe CSS "visivel" que faz o toast aparecer (via animação no CSS)
  toast.classList.add("visivel");

  // setTimeout() agenda a remoção da classe após 2500 ms (2,5 segundos)
  // A "arrow function" () => ... é executada após o tempo definido
  setTimeout(() => toast.classList.remove("visivel"), 2500);
}

// ── Escapa aspas simples para não quebrar o HTML inline ──────────────────────

function escapar(texto) {
  // .replace() substitui todas as ocorrências (flag "g" = global) de ' por \'
  // Isso evita que um nome como "D'Almeida" quebre o atributo onclick no HTML
  return texto.replace(/'/g, "\\'");
}

// Executa carregarClientes() imediatamente quando o script é carregado
// Assim a tabela já aparece preenchida ao abrir a página
carregarClientes();
