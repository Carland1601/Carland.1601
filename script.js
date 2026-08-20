/* =========================================================
   CARLAND 1601 — Lógica del catálogo + CARRITO
   Todo el catálogo se genera dinámicamente desde productos.json
   ========================================================= */

// ---------- CONFIGURACIÓN ----------
// Cambia este número por el WhatsApp real del negocio (código de país + número, sin + ni espacios)
const WHATSAPP_NUMBER = "50489534880";
const SHIPPING_COST = 100; // Costo de envío L.100 por C807

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

// ESTADO DEL CARRITO
let cart = [];

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

  const buyBtns = isAvailable
    ? `<div class="card__buyRow">
         <button type="button" class="card__buy card__buy--whatsapp" data-action="whatsapp" data-product-index="${index}" aria-label="Comprar ${product.nombre} por WhatsApp">
           <svg viewBox="0 0 32 32" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M16.02 2.6C8.6 2.6 2.6 8.6 2.6 16c0 2.5.68 4.85 1.86 6.87L2.7 29.4l6.7-1.75A13.35 13.35 0 0 0 16.02 29.4c7.42 0 13.42-6 13.42-13.4S23.44 2.6 16.02 2.6zm0 24.4c-2.2 0-4.24-.6-6-1.65l-.43-.25-4 1.05 1.07-3.9-.28-.4a10.9 10.9 0 0 1-1.7-5.8c0-6.04 4.9-10.94 10.94-10.94 6.03 0 10.93 4.9 10.93 10.94 0 6.03-4.9 10.95-10.93 10.95zm6-8.18c-.33-.16-1.94-.96-2.24-1.07-.3-.11-.52-.16-.74.17-.22.32-.85 1.06-1.04 1.28-.19.22-.38.24-.71.08-.33-.16-1.4-.52-2.66-1.65-.98-.87-1.65-1.95-1.84-2.28-.19-.32-.02-.5.14-.66.15-.15.33-.38.5-.58.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.58-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.41-.3.32-1.15 1.13-1.15 2.75s1.18 3.19 1.34 3.41c.16.22 2.32 3.55 5.63 4.98.79.34 1.4.54 1.88.7.79.25 1.5.21 2.07.13.63-.1 1.94-.79 2.21-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.63-.38z"/></svg>
           <span class="card__buyLabel">Comprar</span>
         </button>
         <button type="button" class="card__buy card__buy--cart" data-action="cart" data-product-index="${index}" aria-label="Agregar ${product.nombre} al carrito">
           🛒
         </button>
       </div>`
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
        ${buyBtns}
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

  const buyBtns = isAvailable
    ? `<div class="modalContent__buyRow">
         <button type="button" class="modalContent__buy modalContent__buy--whatsapp">
           <svg viewBox="0 0 32 32" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M16.02 2.6C8.6 2.6 2.6 8.6 2.6 16c0 2.5.68 4.85 1.86 6.87L2.7 29.4l6.7-1.75A13.35 13.35 0 0 0 16.02 29.4c7.42 0 13.42-6 13.42-13.4S23.44 2.6 16.02 2.6zm0 24.4c-2.2 0-4.24-.6-6-1.65l-.43-.25-4 1.05 1.07-3.9-.28-.4a10.9 10.9 0 0 1-1.7-5.8c0-6.04 4.9-10.94 10.94-10.94 6.03 0 10.93 4.9 10.93 10.94 0 6.03-4.9 10.95-10.93 10.95zm6-8.18c-.33-.16-1.94-.96-2.24-1.07-.3-.11-.52-.16-.74.17-.22.32-.85 1.06-1.04 1.28-.19.22-.38.24-.71.08-.33-.16-1.4-.52-2.66-1.65-.98-.87-1.65-1.95-1.84-2.28-.19-.32-.02-.5.14-.66.15-.15.33-.38.5-.58.16-.19.22-.33.33-.55.11-.22.05-.41-.03-.58-.08-.16-.74-1.78-1.01-2.44-.27-.64-.54-.55-.74-.56-.19-.01-.41-.01-.63-.01-.22 0-.58.08-.88.41-.3.32-1.15 1.13-1.15 2.75s1.18 3.19 1.34 3.41c.16.22 2.32 3.55 5.63 4.98.79.34 1.4.54 1.88.7.79.25 1.5.21 2.07.13.63-.1 1.94-.79 2.21-1.55.27-.76.27-1.42.19-1.55-.08-.14-.3-.22-.63-.38z"/></svg>
           Comprar por WhatsApp
         </button>
         <button type="button" class="modalContent__buy modalContent__buy--cart">
           🛒 Agregar al carrito
         </button>
       </div>`
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
      ${buyBtns}
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
  
  // Agregar eventos a los botones de compra del modal
  const whatsappBtn = modalContent.querySelector(".modalContent__buy--whatsapp");
  const cartBtn = modalContent.querySelector(".modalContent__buy--cart");
  
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", (e) => {
      e.preventDefault();
      window.open(buildWhatsappLink(product), "_blank", "noopener");
    });
  }
  
  if (cartBtn) {
    cartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      addToCart(product);
      closeProductModal();
    });
  }
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

    setTimeout(() => {
      modalOverlay.hidden = true;
      document.body.classList.remove("modal-open");
      modalContent.style.transition = "none";
      modalContent.style.transform = "none";
      modalContent.style.opacity = "1";
      if (lastFocusedElement) lastFocusedElement.focus();
    }, 320);
  } else {
    modalOverlay.hidden = true;
    document.body.classList.remove("modal-open");
    if (lastFocusedElement) lastFocusedElement.focus();
  }
}

