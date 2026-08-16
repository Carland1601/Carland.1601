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
    filterCategory: "Todos"
  },
  {
    variant: "b", icon: "💥",
    eyebrow: "Por tiempo limitado",
    title: "Ofertas de la semana",
    text: "Precios especiales en modelos seleccionados. No duran mucho.",
    filterCategory: "Ofertas"
  },
  {
    variant: "c", icon: "🚚",
    eyebrow: "Cobertura nacional",
    title: "Envíos a todo Honduras",
    text: "Llega hasta la puerta de tu casa, pagas por depósito o transferencia.",
    filterCategory: "Todos"
  },
  {
    variant: "h", icon: "📦",
    type: "envios",
    eyebrow: "Envíos verificados",
    title: "Así llegan tus pedidos",
    text: "Fotos reales de empaques y entregas hechas por nuestro equipo en toda Honduras. 📦🚚✅",
    filterCategory: "Todos"
  },
  {
    variant: "d", icon: "⭐",
    eyebrow: "Recién llegados",
    title: "Nuevos ingresos",
    text: "Las últimas piezas que se sumaron al catálogo.",
    filterCategory: "Novedades"
  },
  {
    variant: "e", icon: "🚗",
    eyebrow: "Colección",
    title: "Tacoma Collection",
    text: "Toda la línea Toyota Tacoma a escala, lista para coleccionar.",
    filterCategory: "Autos"
  },
  {
    variant: "f", icon: "🚙",
    eyebrow: "Colección",
    title: "Toyota Collection",
    text: "Prado, Land Cruiser, Hilux y más, en un solo lugar.",
    filterCategory: "Autos"
  },
  {
    variant: "g", icon: "🎁",
    eyebrow: "Sorpresa",
    title: "Mystery Box",
    text: "No sabes cuál te toca, pero seguro te va a encantar.",
    filterCategory: "Todos"
  }
];

// Imágenes de pruebas de envíos reales (carpeta assets/productos, nombradas 1 a 6)
const SHIP_PROOF_IMAGES = [
  "assets/productos/1.jpg",
  "assets/productos/2.jpg",
  "assets/productos/3.jpg",
  "assets/productos/4.jpg",
  "assets/productos/5.jpg",
  "assets/productos/6.jpg"
];

// Emojis que giran alrededor de la foto de envío (estilo "aro" circular)
const SHIP_PROOF_EMOJIS = ["📦", "🚚", "✅", "📍", "🎉", "🛵"];

// Duración en milisegundos entre cada imagen de envío
const SHIP_PROOF_INTERVAL = 2000;

// Emojis de autos, envíos y entregas para el aro que gira alrededor de cada foto
const HERO_CIRCLE_EMOJIS = [
  "🚗", "🏎️", "🚙", "🛻", "🏍️", "🚓", "🚕",
  "📦", "🚚", "✅", "📍", "🎉", "🛵", "🚀", "🔥", "⭐"
];

// Mezcla un arreglo sin modificar el original (Fisher-Yates)
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Toma `count` elementos aleatorios y distintos de un arreglo
function pickRandom(arr, count) {
  return shuffleArray(arr).slice(0, Math.min(count, arr.length));
}

// Pool combinado: fotos de productos (autos/motos) + pruebas de envío reales
function getCirclePoolImages() {
  const fromProducts = Array.isArray(window.PRODUCTOS)
    ? window.PRODUCTOS.map((p) => p.imagen).filter(Boolean)
    : [];
  return [...new Set([...fromProducts, ...SHIP_PROOF_IMAGES])];
}

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
let activeModalProduct = null; // producto mostrado actualmente en el modal de vista previa

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
 * NOTA: Este catálogo NO asigna etiquetas automáticas/falsas a los productos.
 * Un producto solo muestra un badge ("Nuevo", "Oferta", "Novedad") cuando el
 * campo "etiqueta" en window.PRODUCTOS realmente lo define. Para marcar un
 * producto como oferta o novedad, edita su campo "etiqueta" en index.html.
 */

/**
 * Genera el HTML de una tarjeta de producto
 */
