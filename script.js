/* =========================================================
   CARLAND 1601 — Lógica del catálogo + Nuevas funcionalidades
   ========================================================= */

const WHATSAPP_NUMBER = "50489534880";
const SHIPPING_COST = 100;

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
    variant: "d", icon: "⭐",
    eyebrow: "Recién llegados",
    title: "Nuevos ingresos",
    text: "Las últimas piezas que se sumaron al catálogo.",
    filterCategory: "Novedades"
  }
];

const CATEGORY_ORDER = ["Todos", "Autos", "Motocicletas", "Rastras", "Control Remoto", "Otros", "Ofertas", "Novedades"];

let allProducts = [];
let renderedProducts = [];
let currentSearch = "";
let currentCategory = "Todos";
let currentHeroIndex = 0;
let cart = [];
let wishlist = [];

/* =========================================================
   ALMACENAMIENTO LOCAL
   ========================================================= */
function loadCart() {
  const saved = localStorage.getItem("carland_cart");
  cart = saved ? JSON.parse(saved) : [];
  updateCartUI();
}

function saveCart() {
  localStorage.setItem("carland_cart", JSON.stringify(cart));
  updateCartUI();
}

function loadWishlist() {
  const saved = localStorage.getItem("carland_wishlist");
  wishlist = saved ? JSON.parse(saved) : [];
  updateWishlistUI();
}

function saveWishlist() {
  localStorage.setItem("carland_wishlist", JSON.stringify(wishlist));
  updateWishlistUI();
}

/* =========================================================
   CARRITO DE COMPRAS
   ========================================================= */
function addToCart(product) {
  const existingItem = cart.find(item => item.__pid === product.__pid);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }
  saveCart();
  showCartNotification("✓ Agregado al carrito");
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.__pid !== productId);
  saveCart();
}

function updateCartItemQty(productId, qty) {
  const item = cart.find(item => item.__pid === productId);
  if (item) {
    item.quantity = Math.max(1, qty);
    saveCart();
  }
}

function getCartTotal() {
  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  return subtotal + SHIPPING_COST;
}

function getCartSubtotal() {
  return cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
}

function updateCartUI() {
  const cartBtn = document.getElementById("cartBtn");
  const cartBadge = document.getElementById("cartBadge");
  const cartPanelBody = document.getElementById("cartPanelBody");
  const cartPanelFooter = document.getElementById("cartPanelFooter");
  
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.textContent = totalItems;
  
  if (cart.length === 0) {
    cartPanelBody.innerHTML = '<div class="cartPanel__empty">Tu carrito está vacío</div>';
    cartPanelFooter.innerHTML = '<button class="cartAction cartAction--secondary" onclick="toggleCart()">Seguir comprando</button>';
  } else {
    cartPanelBody.innerHTML = cart.map(item => `
      <div class="cartItem">
        <div class="cartItem__img">
          <img src="${item.imagen}" alt="${item.nombre}">
        </div>
        <div class="cartItem__info">
          <div class="cartItem__name">${item.nombre}</div>
          <div class="cartItem__price">L. ${formatPrice(item.precio)}</div>
          <div class="cartItem__qty">
            <button class="cartItem__qtyBtn" onclick="updateCartItemQty(${item.__pid}, ${item.quantity - 1})">−</button>
            <span class="cartItem__qtyValue">${item.quantity}</span>
            <button class="cartItem__qtyBtn" onclick="updateCartItemQty(${item.__pid}, ${item.quantity + 1})">+</button>
          </div>
        </div>
        <button class="cartItem__remove" onclick="removeFromCart(${item.__pid})">×</button>
      </div>
    `).join("");
    
    const subtotal = getCartSubtotal();
    cartPanelFooter.innerHTML = `
      <div>
        <div class="cartSummary">
          <div class="cartSummary__row">
            <span>Subtotal:</span>
            <strong>L. ${formatPrice(subtotal)}</strong>
          </div>
          <div class="cartSummary__row">
            <span>Envío C807:</span>
            <strong>L. ${formatPrice(SHIPPING_COST)}</strong>
          </div>
          <div class="cartSummary__row cartSummary__row--total">
            <span>Total:</span>
            <strong>L. ${formatPrice(getCartTotal())}</strong>
          </div>
        </div>
        <button class="cartAction cartAction--primary" onclick="proceedToCheckout()">Ir a pagar</button>
        <button class="cartAction cartAction--secondary" onclick="toggleCart()">Seguir comprando</button>
      </div>
    `;
    
    checkShipmentIncentive();
  }
}

