/* =========================================================
   CARLAND 1601 — Lógica del catálogo
   Todo el catálogo se genera dinámicamente desde productos.json
   ========================================================= */

// ---------- CONFIGURACIÓN ----------
// Cambia este número por el WhatsApp real del negocio (código de país + número, sin + ni espacios)
const WHATSAPP_NUMBER = "50489534880";

// Slides del carrusel principal (rota automáticamente cada 4.5s)
const HERO_SLIDES = [
  {
    variant: "a", icon: "🔥",
    eyebrow: "Lo más pedido",
    title: "Más vendidos",
    text: "Las piezas que más se llevan nuestros clientes esta semana.",
    filterCategory: "Todos",
    image: "assets/productos/roll.jpg",
    imageAlt: "Rolls-Royce Spectre a escala"
  },
  {
    variant: "b", icon: "💥",
    eyebrow: "Por tiempo limitado",
    title: "Ofertas de la semana",
    text: "Precios especiales en modelos seleccionados. No duran mucho.",
    filterCategory: "Ofertas",
    image: "assets/productos/sto.jpg",
    imageAlt: "Modelo en oferta"
  },
  {
    variant: "c", icon: "🚚",
    eyebrow: "Cobertura nacional",
    title: "Envíos a todo Honduras",
    text: "Llega hasta la puerta de tu casa, pagas por depósito o transferencia.",
    filterCategory: "Todos",
    image: "assets/productos/mack.jpg",
    imageAlt: "Camión Mack a escala"
  },
  {
    variant: "d", icon: "⭐",
    eyebrow: "Recién llegados",
    title: "Nuevos ingresos",
    text: "Las últimas piezas que se sumaron al catálogo.",
    filterCategory: "Novedades",
    image: "assets/productos/h2r.jpg",
    imageAlt: "Kawasaki H2R a escala"
  },
  {
    variant: "e", icon: "🚗",
    eyebrow: "Colección",
    title: "Tacoma Collection",
    text: "Toda la línea Toyota Tacoma a escala, lista para coleccionar.",
    filterCategory: "Autos",
    image: "assets/productos/dorada.jpg",
    imageAlt: "Toyota Tacoma dorada a escala"
  },
  {
    variant: "f", icon: "🚙",
    eyebrow: "Colección",
    title: "Toyota Collection",
    text: "Prado, Land Cruiser, Hilux y más, en un solo lugar.",
    filterCategory: "Autos",
    image: "assets/productos/landb.png",
    imageAlt: "Toyota Land Cruiser 70 a escala"
  },
  {
    variant: "g", icon: "🎁",
    eyebrow: "Sorpresa",
    title: "Mystery Box",
    text: "No sabes cuál te toca, pero seguro te va a encantar.",
    filterCategory: "Todos",
    image: "assets/productos/mcqueenrc.png",
    imageAlt: "Auto de control remoto sorpresa"
  }
];

// Orden en que deben aparecer los botones de categoría
const CATEGORY_ORDER = [
  "Todos",
  "Autos",
  "Motocicletas",
  "Otros",
  "Rastras",
  "Maquinaria",
  "Control Remoto",
  "Novedades",
  "Ofertas"
];

// ---------- ESTADO ----------
let allProducts = [];
let currentCategory = "Todos";
let currentSearch = "";
let renderedProducts = []; // productos actualmente visibles en el grid (tras filtros/búsqueda)
let lastFocusedElement = null; // para devolver el foco al cerrar el modal

// ---------- ELEMENTOS DEL DOM ----------
const grid = document.getElementById("productsGrid");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const filtersContainer = document.getElementById("categoryFilters");
const navbar = document.getElementById("navbar");
const navToggle = document.getElementById("navToggle");
const navInfoMobile = document.getElementById("navInfoMobile");
const backToTop = document.getElementById("backToTop");
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");
const heroTrack = document.getElementById("heroTrack");
const heroDots = document.getElementById("heroDots");
const heroPrevBtn = document.getElementById("heroPrev");
const heroNextBtn = document.getElementById("heroNext");