function renderCard(product, index) {
  const isAvailable = product.estado === "Disponible";
  const badgeClass = getBadgeClass(product.etiqueta);

  let badgeHtml = "";
  if (badgeClass) {
    badgeHtml = `<span class="card__badge ${badgeClass}">${product.etiqueta}</span>`;
  }

  const statusClass = isAvailable ? "card__status--disponible" : "card__status--agotado";
  const statusLabel = isAvailable ? "Disponible" : "Agotado";

  const buyBtn = isAvailable
    ? `<button type="button" class="card__buy" aria-label="Comprar ${product.nombre} por WhatsApp">
         <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M16.02 2.6C8.6 2.6 2.6 8.6 2.6 16c0 2.5.68 4.85 1.86 6.87L2.7 29.4l6.7-1.75A13.35 13.35 0 0 0 16.02 29.4c7.42 0 13.42-6 13.42-13.4S23.44 2.6 16.02 2.6zm0 24.4c-2.2 0-4.24-.6-6-1.65l-.43-.25-4 1.05 1.07-3.9-.28-.4a10.9 10.9 0 0 1-1.7-5.8c0-6.04 4.9-10.94 10.94-10.94 6.03 0 10.93 4.9 10.93 10.94 0 6.03-4.9 10.95-10.93 10.95zm6-8.18c-.33-.16-1.94-.96-2.24-1.07-.3-.11-.52-.16-.74.17-.22.32-.85 1.06-1.04 1.28-.19.22-.38.24-.71.08-.33-.16-1.4-.52-2.66-1.65-.98-.87-1.65-1.95-1.84-2.28-.19-.32-.02-.5.14-.66.15-.15.33-.38.5-.58.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.58-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.41-.3.32-1.15 1.13-1.15 2.75s1.18 3.19 1.34 3.41c.16.22 2.32 3.55 5.63 4.98.79.34 1.4.54 1.88.7.79.25 1.5.21 2.07.13.63-.1 1.94-.79 2.21-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.63-.38z"/></svg>
         <span class="card__buyLabel">Comprar</span>
       </button>`
    : `<span class="card__buy card__buy--disabled">Agotado</span>`;

  return `
    <article class="card" data-index="${index}" data-pid="${product.__pid}" tabindex="0" role="button" aria-label="Ver ${product.nombre} en grande">
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
    ? `<button type="button" class="modalContent__buy">
         <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16.02 2.6C8.6 2.6 2.6 8.6 2.6 16c0 2.5.68 4.85 1.86 6.87L2.7 29.4l6.7-1.75A13.35 13.35 0 0 0 16.02 29.4c7.42 0 13.42-6 13.42-13.4S23.44 2.6 16.02 2.6zm0 24.4c-2.2 0-4.24-.6-6-1.65l-.43-.25-4 1.05 1.07-3.9-.28-.4a10.9 10.9 0 0 1-1.7-5.8c0-6.04 4.9-10.94 10.94-10.94 6.03 0 10.93 4.9 10.93 10.94 0 6.03-4.9 10.95-10.93 10.95zm6-8.18c-.33-.16-1.94-.96-2.24-1.07-.3-.11-.52-.16-.74.17-.22.32-.85 1.06-1.04 1.28-.19.22-.38.24-.71.08-.33-.16-1.4-.52-2.66-1.65-.98-.87-1.65-1.95-1.84-2.28-.19-.32-.02-.5.14-.66.15-.15.33-.38.5-.58.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.58-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.41-.3.32-1.15 1.13-1.15 2.75s1.18 3.19 1.34 3.41c.16.22 2.32 3.55 5.63 4.98.79.34 1.4.54 1.88.7.79.25 1.5.21 2.07.13.63-.1 1.94-.79 2.21-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.63-.38z"/></svg>
         Comprar por WhatsApp
       </button>`
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
  activeModalProduct = product;

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
    activeModalProduct = null;
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
  const cat = currentCategory.trim().toLowerCase();

  const filtered = allProducts.filter((p) => {
    // Comparación insensible a mayúsculas/minúsculas: evita que productos
    // guardados como "autos" (minúscula) desaparezcan al filtrar "Autos".
    // "Ofertas" y "Novedades" no son categorías reales del producto, sino
    // grupos derivados del campo "etiqueta" (Oferta / Novedad).
    let matchesCategory;
    if (cat === "todos") {
      matchesCategory = true;
    } else if (cat === "ofertas") {
      matchesCategory = getBadgeClass(p.etiqueta) === "card__badge--oferta";
    } else if (cat === "novedades") {
      matchesCategory = getBadgeClass(p.etiqueta) === "card__badge--novedad";
    } else {
      matchesCategory = (p.categoria || "").trim().toLowerCase() === cat;
    }

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
  const presentCategories = new Set(
    allProducts.map((p) => (p.categoria || "").trim().toLowerCase())
  );
  const hasOfertas = allProducts.some((p) => getBadgeClass(p.etiqueta) === "card__badge--oferta");
  const hasNovedades = allProducts.some((p) => getBadgeClass(p.etiqueta) === "card__badge--novedad");

  const categoriesToShow = CATEGORY_ORDER.filter((cat) => {
    if (cat === "Todos") return true;
    if (cat === "Ofertas") return hasOfertas;
    if (cat === "Novedades") return hasNovedades;
    return presentCategories.has(cat.toLowerCase());
  });

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
      // Limpia cualquier búsqueda activa (p. ej. "RC" del botón Control
      // Remoto) para que un filtro de categoría no quede oculto por un
      // término de búsqueda que el usuario ya no ve en el input.
      currentSearch = "";
      searchInput.value = "";
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
  // Asigna a cada producto un identificador estable (posición en el catálogo).
  // Se usa para reconocer el producto exacto sin importar en qué grid
  // (catálogo, ofertas, novedades) o modal se haya presionado "Comprar".
  allProducts.forEach((p, i) => { p.__pid = i; });
  renderCategoryFilters();
  applyFiltersAndRender();
  renderOffersPreview();
  renderNoveltiesPreview();
}

// ---------- TARJETAS DE COLECCIÓN Y ENLACES "VER TODAS" ----------
// Estos botones (Autos, Motocicletas, Rastras, Control remoto, Novedades,
// Ofertas, "Ver todas las ofertas →") antes no tenían ningún listener y no
// hacían nada al hacer clic. Ahora todos llevan al catálogo ya filtrado.
document.querySelectorAll("[data-category-jump]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    goToCategory(el.dataset.categoryJump);
  });
});

// ---------- PREVIEW DE PRODUCTOS REALES: OFERTAS Y NOVEDADES ----------
// Solo muestran productos cuyo campo "etiqueta" en window.PRODUCTOS los
// marca realmente como Oferta/Novedad. Si no hay ninguno, se oculta el
// bloque de preview en vez de inventar productos.
function renderProductPreview(containerId, badgeClass, limit = 4) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const matches = allProducts.filter((p) => getBadgeClass(p.etiqueta) === badgeClass);

  if (!matches.length) {
    container.innerHTML = `<p class="previewGrid__empty">Por ahora no hay productos marcados en esta sección. Vuelve pronto.</p>`;
    return;
  }

  container.innerHTML = matches
    .slice(0, limit)
    .map((p, i) => renderCard(p, i))
    .join("");
}

function renderOffersPreview() {
  renderProductPreview("ofertasPreview", "card__badge--oferta");
}

function renderNoveltiesPreview() {
  renderProductPreview("novedadesPreview", "card__badge--novedad");
}

// Los productos de las secciones de preview también deben abrir el modal.
// Como usan tarjetas .card idénticas a las del grid principal, reutilizamos
// la misma lógica de apertura buscando el producto por nombre+imagen.
[["ofertasPreview", "card__badge--oferta"], ["novedadesPreview", "card__badge--novedad"]].forEach(
  ([containerId, badgeClass]) => {
    document.addEventListener("click", (e) => {
      const container = document.getElementById(containerId);
      if (!container || !container.contains(e.target)) return;
      if (e.target.closest(".card__buy")) return;
      const cardEl = e.target.closest(".card");
      if (!cardEl) return;

      const matches = allProducts.filter((p) => getBadgeClass(p.etiqueta) === badgeClass);
      const product = matches[Number(cardEl.dataset.index)];
      if (!product) return;

      modalContent.dataset.activeIndex = "";
      openProductModal(product, cardEl);
    });
  }
);

/* =========================================================
   MODAL DE COMPRA POR WHATSAPP
   Funciona con TODOS los productos del catálogo (autos, motos,
   rastras, RC, novedades, ofertas). Se abre siempre desde la
   misma función reutilizable openPurchaseModal(product), tomando
   automáticamente imagen, nombre, precio, categoría e identificador
   del producto que se le pase — nunca datos inventados.

   Flujo:
   producto → cantidad → entrega → datos → resumen → confirmar
   → mini factura → enviar por WhatsApp
   ========================================================= */

// ---------- ELEMENTOS DEL DOM ----------
const purchaseOverlay = document.getElementById("purchaseOverlay");
const purchaseModal = document.getElementById("purchaseModal");
const purchaseScroll = document.getElementById("purchaseScroll");
const purchaseFooter = document.getElementById("purchaseFooter");
const purchaseCloseBtn = document.getElementById("purchaseCloseBtn");

// ---------- DATOS DE ENTREGA / RECOGIDA ----------
const PICKUP_LOCATIONS = {
  carland: "Carland.1601 — Santa Bárbara",
  mave: "Tiendas Mave — Santa Bárbara"
};

const HONDURAS_DEPARTMENTS = [
  "Atlántida", "Choluteca", "Colón", "Comayagua", "Copán", "Cortés",
  "El Paraíso", "Francisco Morazán", "Gracias a Dios", "Intibucá",
  "Islas de la Bahía", "La Paz", "Lempira", "Ocotepeque", "Olancho",
  "Santa Bárbara", "Valle", "Yoro"
];

// ---------- ESTADO DE LA COMPRA ACTUAL ----------
// Se recrea desde cero cada vez que se abre el modal, para un producto
// concreto. Nunca se comparte estado entre productos distintos.
let purchaseState = null;
let lastPurchaseFocusedElement = null;

/**
 * Evita que texto escrito por el cliente (nombre, referencia, etc.)
 * rompa el HTML generado dinámicamente.
 */
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[ch]));
}

function computePurchaseSubtotal() {
  if (!purchaseState) return 0;
  return (Number(purchaseState.product.precio) || 0) * purchaseState.quantity;
}

/**
 * Abre el modal de compra para UN producto específico. Reutilizable:
 * se llama exactamente igual sin importar de qué tarjeta, preview o
 * modal de vista previa provenga el clic en "Comprar por WhatsApp".
 */
function openPurchaseModal(product) {
  if (!product) return;
  lastPurchaseFocusedElement = document.activeElement;

  purchaseState = {
    product,
    quantity: 1,
    deliveryMethod: null, // "domicilio" | "tienda"
    pickupLocation: null, // "carland" | "mave"
    customer: { nombre: "", telefono: "", departamento: "", ciudad: "", barrio: "", referencia: "" },
    step: "form", // "form" | "invoice"
    errors: {},
    attemptedConfirm: false
  };

  renderPurchaseModal();
  purchaseOverlay.hidden = false;
  document.body.classList.add("modal-open");
  requestAnimationFrame(() => purchaseOverlay.classList.add("is-visible"));
}

function closePurchaseModal() {
  if (!purchaseOverlay || purchaseOverlay.hidden) return;
  purchaseOverlay.classList.remove("is-visible");

  setTimeout(() => {
    purchaseOverlay.hidden = true;
    purchaseScroll.innerHTML = "";
    purchaseFooter.innerHTML = "";
    document.body.classList.remove("modal-open");
    purchaseState = null;
    if (lastPurchaseFocusedElement) lastPurchaseFocusedElement.focus();
  }, 260);
}

/**
 * Vuelve a pintar el paso actual del modal (formulario o mini factura)
 * y conecta todos sus listeners. Se usa cada vez que cambia algo que
 * altera la ESTRUCTURA del modal (cantidad de secciones visibles,
 * cambio de paso, etc.). Para actualizaciones en vivo mientras el
 * cliente escribe se usan funciones más puntuales (ver más abajo) para
 * no perder el foco del campo de texto.
 */
function renderPurchaseModal() {
  if (!purchaseState) return;
  if (purchaseState.step === "invoice") {
    purchaseScroll.innerHTML = renderInvoiceScroll();
    purchaseFooter.innerHTML = renderInvoiceFooter();
  } else {
    purchaseScroll.innerHTML = renderPurchaseFormScroll();
    purchaseFooter.innerHTML = renderPurchaseFormFooter();
  }
  attachPurchaseListeners();
}

/**
 * PASO 1: producto + cantidad + entrega + datos + resumen en vivo
 */
function renderPurchaseFormScroll() {
  const s = purchaseState;
  const p = s.product;
  const errors = s.attemptedConfirm ? s.errors : {};

  const generalError =
    errors.delivery ? `<div class="purchaseError">${escapeHtml(errors.delivery)}</div>` :
    errors.pickup ? `<div class="purchaseError">${escapeHtml(errors.pickup)}</div>` : "";

  return `
    <div class="purchaseProduct">
      <img src="${p.imagen}" alt="${escapeHtml(p.nombre)}" class="purchaseProduct__img">
      <div class="purchaseProduct__info">
        <span class="purchaseProduct__brand">${escapeHtml(p.marca)}</span>
        <h2 class="purchaseProduct__name" id="purchaseModalTitle">${escapeHtml(p.nombre)}</h2>
        <span class="purchaseProduct__scale">Escala ${escapeHtml(p.escala)}</span>
        <span class="purchaseProduct__price">${formatPrice(p.precio)}</span>
      </div>
    </div>

    <div class="purchaseSection">
      <span class="purchaseSection__label">Cantidad</span>
      <div class="qtyStepper">
        <button type="button" class="qtyStepper__btn" id="qtyDecBtn" aria-label="Disminuir cantidad">−</button>
        <span class="qtyStepper__value" id="qtyValue">${s.quantity}</span>
        <button type="button" class="qtyStepper__btn" id="qtyIncBtn" aria-label="Aumentar cantidad">+</button>
      </div>
    </div>

    <div class="purchaseSubtotalRow">
      <span>Subtotal</span>
      <strong id="purchaseSubtotalValue">${formatPrice(computePurchaseSubtotal())}</strong>
    </div>

    <div class="purchaseSection">
      <span class="purchaseSection__label">¿Cómo deseas recibir tu pedido?</span>
      <div class="deliveryChoice">
        <button type="button" class="deliveryChoice__btn ${s.deliveryMethod === "domicilio" ? "is-active" : ""}" data-delivery="domicilio">
          <span class="deliveryChoice__icon">🚚</span><span>Domicilio</span>
        </button>
        <button type="button" class="deliveryChoice__btn ${s.deliveryMethod === "tienda" ? "is-active" : ""}" data-delivery="tienda">
          <span class="deliveryChoice__icon">🏪</span><span>Recoger en tienda</span>
        </button>
      </div>
    </div>

    ${s.deliveryMethod === "domicilio" ? renderDomicilioFields(errors) : ""}
    ${s.deliveryMethod === "tienda" ? renderPickupFields(errors) : ""}

    ${generalError}

    <div class="purchaseSummary" id="purchaseSummary">
      ${renderPurchaseSummaryHtml()}
    </div>
  `;
}

function renderPurchaseFormFooter() {
  return `<button type="button" class="purchaseConfirmBtn" id="purchaseConfirmBtn">CONFIRMAR ORDEN</button>`;
}

function fieldErrorHtml(errors, key) {
  return errors[key] ? `<small class="purchaseField__error">${escapeHtml(errors[key])}</small>` : "";
}

function renderDomicilioFields(errors) {
  const c = purchaseState.customer;
  return `
    <div class="purchaseSection purchaseForm">
      <span class="purchaseSection__label">Datos de entrega</span>

      <label class="purchaseField ${errors.nombre ? "has-error" : ""}">
        <span>Nombre completo</span>
        <input type="text" id="fNombre" value="${escapeHtml(c.nombre)}" placeholder="Ej. Juan Pérez" autocomplete="name">
        ${fieldErrorHtml(errors, "nombre")}
      </label>

      <label class="purchaseField ${errors.telefono ? "has-error" : ""}">
        <span>Número de teléfono</span>
        <input type="tel" id="fTelefono" value="${escapeHtml(c.telefono)}" placeholder="Ej. 9999-9999" autocomplete="tel" inputmode="tel">
        ${fieldErrorHtml(errors, "telefono")}
      </label>

      <label class="purchaseField ${errors.departamento ? "has-error" : ""}">
        <span>Departamento</span>
        <select id="fDepartamento">
          <option value="">Selecciona un departamento</option>
          ${HONDURAS_DEPARTMENTS.map((d) => `<option value="${d}" ${c.departamento === d ? "selected" : ""}>${d}</option>`).join("")}
        </select>
        ${fieldErrorHtml(errors, "departamento")}
      </label>

      <label class="purchaseField ${errors.ciudad ? "has-error" : ""}">
        <span>Ciudad</span>
        <input type="text" id="fCiudad" value="${escapeHtml(c.ciudad)}" placeholder="Ej. Santa Bárbara">
        ${fieldErrorHtml(errors, "ciudad")}
      </label>

      <label class="purchaseField ${errors.barrio ? "has-error" : ""}">
        <span>Barrio / Aldea / Casa o Caserío</span>
        <input type="text" id="fBarrio" value="${escapeHtml(c.barrio)}" placeholder="Ej. Barrio El Centro">
        ${fieldErrorHtml(errors, "barrio")}
      </label>

      <label class="purchaseField ${errors.referencia ? "has-error" : ""}">
        <span>Referencia de entrega</span>
        <textarea id="fReferencia" rows="2" placeholder="Ej. Casa de esquina, frente a pulpería, portón negro.">${escapeHtml(c.referencia)}</textarea>
        ${fieldErrorHtml(errors, "referencia")}
      </label>
    </div>
  `;
}

function renderPickupFields() {
  const s = purchaseState;
  return `
    <div class="purchaseSection">
      <span class="purchaseSection__label">Selecciona dónde recoger</span>
      <div class="pickupChoice">
        <button type="button" class="pickupChoice__btn ${s.pickupLocation === "carland" ? "is-active" : ""}" data-pickup="carland">
          <span class="pickupChoice__radio"></span><span>Carland.1601 — Santa Bárbara</span>
        </button>
        <button type="button" class="pickupChoice__btn ${s.pickupLocation === "mave" ? "is-active" : ""}" data-pickup="mave">
          <span class="pickupChoice__radio"></span><span>Tiendas Mave — Santa Bárbara</span>
        </button>
      </div>
    </div>
  `;
}

/**
 * Genera el bloque "Resumen de orden" a partir del estado actual.
 * Se llama tanto en el render completo como en cada actualización
 * en vivo (cantidad, texto escrito, selección de entrega).
 */
function renderPurchaseSummaryHtml() {
  const s = purchaseState;
  const p = s.product;
  const subtotal = computePurchaseSubtotal();

  const rows = [
    ["Producto", p.nombre],
    ["Precio unitario", formatPrice(p.precio)],
    ["Cantidad", String(s.quantity)],
    ["Subtotal", formatPrice(subtotal)]
  ];

  if (s.deliveryMethod === "domicilio") {
    rows.push(["Método de entrega", "🚚 Domicilio"]);
    if (s.customer.nombre) rows.push(["Nombre", s.customer.nombre]);
    if (s.customer.telefono) rows.push(["Teléfono", s.customer.telefono]);
    if (s.customer.departamento) rows.push(["Departamento", s.customer.departamento]);
    if (s.customer.ciudad) rows.push(["Ciudad", s.customer.ciudad]);
    if (s.customer.barrio) rows.push(["Dirección", s.customer.barrio]);
    if (s.customer.referencia) rows.push(["Referencia", s.customer.referencia]);
  } else if (s.deliveryMethod === "tienda") {
    rows.push(["Método de entrega", "🏪 Recoger en tienda"]);
    if (s.pickupLocation) rows.push(["Punto de recogida", PICKUP_LOCATIONS[s.pickupLocation]]);
  } else {
    rows.push(["Método de entrega", "Sin seleccionar"]);
  }

  return `
    <p class="purchaseSummary__title">Resumen de orden</p>
    <div class="purchaseSummary__rows">
      ${rows.map(([label, value]) => `
        <div class="purchaseSummary__row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>
      `).join("")}
    </div>
  `;
}

function updatePurchaseSummary() {
  const el = document.getElementById("purchaseSummary");
  if (el) el.innerHTML = renderPurchaseSummaryHtml();
}

function refreshPurchaseQuantityUI() {
  const qtyValueEl = document.getElementById("qtyValue");
  const subtotalEl = document.getElementById("purchaseSubtotalValue");
  if (qtyValueEl) qtyValueEl.textContent = purchaseState.quantity;
  if (subtotalEl) subtotalEl.textContent = formatPrice(computePurchaseSubtotal());
  updatePurchaseSummary();
}

/**
 * PASO 2: mini factura / confirmación (después de "Confirmar orden")
 */
function renderInvoiceScroll() {
  const s = purchaseState;
  const p = s.product;
  const subtotal = computePurchaseSubtotal();
  const deliveryLabel = s.deliveryMethod === "domicilio" ? "🚚 Domicilio" : "🏪 Recoger en tienda";

  const domicilioRows = s.deliveryMethod === "domicilio" ? `
    <div class="invoice__row"><span>Nombre</span><strong>${escapeHtml(s.customer.nombre)}</strong></div>
    <div class="invoice__row"><span>Teléfono</span><strong>${escapeHtml(s.customer.telefono)}</strong></div>
    <div class="invoice__row"><span>Departamento</span><strong>${escapeHtml(s.customer.departamento)}</strong></div>
    <div class="invoice__row"><span>Ciudad</span><strong>${escapeHtml(s.customer.ciudad)}</strong></div>
    <div class="invoice__row"><span>Dirección</span><strong>${escapeHtml(s.customer.barrio)}</strong></div>
    <div class="invoice__row"><span>Referencia</span><strong>${escapeHtml(s.customer.referencia)}</strong></div>
  ` : "";

  const pickupRow = s.deliveryMethod === "tienda" ? `
    <div class="invoice__row"><span>Punto de recogida</span><strong>${escapeHtml(PICKUP_LOCATIONS[s.pickupLocation])}</strong></div>
  ` : "";

  return `
    <div class="invoice">
      <div class="invoice__header">
        <span class="invoice__brand">CARLAND 1601</span>
        <span class="invoice__type">ORDEN DE COMPRA</span>
      </div>
      <div class="invoice__body">
        <div class="invoice__row"><span>Producto</span><strong>${escapeHtml(p.nombre)}</strong></div>
        <div class="invoice__row"><span>Cantidad</span><strong>${s.quantity}</strong></div>
        <div class="invoice__row"><span>Precio unitario</span><strong>${formatPrice(p.precio)}</strong></div>
        <div class="invoice__row"><span>Subtotal</span><strong>${formatPrice(subtotal)}</strong></div>
        <div class="invoice__divider"></div>
        <div class="invoice__row"><span>Método de entrega</span><strong>${deliveryLabel}</strong></div>
        ${domicilioRows}
        ${pickupRow}
        <div class="invoice__divider"></div>
        <div class="invoice__row invoice__row--total"><span>TOTAL</span><strong>${formatPrice(subtotal)}</strong></div>
      </div>
      <p class="invoice__note">Tu pedido está listo para ser enviado a Carland.1601 por WhatsApp.</p>
    </div>
  `;
}

function renderInvoiceFooter() {
  return `
    <div class="purchaseActions">
      <button type="button" class="invoiceSendBtn" id="invoiceSendBtn">📲 Enviar pedido por WhatsApp</button>
      <button type="button" class="invoiceEditBtn" id="invoiceEditBtn">← Editar pedido</button>
    </div>
  `;
}

/**
 * Valida los datos obligatorios antes de permitir confirmar la orden.
 * Producto, cantidad y precio siempre son válidos por construcción
 * (vienen del catálogo y el stepper nunca baja de 1); lo que sí debe
 * validarse es el método de entrega y sus datos asociados.
 */
function validatePurchaseOrder() {
  const s = purchaseState;
  const errors = {};

  if (!s.deliveryMethod) {
    errors.delivery = "Selecciona un método de entrega.";
  } else if (s.deliveryMethod === "domicilio") {
    const c = s.customer;
    if (!c.nombre.trim()) errors.nombre = "Ingresa el nombre completo.";
    if (!c.telefono.trim()) errors.telefono = "Ingresa un número de teléfono.";
    if (!c.departamento.trim()) errors.departamento = "Selecciona un departamento.";
    if (!c.ciudad.trim()) errors.ciudad = "Ingresa la ciudad.";
    if (!c.barrio.trim()) errors.barrio = "Ingresa el barrio, aldea, casa o caserío.";
    if (!c.referencia.trim()) errors.referencia = "Ingresa una referencia de entrega.";
  } else if (s.deliveryMethod === "tienda") {
    if (!s.pickupLocation) errors.pickup = "Selecciona dónde deseas recoger tu pedido.";
  }

  s.errors = errors;
  return Object.keys(errors).length === 0;
}

function handleConfirmOrderClick() {
  purchaseState.attemptedConfirm = true;
  if (!validatePurchaseOrder()) {
    renderPurchaseModal();
    const errEl = purchaseScroll.querySelector(".purchaseError, .purchaseField__error");
    const scrollTarget = errEl ? errEl.closest(".purchaseSection, .purchaseError") : null;
    if (scrollTarget && typeof scrollTarget.scrollIntoView === "function") {
      scrollTarget.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return;
  }
  purchaseState.step = "invoice";
  renderPurchaseModal();
  purchaseScroll.scrollTop = 0;
}

/**
 * Construye el mensaje de WhatsApp con los datos REALES introducidos
 * por el cliente para ESTE pedido — nunca datos ficticios.
 */
function buildOrderWhatsappMessage() {
  const s = purchaseState;
  const p = s.product;
  const subtotal = computePurchaseSubtotal();
  const lines = [];

  lines.push("🛒 *NUEVA ORDEN — CARLAND.1601*");
  lines.push("━━━━━━━━━━━━━━");
  lines.push("📦 *PRODUCTO*");
  lines.push(p.nombre);
  lines.push(`💰 Precio: ${formatPrice(p.precio)}`);
  lines.push(`🔢 Cantidad: ${s.quantity}`);
  lines.push(`💵 Subtotal: ${formatPrice(subtotal)}`);
  lines.push("━━━━━━━━━━━━━━");

  if (s.deliveryMethod === "domicilio") {
    lines.push("🚚 *ENTREGA*");
    lines.push("Domicilio");
    lines.push(`👤 Nombre: ${s.customer.nombre}`);
    lines.push(`📱 Teléfono: ${s.customer.telefono}`);
    lines.push(`📍 Departamento: ${s.customer.departamento}`);
    lines.push(`🏙️ Ciudad: ${s.customer.ciudad}`);
    lines.push(`🏠 Dirección: ${s.customer.barrio}`);
    lines.push(`📌 Referencia: ${s.customer.referencia}`);
  } else {
    lines.push("🏪 *ENTREGA*");
    lines.push("Recoger en tienda");
    lines.push(`📍 Punto de recogida: ${PICKUP_LOCATIONS[s.pickupLocation]}`);
  }

  lines.push("━━━━━━━━━━━━━━");
  lines.push(`💰 *TOTAL: ${formatPrice(subtotal)}*`);
  lines.push("━━━━━━━━━━━━━━");
  lines.push("Gracias por comprar en *Carland 1601*.");

  return lines.join("\n");
}

function sendOrderToWhatsapp() {
  const message = buildOrderWhatsappMessage();
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, "_blank", "noopener");
}

/**
 * Conecta todos los listeners del contenido dinámico del modal.
 * Se llama después de CADA renderPurchaseModal(), porque el HTML
 * interno se reemplaza por completo en cada paso.
 */
function attachPurchaseListeners() {
  const qtyDecBtn = document.getElementById("qtyDecBtn");
  const qtyIncBtn = document.getElementById("qtyIncBtn");
  if (qtyDecBtn) {
    qtyDecBtn.addEventListener("click", () => {
      if (purchaseState.quantity > 1) purchaseState.quantity -= 1;
      refreshPurchaseQuantityUI();
    });
  }
  if (qtyIncBtn) {
    qtyIncBtn.addEventListener("click", () => {
      purchaseState.quantity += 1;
      refreshPurchaseQuantityUI();
    });
  }

  purchaseScroll.querySelectorAll("[data-delivery]").forEach((btn) => {
    btn.addEventListener("click", () => {
      purchaseState.deliveryMethod = btn.dataset.delivery;
      purchaseState.pickupLocation = null;
      purchaseState.errors = {};
      renderPurchaseModal();
    });
  });

  purchaseScroll.querySelectorAll("[data-pickup]").forEach((btn) => {
    btn.addEventListener("click", () => {
      purchaseState.pickupLocation = btn.dataset.pickup;
      purchaseState.errors = {};
      renderPurchaseModal();
    });
  });

  // Los campos de texto solo refrescan el resumen (no todo el modal),
  // para no perder el foco ni la posición del cursor mientras se escribe.
  const bindField = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      purchaseState.customer[key] = el.value;
      updatePurchaseSummary();
    });
  };
  bindField("fNombre", "nombre");
  bindField("fTelefono", "telefono");
  bindField("fDepartamento", "departamento");
  bindField("fCiudad", "ciudad");
  bindField("fBarrio", "barrio");
  bindField("fReferencia", "referencia");

  const confirmBtn = document.getElementById("purchaseConfirmBtn");
  if (confirmBtn) confirmBtn.addEventListener("click", handleConfirmOrderClick);

  const editBtn = document.getElementById("invoiceEditBtn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      purchaseState.step = "form";
      renderPurchaseModal();
    });
  }

  const sendBtn = document.getElementById("invoiceSendBtn");
  if (sendBtn) sendBtn.addEventListener("click", sendOrderToWhatsapp);
}

// ---------- ABRIR EL MODAL DE COMPRA DESDE CUALQUIER "COMPRAR POR WHATSAPP" ----------
// Un solo listener delegado cubre el catálogo completo, las previews de
// Ofertas/Novedades y el modal de vista previa: todos usan la misma
// función openPurchaseModal(product), por lo que no hay código duplicado
// por producto y cualquier producto nuevo agregado a window.PRODUCTOS
// queda cubierto automáticamente.
document.addEventListener("click", (e) => {
  const buyEl = e.target.closest(".card__buy, .modalContent__buy");
  if (!buyEl) return;
  if (buyEl.classList.contains("card__buy--disabled") || buyEl.classList.contains("modalContent__buy--disabled")) return;
  e.preventDefault();

  let product = null;
  if (buyEl.classList.contains("modalContent__buy")) {
    product = activeModalProduct;
  } else {
    const cardEl = buyEl.closest(".card");
    const pid = cardEl ? Number(cardEl.dataset.pid) : NaN;
    product = allProducts.find((p) => p.__pid === pid) || null;
  }
  if (!product) return;

  // Si el modal de vista previa (FLIP) está abierto, se cierra al instante
  // para dar paso al modal de compra, evitando dos modales apilados.
  if (!modalOverlay.hidden) {
    modalOverlay.hidden = true;
    modalOverlay.classList.remove("is-visible");
    document.body.classList.remove("modal-open");
  }

  openPurchaseModal(product);
});

purchaseCloseBtn.addEventListener("click", closePurchaseModal);

purchaseOverlay.addEventListener("click", (e) => {
  if (e.target === purchaseOverlay) closePurchaseModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !purchaseOverlay.hidden) closePurchaseModal();
});

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

// ---------- WHATSAPP: BOTÓN DE MAYOREO ----------
// Antes apuntaba a href="#" sin mensaje. Usa el mismo WHATSAPP_NUMBER que
// el resto del sitio y el mensaje de mayoreo pedido en el brief.
(function setWholesaleWhatsapp() {
  const btn = document.getElementById("wholesaleWhatsapp");
  if (!btn) return;
  const mensaje = encodeURIComponent(
    "Hola, Carland 1601. Estoy interesado en comprar al mayoreo 3 o más unidades del mismo modelo. Quisiera información sobre disponibilidad y beneficios."
  );
  btn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${mensaje}`;
  btn.target = "_blank";
  btn.rel = "noopener";
})();

