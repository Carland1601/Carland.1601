/* =========================================================
   CARLAND 1601 — Lógica MEJORADA con Carrito + Preview Modal
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
let currentShipmentSlide = 0;
let shipmentAutoplayInterval = null;
let currentPreviewProduct = null;

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
const navWhatsapp = document.getElementById("navWhatsapp");
const navToggle = document.getElementById("navToggle");
const navInfoMobile = document.getElementById("navInfoMobile");

// Product Preview Modal
const productPreviewModal = document.getElementById("productPreviewModal");
const previewOverlay = document.getElementById("previewOverlay");
const previewClose = document.getElementById("previewClose");
const previewImage = document.getElementById("previewImage");
const previewName = document.getElementById("previewName");
const previewBrand = document.getElementById("previewBrand");
const previewScale = document.getElementById("previewScale");
const previewStatus = document.getElementById("previewStatus");
const previewCategory = document.getElementById("previewCategory");
const previewPrice = document.getElementById("previewPrice");
const previewOrderBtn = document.getElementById("previewOrderBtn");
const previewAddBtn = document.getElementById("previewAddBtn");

// Shipment Carousel
const shipmentTrack = document.getElementById("shipmentTrack");
const shipmentPrevBtn = document.getElementById("shipmentPrev");
const shipmentNextBtn = document.getElementById("shipmentNext");

// ---------- INICIALIZACIÓN ----------
document.addEventListener('DOMContentLoaded', () => {
  initShipmentCarousel();
  renderShipmentSlides();
  renderFilterButtons();
  renderProducts();
  updateCartUI();
  setupEventListeners();
  animateOnScroll();
});

// =========================================================
// PRODUCT PREVIEW MODAL
// =========================================================

function openProductPreview(product) {
  currentPreviewProduct = product;
  
  previewImage.src = product.imagen;
  previewImage.alt = product.nombre;
  previewName.textContent = product.nombre;
  previewBrand.textContent = `Marca: ${product.marca}`;
  previewScale.textContent = product.escala;
  previewStatus.textContent = product.estado;
  previewCategory.textContent = `Categoría: ${product.categoria}`;
  previewPrice.textContent = `L. ${product.precio.toLocaleString('es-HN', { minimumFractionDigits: 0 })}`;
  
  // Actualizar onclick del botón OrderNow
  previewOrderBtn.onclick = () => orderProductViaWhatsApp(product);
  
  productPreviewModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeProductPreview() {
  productPreviewModal.classList.remove('active');
  document.body.style.overflow = '';
  currentPreviewProduct = null;
}

function orderProductViaWhatsApp(product) {
  const message = `¡Hola! Me gustaría ordenar el siguiente producto:\n\n` +
                  `*${product.nombre}*\n` +
                  `Marca: ${product.marca}\n` +
                  `Escala: ${product.escala}\n` +
                  `Precio: L. ${product.precio.toLocaleString('es-HN', { minimumFractionDigits: 0 })}\n\n` +
                  `Por favor, confirma disponibilidad y envío.`;
  
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  closeProductPreview();
}

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

  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  message += `*TOTAL: L. ${subtotal.toLocaleString('es-HN', { minimumFractionDigits: 0 })}*\n\n`;
  message += '📍 Por favor, confirma disponibilidad y envío.\n';
  message += '💳 Acepto depósito o transferencia bancaria.';

  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
  closeCart();
}

function openCart() {
  cartModal.classList.add('active');
  cartOverlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartModal.classList.remove('active');
  cartOverlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function showNotification(text) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = text;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}

// =========================================================
// CARRUSEL DE ENVÍOS
// =========================================================

function initShipmentCarousel() {
  startShipmentAutoplay();
}

function renderShipmentSlides() {
  shipmentTrack.innerHTML = '';
  
  if (!window.SHIPMENT_IMAGES || window.SHIPMENT_IMAGES.length === 0) {
    return;
  }

  window.SHIPMENT_IMAGES.forEach((image, index) => {
    const slideEl = document.createElement('div');
    slideEl.className = `hero__shipmentSlide ${index === 0 ? 'active' : ''}`;
    slideEl.innerHTML = `<img src="${image}" alt="Envío ${index + 1}" loading="lazy">`;
    shipmentTrack.appendChild(slideEl);
  });
}

function nextShipmentSlide() {
  if (!window.SHIPMENT_IMAGES || window.SHIPMENT_IMAGES.length === 0) return;
  
  currentShipmentSlide = (currentShipmentSlide + 1) % window.SHIPMENT_IMAGES.length;
  updateShipmentSlide();
}

function prevShipmentSlide() {
  if (!window.SHIPMENT_IMAGES || window.SHIPMENT_IMAGES.length === 0) return;
  
  currentShipmentSlide = (currentShipmentSlide - 1 + window.SHIPMENT_IMAGES.length) % window.SHIPMENT_IMAGES.length;
  updateShipmentSlide();
}

function updateShipmentSlide() {
  const slides = document.querySelectorAll('.hero__shipmentSlide');
  
  slides.forEach((slide, index) => {
    slide.classList.toggle('active', index === currentShipmentSlide);
  });
}

function startShipmentAutoplay() {
  shipmentAutoplayInterval = setInterval(() => {
    nextShipmentSlide();
  }, 4000);
}

function resetShipmentAutoplay() {
  clearInterval(shipmentAutoplayInterval);
  startShipmentAutoplay();
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
    <div class="product__image" role="button" tabindex="0">
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

  // Click en la imagen para preview
  card.querySelector('.product__image').addEventListener('click', () => {
    openProductPreview(product);
  });

  // Soporte para teclado
  card.querySelector('.product__image').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      openProductPreview(product);
    }
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

  // Product Preview Modal
  previewClose.addEventListener('click', closeProductPreview);
  previewOverlay.addEventListener('click', closeProductPreview);
  previewAddBtn.addEventListener('click', () => {
    if (currentPreviewProduct) {
      addToCart(currentPreviewProduct);
      closeProductPreview();
    }
  });

  // Shipment Carousel
  shipmentPrevBtn.addEventListener('click', () => {
    prevShipmentSlide();
    resetShipmentAutoplay();
  });
  shipmentNextBtn.addEventListener('click', () => {
    nextShipmentSlide();
    resetShipmentAutoplay();
  });

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

  // Cerrar modales con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (cartModal.classList.contains('active')) {
        closeCart();
      }
      if (productPreviewModal.classList.contains('active')) {
        closeProductPreview();
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