/**
 * Formatea un número como moneda en Lempiras (L.)
 */
function formatPrice(value) {
  const num = Number(value) || 0;
  return "L. " + num.toLocaleString("es-HN", { minimumFractionDigits: 0 });
}

/**
 * Construye el enlace de WhatsApp con mensaje precargado para un producto
 */
function buildWhatsappLink(product) {
  const mensaje = `Hola, me interesa el ${product.nombre} escala ${product.escala} con precio de ${formatPrice(product.precio)}.`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
}

/**
 * Determina qué "chip" de estado / etiqueta especial mostrar sobre la tarjeta,
 * a partir del campo "etiqueta" del producto (acepta singular y plural)
 */
function getBadgeClass(etiqueta) {
  const map = {
    "Nuevo": "card__badge--nuevo",
    "Nuevos": "card__badge--nuevo",
    "Oferta": "card__badge--oferta",
    "Ofertas": "card__badge--oferta",
    "Novedad": "card__badge--novedad",
    "Novedades": "card__badge--novedad"
  };
  return map[etiqueta] || null;
}

/**
 * Etiquetas automáticas: para productos que no tienen ya una etiqueta fuerte
 * (Nuevo/Oferta/Novedad), se les asigna al azar, en cada carga de página,
 * una de estas para que el catálogo se sienta siempre activo.
 */
const AUTO_BADGE_POOL = [
  { label: "🔥 HOT", cls: "card__badge--hot" },
  { label: "⭐ Popular", cls: "card__badge--popular" },
  { label: "🚚 Envío rápido", cls: "card__badge--envio" },
  { label: "💥 Oferta", cls: "card__badge--oferta" }
];
const AUTO_BADGE_CHANCE = 0.3; // ~30% de los productos sin etiqueta reciben una automática

/**
 * Asigna una etiqueta automática (o ninguna) a cada producto sin etiqueta fuerte.
 * Se llama una sola vez al cargar el catálogo para que el badge de cada
 * producto se mantenga estable mientras el usuario filtra/busca.
 */
function assignAutoBadges(products) {
  products.forEach((p) => {
    if (getBadgeClass(p.etiqueta)) return; // ya tiene una etiqueta real, no se toca
    if (Math.random() < AUTO_BADGE_CHANCE) {
      const pick = AUTO_BADGE_POOL[Math.floor(Math.random() * AUTO_BADGE_POOL.length)];
      p._autoBadge = pick;
    }
  });
}

/**
 * Genera el HTML de una tarjeta de producto
 */
