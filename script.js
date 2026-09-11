/* =========================================================
   CARLAND 1601 — Lógica MEJORADA con Carrito + Modal de Productos
   ========================================================= */

// ---------- CONFIGURACIÓN ----------
const WHATSAPP_NUMBER = "50489534880";

// ✨ NUEVOS SLIDES DEL CARRUSEL EN ORDEN ESPECIFICADO
const HERO_SLIDES = [
  // PRIMERO: ENVÍOS
  {
    variant: "a", icon: "🚚",
    eyebrow: "Cobertura nacional",
    title: "Envíos a todo Honduras",
    text: "Llega hasta la puerta de tu casa, pagas por depósito o transferencia.",
    filterCategory: "Todos"
  },
  // SEGUNDO: AUTOS (MCQUEEN, CARS, MACK)
  {
    variant: "b", icon: "🏎️",
    eyebrow: "Colección Premium",
    title: "Cars & McQueen",
    text: "Toda la colección de personajes de Cars: Rayo McQueen, Mack, Sally y más.",
    filterCategory: "Autos"
  },
  // TERCERO: TACOMAS, TUNDRAS, HILUX
  {
    variant: "c", icon: "🚙",
    eyebrow: "Colección",
    title: "Toyota Trucks",
    text: "Tacoma, Tundra, Hilux y toda la línea Toyota lista para coleccionar.",
    filterCategory: "Autos"
  },
  // CUARTO: RASTRAS, CABESALES, CAMIONES
  {
    variant: "d", icon: "🚛",
    eyebrow: "Colección",
    title: "Rastras & Camiones",
    text: "Cabezales, pipas, rastras y camiones especiales de carga.",
    filterCategory: "Rastras"
  },
  // EXTRAS (MANTENER VARIEDAD)
  {
    variant: "e", icon: "💥",
    eyebrow: "Por tiempo limitado",
    title: "Ofertas de la semana",
    text: "Precios especiales en modelos seleccionados. No duran mucho.",
    filterCategory: "Ofertas"
  },
  {
    variant: "f", icon: "⭐",
    eyebrow: "Recién llegados",
    title: "Nuevos ingresos",
    text: "Las últimas piezas que se sumaron al catálogo.",
    filterCategory: "Novedades"
  },
  {
    variant: "g", icon: "🔥",
    eyebrow: "Lo más pedido",
    title: "Más vendidos",
    text: "Las piezas que más se llevan nuestros clientes esta semana.",
    filterCategory: "Todos"
  }
];

const CATEGORY_ORDER = [
  "Todos",
  "Autos",
  "Motocicletas",
  "Rastras",
  "Maquinaria",
  "Control Remoto",
  "Otros",
  "Novedades",
  "Ofertas"
];

// Categorías especiales para rastras
const RASTA_SUBCATEGORIES = [
  "Rastras",
  "Cabezales",
  "Pipas",
  "Camiones"
];

// ---------- ESTADO ----------
let allProducts = [];
let currentCategory = "Todos";
let currentSearch = "";
let renderedProducts = [];
let cart = JSON.parse(localStorage.getItem('carland_cart')) || [];
let currentHeroSlide = 0;
let heroAutoplayInterval = null;
let selectedProduct = null; // Para el modal

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
  createProductModal(); // ✨ CREAR MODAL DE PRODUCTOS
});

// =========================================================
// ✨ MODAL DE PRODUCTOS (NUEVO)
// =========================================================