function toggleCart() {
  const overlay = document.getElementById("cartOverlay");
  const panel = document.getElementById("cartPanel");
  overlay.classList.toggle("is-open");
  panel.classList.toggle("is-open");
}

function proceedToCheckout() {
  if (cart.length === 0) return;
  toggleCart();
  buildMultiProductOrder();
}

/* =========================================================
   LISTA DE COMPRA / WISHLIST
   ========================================================= */
function addToWishlist(product) {
  const exists = wishlist.find(item => item.__pid === product.__pid);
  if (!exists) {
    wishlist.push({ ...product });
    saveWishlist();
    showCartNotification("♥ Agregado a lista de compra");
  }
}

function removeFromWishlist(productId) {
  wishlist = wishlist.filter(item => item.__pid !== productId);
  saveWishlist();
}

function moveWishlistToCart(productId) {
  const item = wishlist.find(w => w.__pid === productId);
  if (item) {
    addToCart(item);
    showCartNotification("✓ Movido al carrito");
  }
}

function updateWishlistUI() {
  const wishlistBadge = document.getElementById("wishlistBadge");
  const wishlistPanelBody = document.getElementById("wishlistPanelBody");
  const wishlistPanelFooter = document.getElementById("wishlistPanelFooter");
  
  wishlistBadge.textContent = wishlist.length;
  
  if (wishlist.length === 0) {
    wishlistPanelBody.innerHTML = '<div class="wishlistPanel__empty">Tu lista de compra está vacía</div>';
    wishlistPanelFooter.innerHTML = '<button class="wishlistAction wishlistAction--secondary" onclick="toggleWishlist()">Ir al catálogo</button>';
  } else {
    wishlistPanelBody.innerHTML = wishlist.map(item => `
      <div class="wishlistItem">
        <div class="wishlistItem__img">
          <img src="${item.imagen}" alt="${item.nombre}">
        </div>
        <div class="wishlistItem__info">
          <div class="wishlistItem__name">${item.nombre}</div>
          <div class="wishlistItem__price">L. ${formatPrice(item.precio)}</div>
          <div class="wishlistItem__actions">
            <button class="wishlistItem__btn wishlistItem__btn--primary" onclick="moveWishlistToCart(${item.__pid})">Al carrito</button>
            <button class="wishlistItem__btn wishlistItem__btn--secondary" onclick="removeFromWishlist(${item.__pid})">Quitar</button>
          </div>
        </div>
        <button class="wishlistItem__remove" onclick="removeFromWishlist(${item.__pid})">×</button>
      </div>
    `).join("");
    
    wishlistPanelFooter.innerHTML = `
      <button class="wishlistAction wishlistAction--primary" onclick="addAllWishlistToCart()">Agregar todos al carrito</button>
      <button class="wishlistAction wishlistAction--secondary" onclick="toggleWishlist()">Seguir comprando</button>
    `;
  }
}

function toggleWishlist() {
  const overlay = document.getElementById("wishlistOverlay");
  const panel = document.getElementById("wishlistPanel");
  overlay.classList.toggle("is-open");
  panel.classList.toggle("is-open");
}

function addAllWishlistToCart() {
  wishlist.forEach(item => addToCart(item));
  showCartNotification("✓ Todos agregados al carrito");
  toggleWishlist();
  toggleCart();
}

/* =========================================================
   INCENTIVO DE ENVÍO (1 producto)
   ========================================================= */
function checkShipmentIncentive() {
  const incentive = document.getElementById("shipmentIncentive");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  if (totalItems === 1) {
    const recommendedProducts = getRecommendedProducts(3);
    const productsHtml = recommendedProducts.map(p => `
      <div class="shipmentIncentiveProduct" onclick="addToCartFromIncentive(${p.__pid})">
        <div class="shipmentIncentiveProduct__img">
          <img src="${p.imagen}" alt="${p.nombre}">
        </div>
        <div class="shipmentIncentiveProduct__info">
          <div class="shipmentIncentiveProduct__name">${p.nombre}</div>
          <div class="shipmentIncentiveProduct__price">L. ${formatPrice(p.precio)}</div>
        </div>
      </div>
    `).join("");
    
    document.getElementById("shipmentIncentiveProducts").innerHTML = productsHtml;
    incentive.hidden = false;
  } else {
    incentive.hidden = true;
  }
}