function renderCard(product, index) {
  const isAvailable = product.estado === "Disponible";
  const badgeClass = getBadgeClass(product.etiqueta);

  let badgeHtml = "";
  if (badgeClass) {
    badgeHtml = `<span class="card__badge ${badgeClass}">${product.etiqueta}</span>`;
  } else if (product._autoBadge) {
    badgeHtml = `<span class="card__badge ${product._autoBadge.cls}">${product._autoBadge.label}</span>`;
  }

  const statusClass = isAvailable ? "card__status--disponible" : "card__status--agotado";
  const statusLabel = isAvailable ? "Disponible" : "Agotado";

  const buyBtn = isAvailable
    ? `<a href="${buildWhatsappLink(product)}" target="_blank" rel="noopener" class="card__buy">
         <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M16.02 2.6C8.6 2.6 2.6 8.6 2.6 16c0 2.5.68 4.85 1.86 6.87L2.7 29.4l6.7-1.75A13.35 13.35 0 0 0 16.02 29.4c7.42 0 13.42-6 13.42-13.4S23.44 2.6 16.02 2.6zm0 24.4c-2.2 0-4.24-.6-6-1.65l-.43-.25-4 1.05 1.07-3.9-.28-.4a10.9 10.9 0 0 1-1.7-5.8c0-6.04 4.9-10.94 10.94-10.94 6.03 0 10.93 4.9 10.93 10.94 0 6.03-4.9 10.95-10.93 10.95zm6-8.18c-.33-.16-1.94-.96-2.24-1.07-.3-.11-.52-.16-.74.17-.22.32-.85 1.06-1.04 1.28-.19.22-.38.24-.71.08-.33-.16-1.4-.52-2.66-1.65-.98-.87-1.65-1.95-1.84-2.28-.19-.32-.02-.5.14-.66.15-.15.33-.38.5-.58.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.58-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.41-.3.32-1.15 1.13-1.15 2.75s1.18 3.19 1.34 3.41c.16.22 2.32 3.55 5.63 4.98.79.34 1.4.54 1.88.7.79.25 1.5.21 2.07.13.63-.1 1.94-.79 2.21-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.63-.38z"/></svg>
         Comprar
       </a>`
    : `<span class="card__buy card__buy--disabled">Agotado</span>`;

  return `
    <article class="card" data-index="${index}" tabindex="0" role="button" aria-label="Ver ${product.nombre} en grande">
      <div class="card__mediaWrap">
        ${badgeHtml}
        <span class="card__status ${statusClass}">${statusLabel}</span>
        <img src="${product.imagen}" alt="${product.nombre}" loading="lazy" class="lazy-fade" onload="this.classList.add('is-loaded')">
      </div>
      <div class="card__body">
        <span class="card__brand">${product.marca}</span>
        <h3 class="card__name">${product.nombre}</h3>
        <span class="card__scale">Escala ${product.escala}</span>
        <div class="card__priceRow">
          <span class="card__price">${formatPrice(product.precio)}</span>
        </div>
        ${buyBtn}
      </div>
    </article>
  `;
}

/**
 * Genera el contenido interno del modal para un producto dado
 */
function renderModalBody(product) {
  const isAvailable = product.estado === "Disponible";
  const badgeClass = getBadgeClass(product.etiqueta);

  const etiquetaChip = badgeClass
    ? `<span class="modalContent__chip ${badgeClass.replace('card__badge', 'modalContent__chip')}">${product.etiqueta}</span>`
    : "";

  const statusChip = isAvailable
    ? `<span class="modalContent__chip modalContent__chip--disponible">Disponible</span>`
    : `<span class="modalContent__chip modalContent__chip--agotado">Agotado</span>`;

  const buyBtn = isAvailable
    ? `<a href="${buildWhatsappLink(product)}" target="_blank" rel="noopener" class="modalContent__buy">
         <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16.02 2.6C8.6 2.6 2.6 8.6 2.6 16c0 2.5.68 4.85 1.86 6.87L2.7 29.4l6.7-1.75A13.35 13.35 0 0 0 16.02 29.4c7.42 0 13.42-6 13.42-13.4S23.44 2.6 16.02 2.6zm0 24.4c-2.2 0-4.24-.6-6-1.65l-.43-.25-4 1.05 1.07-3.9-.28-.4a10.9 10.9 0 0 1-1.7-5.8c0-6.04 4.9-10.94 10.94-10.94 6.03 0 10.93 4.9 10.93 10.94 0 6.03-4.9 10.95-10.93 10.95zm6-8.18c-.33-.16-1.94-.96-2.24-1.07-.3-.11-.52-.16-.74.17-.22.32-.85 1.06-1.04 1.28-.19.22-.38.24-.71.08-.33-.16-1.4-.52-2.66-1.65-.98-.87-1.65-1.95-1.84-2.28-.19-.32-.02-.5.14-.66.15-.15.33-.38.5-.58.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.58-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.41-.3.32-1.15 1.13-1.15 2.75s1.18 3.19 1.34 3.41c.16.22 2.32 3.55 5.63 4.98.79.34 1.4.54 1.88.7.79.25 1.5.21 2.07.13.63-.1 1.94-.79 2.21-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.63-.38z"/></svg>
         Comprar por WhatsApp
       </a>`
    : `<span class="modalContent__buy modalContent__buy--disabled">Agotado</span>`;

  return `
    <button class="modalContent__close" id="modalCloseBtn" aria-label="Cerrar vista previa">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M6 6l12 12M18 6L6 18"/></svg>
    </button>
    <div class="modalContent__media">
      <img src="${product.imagen}" alt="${product.nombre}">
    </div>
    <div class="modalContent__body">
      <span class="modalContent__brand">${product.marca}</span>
      <h2 class="modalContent__name" id="modalName">${product.nombre}</h2>
      <div class="modalContent__meta">
        <span class="modalContent__chip">Escala ${product.escala}</span>
        <span class="modalContent__chip">${product.categoria}</span>
        ${etiquetaChip}
        ${statusChip}
      </div>
      <div class="modalContent__priceBlock">
        <p class="modalContent__priceLabel">Precio</p>
        <p class="modalContent__price">${formatPrice(product.precio)}</p>
      </div>
      ${buyBtn}
    </div>
  `;
}