// ============ CARRITO ============

/**
 * Carga el carrito desde localStorage
 */
function loadCart() {
  try {
    const saved = localStorage.getItem("carland_cart");
    cart = saved ? JSON.parse(saved) : [];
  } catch (e) {
    cart = [];
  }
}

/**
 * Guarda el carrito en localStorage
 */
function saveCart() {
  localStorage.setItem("carland_cart", JSON.stringify(cart));
  updateCartUI();
}

/**
 * Agrega un producto al carrito o aumenta su cantidad
 */
function addToCart(product) {
  const existingItem = cart.find(item => item.__pid === product.__pid);
  
  if (existingItem) {
    existingItem.cantidad++;
  } else {
    cart.push({
      __pid: product.__pid,
      nombre: product.nombre,
      precio: product.precio,
      imagen: product.imagen,
      escala: product.escala,
      marca: product.marca,
      cantidad: 1
    });
  }
  
  saveCart();
  showCartNotification();
}

/**
 * Muestra una pequeña notificación al agregar al carrito
 */
function showCartNotification() {
  const cartIcon = document.getElementById("navCartIcon");
  if (cartIcon) {
    cartIcon.classList.add("pulse");
    setTimeout(() => cartIcon.classList.remove("pulse"), 600);
  }
}

/**
 * Actualiza el UI del carrito (contador de items)
 */
function updateCartUI() {
  const cartIcon = document.getElementById("navCartIcon");
  const cartCount = document.getElementById("cartCount");
  const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
  
  if (cartCount) {
    cartCount.textContent = totalItems;
  }
}

/**
 * Abre el modal del carrito
 */
function openCart() {
  const cartModal = document.getElementById("cartModal");
  if (cartModal) {
    cartModal.hidden = false;
    document.body.classList.add("modal-open");
    renderCartModal();
    setTimeout(() => {
      cartModal.classList.add("is-visible");
    }, 10);
  }
}

/**
 * Cierra el modal del carrito
 */
function closeCart() {
  const cartModal = document.getElementById("cartModal");
  if (cartModal) {
    cartModal.classList.remove("is-visible");
    setTimeout(() => {
      cartModal.hidden = true;
      document.body.classList.remove("modal-open");
    }, 300);
  }
}

/**
 * Renderiza el contenido del modal del carrito
 */
