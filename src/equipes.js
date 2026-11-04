
import './style.css'
import { supabase } from './supabase.js'

document.querySelector('#app').innerHTML = `
  <div class="painel-admin">
    <header class="admin-cabecalho">
      <div>
        <span class="logo-fju">FJU</span>
        <p>CAMPEONATO DE FUTSAL</p>
      </div>
      <a href="/admin.html">VOLTAR AO PAINEL</a>
    </header>

    <main class="admin-conteudo">
      <span class="etiqueta">ÁREA ADMINISTRATIVA</span>
      <h1>Cadastro de equipes</h1>
      <p>Cadastre os times participantes do campeonato.</p>

      <div id="aviso-acesso"></div>

      <form id="form-equipe" class="form-equipe" hidden>
        <h2>Dados da equipe</h2>

        <label>Nome da equipe</label>
        <input type="text" id="nome-equipe" placeholder="Digite o nome da equipe" required>

        <label>Nome do responsável</label>
        <input type="text" id="responsavel" placeholder="Nome completo" required>

        <label>Telefone do responsável</label>
        <input type="tel" id="telefone" placeholder="(61) 99999-9999" required>

        <div class="titulo-jogadores">
          <h2>Jogadores</h2>
          <button type="button" id="adicionar-jogador">+ Adicionar jogador</button>
        </div>

        <div id="lista-jogadores"></div>

        <button type="submit" class="botao-salvar">
          CADASTRAR EQUIPE
        </button>
      </form>

      <div id="mensagem-equipe"></div>
    </main>
  </div>
`

const EMAIL_ADMIN = 'bernardesleticia24@gmail.com'

const formulario = document.querySelector('#form-equipe')
const lista = document.querySelector('#lista-jogadores')
const mensagem = document.querySelector('#mensagem-equipe')
const aviso = document.querySelector('#aviso-acesso')
const adicionar = document.querySelector('#adicionar-jogador')

const parametros = new URLSearchParams(window.location.search)
const idEdicao = parametros.get('id')

let equipeEditando = null

function criarJogador(nome = '', numero = '') {
  const jogador = document.createElement('div')
  jogador.className = 'jogador-item'

  jogador.innerHTML = `
    <input type="text" placeholder="Nome do jogador" class="nome-jogador" required>
    <input type="number" placeholder="Nº da camisa" class="numero-jogador" min="0" required>
    <button type="button" class="remover-jogador">Remover</button>
  `

  jogador.querySelector('.nome-jogador').value = nome
  jogador.querySelector('.numero-jogador').value = numero

  jogador.querySelector('.remover-jogador').addEventListener('click', () => {
    jogador.remove()
  })

  lista.appendChild(jogador)
}

adicionar.addEventListener('click', () => criarJogador())

async function verificarAcesso() {
  aviso.textContent = 'Verificando acesso...'

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    aviso.textContent = 'Você precisa entrar com sua conta administrativa para cadastrar equipes.'
    return false
  }

  if (data.user.email?.toLowerCase() !== EMAIL_ADMIN.toLowerCase()) {
    aviso.textContent = 'Acesso não autorizado. Somente a administradora pode modificar equipes.'
    return false
  }

  aviso.textContent = ''
  formulario.hidden = false

  return true
}

async function carregarEquipe() {
  if (!idEdicao) {
    criarJogador()
    return
  }

  const { data, error } = await supabase
    .from('equipes')
    .select('id, nome, responsavel, telefone, jogadores(id, nome, numero)')
    .eq('id', idEdicao)
    .single()

  if (error) {
    mensagem.textContent = 'Não foi possível carregar a equipe: ' + error.message
    return
  }

  equipeEditando = data

  document.querySelector('#nome-equipe').value = data.nome
  document.querySelector('#responsavel').value = data.responsavel || ''
  document.querySelector('#telefone').value = data.telefone || ''

  lista.innerHTML = ''

  if (data.jogadores?.length) {
    data.jogadores.forEach(jogador => {
      criarJogador(jogador.nome, jogador.numero)
    })
  } else {
    criarJogador()
  }

  document.querySelector('h1').textContent = 'Editar equipe'
  document.querySelector('.botao-salvar').textContent = 'SALVAR ALTERAÇÕES'
}

formulario.addEventListener('submit', async (evento) => {
  evento.preventDefault()

  mensagem.textContent = 'Salvando equipe...'

  const jogadores = [...document.querySelectorAll('.jogador-item')].map(item => ({
    nome: item.querySelector('.nome-jogador').value.trim(),
    numero: Number(item.querySelector('.numero-jogador').value)
  }))

  if (jogadores.length === 0) {
    mensagem.textContent = 'Adicione pelo menos um jogador.'
    return
  }

  const equipe = {
    nome: document.querySelector('#nome-equipe').value.trim(),
    responsavel: document.querySelector('#responsavel').value.trim(),
    telefone: document.querySelector('#telefone').value.trim()
  }

  let equipeId

  if (equipeEditando) {
    const { error } = await supabase
      .from('equipes')
      .update(equipe)
      .eq('id', equipeEditando.id)

    if (error) {
      mensagem.textContent = 'Erro ao atualizar equipe: ' + error.message
      return
    }

    equipeId = equipeEditando.id

    const { error: erroRemocao } = await supabase
      .from('jogadores')
      .delete()
      .eq('equipe_id', equipeId)

    if (erroRemocao) {
      mensagem.textContent = 'Equipe atualizada, mas houve erro ao atualizar jogadores: ' + erroRemocao.message
      return
    }
  } else {
    const { data, error } = await supabase
      .from('equipes')
      .insert(equipe)
      .select()
      .single()

    if (error) {
      mensagem.textContent = 'Erro ao cadastrar equipe: ' + error.message
      return
    }

    equipeId = data.id
  }

  const jogadoresParaSalvar = jogadores.map(jogador => ({
    equipe_id: equipeId,
    nome: jogador.nome,
    numero: jogador.numero
  }))

  const { error: erroJogadores } = await supabase
    .from('jogadores')
    .insert(jogadoresParaSalvar)

  if (erroJogadores) {
    mensagem.textContent = 'Equipe salva, mas houve erro ao salvar jogadores: ' + erroJogadores.message
    return
  }

  mensagem.textContent = equipeEditando
    ? 'Equipe e jogadores atualizados com sucesso!'
    : 'Equipe e jogadores cadastrados com sucesso!'

  formulario.reset()
  lista.innerHTML = ''
  criarJogador()

  if (equipeEditando) {
    equipeEditando = null
    document.querySelector('h1').textContent = 'Cadastro de equipes'
    document.querySelector('.botao-salvar').textContent = 'CADASTRAR EQUIPE'
    window.history.replaceState({}, '', '/equipes.html')
  }
})

async function iniciar() {
  const autorizado = await verificarAcesso()

  if (!autorizado) return

  await carregarEquipe()
}

iniciar()
