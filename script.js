/* =========================================================
   CARLAND 1601 — Lógica del catálogo
   Todo el catálogo se genera dinámicamente desde productos.json
   ========================================================= */

// ---------- CONFIGURACIÓN ----------
// Cambia este número por el WhatsApp real del negocio (código de país + número, sin + ni espacios)
const WHATSAPP_NUMBER = "504XXXXXXXX";

// Orden en que deben aparecer los botones de categoría
const CATEGORY_ORDER = [
  "Todos",
  "Autos",
  "Motocicletas",
  "Camiones",
  "Rastras",
  "Maquinaria",
  "Control Remoto",
  "Novedades",
  "Ofertas",
  "Otros"
];

/**
 * Alias de categorías: mapea variantes en minúscula que puedan colarse
 * al editar productos a mano, hacia el nombre "oficial" que se usa
 * para agrupar y filtrar. Así "autos", "Autos" o "AUTOS" se tratan igual.
 */
const CATEGORY_ALIASES = {
  "autos": "Autos",
  "motocicletas": "Motocicletas",
  "camiones": "Camiones",
  "rastras": "Rastras",
  "maquinaria": "Maquinaria",
  "control remoto": "Control Remoto",
  "novedades": "Novedades",
  "ofertas": "Ofertas",
  "otros": "Otros"
};

/**
 * Devuelve el nombre de categoría "oficial" (con el que se filtra),
 * aceptando variantes de mayúsculas/minúsculas.
 */
function getCanonicalCategory(rawCategory) {
  const key = (rawCategory || "").trim().toLowerCase();
  return CATEGORY_ALIASES[key] || (rawCategory || "").trim();
}

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
 * Determina qué "chip" de estado / etiqueta especial mostrar sobre la tarjeta
 */
function getBadgeClass(etiqueta) {
  const map = {
    "nuevo": "card__badge--nuevo",
    "oferta": "card__badge--oferta",
    "ofertas": "card__badge--oferta",
    "novedad": "card__badge--novedad",
    "novedades": "card__badge--novedad"
  };
  const key = (etiqueta || "").trim().toLowerCase();
  return map[key] || null;
}

/**
 * Genera el HTML de una tarjeta de producto
 */
function renderCard(product, index) {
  const isAvailable = product.estado === "Disponible";
  const badgeClass = getBadgeClass(product.etiqueta);

  const badgeHtml = badgeClass
    ? `<span class="card__badge ${badgeClass}">${product.etiqueta}</span>`
    : "";

  const statusClass = isAvailable ? "card__status--disponible" : "card__status--agotado";
  const statusLabel = isAvailable ? "Disponible" : "Agotado";

  const buyBtn = isAvailable
    ? `<a href="${buildWhatsappLink(product)}" target="_blank" rel="noopener" class="card__buy">
         <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M16.02 2.6C8.6 2.6 2.6 8.6 2.6 16c0 2.5.68 4.85 1.86 6.87L2.7 29.4l6.7-1.75A13.35 13.35 0 0 0 16.02 29.4c7.42 0 13.42-6 13.42-13.4S23.44 2.6 16.02 2.6zm0 24.4c-2.2 0-4.24-.6-6-1.65l-.43-.25-4 1.05 1.07-3.9-.28-.4a10.9 10.9 0 0 1-1.7-5.8c0-6.04 4.9-10.94 10.94-10.94 6.03 0 10.93 4.9 10.93 10.94 0 6.03-4.9 10.95-10.93 10.95zm6-8.18c-.33-.16-1.94-.96-2.24-1.07-.3-.11-.52-.16-.74.17-.22.32-.85 1.06-1.04 1.28-.19.22-.38.24-.71.08-.33-.16-1.4-.52-2.66-1.65-.98-.87-1.65-1.95-1.84-2.28-.19-.32-.02-.5.14-.66.15-.15.33-.38.5-.58.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.58-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.41-.3.32-1.15 1.13-1.15 2.75s1.18 3.19 1.34 3.41c.16.22 2.32 3.55 5.63 4.98.79.34 1.4.54 1.88.7.79.25 1.5.21 2.07.13.63-.1 1.94-.79 2.21-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.63-.38z"/></svg>
         Comprar por WhatsApp
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

  allProducts = window.PRODUCTOS.map((p) => ({
    ...p,
    categoria: getCanonicalCategory(p.categoria)
  }));
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

// ---------- INICIALIZACIÓN ----------
setGenericWhatsappLinks();
loadProducts();
