
import './style.css'
import { supabase } from './supabase.js'

const app = document.querySelector('#app')

async function carregarClassificacao() {
  app.innerHTML = `
    <main class="painel-admin">
      <header class="admin-cabecalho">
        <h1>Classificação</h1>
        <p>Campeonato Futsal FJU Céu Azul</p>
        <a href="/">← Voltar ao site</a>
      </header>

      <section class="admin-conteudo">
        <h2>Tabela do campeonato</h2>
        <p>Atualizada automaticamente conforme os resultados das partidas.</p>
        <div id="tabela-classificacao">Carregando classificação...</div>
      </section>
    </main>
  `

  const conteudo = document.querySelector('#tabela-classificacao')

  const [resultadoEquipes, resultadoPartidas] = await Promise.all([
    supabase
      .from('equipes')
      .select('id, nome')
      .order('nome'),

    supabase
      .from('partidas')
      .select('equipe1_id, equipe2_id, gols1, gols2')
  ])

  if (resultadoEquipes.error || resultadoPartidas.error) {
    const erro = resultadoEquipes.error || resultadoPartidas.error
    conteudo.textContent = 'Erro ao carregar classificação: ' + erro.message
    return
  }

  const equipes = resultadoEquipes.data || []
  const partidas = resultadoPartidas.data || []

  const tabela = equipes.map(equipe => ({
    id: equipe.id,
    nome: equipe.nome,
    pontos: 0,
    jogos: 0,
    vitorias: 0,
    empates: 0,
    derrotas: 0,
    golsPro: 0,
    golsContra: 0,
    saldo: 0
  }))

  partidas.forEach(partida => {
    if (partida.gols1 === null || partida.gols2 === null) return

    const gols1 = Number(partida.gols1)
    const gols2 = Number(partida.gols2)

    if (
      !Number.isInteger(gols1) ||
      !Number.isInteger(gols2) ||
      gols1 < 0 ||
      gols2 < 0
    ) return

    const equipe1 = tabela.find(e => e.id === partida.equipe1_id)
    const equipe2 = tabela.find(e => e.id === partida.equipe2_id)

    if (!equipe1 || !equipe2) return

    equipe1.jogos++
    equipe2.jogos++

    equipe1.golsPro += gols1
    equipe1.golsContra += gols2

    equipe2.golsPro += gols2
    equipe2.golsContra += gols1

    if (gols1 > gols2) {
      equipe1.vitorias++
      equipe1.pontos += 3
      equipe2.derrotas++
    } else if (gols2 > gols1) {
      equipe2.vitorias++
      equipe2.pontos += 3
      equipe1.derrotas++
    } else {
      equipe1.empates++
      equipe2.empates++
      equipe1.pontos++
      equipe2.pontos++
    }
  })

  tabela.forEach(equipe => {
    equipe.saldo = equipe.golsPro - equipe.golsContra
  })

  tabela.sort((a, b) =>
    b.pontos - a.pontos ||
    b.vitorias - a.vitorias ||
    b.saldo - a.saldo ||
    b.golsPro - a.golsPro ||
    a.nome.localeCompare(b.nome)
  )

  if (tabela.length === 0) {
    conteudo.innerHTML = '<p>Nenhuma equipe cadastrada ainda.</p>'
    return
  }

  conteudo.innerHTML = `
    <div style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>POS</th>
            <th>EQUIPE</th>
            <th>PTS</th>
            <th>J</th>
            <th>V</th>
            <th>E</th>
            <th>D</th>
            <th>GP</th>
            <th>GC</th>
            <th>SG</th>
          </tr>
        </thead>

        <tbody>
          ${tabela.map((e, i) => `
            <tr>
              <td>${i + 1}º</td>
              <td><strong>${escapar(e.nome)}</strong></td>
              <td><strong>${e.pontos}</strong></td>
              <td>${e.jogos}</td>
              <td>${e.vitorias}</td>
              <td>${e.empates}</td>
              <td>${e.derrotas}</td>
              <td>${e.golsPro}</td>
              <td>${e.golsContra}</td>
              <td>${e.saldo}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <p style="margin-top:20px;">
      <strong>Regras:</strong> Vitória = 3 pontos | Empate = 1 ponto | Derrota = 0 pontos.
    </p>
  `
}

function escapar(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, caractere => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caractere])
}

carregarClassificacao()
