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