function renderCartModal() {
  const cartModal = document.getElementById("cartModal");
  if (!cartModal) return;
  
  if (cart.length === 0) {
    cartModal.innerHTML = `
      <div class="cartModal__overlay" id="cartOverlay"></div>
      <div class="cartModal__content">
        <div class="cartModal__header">
          <h2>🛒 Carrito de compras</h2>
          <button class="cartModal__close" id="cartCloseBtn">✕</button>
        </div>
        <div class="cartModal__empty">
          <p>Tu carrito está vacío</p>
          <p style="font-size: 14px; color: var(--gray-600);">Agrega productos para comenzar tu pedido</p>
        </div>
      </div>
    `;
    document.getElementById("cartCloseBtn").addEventListener("click", closeCart);
    document.getElementById("cartOverlay").addEventListener("click", closeCart);
    return;
  }
  
  const cartItems = cart.map((item, idx) => `
    <div class="cartItem">
      <img src="${item.imagen}" alt="${item.nombre}" class="cartItem__image">
      <div class="cartItem__info">
        <h3>${item.nombre}</h3>
        <p style="font-size: 12px; color: var(--gray-600);">Escala ${item.escala}</p>
        <p style="font-weight: 600; color: var(--red); font-size: 14px; margin-top: 4px;">${formatPrice(item.precio)}</p>
      </div>
      <div class="cartItem__controls">
        <button class="cartItem__btn" onclick="updateCartQuantity(${idx}, -1)">−</button>
        <span class="cartItem__qty">${item.cantidad}</span>
        <button class="cartItem__btn" onclick="updateCartQuantity(${idx}, 1)">+</button>
      </div>
      <div class="cartItem__total">
        <p style="font-size: 11px; color: var(--gray-600);">Subtotal</p>
        <p style="font-weight: 700; font-size: 14px;">${formatPrice(item.precio * item.cantidad)}</p>
      </div>
      <button class="cartItem__remove" onclick="removeFromCart(${idx})">🗑️</button>
    </div>
  `).join("");
  
  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const total = subtotal + SHIPPING_COST;
  
  cartModal.innerHTML = `
    <div class="cartModal__overlay" id="cartOverlay"></div>
    <div class="cartModal__content">
      <div class="cartModal__header">
        <h2>🛒 Carrito de compras</h2>
        <button class="cartModal__close" id="cartCloseBtn">✕</button>
      </div>
      
      <div class="cartModal__items">
        ${cartItems}
      </div>
      
      <div class="cartModal__summary">
        <div class="cartSummary__row">
          <span>Subtotal:</span>
          <span class="cartSummary__value">${formatPrice(subtotal)}</span>
        </div>
        <div class="cartSummary__row">
          <span>Envío C807:</span>
          <span class="cartSummary__value">${formatPrice(SHIPPING_COST)}</span>
        </div>
        <div class="cartSummary__row cartSummary__row--total">
          <span>TOTAL:</span>
          <span class="cartSummary__value">${formatPrice(total)}</span>
        </div>
      </div>
      
      <div class="cartModal__actions">
        <button class="cartModal__btn cartModal__btn--checkout" id="checkoutBtn">
          ✓ FINALIZAR PEDIDO POR WHATSAPP
        </button>
        <button class="cartModal__btn cartModal__btn--secondary" id="continueShopping">
          Seguir comprando
        </button>
      </div>
    </div>
  `;
  
  document.getElementById("cartCloseBtn").addEventListener("click", closeCart);
  document.getElementById("cartOverlay").addEventListener("click", closeCart);
  document.getElementById("continueShopping").addEventListener("click", closeCart);
  document.getElementById("checkoutBtn").addEventListener("click", openCheckoutConfirmation);
}

/**
 * Actualiza la cantidad de un producto en el carrito
 */
function updateCartQuantity(index, change) {
  if (cart[index]) {
    cart[index].cantidad += change;
    if (cart[index].cantidad <= 0) {
      cart.splice(index, 1);
    }
    saveCart();
  }
}

/**
 * Elimina un producto del carrito
 */
function removeFromCart(index) {
  cart.splice(index, 1);
  saveCart();
}

/**
 * Abre la pantalla de confirmación
 */