// ---------- TICKER DEL TOPBAR ----------
// Duplica el contenido de la barra superior una vez para que la animación
// CSS (translateX(-50%)) haga un loop perfectamente continuo, sin salto.
(function initTopbarTicker() {
  const track = document.querySelector(".topbar__track");
  if (!track) return;
  track.innerHTML += track.innerHTML;
})();

// ---------- REVELADO AL HACER SCROLL (.reveal) ----------
// Sin esto, .reveal quedaba como una clase sin ningún efecto real.
(function initScrollReveal() {
  const targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;

  const prefersReducedMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  targets.forEach((el) => observer.observe(el));
})();

/* =========================================================
   CARRUSEL PRINCIPAL
   Cambia de slide automáticamente cada 4.5s. También se puede
   navegar con flechas, puntos, swipe (móvil) o teclado.
   ========================================================= */
let heroIndex = 0;
let heroTimer = null;
const HERO_INTERVAL = 4500;

function goToCategory(categoryName) {
  // "Control Remoto" no existe como categoría propia en window.PRODUCTOS hoy
  // (los vehículos RC están guardados dentro de "Autos"). Para que el botón
  // funcione de verdad en vez de mostrar 0 resultados, se resuelve como una
  // búsqueda por "RC" en vez de un filtro de categoría exacto.
  if (categoryName === "Control Remoto") {
    currentCategory = "Todos";
    currentSearch = "RC";
    searchInput.value = "RC";
  } else {
    currentCategory = categoryName;
    currentSearch = "";
    searchInput.value = "";
  }
  renderCategoryFilters();
  applyFiltersAndRender();
  document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
}