function createProductModal() {
  // Verificar si ya existe
  if (document.getElementById('productModal')) return;

  const modal = document.createElement('div');
  modal.id = 'productModal';
  modal.className = 'product-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.setAttribute('role', 'dialog');
  
  modal.innerHTML = `
    <div class="product-modal__overlay" id="productModalOverlay"></div>
    <div class="product-modal__content">
      <button class="product-modal__close" id="productModalClose" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      
      <div class="product-modal__body">
        <div class="product-modal__image" id="productModalImage">
          <img src="" alt="" id="productModalImg">
        </div>
        
        <div class="product-modal__details">
          <div class="product-modal__label" id="productModalLabel"></div>
          <h2 class="product-modal__name" id="productModalName"></h2>
          <p class="product-modal__brand" id="productModalBrand"></p>
          
          <div class="product-modal__specs">
            <div class="spec-item">
              <span class="spec-label">Categoría</span>
              <span class="spec-value" id="productModalCategory"></span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Escala</span>
              <span class="spec-value" id="productModalScale"></span>
            </div>
            <div class="spec-item">
              <span class="spec-label">Estado</span>
              <span class="spec-value" id="productModalStatus"></span>
            </div>
          </div>
          
          <div class="product-modal__price">
            <span class="price-label">Precio</span>
            <span class="price-value" id="productModalPrice">L. 0</span>
          </div>
          
          <button class="product-modal__addBtn" id="productModalAddBtn">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            Agregar al carrito
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners del modal
  const productModalClose = document.getElementById('productModalClose');
  const productModalOverlay = document.getElementById('productModalOverlay');
  const productModalAddBtn = document.getElementById('productModalAddBtn');
  
  productModalClose.addEventListener('click', closeProductModal);
  productModalOverlay.addEventListener('click', closeProductModal);
  
  productModalAddBtn.addEventListener('click', () => {
    if (selectedProduct) {
      addToCart(selectedProduct);
      // Cerrar modal después de agregar
      setTimeout(closeProductModal, 600);
    }
  });
  
  // Cerrar con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeProductModal();
    }
  });
}

function openProductModal(product) {
  selectedProduct = product;
  const modal = document.getElementById('productModal');
  
  document.getElementById('productModalImg').src = product.imagen;
  document.getElementById('productModalImg').alt = product.nombre;
  document.getElementById('productModalName').textContent = product.nombre;
  document.getElementById('productModalBrand').textContent = product.marca;
  document.getElementById('productModalCategory').textContent = product.categoria;
  document.getElementById('productModalScale').textContent = product.escala;
  document.getElementById('productModalStatus').textContent = product.estado;
  document.getElementById('productModalPrice').textContent = `L. ${product.precio.toLocaleString('es-HN', { minimumFractionDigits: 0 })}`;
  
  if (product.etiqueta) {
    document.getElementById('productModalLabel').textContent = product.etiqueta;
    document.getElementById('productModalLabel').style.display = 'inline-block';
  } else {
    document.getElementById('productModalLabel').style.display = 'none';
  }
  
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  modal.setAttribute('aria-hidden', 'true');
  modal.classList.remove('active');
  document.body.style.overflow = '';
  selectedProduct = null;
}

// =========================================================
// CARRITO
// =========================================================

function updateCartUI() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.textContent = totalItems;

  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '';
    cartEmptyMsg.removeAttribute('hidden');
  } else {
    cartEmptyMsg.setAttribute('hidden', '');
    renderCartItems();
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  const total = subtotal;
  cartSubtotal.textContent = `L. ${subtotal.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;
  cartTotal.textContent = `L. ${total.toLocaleString('es-HN', { minimumFractionDigits: 2 })}`;

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
  
  // Animar botón
  const button = event?.target;
  if (button) {
    button.style.animation = 'pulse 0.5s ease-out';
    setTimeout(() => {
      button.style.animation = '';
    }, 500);
  }
  
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

  let message = '🛒 *Quiero comprar los siguientes productos:*\n\n';
  
  cart.forEach((item, index) => {
    message += `${index + 1}. *${item.nombre}*\n`;
    message += `   Marca: ${item.marca}\n`;
    message += `   Escala: ${item.escala}\n`;
    message += `   Cantidad: ${item.quantity}\n`;
    message += `   Precio unitario: L. ${item.precio.toLocaleString('es-HN', { minimumFractionDigits: 0 })}\n`;
    message += `   Subtotal: L. ${(item.precio * item.quantity).toLocaleString('es-HN', { minimumFractionDigits: 0 })}\n\n`;
  });

  const total = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  message += `*TOTAL: L. ${total.toLocaleString('es-HN', { minimumFractionDigits: 0 })}*\n\n`;
  message += '📍 Mi dirección es: [El cliente completará]\n🏦 Listo para hacer el pago por depósito o transferencia.';

  const whatsappURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(whatsappURL, '_blank');
  
  showNotification('¡Abriendo WhatsApp!');
}

function showNotification(text) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = text;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.classList.add('active'), 10);
  setTimeout(() => {
    notification.classList.remove('active');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function openCart() {
  cartModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartModal.classList.remove('active');
  document.body.style.overflow = '';
}

// =========================================================
// CARRUSEL PRINCIPAL
// =========================================================

function initHeroCarousel() {
  heroPrevBtn.addEventListener('click', () => {
    prevSlide();
    resetHeroAutoplay();
  });
  
  heroNextBtn.addEventListener('click', () => {
    nextSlide();
    resetHeroAutoplay();
  });
  
  startHeroAutoplay();
}

function renderHeroSlides() {
  heroTrack.innerHTML = '';
  HERO_SLIDES.forEach((slide, index) => {
    const slideEl = document.createElement('div');
    slideEl.className = `hero__slide hero__slide--${slide.variant}`;
    slideEl.setAttribute('role', 'img');
    slideEl.setAttribute('aria-label', slide.title);
    
    slideEl.innerHTML = `
      <div class="hero__content">
        <span class="hero__eyebrow">${slide.icon} ${slide.eyebrow}</span>
        <h1 class="hero__title">${slide.title}</h1>
        <p class="hero__text">${slide.text}</p>
        <button class="hero__cta" onclick="filterByCategory('${slide.filterCategory}'); document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });">
          Ver catálogo →
        </button>
      </div>
    `;
    
    heroTrack.appendChild(slideEl);
  });
  
  updateHeroSlide();
  renderHeroDots();
}

function renderHeroDots() {
  heroDots.innerHTML = '';
  HERO_SLIDES.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.className = `hero__dot ${index === 0 ? 'active' : ''}`;
    dot.setAttribute('aria-label', `Ir al slide ${index + 1}`);
    dot.addEventListener('click', () => {
      currentHeroSlide = index;
      updateHeroSlide();
      resetHeroAutoplay();
    });
    heroDots.appendChild(dot);
  });
}

