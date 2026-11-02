/* Interações do portfólio: menu móvel, troca de idioma preservando a seção, seção ativa e ampliação de imagens.
   Sem dependências. Sem JS, o site continua navegável (links comuns; imagens abrem em tamanho real). */
(function () {
  "use strict";

  /* ---------------------------------------------------------------- menu móvel */
  var botao = document.querySelector(".menu-btn");
  var menu = document.getElementById("menu");

  function definirMenu(aberto) {
    if (!botao || !menu) return;
    menu.classList.toggle("aberto", aberto);
    botao.setAttribute("aria-expanded", String(aberto));
    botao.querySelector(".menu-btn__estado").textContent = aberto ? botao.dataset.fechar : botao.dataset.abrir;
  }

  if (botao && menu) {
    botao.addEventListener("click", function () {
      definirMenu(botao.getAttribute("aria-expanded") !== "true");
    });
    menu.addEventListener("click", function (ev) {
      if (ev.target.closest("a")) definirMenu(false);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && botao.getAttribute("aria-expanded") === "true") {
        definirMenu(false);
        botao.focus();
      }
    });
    window.matchMedia("(min-width: 961px)").addEventListener("change", function (mq) {
      if (mq.matches) definirMenu(false);
    });
  }

  /* ---------------------------------------------------------------- idioma: mantém a página e a seção */
  var trocaIdioma = document.querySelector(".idioma__outro");
  if (trocaIdioma) {
    trocaIdioma.addEventListener("click", function () {
      var hash = decodeURIComponent(location.hash.slice(1));
      if (!hash) return;
      var mapa = {};
      try { mapa = JSON.parse(trocaIdioma.dataset.hashes || "{}"); } catch (e) { mapa = {}; }
      var destino = mapa[hash] || (document.getElementById(hash) ? hash : "");
      if (destino) trocaIdioma.href = trocaIdioma.href.split("#")[0] + "#" + destino;
    });
  }

  /* ---------------------------------------------------------------- seção ativa na página inicial */
  var linksSecao = document.querySelectorAll(".menu a[data-secao]");
  if (linksSecao.length && "IntersectionObserver" in window) {
    var porId = {};
    linksSecao.forEach(function (a) { porId[a.dataset.secao] = a; });
    var visiveis = {};
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) { visiveis[en.target.id] = en.isIntersecting ? en.intersectionRatio : 0; });
      var melhor = null, maior = 0;
      Object.keys(visiveis).forEach(function (id) {
        if (visiveis[id] > maior) { maior = visiveis[id]; melhor = id; }
      });
      linksSecao.forEach(function (a) { a.removeAttribute("aria-current"); });
      if (melhor && porId[melhor]) porId[melhor].setAttribute("aria-current", "true");
    }, { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.25, 0.5, 1] });
    Object.keys(porId).forEach(function (id) {
      var secao = document.getElementById(id);
      if (secao) observador.observe(secao);
    });
  }

  /* ---------------------------------------------------------------- ampliação de imagens */
  var dialogo = document.querySelector(".lightbox");
  if (!dialogo || typeof dialogo.showModal !== "function") return;

  var palco = dialogo.querySelector(".lightbox__palco");
  var img = palco.querySelector("img");
  var legenda = dialogo.querySelector(".lightbox__legenda");
  var contador = dialogo.querySelector(".lightbox__contador");
  var botaoZoom = dialogo.querySelector(".lightbox__zoom");
  var grupo = [], indice = 0, origem = null;

  function textoLegenda(link) {
    var fig = link.closest("figure");
    var cap = fig && fig.querySelector("figcaption");
    return cap ? cap.textContent.trim() : link.querySelector("img").alt;
  }

  function definirZoom(ativo, px, py) {
    palco.classList.toggle("zoom", ativo);
    botaoZoom.setAttribute("aria-pressed", String(ativo));
    if (ativo) {
      var w = parseInt(grupo[indice].dataset.w, 10);
      img.style.width = Math.max(w, palco.clientWidth) + "px";
      // Centraliza a aproximação no ponto clicado (proporções 0–1)
      requestAnimationFrame(function () {
        palco.scrollLeft = (palco.scrollWidth - palco.clientWidth) * (px == null ? 0.5 : px);
        palco.scrollTop = (palco.scrollHeight - palco.clientHeight) * (py == null ? 0.5 : py);
      });
    } else {
      img.style.width = "";
    }
  }

  function mostrar(i) {
    indice = (i + grupo.length) % grupo.length;
    var link = grupo[indice];
    definirZoom(false);
    // Esconde a imagem anterior até a nova carregar, para legenda e imagem nunca divergirem
    palco.classList.add("carregando");
    img.removeAttribute("src");
    img.src = link.getAttribute("href");
    img.alt = link.querySelector("img").alt;
    legenda.textContent = textoLegenda(link);
    contador.textContent = grupo.length > 1 ? (indice + 1) + " " + dialogo.dataset.de + " " + grupo.length : "";
    dialogo.classList.toggle("lightbox--unica", grupo.length < 2);
  }

  document.addEventListener("click", function (ev) {
    var link = ev.target.closest("a[data-galeria]");
    if (!link || ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
    ev.preventDefault();
    origem = link;
    grupo = Array.prototype.slice.call(document.querySelectorAll('a[data-galeria="' + link.dataset.galeria + '"]'));
    mostrar(grupo.indexOf(link));
    dialogo.showModal();
    dialogo.querySelector(".lightbox__fechar").focus();
  });

  img.addEventListener("load", function () { palco.classList.remove("carregando"); });
  img.addEventListener("error", function () { palco.classList.remove("carregando"); });
  dialogo.querySelector(".lightbox__fechar").addEventListener("click", function () { dialogo.close(); });
  dialogo.querySelector(".lightbox__ant").addEventListener("click", function () { mostrar(indice - 1); });
  dialogo.querySelector(".lightbox__prox").addEventListener("click", function () { mostrar(indice + 1); });
  botaoZoom.addEventListener("click", function () { definirZoom(!palco.classList.contains("zoom")); });
  dialogo.addEventListener("close", function () {
    definirZoom(false);
    img.removeAttribute("src");
    if (origem) origem.focus();
  });
  dialogo.addEventListener("keydown", function (ev) {
    if (ev.key === "ArrowRight" && !palco.classList.contains("zoom")) mostrar(indice + 1);
    if (ev.key === "ArrowLeft" && !palco.classList.contains("zoom")) mostrar(indice - 1);
  });
  // Clique no fundo escuro (fora da imagem e dos controles) fecha
  dialogo.addEventListener("click", function (ev) {
    if (ev.target === dialogo || ev.target === palco || ev.target === legenda) dialogo.close();
  });

  // Clique na imagem: aproxima no ponto clicado; arrastar desloca
  var arrasto = null, moveu = false;
  img.addEventListener("click", function (ev) {
    if (moveu) { moveu = false; return; }
    if (palco.classList.contains("zoom")) { definirZoom(false); return; }
    var r = img.getBoundingClientRect();
    definirZoom(true, (ev.clientX - r.left) / r.width, (ev.clientY - r.top) / r.height);
  });
  palco.addEventListener("pointerdown", function (ev) {
    if (!palco.classList.contains("zoom") || ev.pointerType === "touch") return;
    arrasto = { x: ev.clientX, y: ev.clientY, l: palco.scrollLeft, t: palco.scrollTop };
    moveu = false;
    palco.classList.add("arrastando");
  });
  window.addEventListener("pointermove", function (ev) {
    if (!arrasto) return;
    var dx = ev.clientX - arrasto.x, dy = ev.clientY - arrasto.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) moveu = true;
    palco.scrollLeft = arrasto.l - dx;
    palco.scrollTop = arrasto.t - dy;
  });
  window.addEventListener("pointerup", function () {
    arrasto = null;
    palco.classList.remove("arrastando");
  });
})();

