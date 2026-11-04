
import './style.css'
import { supabase } from './supabase.js'

const app = document.querySelector('#app')

async function verificarAcesso() {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== 'bernardesleticia24@gmail.com') {
    app.innerHTML = `
      <main class="admin-conteudo">
        <h1>Acesso restrito</h1>
        <p>Entre primeiro no painel administrativo.</p>
        <button onclick="location.href='/admin.html'">Ir para o login</button>
      </main>
    `
    return false
  }

  return true
}

async function iniciar() {
  if (!await verificarAcesso()) return

  app.innerHTML = `
    <div class="painel-admin">
      <header class="admin-cabecalho">
        <div>
          <span class="logo-fju">FJU</span>
          <p>CAMPEONATO DE FUTSAL</p>
        </div>
        <a href="/admin.html">VOLTAR AO PAINEL</a>
      </header>

      <main class="admin-conteudo">
        <span class="etiqueta">ORGANIZAÇÃO DO CAMPEONATO</span>
        <h1>Gerenciar partidas</h1>
        <p>Organize os confrontos e registre os resultados.</p>

        <form id="form-partida" class="form-equipe">
          <h2>Dados da partida</h2>

          <label>Primeira equipe</label>
          <select id="equipe1" required>
            <option value="">Selecione a equipe</option>
          </select>

          <label>Segunda equipe</label>
          <select id="equipe2" required>
            <option value="">Selecione a equipe</option>
          </select>

          <label>Data da partida</label>
          <input type="date" id="data-partida" required>

          <label>Horário</label>
          <input type="time" id="horario-partida" required>

          <label>Local</label>
          <input type="text" id="local-partida"
            placeholder="Ex.: Ginásio do Céu Azul" required>

          <h2>Resultado</h2>

          <label>Gols da primeira equipe</label>
          <input type="number" id="gols1" min="0"
            placeholder="Ainda não realizado">

          <label>Gols da segunda equipe</label>
          <input type="number" id="gols2" min="0"
            placeholder="Ainda não realizado">

          <button type="submit" class="botao-salvar">
            SALVAR PARTIDA
          </button>
        </form>

        <div id="mensagem-partida"></div>

        <section class="lista-partidas">
          <h2>Partidas cadastradas</h2>
          <div id="partidas-cadastradas">Carregando...</div>
        </section>
      </main>
    </div>
  `

  await carregarEquipes()
  await mostrarPartidas()

  document.querySelector('#form-partida')
    .addEventListener('submit', salvarPartida)
}

const equipe1 = () => document.querySelector('#equipe1')
const equipe2 = () => document.querySelector('#equipe2')

let partidaEditando = null

async function carregarEquipes() {
  const { data: equipes, error } = await supabase
    .from('equipes')
    .select('id, nome')
    .order('nome')

  if (error) {
    alert('Erro ao carregar equipes: ' + error.message)
    return
  }

  equipes.forEach((equipe) => {
    [equipe1(), equipe2()].forEach((select) => {
      const opcao = document.createElement('option')
      opcao.value = equipe.id
      opcao.textContent = equipe.nome
      select.appendChild(opcao)
    })
  })
}

async function mostrarPartidas() {
  const lista = document.querySelector('#partidas-cadastradas')

  const { data: partidas, error } = await supabase
    .from('partidas')
    .select(`
      id,
      equipe1_id,
      equipe2_id,
      data,
      horario,
      local,
      gols1,
      gols2,
      time1:equipes!partidas_equipe1_id_fkey(nome),
      time2:equipes!partidas_equipe2_id_fkey(nome)
    `)
    .order('data')

  if (error) {
    lista.textContent = 'Erro ao carregar partidas: ' + error.message
    return
  }

  lista.innerHTML = ''

  if (!partidas || partidas.length === 0) {
    lista.textContent = 'Nenhuma partida cadastrada ainda.'
    return
  }

  partidas.forEach((partida) => {
    const card = document.createElement('div')
    card.className = 'admin-card'

    const titulo = document.createElement('h2')
    titulo.textContent = `${partida.time1.nome} x ${partida.time2.nome}`

    const data = document.createElement('p')
    data.textContent = `Data: ${partida.data} às ${partida.horario}`

    const local = document.createElement('p')
    local.textContent = `Local: ${partida.local}`

    const resultado = document.createElement('p')
    resultado.textContent =
      partida.gols1 === null || partida.gols2 === null
        ? 'Resultado: A realizar'
        : `Resultado: ${partida.gols1} x ${partida.gols2}`

    const botaoEditar = document.createElement('button')
    botaoEditar.textContent = 'Editar partida'

    botaoEditar.addEventListener('click', () => {
      partidaEditando = partida

      equipe1().value = partida.equipe1_id
      equipe2().value = partida.equipe2_id

      document.querySelector('#data-partida').value = partida.data
      document.querySelector('#horario-partida').value =
        partida.horario?.slice(0, 5) || ''
      document.querySelector('#local-partida').value = partida.local

      document.querySelector('#gols1').value = partida.gols1 ?? ''
      document.querySelector('#gols2').value = partida.gols2 ?? ''

      document.querySelector('h1').textContent = 'Editar partida'
      document.querySelector('.botao-salvar').textContent =
        'SALVAR ALTERAÇÕES'

      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    const botaoExcluir = document.createElement('button')
    botaoExcluir.textContent = 'Excluir partida'

    botaoExcluir.addEventListener('click', async () => {
      if (!confirm('Deseja excluir esta partida?')) return

      const { error } = await supabase
        .from('partidas')
        .delete()
        .eq('id', partida.id)

      if (error) {
        alert('Erro ao excluir: ' + error.message)
        return
      }

      alert('Partida excluída!')
      mostrarPartidas()
    })

    card.append(titulo, data, local, resultado, botaoEditar, botaoExcluir)
    lista.appendChild(card)
  })
}

async function salvarPartida(evento) {
  evento.preventDefault()

  const id1 = equipe1().value
  const id2 = equipe2().value

  if (id1 === id2) {
    alert('Selecione duas equipes diferentes.')
    return
  }

  const valorGols1 = document.querySelector('#gols1').value
  const valorGols2 = document.querySelector('#gols2').value

  if ((valorGols1 === '') !== (valorGols2 === '')) {
    alert('Preencha os gols das duas equipes ou deixe os dois em branco.')
    return
  }

  const partida = {
    equipe1_id: id1,
    equipe2_id: id2,
    data: document.querySelector('#data-partida').value,
    horario: document.querySelector('#horario-partida').value,
    local: document.querySelector('#local-partida').value.trim(),
    gols1: valorGols1 === '' ? null : Number(valorGols1),
    gols2: valorGols2 === '' ? null : Number(valorGols2)
  }

  const botao = document.querySelector('.botao-salvar')
  botao.disabled = true

  let resultado

  if (partidaEditando) {
    resultado = await supabase
      .from('partidas')
      .update(partida)
      .eq('id', partidaEditando.id)
  } else {
    resultado = await supabase
      .from('partidas')
      .insert([partida])
  }

  botao.disabled = false

  if (resultado.error) {
    alert('Erro ao salvar partida: ' + resultado.error.message)
    return
  }

  document.querySelector('#mensagem-partida').textContent =
    partidaEditando
      ? 'Partida atualizada com sucesso!'
      : 'Partida cadastrada com sucesso!'

  document.querySelector('#form-partida').reset()
  partidaEditando = null

  document.querySelector('h1').textContent = 'Gerenciar partidas'
  botao.textContent = 'SALVAR PARTIDA'

  await mostrarPartidas()
}

iniciar()