/**
 * Abre el modal de vista previa animando su crecimiento desde la
 * posición y el tamaño exactos de la tarjeta en la que se hizo clic
 * (técnica FLIP: First, Last, Invert, Play) — efecto tipo Canva.
 */
function openProductModal(product, cardEl) {
  lastFocusedElement = document.activeElement;

  const firstRect = cardEl.getBoundingClientRect();

  modalContent.innerHTML = renderModalBody(product);
  modalOverlay.hidden = false;
  document.body.classList.add("modal-open");

  // "Last": posición/tamaño final una vez que el modal ya está centrado
  const lastRect = modalContent.getBoundingClientRect();

  const deltaX = firstRect.left - lastRect.left;
  const deltaY = firstRect.top - lastRect.top;
  const scaleX = firstRect.width / lastRect.width;
  const scaleY = firstRect.height / lastRect.height;

  // "Invert": colocamos el modal visualmente donde estaba la tarjeta
  modalContent.style.transition = "none";
  modalContent.style.transformOrigin = "top left";
  modalContent.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
  modalContent.style.opacity = "0.5";
  modalContent.style.borderRadius = "16px";

  // Forzar reflow para que el navegador registre el estado inicial
  void modalContent.offsetWidth;

  // "Play": animamos hacia el estado final (tamaño completo, centrado)
  requestAnimationFrame(() => {
    modalContent.style.transition =
      "transform 0.45s cubic-bezier(.22,.85,.3,1), opacity 0.28s ease";
    modalContent.style.transform = "translate(0, 0) scale(1, 1)";
    modalContent.style.opacity = "1";
  });

  requestAnimationFrame(() => {
    modalOverlay.classList.add("is-visible");
  });

  document.getElementById("modalCloseBtn").addEventListener("click", closeProductModal);
}

/**
 * Cierra el modal encogiéndolo de vuelta hacia la tarjeta original
 * (si sigue visible en el grid) o con un simple fundido si ya no está.
 */