/* Texto justificado sem hifenização, em todas as telas: quando alguma linha fica com espaços largos demais, ajusta a
   largura da caixa do texto (até 15% mais estreita, ou mais larga até o limite do contêiner) e fica com a largura de
   espaçamento mais uniforme. Parágrafos de um mesmo texto recebem o mesmo ajuste. Sem JS, o texto continua justificado. */
(function () {
  "use strict";

  var SELETOR = "main p:not([class]), .secao__intro, .lead, .card__resumo, .pub__desc, .tcc__resumo, .premio__texto, " +
    ".aviso, .nota-nome, .fontes__nota, .galeria__nota, .mat__nota, .ficha__nota, .pub__nota, .lista-marcada li, " +
    ".eixos li, .numero__texto";
  // Colunas de texto contínuo: tudo o que está dentro delas é ajustado em conjunto
  var COLUNAS = ".proj-texto, .colab__texto, .sobre__texto";
  var LIMITE = 2;      // espaço máximo aceitável entre palavras, em múltiplos do espaço normal
  var VARIACAO = 0.15; // variação máxima testada, em fração da largura original
  var regua = document.createElement("canvas").getContext("2d");

  // Maior espaço entre palavras (em múltiplos do espaço normal) nas linhas justificadas; a última linha não conta
  function folga(el) {
    regua.font = getComputedStyle(el).font;
    var espaco = regua.measureText(" ").width || 4;
    var linhas = {}, percurso = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), palavra = /\S+/g, faixa = document.createRange();
    while (percurso.nextNode()) {
      var no = percurso.currentNode, m;
      palavra.lastIndex = 0;
      while ((m = palavra.exec(no.data))) {
        faixa.setStart(no, m.index);
        faixa.setEnd(no, m.index + m[0].length);
        var r = faixa.getClientRects()[0];
        if (!r) continue;
        var chave = Math.round(r.top);
        (linhas[chave] = linhas[chave] || []).push(r);
      }
    }
    var tops = Object.keys(linhas).map(Number).sort(function (a, b) { return a - b; });
    var maior = 0;
    tops.slice(0, -1).forEach(function (t) {
      var l = linhas[t].sort(function (a, b) { return a.left - b.left; });
      for (var i = 1; i < l.length; i++) maior = Math.max(maior, (l[i].left - l[i - 1].right) / espaco);
    });
    return maior;
  }

  function cartao(el) {
    var s = getComputedStyle(el);
    return parseFloat(s.borderLeftWidth) > 0 || s.backgroundColor !== "rgba(0, 0, 0, 0)";
  }

  // Como variar a área de texto de um elemento: aplicar(a) deixa o texto "a" px mais estreito (negativo: mais largo)
  function regulador(el) {
    var proprio = getComputedStyle(el), largura = el.getBoundingClientRect().width;
    if (cartao(el)) {
      // Cartões (borda ou fundo próprios) mantêm a caixa da grade: varia a margem interna, igual dos dois lados
      var pe = parseFloat(proprio.paddingLeft), pd = parseFloat(proprio.paddingRight);
      return {
        minimo: -Math.max(0, Math.min(pe, pd) - 8) * 2, maximo: largura * VARIACAO,
        aplicar: function (a) {
          el.style.paddingLeft = a ? pe + a / 2 + "px" : "";
          el.style.paddingRight = a ? pd + a / 2 + "px" : "";
        }
      };
    }
    // Parágrafos: varia a largura; só cresce quando limitado por max-width (não pela grade) e até o contêiner
    var pai = el.parentElement, estilo = getComputedStyle(pai), teto = 0;
    if (proprio.maxWidth !== "none" && !/grid|flex/.test(estilo.display)) {
      teto = Math.min(largura * VARIACAO,
        pai.clientWidth - parseFloat(estilo.paddingLeft) - parseFloat(estilo.paddingRight) - largura);
    }
    return {
      minimo: -Math.max(0, teto), maximo: largura * VARIACAO,
      aplicar: function (a) {
        el.style.width = a ? largura - a + "px" : "";
        el.style.maxWidth = a ? "none" : "";
      }
    };
  }

  // Bloco de texto a que o elemento pertence: o contêiner dos parágrafos (para itens de lista, o contêiner da lista).
  // Cartões e elementos dispostos em grade/colunas são textos isolados (sem bloco)
  function bloco(el) {
    if (cartao(el)) return null;
    var pai = el.parentElement, coluna = el.closest(COLUNAS);
    if (coluna && !(el.tagName === "LI" && pai.matches(".lista-marcada--colunas"))) return coluna;
    if (el.tagName === "LI") {
      if (/grid|flex/.test(getComputedStyle(pai).display)) return null;
      pai = pai.parentElement;
    }
    return /grid|flex/.test(getComputedStyle(pai).display) ? null : pai;
  }

  // Todos os parágrafos e itens de lista de um mesmo texto formam um grupo e recebem sempre o mesmo ajuste, para manter
  // as margens alinhadas ao longo do texto; textos isolados e cartões são ajustados um a um
  function agrupar(itens) {
    var grupos = [], porBloco = new Map();
    itens.forEach(function (el) {
      if (!el.offsetParent) return;
      var b = bloco(el);
      if (!b) return grupos.push([el]);
      if (!porBloco.has(b)) grupos.push(porBloco.set(b, []).get(b));
      porBloco.get(b).push(el);
    });
    return grupos;
  }

  function ajustar() {
    var itens = Array.prototype.slice.call(document.querySelectorAll(SELETOR));
    itens.forEach(function (el) { el.style.maxWidth = el.style.width = el.style.paddingLeft = el.style.paddingRight = ""; });
    agrupar(itens).forEach(function (grupo) {
      function folgaGrupo() { return Math.max.apply(null, grupo.map(folga)); }
      var melhor = { ajuste: 0, folga: folgaGrupo() };
      if (melhor.folga <= LIMITE) return;
      var regs = grupo.map(regulador);
      var minimo = Math.max.apply(null, regs.map(function (r) { return r.minimo; }));
      var maximo = Math.min.apply(null, regs.map(function (r) { return r.maximo; }));
      function aplicar(a) { regs.forEach(function (r) { r.aplicar(a); }); }
      // Testa a partir da largura original, alternando mais estreita e mais larga, e fica com a de menor folga
      for (var d = 4; d <= maximo; d += 4) {
        [d, -d].forEach(function (a) {
          if (a < minimo || melhor.folga <= LIMITE) return;
          aplicar(a);
          var f = folgaGrupo();
          if (f < melhor.folga - 0.2) melhor = { ajuste: a, folga: f };
        });
        if (melhor.folga <= LIMITE) break;
      }
      aplicar(melhor.ajuste);
    });
  }

  var larguraJanela = window.innerWidth, espera;
  window.addEventListener("resize", function () {
    if (window.innerWidth === larguraJanela) return;
    larguraJanela = window.innerWidth;
    clearTimeout(espera);
    espera = setTimeout(ajustar, 150);
  });
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(ajustar);
})();