function buildHeroSlides() {
  heroTrack.innerHTML = HERO_SLIDES.map((slide, i) => `
    <div class="hero__slide hero__slide--${slide.variant}" role="group" aria-roledescription="slide">
      <div class="hero__content">
        <span class="hero__eyebrow">${slide.icon} ${slide.eyebrow}</span>
        <h1 class="hero__title">${slide.title}</h1>
        <p class="hero__text">${slide.text}</p>
        <div class="hero__actions">
          <a href="#catalogo" class="hero__cta" data-hero-category="${slide.filterCategory}">Comprar ahora</a>
          <a href="#catalogo" class="hero__cta hero__cta--ghost">Ver catálogo</a>
        </div>
      </div>
      ${buildHeroCircleMarkup(i)}
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

/**
 * Genera el markup de la galería circular de un slide: una foto que va
 * cambiando entre varias imágenes aleatorias (autos, motos y envíos reales),
 * rodeada de un aro de emojis (también aleatorios) que gira en círculo.
 * Cada slide recibe su propia selección aleatoria de fotos, emojis,
 * velocidad y sentido de giro para que se sienta dinámico y distinto.
 */
function buildHeroCircleMarkup(slideIndex) {
  const pool = getCirclePoolImages();
  if (!pool.length) return "";

  const images = pickRandom(pool, Math.min(6, pool.length));
  const emojis = pickRandom(HERO_CIRCLE_EMOJIS, 6);
  const spinDuration = (12 + Math.random() * 10).toFixed(1); // entre 12s y 22s
  const spinDirection = Math.random() < 0.5 ? "normal" : "reverse";

  const emojiRing = emojis.map((emoji, i) => `
    <div class="shipProof__orbit" style="--i:${i}">
      <span class="shipProof__emoji">${emoji}</span>
    </div>
  `).join("");

  return `
    <div class="shipProof" data-slide-index="${slideIndex}"
         data-images='${JSON.stringify(images)}'
         style="--spin-duration:${spinDuration}s; --spin-direction:${spinDirection};">
      <div class="shipProof__ring" aria-hidden="true">${emojiRing}</div>
      <div class="shipProof__circle">
        <img src="${images[0]}" alt="Autos, motos y envíos reales de Carland 1601" class="shipProof__img">
      </div>
      <span class="shipProof__badge">✅ 100% real</span>
    </div>
  `;
}

/**
 * Activa la rotación aleatoria de fotos en CADA galería circular del
 * carrusel (una por slide), cada una de forma independiente y con un
 * pequeño desfase inicial para que no cambien todas al mismo tiempo.
 * Si una imagen no carga, se salta automáticamente a la siguiente.
 */
function initHeroCircleRotation() {
  document.querySelectorAll(".shipProof").forEach((container) => {
    const img = container.querySelector(".shipProof__img");
    if (!img) return;

    let images = [];
    try {
      images = JSON.parse(container.dataset.images || "[]");
    } catch (e) {
      images = [];
    }
    if (images.length < 2) return; // nada que rotar

    // Precarga silenciosa para evitar parpadeos al cambiar de foto
    images.forEach((src) => { const preloader = new Image(); preloader.src = src; });

    let idx = 0;
    img.onerror = () => {
      idx = (idx + 1) % images.length;
      img.src = images[idx];
    };

    const startDelay = Math.floor(Math.random() * SHIP_PROOF_INTERVAL);
    setTimeout(() => {
      setInterval(() => {
        idx = (idx + 1) % images.length;
        img.classList.add("is-fading");
        setTimeout(() => {
          img.src = images[idx];
          img.classList.remove("is-fading");
        }, 220);
      }, SHIP_PROOF_INTERVAL);
    }, startDelay);
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
  initHeroCircleRotation();

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