function closeProductModal() {
  const activeIndex = modalContent.dataset.activeIndex;
  const originCard = grid.querySelector(`.card[data-index="${activeIndex}"]`);

  modalOverlay.classList.remove("is-visible");

  if (originCard) {
    const rect = originCard.getBoundingClientRect();
    const modalRect = modalContent.getBoundingClientRect();
    const deltaX = rect.left - modalRect.left;
    const deltaY = rect.top - modalRect.top;
    const scaleX = rect.width / modalRect.width;
    const scaleY = rect.height / modalRect.height;

    modalContent.style.transition =
      "transform 0.32s cubic-bezier(.4,0,.6,1), opacity 0.25s ease";
    modalContent.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`;
    modalContent.style.opacity = "0.4";
  } else {
    modalContent.style.transition = "transform 0.25s ease, opacity 0.25s ease";
    modalContent.style.transform = "scale(0.94)";
    modalContent.style.opacity = "0";
  }

  setTimeout(() => {
    modalOverlay.hidden = true;
    modalContent.style.transition = "none";
    modalContent.style.transform = "none";
    modalContent.style.opacity = "1";
    modalContent.innerHTML = "";
    document.body.classList.remove("modal-open");
    if (lastFocusedElement) lastFocusedElement.focus();
  }, 320);
}

// Abrir el modal al hacer clic (o presionar Enter/Espacio) en una tarjeta,
// siempre que el clic no haya sido sobre el botón "Comprar por WhatsApp"
grid.addEventListener("click", (e) => {
  if (e.target.closest(".card__buy")) return; // deja que el enlace de WhatsApp funcione normal
  const cardEl = e.target.closest(".card");
  if (!cardEl) return;

  const product = renderedProducts[Number(cardEl.dataset.index)];
  if (!product) return;

  modalContent.dataset.activeIndex = cardEl.dataset.index;
  openProductModal(product, cardEl);
});

grid.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const cardEl = e.target.closest(".card");
  if (!cardEl) return;
  e.preventDefault();
  cardEl.click();
});

// Cerrar el modal al hacer clic fuera del contenido, con Escape, o con el botón X
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeProductModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !modalOverlay.hidden) closeProductModal();
});

/**
 * Aplica los filtros de búsqueda + categoría actuales y vuelve a pintar el grid
 */
function applyFiltersAndRender() {
  const term = currentSearch.trim().toLowerCase();

  const filtered = allProducts.filter((p) => {
    const matchesCategory =
      currentCategory === "Todos" || p.categoria === currentCategory;

    const matchesSearch =
      term === "" ||
      p.nombre.toLowerCase().includes(term) ||
      p.marca.toLowerCase().includes(term) ||
      p.categoria.toLowerCase().includes(term) ||
      p.escala.toLowerCase().includes(term);

    return matchesCategory && matchesSearch;
  });

  renderedProducts = filtered;
  grid.innerHTML = filtered.map((p, i) => renderCard(p, i)).join("");
  emptyMessage.hidden = filtered.length !== 0;
}

/**
 * Genera dinámicamente los botones de categoría a partir de las categorías
 * realmente presentes en productos.json (respetando el orden preferido)
 */
function renderCategoryFilters() {
  const presentCategories = new Set(allProducts.map((p) => p.categoria));
  const categoriesToShow = CATEGORY_ORDER.filter(
    (cat) => cat === "Todos" || presentCategories.has(cat)
  );

  filtersContainer.innerHTML = categoriesToShow
    .map((cat) => {
      const activeClass = cat === currentCategory ? "is-active" : "";
      return `<button class="filter-btn ${activeClass}" data-category="${cat}">${cat}</button>`;
    })
    .join("");

  // Delegación de eventos para los botones de filtro
  filtersContainer.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentCategory = btn.dataset.category;
      renderCategoryFilters();
      applyFiltersAndRender();
    });
  });
}

/**
 * Carga el catálogo desde la lista de productos embebida en index.html
 * (window.PRODUCTOS, definida en un <script> justo antes de script.js)
 */
function loadProducts() {
  if (!Array.isArray(window.PRODUCTOS)) {
    console.error("No se encontró window.PRODUCTOS. Revisa el bloque <script> en index.html");
    grid.innerHTML = `<p class="products__empty">No se pudo cargar el catálogo. Revisa la lista de productos en index.html.</p>`;
    return;
  }

  allProducts = window.PRODUCTOS;
  assignAutoBadges(allProducts);
  renderCategoryFilters();
  applyFiltersAndRender();
}

// ---------- BUSCADOR EN TIEMPO REAL ----------
searchInput.addEventListener("input", (e) => {
  currentSearch = e.target.value;
  applyFiltersAndRender();
});

// ---------- WHATSAPP: NAVBAR Y BOTÓN FLOTANTE (mensaje genérico) ----------
function setGenericWhatsappLinks() {
  const genericMsg = encodeURIComponent(
    "Hola, quiero más información sobre el catálogo de Carland 1601."
  );
  const link = `https://wa.me/${WHATSAPP_NUMBER}?text=${genericMsg}`;
  document.getElementById("navWhatsapp").href = link;
  document.getElementById("floatWhatsapp").href = link;
}

// ---------- MENÚ DE INFORMACIÓN EN MÓVIL ----------
navToggle.addEventListener("click", () => {
  navInfoMobile.classList.toggle("is-open");
});

// ---------- BOTÓN VOLVER ARRIBA + NAVBAR ON SCROLL ----------
window.addEventListener("scroll", () => {
  const scrolled = window.scrollY > 400;
  backToTop.hidden = !scrolled;
});

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ---------- AÑO DINÁMICO EN EL FOOTER ----------
document.getElementById("year").textContent = new Date().getFullYear();

/* =========================================================
   CARRUSEL PRINCIPAL
   Cambia de slide automáticamente cada 4.5s. También se puede
   navegar con flechas, puntos, swipe (móvil) o teclado.
   ========================================================= */
let heroIndex = 0;
let heroTimer = null;
const HERO_INTERVAL = 4500;

function goToCategory(categoryName) {
  currentCategory = categoryName;
  renderCategoryFilters();
  applyFiltersAndRender();
  document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
}

function buildHeroSlides() {
  heroTrack.innerHTML = HERO_SLIDES.map((slide) => `
    <div class="hero__slide hero__slide--${slide.variant}" role="group" aria-roledescription="slide">
      <div class="hero__slideMedia">
        <img src="${slide.image}" alt="${slide.imageAlt}" class="hero__slideImg">
      </div>
      <div class="hero__content">
        <span class="hero__eyebrow">${slide.icon} ${slide.eyebrow}</span>
        <h1 class="hero__title">${slide.title}</h1>
        <p class="hero__text">${slide.text}</p>
        <div class="hero__actions">
          <a href="#catalogo" class="hero__cta" data-hero-category="${slide.filterCategory}">Comprar ahora</a>
          <a href="#catalogo" class="hero__cta hero__cta--ghost">Ver catálogo</a>
        </div>
      </div>
    </div>
  `).join("");

  heroDots.innerHTML = HERO_SLIDES.map((_, i) =>
    `<button class="hero__dot" data-slide="${i}" aria-label="Ir al slide ${i + 1}"></button>`
  ).join("");

  heroTrack.querySelectorAll("[data-hero-category]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      goToCategory(btn.dataset.heroCategory);
    });
  });

  heroDots.querySelectorAll(".hero__dot").forEach((dot) => {
    dot.addEventListener("click", () => {
      setHeroSlide(Number(dot.dataset.slide));
      restartHeroAutoplay();
    });
  });
}