function addToCartFromIncentive(productId) {
  const product = allProducts.find(p => p.__pid === productId);
  if (product) {
    addToCart(product);
  }
}

/* =========================================================
   RECOMENDACIONES FLOTANTES
   ========================================================= */
function getRecommendedProducts(limit = 1) {
  const available = allProducts.filter(p => !cart.find(c => c.__pid === p.__pid));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}

function showRandomRecommendation() {
  const recommended = getRecommendedProducts(1)[0];
  if (!recommended) return;
  
  const box = document.getElementById("recommendationBox");
  const productHtml = `
    <div class="recommendationProduct" onclick="addToCartFromRecommendation(${recommended.__pid})">
      <div class="recommendationProduct__img">
        <img src="${recommended.imagen}" alt="${recommended.nombre}">
      </div>
      <div class="recommendationProduct__name">${recommended.nombre}</div>
      <div class="recommendationProduct__price">L. ${formatPrice(recommended.precio)}</div>
    </div>
    <button class="recommendationBox__cta" onclick="addToCartFromRecommendation(${recommended.__pid})">Agregar al carrito</button>
  `;
  
  document.getElementById("recommendationBoxProduct").innerHTML = productHtml;
  box.hidden = false;
  
  setTimeout(() => {
    box.hidden = true;
  }, 8000);
}

function addToCartFromRecommendation(productId) {
  const product = allProducts.find(p => p.__pid === productId);
  if (product) {
    addToCart(product);
    document.getElementById("recommendationBox").hidden = true;
  }
}



/* =========================================================
   ORDEN CON MÚLTIPLES PRODUCTOS
   ========================================================= */