function openCheckoutConfirmation() {
  const confirmModal = document.getElementById("confirmModal");
  if (!confirmModal) return;
  
  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const total = subtotal + SHIPPING_COST;
  
  const cartItems = cart.map(item => `
    <div class="confirmItem">
      <span>${item.nombre}</span>
      <span>× ${item.cantidad}</span>
      <span>${formatPrice(item.precio * item.cantidad)}</span>
    </div>
  `).join("");
  
  confirmModal.innerHTML = `
    <div class="cartModal__overlay" id="confirmOverlay"></div>
    <div class="cartModal__content">
      <button class="cartModal__close" id="confirmCloseBtn">✕</button>
      
      <div class="confirmModal__header">
        <h2>🏁 Estás en el último paso de tu pedido</h2>
        <p>Revisa que tus productos, cantidades y total sean correctos antes de continuar.</p>
      </div>
      
      <div class="confirmModal__items">
        ${cartItems}
      </div>
      
      <div class="cartModal__summary">
        <div class="cartSummary__row">
          <span>Subtotal:</span>
          <span class="cartSummary__value">${formatPrice(subtotal)}</span>
        </div>
        <div class="cartSummary__row">
          <span>Envío C807:</span>
          <span class="cartSummary__value">${formatPrice(SHIPPING_COST)}</span>
        </div>
        <div class="cartSummary__row cartSummary__row--total">
          <span>TOTAL:</span>
          <span class="cartSummary__value">${formatPrice(total)}</span>
        </div>
      </div>
      
      <div class="confirmModal__notice">
        <strong>📌 Información importante:</strong>
        <p>"En WhatsApp te brindaremos los números de cuenta disponibles y las fotos de tu pedido para que puedas verificarlo antes de realizar tu pago."</p>
      </div>
      
      <div class="cartModal__actions">
        <button class="cartModal__btn cartModal__btn--secondary" id="backToCartBtn">
          ← Revisar pedido
        </button>
        <button class="cartModal__btn cartModal__btn--checkout" id="finalCheckoutBtn">
          ✓ Continuar a WhatsApp
        </button>
      </div>
    </div>
  `;
  
  confirmModal.hidden = false;
  document.body.classList.add("modal-open");
  setTimeout(() => {
    confirmModal.classList.add("is-visible");
  }, 10);
  
  document.getElementById("confirmCloseBtn").addEventListener("click", closeCheckoutConfirmation);
  document.getElementById("confirmOverlay").addEventListener("click", closeCheckoutConfirmation);
  document.getElementById("backToCartBtn").addEventListener("click", closeCheckoutConfirmation);
  document.getElementById("finalCheckoutBtn").addEventListener("click", sendCartToWhatsapp);
}

/**
 * Cierra la pantalla de confirmación
 */
function closeCheckoutConfirmation() {
  const confirmModal = document.getElementById("confirmModal");
  if (confirmModal) {
    confirmModal.classList.remove("is-visible");
    setTimeout(() => {
      confirmModal.hidden = true;
      document.body.classList.remove("modal-open");
      openCart(); // Volver al carrito
    }, 300);
  }
}

/**
 * Genera el mensaje de WhatsApp con el carrito completo
 */