function nextSlide() {
  currentHeroSlide = (currentHeroSlide + 1) % HERO_SLIDES.length;
  updateHeroSlide();
}

function prevSlide() {
  currentHeroSlide = (currentHeroSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
  updateHeroSlide();
}

function updateHeroSlide() {
  const offset = -currentHeroSlide * 100;
  heroTrack.style.transform = `translateX(${offset}%)`;
  
  const dots = document.querySelectorAll('.hero__dot');
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

  renderedProducts.forEach((product, index) => {
    const card = createProductCard(product, index);
    grid.appendChild(card);
  });
}

function createProductCard(product, index) {
  const card = document.createElement('div');
  card.className = 'product';
  card.style.animationDelay = `${50 + index * 30}ms`;
  card.style.cursor = 'pointer';
  
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
        <button class="product__addBtn" onclick="event.stopPropagation(); addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Añadir
        </button>
      </div>
    </div>
  `;

  // ✨ Click en la tarjeta para abrir modal
  card.addEventListener('click', () => {
    openProductModal(product);
  });

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

  // Botones de categoría en colecciones
  document.querySelectorAll('[data-category-jump]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const category = e.currentTarget.dataset.categoryJump;
      filterByCategory(category);
      
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
    if (e.key === 'Escape') {
      if (cartModal.classList.contains('active')) {
        closeCart();
      }
      if (document.getElementById('productModal')?.classList.contains('active')) {
        closeProductModal();
      }
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

if (typeof window.PRODUCTOS === 'undefined') {
  window.PRODUCTOS = [];
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

if (Array.isArray(window.PRODUCTOS) && window.PRODUCTOS.length > 0) {
  allProducts = [...window.PRODUCTOS];
  renderedProducts = [...window.PRODUCTOS];
}
