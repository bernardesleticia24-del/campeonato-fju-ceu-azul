
import './style.css'
import { supabase } from './supabase.js'

const EMAIL_ADMIN = 'bernardesleticia24@gmail.com'
const app = document.querySelector('#app')

async function iniciarPainel() {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== EMAIL_ADMIN) {
    mostrarLogin()
    return
  }

  mostrarPainel()
}

function mostrarLogin() {
  app.innerHTML = `
    <div class="painel-admin">
      <main class="admin-conteudo">
        <span class="etiqueta">ÁREA RESTRITA</span>
        <h1>Login administrativo</h1>
        <p>Entre com seu e-mail e sua senha para gerenciar o campeonato.</p>

        <form id="form-login">
          <p><input id="email" type="email" placeholder="Seu e-mail" required></p>
          <p><input id="senha" type="password" placeholder="Sua senha" required></p>
          <button type="submit">Entrar no painel</button>
          <p id="mensagem-login"></p>
        </form>
      </main>
    </div>
  `

  document.querySelector('#form-login').addEventListener('submit', async (evento) => {
    evento.preventDefault()

    const email = document.querySelector('#email').value.trim()
    const senha = document.querySelector('#senha').value
    const mensagem = document.querySelector('#mensagem-login')

    mensagem.textContent = 'Verificando acesso...'

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: senha
    })

    if (error) {
      mensagem.textContent = 'E-mail ou senha incorretos.'
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user || user.email !== EMAIL_ADMIN) {
      await supabase.auth.signOut()
      mensagem.textContent = 'Você não tem autorização para acessar.'
      return
    }

    mostrarPainel()
  })
}

function mostrarPainel() {
  app.innerHTML = `
    <div class="painel-admin">
      <header class="admin-cabecalho">
        <div>
          <span class="logo-fju">FJU</span>
          <p>PAINEL ADMINISTRATIVO</p>
        </div>
        <div>
          <a href="/">VOLTAR AO SITE</a>
          <button id="sair">Sair</button>
        </div>
      </header>

      <main class="admin-conteudo">
        <span class="etiqueta">ÁREA RESTRITA</span>
        <h1>Bem-vinda, administradora!</h1>
        <p>Gerencie o Campeonato Futsal FJU Céu Azul.</p>

        <div class="admin-cards">
          <div class="admin-card">
            <span>⚽</span>
            <h2>Equipes</h2>
            <p>Cadastrar e gerenciar os times participantes.</p>
            <button onclick="location.href='/equipes.html'">Cadastrar equipes</button>
          </div>

          <div class="admin-card">
            <span>👥</span>
            <h2>Jogadores</h2>
            <p>Visualizar os jogadores cadastrados.</p>
            <button onclick="document.querySelector('#lista-equipes-admin').scrollIntoView({behavior:'smooth'})">Gerenciar jogadores</button>
          </div>

          <div class="admin-card">
            <span>🏆</span>
            <h2>Partidas e resultados</h2>
            <p>Agendar jogos e registrar resultados.</p>
            <button onclick="location.href='/partidas.html'">Gerenciar partidas</button>
          </div>

          <div class="admin-card">
            <span>📊</span>
            <h2>Classificação</h2>
            <p>Acompanhar a pontuação dos times.</p>
            <button onclick="location.href='/classificacao.html'">Ver classificação</button>
          </div>
        </div>

        <div class="admin-lista-equipes">
          <h2>Equipes cadastradas</h2>
          <div id="lista-equipes-admin">Carregando equipes...</div>
        </div>
      </main>
    </div>
  `

  document.querySelector('#sair').addEventListener('click', async () => {
    await supabase.auth.signOut()
    mostrarLogin()
  })

  mostrarEquipes()
}

async function mostrarEquipes() {
  const lista = document.querySelector('#lista-equipes-admin')

  const { data: equipes, error } = await supabase
    .from('equipes')
    .select('id, nome, responsavel, telefone, jogadores(id, nome, numero)')
    .order('nome')

  if (error) {
    lista.textContent = 'Não foi possível carregar as equipes: ' + error.message
    return
  }

  lista.innerHTML = ''

  if (!equipes || equipes.length === 0) {
    lista.textContent = 'Nenhuma equipe cadastrada ainda.'
    return
  }

  equipes.forEach((equipe) => {
    const card = document.createElement('div')
    card.className = 'admin-card'

    const nome = document.createElement('h2')
    nome.textContent = equipe.nome

    const responsavel = document.createElement('p')
    responsavel.textContent = `Responsável: ${equipe.responsavel || '-'}`

    const telefone = document.createElement('p')
    telefone.textContent = `Telefone: ${equipe.telefone || '-'}`

    const quantidade = document.createElement('p')
    quantidade.textContent = `Jogadores: ${equipe.jogadores.length}`

    const botaoJogadores = document.createElement('button')
    botaoJogadores.textContent = 'Ver jogadores'

    const jogadores = document.createElement('div')
    jogadores.hidden = true

    equipe.jogadores.forEach((jogador) => {
      const linha = document.createElement('p')
      linha.textContent = `${jogador.nome} - Camisa ${jogador.numero ?? '-'}`
      jogadores.appendChild(linha)
    })

    botaoJogadores.addEventListener('click', () => {
      jogadores.hidden = !jogadores.hidden
      botaoJogadores.textContent = jogadores.hidden
        ? 'Ver jogadores'
        : 'Ocultar jogadores'
    })

    const botaoEditar = document.createElement('button')
    botaoEditar.textContent = 'Editar equipe'
    botaoEditar.addEventListener('click', () => {
      location.href = `/equipes.html?id=${equipe.id}`
    })

    const botaoExcluir = document.createElement('button')
    botaoExcluir.textContent = 'Excluir equipe'

    botaoExcluir.addEventListener('click', async () => {
      if (!confirm(`Deseja excluir a equipe ${equipe.nome}?`)) return

      const { error } = await supabase
        .from('equipes')
        .delete()
        .eq('id', equipe.id)

      if (error) {
        alert('Erro ao excluir: ' + error.message)
        return
      }

      alert('Equipe excluída!')
      mostrarEquipes()
    })

    card.append(
      nome,
      responsavel,
      telefone,
      quantidade,
      botaoJogadores,
      jogadores,
      botaoEditar,
      botaoExcluir
    )

    lista.appendChild(card)
  })
}

iniciarPainel()
