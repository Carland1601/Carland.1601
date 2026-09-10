/* =========================================================
   CARLAND 1601 — Lógica MEJORADA con Carrito
   ========================================================= */

// ---------- CONFIGURACIÓN ----------
const WHATSAPP_NUMBER = "50489534880";

// Slides del carrusel principal
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
let renderedProducts = [];
let cart = JSON.parse(localStorage.getItem('carland_cart')) || [];
let currentHeroSlide = 0;
let heroAutoplayInterval = null;

// ---------- ELEMENTOS DEL DOM ----------
const grid = document.getElementById("productsGrid");
const emptyMessage = document.getElementById("emptyMessage");
const searchInput = document.getElementById("searchInput");
const filtersContainer = document.getElementById("categoryFilters");
const navbar = document.getElementById("navbar");
const cartToggle = document.getElementById("cartToggle");
const cartBadge = document.getElementById("cartBadge");
const cartModal = document.getElementById("cartModal");
const cartOverlay = document.getElementById("cartOverlay");
const cartClose = document.getElementById("cartClose");
const cartItemsContainer = document.getElementById("cartItems");
const cartEmptyMsg = document.getElementById("cartEmpty");
const cartCheckout = document.getElementById("cartCheckout");
const cartClear = document.getElementById("cartClear");
const cartSubtotal = document.getElementById("cartSubtotal");
const cartTotal = document.getElementById("cartTotal");
const heroTrack = document.getElementById("heroTrack");
const heroDots = document.getElementById("heroDots");
const heroPrevBtn = document.getElementById("heroPrev");
const heroNextBtn = document.getElementById("heroNext");
const navWhatsapp = document.getElementById("navWhatsapp");
const navToggle = document.getElementById("navToggle");
const navInfoMobile = document.getElementById("navInfoMobile");

// ---------- INICIALIZACIÓN ----------
document.addEventListener('DOMContentLoaded', () => {
  initHeroCarousel();
  renderHeroSlides();
  renderFilterButtons();
  renderProducts();
  updateCartUI();
  setupEventListeners();
  animateOnScroll();
});

// =========================================================
// CARRITO
// =========================================================

function updateCartUI() {
  // Actualizar badge
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.textContent = totalItems;

  // Mostrar/ocultar mensaje vacío
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '';
    cartEmptyMsg.removeAttribute('hidden');
  } else {
    cartEmptyMsg.setAttribute('hidden', '');
    renderCartItems();
  }

  // Actualizar totales
  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  const total = subtotal;
  cartSubtotal.textContent = `L. ${subtotal.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;
  cartTotal.textContent = `L. ${total.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;

  // Guardar en localStorage
  localStorage.setItem('carland_cart', JSON.stringify(cart));
}

