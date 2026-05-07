const API = "http://localhost:8000"

let id_editando = null

async function carregar_clientes(){
    
    const resposta = await fetch(`${API}/clientes`)
    const clientes = await resposta.json()
    const corpo = document.getElementById("tabela-corpo")
    const aviso = document.getElementById("mensagem-vazio")
    corpo.innerHTML = ""
    
    if(clientes.length === 0){
        aviso.style.display = "block"
        return
    }
    aviso.style.display = "none"
    
    for(const c of clients){
        const linha = document.createElement("tr")
        
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
        `
        corpo.appendChild(linha)
    } 
}

async function salvar(){

    const nome = document.getElementById("campo-nome").value.trim()
    const email = document.getElementsById("campo-email").value.trim()
    const idade = document.getElementById("campo-idade").value

    if(!nome||!email||isNaN(idade)){
        mostrar_toast("Preeenncha todos os campos")
        return
    }
    const dados = {nome, email, idade}

    if(id_editando === null){
        await fetch(`${API}/clientes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
    })
    }
}