function setHeroSlide(index) {
  heroIndex = (index + HERO_SLIDES.length) % HERO_SLIDES.length;
  heroTrack.style.transform = `translateX(-${heroIndex * 100}%)`;
  heroDots.querySelectorAll(".hero__dot").forEach((dot, i) => {
    dot.classList.toggle("is-active", i === heroIndex);
  });
}

function restartHeroAutoplay() {
  clearInterval(heroTimer);
  heroTimer = setInterval(() => setHeroSlide(heroIndex + 1), HERO_INTERVAL);
}

function initHeroCarousel() {
  buildHeroSlides();
  setHeroSlide(0);
  restartHeroAutoplay();

  heroPrevBtn.addEventListener("click", () => {
    setHeroSlide(heroIndex - 1);
    restartHeroAutoplay();
  });
  heroNextBtn.addEventListener("click", () => {
    setHeroSlide(heroIndex + 1);
    restartHeroAutoplay();
  });

  // Pausar mientras el cursor está encima (desktop)
  const heroSection = document.getElementById("heroCarousel");
  heroSection.addEventListener("mouseenter", () => clearInterval(heroTimer));
  heroSection.addEventListener("mouseleave", restartHeroAutoplay);

  // Swipe táctil (móvil)
  let touchStartX = 0;
  heroSection.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    clearInterval(heroTimer);
  }, { passive: true });

  heroSection.addEventListener("touchend", (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX > 40) setHeroSlide(heroIndex - 1);
    else if (deltaX < -40) setHeroSlide(heroIndex + 1);
    restartHeroAutoplay();
  });
}

// ---------- INICIALIZACIÓN ----------
setGenericWhatsappLinks();
loadProducts();
initHeroCarousel();