function renderCartItems() {
  cartItemsContainer.innerHTML = '';
  cart.forEach((item, index) => {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div class="cart-item__image">
        <img src="${item.imagen}" alt="${item.nombre}">
      </div>
      <div class="cart-item__content">
        <div class="cart-item__name">${item.nombre}</div>
        <div class="cart-item__brand">${item.marca}</div>
        <div class="cart-item__price">L. ${item.precio.toLocaleString('es-HN', { minimumFractionDigits: 0 })}</div>
        <div class="cart-item__controls">
          <button class="cart-item__btn" onclick="decreaseCartItem(${index})">−</button>
          <div class="cart-item__quantity">${item.quantity}</div>
          <button class="cart-item__btn" onclick="increaseCartItem(${index})">+</button>
          <button class="cart-item__remove" onclick="removeCartItem(${index})">✕</button>
        </div>
      </div>
    `;
    cartItemsContainer.appendChild(cartItem);
  });
}

function addToCart(product) {
  // Verificar si el producto ya está en el carrito
  const existingItem = cart.find(item => item.nombre === product.nombre);
  
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1
    });
  }
  
  updateCartUI();
  
  // Animar el botón
  const button = event.target;
  button.style.animation = 'pulse 0.5s ease-out';
  setTimeout(() => {
    button.style.animation = '';
  }, 500);
  
  // Mostrar mini notificación
  showNotification(`${product.nombre} agregado al carrito`);
}

function increaseCartItem(index) {
  cart[index].quantity += 1;
  updateCartUI();
}

function decreaseCartItem(index) {
  if (cart[index].quantity > 1) {
    cart[index].quantity -= 1;
  } else {
    removeCartItem(index);
  }
  updateCartUI();
}

function removeCartItem(index) {
  const removedProduct = cart[index].nombre;
  cart.splice(index, 1);
  updateCartUI();
  showNotification(`${removedProduct} eliminado del carrito`);
}

function clearCart() {
  if (cart.length === 0) return;
  if (confirm('¿Estás seguro de que deseas vaciar el carrito?')) {
    cart = [];
    updateCartUI();
    showNotification('Carrito vaciado');
  }
}

function checkoutCart() {
  if (cart.length === 0) {
    showNotification('Tu carrito está vacío');
    return;
  }

  // Construir mensaje de WhatsApp
  let message = '🛒 *Quiero comprar los siguientes productos:*\n\n';
  
  cart.forEach((item, index) => {
    message += `${index + 1}. *${item.nombre}*\n`;
    message += `   Marca: ${item.marca}\n`;
    message += `   Escala: ${item.escala}\n`;
    message += `   Cantidad: ${item.quantity}\n`;
    message += `   Precio unitario: L. ${item.precio.toLocaleString('es-HN', { minimumFractionDigits: 0 })}\n`;
    message += `   Subtotal: L. ${(item.precio * item.quantity).toLocaleString('es-HN', { minimumFractionDigits: 0 })}\n\n`;
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  message += `*TOTAL: L. ${subtotal.toLocaleString('es-HN', { minimumFractionDigits: 0 })}*\n\n`;
  message += '📍 Por favor, confirma disponibilidad y envío.\n';
  message += '💳 Acepto depósito o transferencia bancaria.';

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
  
  closeCart();
  showNotification('¡Abriendo WhatsApp!');
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: linear-gradient(135deg, #d60000, #a10000);
    color: white;
    padding: 14px 20px;
    border-radius: 10px;
    font-weight: 600;
    font-size: 13px;
    z-index: 9999;
    animation: slideInRight 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    box-shadow: 0 8px 20px rgba(214, 0, 0, 0.3);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideInRight 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94) reverse';
    setTimeout(() => notification.remove(), 300);
  }, 2500);
}

function openCart() {
  cartModal.classList.add('active');
  cartModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartModal.classList.remove('active');
  cartModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

// =========================================================
// HERO CAROUSEL
// =========================================================

function renderHeroSlides() {
  heroTrack.innerHTML = '';
  heroDots.innerHTML = '';

  HERO_SLIDES.forEach((slide, index) => {
    // Crear slide
    const slideEl = document.createElement('div');
    slideEl.className = `hero__slide ${index === 0 ? 'active' : ''}`;
    slideEl.innerHTML = `
      <div class="hero__content">
        <div class="hero__icon">${slide.icon}</div>
        <div class="hero__eyebrow">${slide.eyebrow}</div>
        <h1 class="hero__title">${slide.title}</h1>
        <p class="hero__text">${slide.text}</p>
      </div>
    `;
    heroTrack.appendChild(slideEl);

    // Crear dot
    const dot = document.createElement('button');
    dot.className = `hero__dot ${index === 0 ? 'active' : ''}`;
    dot.onclick = () => goToSlide(index);
    dot.setAttribute('aria-label', `Ir al slide ${index + 1}`);
    heroDots.appendChild(dot);
  });

  startHeroAutoplay();
}

function initHeroCarousel() {
  heroPrevBtn.onclick = () => previousSlide();
  heroNextBtn.onclick = () => nextSlide();
}

function previousSlide() {
  currentHeroSlide = (currentHeroSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
  updateHeroSlide();
  resetHeroAutoplay();
}

function nextSlide() {
  currentHeroSlide = (currentHeroSlide + 1) % HERO_SLIDES.length;
  updateHeroSlide();
  resetHeroAutoplay();
}

function goToSlide(index) {
  currentHeroSlide = index;
  updateHeroSlide();
  resetHeroAutoplay();
}

function updateHeroSlide() {
  const slides = document.querySelectorAll('.hero__slide');
  const dots = document.querySelectorAll('.hero__dot');

  slides.forEach((slide, index) => {
    slide.classList.remove('active', 'prev');
    if (index === currentHeroSlide) {
      slide.classList.add('active');
    } else if (index < currentHeroSlide) {
      slide.classList.add('prev');
    }
  });

  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentHeroSlide);
  });
}

function startHeroAutoplay() {
  heroAutoplayInterval = setInterval(() => {
    nextSlide();
  }, 5000);
}

function resetHeroAutoplay() {
  clearInterval(heroAutoplayInterval);
  startHeroAutoplay();
}

// =========================================================
// PRODUCTOS
// =========================================================

function renderFilterButtons() {
  filtersContainer.innerHTML = '';
  
  const categories = Array.isArray(window.PRODUCTOS)
    ? [...new Set(window.PRODUCTOS.map(p => p.categoria)), "Todos", "Novedades", "Ofertas"]
    : CATEGORY_ORDER;

  const uniqueCategories = [...new Set([...CATEGORY_ORDER, ...categories])];

  uniqueCategories.forEach(category => {
    if (!category) return;
    const btn = document.createElement('button');
    btn.className = `filter-btn ${category === 'Todos' ? 'active' : ''}`;
    btn.textContent = category;
    btn.onclick = () => filterByCategory(category);
    btn.setAttribute('aria-pressed', category === 'Todos');
    filtersContainer.appendChild(btn);
  });
}

function filterByCategory(category) {
  currentCategory = category;
  currentSearch = '';
  searchInput.value = '';

  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.classList.toggle('active', btn.textContent === category);
    btn.setAttribute('aria-pressed', btn.textContent === category);
  });

  filterAndRenderProducts();
}

function filterAndRenderProducts() {
  if (!Array.isArray(window.PRODUCTOS)) return;

  renderedProducts = window.PRODUCTOS.filter(product => {
    const matchesCategory = currentCategory === 'Todos' || 
                           product.categoria === currentCategory || 
                           product.etiqueta === currentCategory;
    
    const matchesSearch = currentSearch === '' || 
                         product.nombre.toLowerCase().includes(currentSearch.toLowerCase()) ||
                         product.marca.toLowerCase().includes(currentSearch.toLowerCase()) ||
                         product.escala.toLowerCase().includes(currentSearch.toLowerCase()) ||
                         product.categoria.toLowerCase().includes(currentSearch.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  renderProducts();
}

function renderProducts() {
  grid.innerHTML = '';
  emptyMessage.setAttribute('hidden', '');

  if (renderedProducts.length === 0) {
    emptyMessage.removeAttribute('hidden');
    return;
  }

  // Reordenar productos para que aparezcan en posiciones variadas
  const shuffled = shuffleProducts(renderedProducts);

  shuffled.forEach((product, index) => {
    const card = createProductCard(product, index);
    grid.appendChild(card);
  });
}

function shuffleProducts(products) {
  const copy = [...products];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createProductCard(product, index) {
  const card = document.createElement('div');
  card.className = 'product';
  card.style.animationDelay = `${50 + index * 30}ms`;
  
  card.innerHTML = `
    <div class="product__image">
      <div class="product__imageInner">
        <img src="${product.imagen}" alt="${product.nombre}" loading="lazy">
      </div>
      ${product.etiqueta ? `<span class="product__label">${product.etiqueta}</span>` : ''}
    </div>
    <div class="product__content">
      <div class="product__name">${product.nombre}</div>
      <div class="product__brand">${product.marca}</div>
      <div class="product__specs">
        <span class="product__spec">${product.escala}</span>
        <span class="product__spec">${product.estado}</span>
      </div>
      <div class="product__footer">
        <span class="product__price">L. ${product.precio.toLocaleString('es-HN', { minimumFractionDigits: 0 })}</span>
        <button class="product__addBtn" onclick="addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Añadir
        </button>
      </div>
    </div>
  `;

  return card;
}

// =========================================================
// EVENT LISTENERS
// =========================================================

function setupEventListeners() {
  // Carrito
  cartToggle.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  cartCheckout.addEventListener('click', checkoutCart);
  cartClear.addEventListener('click', clearCart);

  // Búsqueda
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    filterAndRenderProducts();
  });

  // Botones de categoría
  document.querySelectorAll('[data-category-jump]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const category = e.currentTarget.dataset.categoryJump;
      filterByCategory(category);
      
      // Scroll al catálogo
      const catalogSection = document.getElementById('catalogo');
      setTimeout(() => {
        catalogSection?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });
  });

  // WhatsApp
  navWhatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}`;

  // Mayoreo
  const mayoreoBtn = document.getElementById('mayoreoBtn');
  if (mayoreoBtn) {
    mayoreoBtn.onclick = () => {
      const message = '¡Hola! Me gustaría solicitar una cotización de mayoreo. Tengo interés en comprar 3 o más unidades del mismo modelo.';
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    };
  }

  // Navbar móvil
  navToggle.addEventListener('click', () => {
    navInfoMobile.style.display = navInfoMobile.style.display === 'flex' ? 'none' : 'flex';
  });

  // Cerrar carrito con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cartModal.classList.contains('active')) {
      closeCart();
    }
  });
}

// =========================================================
// SCROLL & ANIMACIONES
// =========================================================

function animateOnScroll() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  document.querySelectorAll('.reveal').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = '600ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    observer.observe(el);
  });
}

// =========================================================
// UTILIDADES
// =========================================================

// Prevenir que el script falle si PRODUCTOS no está definido
if (typeof window.PRODUCTOS === 'undefined') {
  window.PRODUCTOS = [];
}

// Mezcla un arreglo sin modificar el original (Fisher-Yates)
function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Inicializar productos si existen
if (Array.isArray(window.PRODUCTOS) && window.PRODUCTOS.length > 0) {
  allProducts = [...window.PRODUCTOS];
  renderedProducts = [...window.PRODUCTOS];
}
