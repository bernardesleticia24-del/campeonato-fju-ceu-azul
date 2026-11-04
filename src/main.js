
import './style.css'
import { supabase } from './supabase.js'

const app = document.querySelector('#app')

function escapar(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, caractere => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[caractere])
}

function formatarData(data) {
  if (!data) return 'A definir'

  const partes = data.split('-')
  if (partes.length !== 3) return data

  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

function obterClassificacao(equipes, partidas) {
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

    if (!Number.isInteger(gols1) || !Number.isInteger(gols2)) return
    if (gols1 < 0 || gols2 < 0) return

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

  return tabela.sort((a, b) =>
    b.pontos - a.pontos ||
    b.vitorias - a.vitorias ||
    b.saldo - a.saldo ||
    b.golsPro - a.golsPro ||
    a.nome.localeCompare(b.nome)
  )
}

async function carregarSite() {
  app.innerHTML = '<main class="admin-conteudo"><h2>Carregando campeonato...</h2></main>'

  const [resultadoEquipes, resultadoPartidas] = await Promise.all([
    supabase
      .from('equipes')
      .select('id, nome, jogadores(id, nome, numero)')
      .order('nome'),

    supabase
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
      .order('horario')
  ])

  if (resultadoEquipes.error || resultadoPartidas.error) {
    const erro = resultadoEquipes.error || resultadoPartidas.error

    app.innerHTML = `
      <main class="admin-conteudo">
        <h1>Não foi possível carregar o campeonato.</h1>
        <p>${escapar(erro.message)}</p>
        <button onclick="location.reload()">Tentar novamente</button>
      </main>
    `
    return
  }

  const equipes = resultadoEquipes.data || []
  const partidas = resultadoPartidas.data || []

  renderizarSite(equipes, partidas)
}

function renderizarSite(equipes, partidas) {
  const classificacao = obterClassificacao(equipes, partidas)

  const partidasOrdenadas = [...partidas].sort((a, b) => {
    const dataA = `${a.data || ''} ${a.horario || ''}`
    const dataB = `${b.data || ''} ${b.horario || ''}`
    return dataA.localeCompare(dataB)
  })

  app.innerHTML = `
    <header class="cabecalho">
    <a href="/admin.html" class="botao-admin">ADMINISTRADOR</a>
      <div class="logo">
        <span class="logo-fju">FJU</span>
        <span class="logo-texto">FORÇA JOVEM UNIVERSAL</span>
      </div>

    <nav class="menu">
  <a href="/#inicio">INÍCIO</a>
  <a href="/#campeonato">CAMPEONATO</a>
  <a href="/#equipes">EQUIPES</a>
  <a href="/#jogos">JOGOS</a>
  <a href="/#classificacao">CLASSIFICAÇÃO</a>
  <a href="/#sobre">SOBRE</a>
  <a href="/#contato">CONTATO</a>
</nav>
    </header>

    <main>
      <section class="inicio" id="inicio">
        <div class="conteudo-inicio">
          <span class="etiqueta">FJU CÉU AZUL APRESENTA</span>

          <h1>
            CAMPEONATO<br>
            <span>DE FUTSAL</span>
          </h1>

          <p class="subtitulo">
            Talento, união e espírito de equipe.
            Prepare seu time e venha fazer parte!
          </p>

          <div class="informacoes">
            <div>
              <span>DATA</span>
              <strong>15 NOV 2026</strong>
            </div>

            <div>
              <span>LOCAL</span>
              <strong>GINÁSIO DO CÉU AZUL</strong>
            </div>
          </div>

          <a href="#campeonato" class="botao">
            CONHEÇA O CAMPEONATO
          </a>
        </div>

        <div class="destaque">
          <img src="/images/futsal.jpg" alt="Jogadores disputando uma partida de futsal">
          <span class="texto-destaque">ESPORTE • UNIÃO • SUPERAÇÃO</span>
        </div>
      </section>

      <section class="sobre" id="campeonato">
        <span class="etiqueta">CONHEÇA O EVENTO</span>
        <h2>Mais que um jogo, uma experiência!</h2>

        <p>
          Um campeonato para reunir equipes, incentivar o esporte
          e celebrar a união através do futsal.
        </p>

        <div class="cards-campeonato">
          <div class="card-info">
            <span>📅</span>
            <h3>DATA</h3>
            <p>15 de novembro de 2026</p>
          </div>

          <div class="card-info">
            <span>📍</span>
            <h3>LOCAL</h3>
            <p>Ginásio do Céu Azul</p>
          </div>

          <div class="card-info">
            <span>🏆</span>
            <h3>PREMIAÇÃO</h3>
            <p>1º e 2º lugar</p>
          </div>

          <div class="card-info">
            <span>⚽</span>
            <h3>ORGANIZAÇÃO</h3>
            <p>FJU Céu Azul</p>
          </div>
        </div>
      </section>

      <section class="equipes" id="equipes">
        <span class="etiqueta">NOSSOS PARTICIPANTES</span>
        <h2>Quem vai entrar em quadra?</h2>

        <p>Conheça as equipes participantes do campeonato.</p>

        <div class="cards-campeonato">
          ${
            equipes.length
              ? equipes.map(equipe => `
                  <div class="card-info">
                    <span>⚽</span>
                    <h3>${escapar(equipe.nome)}</h3>
                    <p>${(equipe.jogadores || []).length} jogadores cadastrados</p>
                  </div>
                `).join('')
              : `
                <div class="equipe-vazia">
                  <span>⚽</span>
                  <h3>Equipes em preparação</h3>
                  <p>Aguarde a divulgação dos times participantes!</p>
                </div>
              `
          }
        </div>
      </section>

      <section class="jogos" id="jogos">
        <span class="etiqueta">ACOMPANHE A COMPETIÇÃO</span>
        <h2>Jogos e resultados</h2>

        <p class="descricao-jogos">
          Confira a programação e acompanhe os resultados das partidas.
        </p>

        <div class="tabela-jogos">
          <div class="linha-jogo cabecalho-jogo">
            <span>PARTIDA</span>
            <span>DATA</span>
            <span>HORÁRIO</span>
            <span>RESULTADO</span>
          </div>

          ${
            partidasOrdenadas.length
              ? partidasOrdenadas.map(partida => {
                  const nome1 = partida.time1?.nome || 'Equipe'
                  const nome2 = partida.time2?.nome || 'Equipe'

                  const temResultado =
                    partida.gols1 !== null &&
                    partida.gols2 !== null

                  return `
                    <div class="linha-jogo">
                      <span>${escapar(nome1)} x ${escapar(nome2)}</span>
                      <span>${escapar(formatarData(partida.data))}</span>
                      <span>${escapar(partida.horario?.slice(0, 5) || 'A definir')}</span>
                      <strong>
                        ${
                          temResultado
                            ? `${escapar(partida.gols1)} x ${escapar(partida.gols2)}`
                            : 'A realizar'
                        }
                      </strong>
                    </div>
                  `
                }).join('')
              : `
                <div class="linha-jogo">
                  <span>Nenhuma partida cadastrada ainda.</span>
                </div>
              `
          }
        </div>
      </section>

      <section class="classificacao" id="classificacao">
        <span class="etiqueta">DISPUTA PELO TÍTULO</span>
        <h2>Tabela de classificação</h2>

        <p class="descricao-classificacao">
          Acompanhe o desempenho das equipes no campeonato.
        </p>

        <div class="tabela-classificacao">
          <div class="linha-classificacao topo-classificacao">
            <span>POS.</span>
            <span>EQUIPE</span>
            <span>PTS</span>
            <span>J</span>
            <span>V</span>
            <span>E</span>
            <span>D</span>
          </div>

          ${
            classificacao.length
              ? classificacao.map((equipe, indice) => `
                  <div class="linha-classificacao">
                    <strong>${String(indice + 1).padStart(2, '0')}</strong>
                    <span>${escapar(equipe.nome)}</span>
                    <strong>${equipe.pontos}</strong>
                    <span>${equipe.jogos}</span>
                    <span>${equipe.vitorias}</span>
                    <span>${equipe.empates}</span>
                    <span>${equipe.derrotas}</span>
                  </div>
                `).join('')
              : `
                  <div class="linha-classificacao">
                    <span>Nenhuma equipe cadastrada ainda.</span>
                  </div>
              `
          }
        </div>

        <p class="legenda-classificacao">
          PTS: Pontos | J: Jogos | V: Vitórias | E: Empates | D: Derrotas
        </p>

        <a href="/classificacao.html" class="botao">
          VER CLASSIFICAÇÃO COMPLETA
        </a>
      </section>

      <section class="contato" id="contato">
        <h2>Faça parte desse campeonato!</h2>
        <p>Entre em contato para obter informações.</p>

        <a href="https://wa.me/5561991623137" target="_blank" rel="noopener noreferrer">
          FALAR PELO WHATSAPP
        </a>
      </section>
    </main>

    <footer id="sobre">
      <p>FJU CÉU AZUL • CAMPEONATO DE FUTSAL 2026</p>
    </footer>
  `
}

carregarSite()