function sendCartToWhatsapp() {
  if (cart.length === 0) return;
  
  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const total = subtotal + SHIPPING_COST;
  
  let mensaje = "Hola, Carland 1601. Quiero realizar el siguiente pedido:\n\n";
  
  cart.forEach(item => {
    mensaje += `${item.nombre} x${item.cantidad} — ${formatPrice(item.precio * item.cantidad)}\n`;
  });
  
  mensaje += `\n*Subtotal:* ${formatPrice(subtotal)}\n`;
  mensaje += `*Envío C807:* ${formatPrice(SHIPPING_COST)}\n`;
  mensaje += `*TOTAL:* ${formatPrice(total)}\n\n`;
  mensaje += `Quedo atento a los datos para realizar el pago.`;
  
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`;
  window.open(whatsappUrl, "_blank", "noopener");
  
  // Limpiar carrito después de enviar
  setTimeout(() => {
    cart = [];
    saveCart();
    closeCheckoutConfirmation();
    const confirmModal = document.getElementById("confirmModal");
    if (confirmModal) {
      confirmModal.classList.remove("is-visible");
      confirmModal.hidden = true;
    }
  }, 500);
}

// Resto del código del catálogo continúa igual...
/**
 * Procesa los filtros y la búsqueda
 */
function updateProductsView() {
  renderedProducts = allProducts.filter((p) => {
    const matchCategory =
      currentCategory === "Todos" || p.categoria === currentCategory;
    const matchSearch =
      currentSearch === "" ||
      p.nombre.toLowerCase().includes(currentSearch.toLowerCase()) ||
      p.marca.toLowerCase().includes(currentSearch.toLowerCase()) ||
      p.escala.toLowerCase().includes(currentSearch.toLowerCase()) ||
      p.categoria.toLowerCase().includes(currentSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  emptyMessage.hidden = renderedProducts.length > 0;

  if (renderedProducts.length === 0) {
    grid.innerHTML = "";
    return;
  }

  grid.innerHTML = renderedProducts
    .map((p, i) => renderCard(p, allProducts.indexOf(p)))
    .join("");

  attachProductCardEvents();
}

/**
 * Vincula los eventos a las tarjetas de producto
 */
function attachProductCardEvents() {
  const cards = grid.querySelectorAll(".card");
  cards.forEach((card) => {
    // Click en la tarjeta para ver el modal
    card.addEventListener("click", (e) => {
      if (e.target.closest(".card__buy")) return; // No abrir modal si se hace clic en el botón
      const idx = parseInt(card.dataset.index);
      openProductModal(allProducts[idx], card);
      modalContent.dataset.activeIndex = idx;
    });

    // Botones de compra en la tarjeta
    const whatsappBtn = card.querySelector('.card__buy--whatsapp');
    const cartBtn = card.querySelector('.card__buy--cart');
    
    if (whatsappBtn) {
      whatsappBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(whatsappBtn.dataset.productIndex);
        const product = allProducts[idx];
        window.open(buildWhatsappLink(product), "_blank", "noopener");
      });
    }
    
    if (cartBtn) {
      cartBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(cartBtn.dataset.productIndex);
        const product = allProducts[idx];
        addToCart(product);
        animateProductToCart(cartBtn, product);
      });
    }
  });
}

/**
 * Anima el producto hacia el carrito
 */
function animateProductToCart(button, product) {
  const cartIcon = document.getElementById("navCartIcon");
  if (!cartIcon) return;
  
  const card = button.closest(".card");
  const cardImage = card?.querySelector("img");
  if (!cardImage) return;
  
  const clone = cardImage.cloneNode(true);
  clone.classList.add("cart-animation");
  
  const cardRect = cardImage.getBoundingClientRect();
  const cartRect = cartIcon.getBoundingClientRect();
  
  clone.style.position = "fixed";
  clone.style.left = cardRect.left + "px";
  clone.style.top = cardRect.top + "px";
  clone.style.width = cardRect.width + "px";
  clone.style.height = cardRect.height + "px";
  clone.style.zIndex = "9999";
  clone.style.pointerEvents = "none";
  clone.style.borderRadius = "8px";
  clone.style.objectFit = "cover";
  
  document.body.appendChild(clone);
  
  setTimeout(() => {
    clone.style.transition = "all 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    clone.style.left = cartRect.left + "px";
    clone.style.top = cartRect.top + "px";
    clone.style.width = "30px";
    clone.style.height = "30px";
    clone.style.opacity = "0.8";
  }, 10);
  
  setTimeout(() => {
    document.body.removeChild(clone);
  }, 600);
}

/**
 * Genera los botones de categoría dinámicamente
 */
function renderFilters() {
  const categories = CATEGORY_ORDER.filter((cat) =>
    allProducts.some((p) => cat === "Todos" || p.categoria === cat)
  );

  filtersContainer.innerHTML = categories
    .map((cat) => {
      const isActive = cat === currentCategory ? "is-active" : "";
      return `<button class="filter-btn ${isActive}" data-category="${cat}">${cat}</button>`;
    })
    .join("");

  filtersContainer.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      currentCategory = e.target.dataset.category;
      filtersContainer.querySelectorAll(".filter-btn").forEach((b) => {
        b.classList.toggle("is-active", b.dataset.category === currentCategory);
      });
      updateProductsView();
    });
  });
}

/**
 * Genera el carrusel principal
 */
let currentHeroSlide = 0;

function renderHeroCarousel() {
  heroTrack.innerHTML = HERO_SLIDES.map((slide, i) => {
    return `
      <div class="hero__slide hero__slide--${slide.variant}" data-index="${i}">
        <div class="hero__content">
          <span class="hero__eyebrow">${slide.eyebrow} ${slide.icon}</span>
          <h1 class="hero__title">${slide.title}</h1>
          <p class="hero__text">${slide.text}</p>
          <button class="hero__cta" data-category-jump="${slide.filterCategory}">
            Explorar ${slide.filterCategory === "Todos" ? "catálogo" : slide.filterCategory}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M13 6l6 6-6 6M7 6l6 6-6 6"/></svg>
          </button>
        </div>
        <div class="hero__orbit">
          <div class="orbit-emojis"></div>
        </div>
      </div>
    `;
  }).join("");

  heroDots.innerHTML = HERO_SLIDES.map((_, i) => {
    const isActive = i === currentHeroSlide ? "is-active" : "";
    return `<button class="hero__dot ${isActive}" data-index="${i}" aria-label="Slide ${i + 1}"></button>`;
  }).join("");

  updateHeroPosition();
  attachHeroEvents();
}

function updateHeroPosition() {
  heroTrack.style.transform = `translateX(-${currentHeroSlide * 100}%)`;
  heroDots.querySelectorAll(".hero__dot").forEach((dot, i) => {
    dot.classList.toggle("is-active", i === currentHeroSlide);
  });
}

function attachHeroEvents() {
  heroPrevBtn.addEventListener("click", () => {
    currentHeroSlide = (currentHeroSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
    updateHeroPosition();
  });

  heroNextBtn.addEventListener("click", () => {
    currentHeroSlide = (currentHeroSlide + 1) % HERO_SLIDES.length;
    updateHeroPosition();
  });

  heroDots.querySelectorAll(".hero__dot").forEach((dot) => {
    dot.addEventListener("click", (e) => {
      currentHeroSlide = parseInt(e.target.dataset.index);
      updateHeroPosition();
    });
  });

  // Auto-play
  setInterval(() => {
    currentHeroSlide = (currentHeroSlide + 1) % HERO_SLIDES.length;
    updateHeroPosition();
  }, 4500);

  // Category jump buttons
  heroTrack.querySelectorAll(".hero__cta").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      currentCategory = e.currentTarget.dataset.categoryJump;
      renderFilters();
      updateProductsView();
      document.getElementById("catalogo").scrollIntoView({ behavior: "smooth" });
    });
  });
}

// ---------- INICIALIZACIÓN ----------
document.addEventListener("DOMContentLoaded", () => {
  allProducts = window.PRODUCTOS || [];
  if (!Array.isArray(allProducts)) allProducts = [];

  // Asignar IDs únicas a productos
  allProducts.forEach((p, i) => {
    p.__pid = p.__pid || `product_${i}_${p.nombre.replace(/\s+/g, "_")}`;
  });

  // Cargar carrito
  loadCart();

  // Renderizar filtros
  renderFilters();

  // Renderizar productos
  updateProductsView();

  // Renderizar carrusel
  renderHeroCarousel();

  // Eventos del buscador
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value;
    updateProductsView();
  });

  // Toggle del menú móvil
  navToggle.addEventListener("click", () => {
    navInfoMobile.classList.toggle("is-visible");
  });

  // Botón del carrito en navbar
  const navCartIcon = document.getElementById("navCartIcon");
  if (navCartIcon) {
    navCartIcon.addEventListener("click", openCart);
  }

  // Modal overlay
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) closeProductModal();
    });
  }
});