function buildMultiProductOrder() {
  if (cart.length === 0) return;
  
  const subtotal = getCartSubtotal();
  const lines = [];
  
  lines.push("🛒 *NUEVA ORDEN — CARLAND.1601*");
  lines.push("━━━━━━━━━━━━━━");
  lines.push("📦 *PRODUCTOS*");
  
  cart.forEach(item => {
    lines.push(`${item.nombre} x${item.quantity} — L. ${formatPrice(item.precio * item.quantity)}`);
  });
  
  lines.push("━━━━━━━━━━━━━━");
  lines.push(`💵 Subtotal: L. ${formatPrice(subtotal)}`);
  lines.push(`🚚 Envío C807: L. ${formatPrice(SHIPPING_COST)}`);
  lines.push(`💰 *TOTAL: L. ${formatPrice(getCartTotal())}*`);
  lines.push("━━━━━━━━━━━━━━");
  lines.push("Gracias por comprar en *Carland 1601*.");
  
  const message = lines.join("%0A");
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  window.open(whatsappUrl, "_blank");
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */
function showCartNotification(text) {
  const div = document.createElement("div");
  div.textContent = text;
  div.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: var(--red);
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    z-index: 999;
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

/* =========================================================
   FUNCIONES EXISTENTES DEL CATÁLOGO
   ========================================================= */
function formatPrice(price) {
  if (typeof price !== "number") price = parseInt(price, 10);
  return price.toLocaleString("es-HN");
}

function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function getBadgeClass(etiqueta) {
  if (etiqueta === "Oferta") return "card__badge--oferta";
  if (etiqueta === "Novedades") return "card__badge--novedad";
  if (etiqueta === "Hot") return "card__badge--hot";
  return "card__badge--nuevo";
}

function renderCard(product, index) {
  const badgeClass = getBadgeClass(product.etiqueta);
  const statusClass = product.estado === "Disponible" ? "card__status--disponible" : "card__status--agotado";
  
  return `
    <div class="card" data-index="${index}" data-pid="${product.__pid}">
      <div class="card__mediaWrap">
        <img src="${product.imagen}" alt="${product.nombre}" loading="lazy">
        <span class="card__badge ${badgeClass}">${product.etiqueta}</span>
        <span class="card__status ${statusClass}">${product.estado}</span>
      </div>
      <div class="card__body">
        <span class="card__brand">${product.marca}</span>
        <h3 class="card__name">${product.nombre}</h3>
        <span class="card__scale">${product.escala}</span>
        <div class="card__priceRow">
          <span class="card__price">L. ${formatPrice(product.precio)}</span>
        </div>
        <div class="card__actions">
          <button class="card__action" onclick="addToCart(window.allProducts[${product.__pid}])" title="Agregar al carrito">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          </button>
          <button class="card__action" onclick="addToWishlist(window.allProducts[${product.__pid}])" title="Agregar a lista de compra">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function applyFiltersAndRender() {
  const term = currentSearch.trim().toLowerCase();
  const cat = currentCategory.trim().toLowerCase();

  const filtered = allProducts.filter((p) => {
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
  const grid = document.getElementById("productsGrid");
  const emptyMessage = document.getElementById("emptyMessage");
  
  grid.innerHTML = filtered.map((p, i) => renderCard(p, i)).join("");
  emptyMessage.hidden = filtered.length !== 0;
}

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

  const filtersContainer = document.getElementById("categoryFilters");
  filtersContainer.innerHTML = categoriesToShow
    .map((cat) => {
      const activeClass = cat === currentCategory ? "is-active" : "";
      return `<button class="filter-btn ${activeClass}" data-category="${cat}">${cat}</button>`;
    })
    .join("");

  filtersContainer.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentCategory = btn.dataset.category;
      currentSearch = "";
      document.getElementById("searchInput").value = "";
      renderCategoryFilters();
      applyFiltersAndRender();
    });
  });
}

function loadProducts() {
  if (!Array.isArray(window.PRODUCTOS)) {
    console.error("No se encontró window.PRODUCTOS");
    return;
  }

  allProducts = window.PRODUCTOS;
  allProducts.forEach((p, i) => { p.__pid = i; });
  renderCategoryFilters();
  applyFiltersAndRender();
  renderOffersPreview();
}

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

function goToCategory(category) {
  currentCategory = category;
  currentSearch = "";
  document.getElementById("searchInput").value = "";
  renderCategoryFilters();
  applyFiltersAndRender();
  const catalogSection = document.getElementById("catalogo");
  if (catalogSection) catalogSection.scrollIntoView({ behavior: "smooth" });
}

/* =========================================================
   CARRUSEL HERO
   ========================================================= */
function renderHeroSlides() {
  const track = document.getElementById("heroTrack");
  const dots = document.getElementById("heroDots");
  
  track.innerHTML = HERO_SLIDES.map((slide, i) => `
    <div class="hero__slide hero__slide--${slide.variant}">
      <div class="hero__content">
        <div class="hero__eyebrow">${slide.eyebrow}</div>
        <div class="hero__icon">${slide.icon}</div>
        <h1 class="hero__title">${slide.title}</h1>
        <p class="hero__text">${slide.text}</p>
        <button class="hero__cta" onclick="goToCategory('${slide.filterCategory}')">Explorar</button>
      </div>
    </div>
  `).join("");
  
  dots.innerHTML = HERO_SLIDES.map((_, i) => 
    `<button class="hero__dot ${i === 0 ? "is-active" : ""}" data-index="${i}"></button>`
  ).join("");
  
  dots.querySelectorAll(".hero__dot").forEach(dot => {
    dot.addEventListener("click", () => goToHeroSlide(parseInt(dot.dataset.index)));
  });
}

function goToHeroSlide(index) {
  currentHeroIndex = index;
  const track = document.getElementById("heroTrack");
  track.style.transform = `translateX(${-index * 100}%)`;
  
  document.querySelectorAll(".hero__dot").forEach((dot, i) => {
    dot.classList.toggle("is-active", i === index);
  });
}

function autoRotateHeroSlide() {
  currentHeroIndex = (currentHeroIndex + 1) % HERO_SLIDES.length;
  goToHeroSlide(currentHeroIndex);
}

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */
document.addEventListener("DOMContentLoaded", function() {
  // Cargar productos y UI
  loadProducts();
  loadCart();
  loadWishlist();
  
  // Carrusel
  renderHeroSlides();
  setInterval(autoRotateHeroSlide, 4500);
  
  document.getElementById("heroPrev").addEventListener("click", () => {
    currentHeroIndex = (currentHeroIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
    goToHeroSlide(currentHeroIndex);
  });
  
  document.getElementById("heroNext").addEventListener("click", () => {
    currentHeroIndex = (currentHeroIndex + 1) % HERO_SLIDES.length;
    goToHeroSlide(currentHeroIndex);
  });
  
  // Búsqueda y filtros
  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", (e) => {
    currentSearch = e.target.value;
    applyFiltersAndRender();
  });
  
  // Carrito
  document.getElementById("cartBtn").addEventListener("click", toggleCart);
  document.getElementById("cartOverlay").addEventListener("click", toggleCart);
  document.getElementById("cartPanelClose").addEventListener("click", toggleCart);
  document.addEventListener("click", (e) => {
    if (e.target.closest(".cartPanel__close")) toggleCart();
  });
  
  // Wishlist
  document.getElementById("wishlistBtn").addEventListener("click", toggleWishlist);
  document.getElementById("wishlistOverlay").addEventListener("click", toggleWishlist);
  document.getElementById("wishlistPanelClose").addEventListener("click", toggleWishlist);
  
  // Botones de categoría
  document.querySelectorAll("[data-category-jump]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      goToCategory(el.dataset.categoryJump);
    });
  });
  
  // Incentivo de envío
  document.getElementById("shipmentIncentiveClose").addEventListener("click", () => {
    document.getElementById("shipmentIncentive").hidden = true;
  });
  
  document.getElementById("shipmentIncentiveContinueShopping").addEventListener("click", () => {
    document.getElementById("shipmentIncentive").hidden = true;
    toggleCart();
  });
  
  document.getElementById("shipmentIncentiveCheckout").addEventListener("click", () => {
    document.getElementById("shipmentIncentive").hidden = true;
    proceedToCheckout();
  });
  
  // Recomendaciones
  document.getElementById("recommendationBoxClose").addEventListener("click", () => {
    document.getElementById("recommendationBox").hidden = true;
  });
  
  // Mostrar recomendaciones aleatoriamente
  if (Math.random() > 0.3) {
    setTimeout(showRandomRecommendation, 5000);
    setInterval(() => {
      if (Math.random() > 0.4) showRandomRecommendation();
    }, 15000);
  }
  
  // Navbar toggle
  document.getElementById("navToggle").addEventListener("click", () => {
    document.getElementById("navInfoMobile").classList.toggle("is-open");
  });
  
  // WhatsApp button
  document.getElementById("navWhatsapp").href = `https://wa.me/${WHATSAPP_NUMBER}`;
  
  // Scroll reveal
  const revealElements = document.querySelectorAll(".reveal");
  const revealOnScroll = () => {
    revealElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        el.classList.add("is-visible");
      }
    });
  };
  
  window.addEventListener("scroll", revealOnScroll);
  revealOnScroll();
  
  // Benefit bar animation
  const benefitCards = document.querySelectorAll(".benefitCard--featured");
  const revealBenefits = () => {
    benefitCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.8 && !card.classList.contains("is-visible")) {
        card.classList.add("is-visible");
      }
    });
  };
  
  window.addEventListener("scroll", revealBenefits);
  revealBenefits();
});

// Exponer en global para botones inline
window.addToCart = addToCart;
window.addToWishlist = addToWishlist;
window.removeFromCart = removeFromCart;
window.updateCartItemQty = updateCartItemQty;
window.toggleCart = toggleCart;
window.toggleWishlist = toggleWishlist;
window.proceedToCheckout = proceedToCheckout;
window.goToCategory = goToCategory;
window.moveWishlistToCart = moveWishlistToCart;
window.addAllWishlistToCart = addAllWishlistToCart;
window.removeFromWishlist = removeFromWishlist;
window.addToCartFromIncentive = addToCartFromIncentive;
window.addToCartFromRecommendation = addToCartFromRecommendation;
window.formatPrice = formatPrice;
window.allProducts = allProducts;
