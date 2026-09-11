/* =========================================================
   CARLAND 1601 — SCRIPT MEJORADO V2 CON TODAS LAS MEJORAS
   ========================================================= */

const WHATSAPP_NUMBER = "50489534880";

const CATEGORY_IMAGES = {
  envios: ['assets/productos/envios1.jpg', 'assets/productos/envios2.jpg', 'assets/productos/envios3.jpg', 'assets/productos/envios4.jpg', 'assets/productos/envios5.jpg', 'assets/productos/envios6.jpg', 'assets/productos/envios7.jpg', 'assets/productos/envios8.jpg'],
  mcqueen: ['assets/productos/mc.png', 'assets/productos/mcqueen.png', 'assets/productos/rayo.png', 'assets/productos/cars.png', 'assets/productos/mack.png', 'assets/productos/lightning.png'],
  toyotas: ['assets/productos/tacoma.png', 'assets/productos/tacoma-negra.png', 'assets/productos/troja.png', 'assets/productos/tverde.png', 'assets/productos/hiluxа.png', 'assets/productos/hiluxn.png', 'assets/productos/hiluxr.png', 'assets/productos/pradob.png', 'assets/productos/pradog.png'],
  rastras: ['assets/productos/cn.png', 'assets/productos/pipa.png', 'assets/productos/cb.png', 'assets/productos/trans.png', 'assets/productos/tc.png', 'assets/productos/ca.png', 'assets/productos/cab.png', 'assets/productos/cr.png'],
  rc: ['assets/productos/rc1.png', 'assets/productos/rc2.png', 'assets/productos/bulrc.png', 'assets/productos/4x4.png', 'assets/productos/landrc.png', 'assets/productos/mariorc.png', 'assets/productos/busrc.png', 'assets/productos/escavador.jpg'],
  ofertas: [],
  novedades: [],
  masVendidos: ['assets/productos/tacoma.png', 'assets/productos/rc1.png']
};

const HERO_SLIDES = [
  {variant: "a", icon: "🚚", eyebrow: "Cobertura nacional", title: "Envíos a todo Honduras", text: "Llega hasta la puerta de tu casa, pagas por depósito o transferencia.", filterCategory: "Todos", imageCategory: "envios"},
  {variant: "b", icon: "🏎️", eyebrow: "Colección Premium", title: "Cars & McQueen", text: "Toda la colección de personajes de Cars: Rayo McQueen, Mack, Sally y más.", filterCategory: "Autos", imageCategory: "mcqueen"},
  {variant: "c", icon: "🚙", eyebrow: "Colección", title: "Toyota Trucks", text: "Tacoma, Tundra, Hilux, Prado y toda la línea Toyota lista para coleccionar.", filterCategory: "Autos", imageCategory: "toyotas"},
  {variant: "d", icon: "🚛", eyebrow: "Colección", title: "Rastras & Camiones", text: "Cabezales, pipas, rastras y camiones especiales de carga.", filterCategory: "Rastras", imageCategory: "rastras"},
  {variant: "e", icon: "💥", eyebrow: "Por tiempo limitado", title: "Ofertas de la semana", text: "Precios especiales en modelos seleccionados. No duran mucho.", filterCategory: "Ofertas", imageCategory: "ofertas"},
  {variant: "f", icon: "⭐", eyebrow: "Recién llegados", title: "Nuevos ingresos", text: "Las últimas piezas que se sumaron al catálogo.", filterCategory: "Novedades", imageCategory: "novedades"},
  {variant: "g", icon: "🔥", eyebrow: "Lo más pedido", title: "Más vendidos", text: "Las piezas que más se llevan nuestros clientes esta semana.", filterCategory: "Todos", imageCategory: "masVendidos"}
];

const CATEGORY_ORDER = ["Todos", "Autos", "Motocicletas", "Rastras", "Maquinaria", "Control Remoto", "Otros", "Novedades", "Ofertas"];

let allProducts = [];
let currentCategory = "Todos";
let currentSearch = "";
let renderedProducts = [];
let cart = JSON.parse(localStorage.getItem('carland_cart')) || [];
let currentHeroSlide = 0;
let heroAutoplayInterval = null;
let selectedProduct = null;

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

function getRandomImage(category) {
  const images = CATEGORY_IMAGES[category] || [];
  if (images.length === 0) return 'assets/placeholder.jpg';
  return images[Math.floor(Math.random() * images.length)];
}

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

document.addEventListener('DOMContentLoaded', () => {
  updateCarouselImages();
  initHeroCarousel();
  renderHeroSlides();
  renderFilterButtons();
  renderProducts();
  updateCartUI();
  setupEventListeners();
  animateOnScroll();
  createProductModal();
});

function updateCarouselImages() {
  if (Array.isArray(window.PRODUCTOS) && window.PRODUCTOS.length > 0) {
    const ofertas = window.PRODUCTOS.filter(p => p.etiqueta === 'Ofertas');
    CATEGORY_IMAGES.ofertas = ofertas.map(p => p.imagen).length > 0 ? ofertas.map(p => p.imagen) : ['assets/productos/tacoma.png', 'assets/productos/rc1.png'];
    const novedades = window.PRODUCTOS.filter(p => p.etiqueta === 'Novedades');
    CATEGORY_IMAGES.novedades = novedades.map(p => p.imagen).length > 0 ? novedades.map(p => p.imagen) : ['assets/productos/troja.png', 'assets/productos/4x4.png'];
  }
}

function initHeroCarousel() {
  renderHeroSlides();
  startHeroAutoplay();
  heroPrevBtn.addEventListener('click', prevSlide);
  heroNextBtn.addEventListener('click', nextSlide);
  heroDots.addEventListener('click', (e) => {
    if (e.target.classList.contains('hero__dot')) {
      currentHeroSlide = Array.from(heroDots.children).indexOf(e.target);
      updateHeroCarousel();
    }
  });
}

function renderHeroSlides() {
  heroTrack.innerHTML = '';
  heroDots.innerHTML = '';
  HERO_SLIDES.forEach((slide, index) => {
    const randomImage = getRandomImage(slide.imageCategory);
    const slideEl = document.createElement('div');
    slideEl.className = `hero__slide hero__slide--${slide.variant}`;
    slideEl.setAttribute('aria-hidden', index !== currentHeroSlide);
    slideEl.innerHTML = `
      <div class="hero__bgImage" style="background-image: linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.2) 100%), url('${randomImage}')"></div>
      <div class="hero__floatingImage">
        <img src="${randomImage}" alt="${slide.title}">
      </div>
      <div class="hero__content">
        <span class="hero__eyebrow">${slide.eyebrow}</span>
        <h1 class="hero__title">${slide.title}</h1>
        <p class="hero__text">${slide.text}</p>
        <div class="hero__actions">
          <button class="hero__cta" onclick="filterByCategory('${slide.filterCategory}'); document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });">
            ${slide.icon} Explorar
          </button>
        </div>
      </div>
    `;
    heroTrack.appendChild(slideEl);
    const dot = document.createElement('button');
    dot.className = `hero__dot ${index === currentHeroSlide ? 'active' : ''}`;
    dot.setAttribute('aria-label', `Ir a slide ${index + 1}`);
    heroDots.appendChild(dot);
  });
}

function updateHeroCarousel() {
  const slides = document.querySelectorAll('.hero__slide');
  const dots = document.querySelectorAll('.hero__dot');
  slides.forEach((slide, index) => {
    slide.setAttribute('aria-hidden', index !== currentHeroSlide);
    slide.classList.toggle('active', index === currentHeroSlide);
  });
  dots.forEach((dot, index) => {
    dot.classList.toggle('active', index === currentHeroSlide);
  });
  const offset = -currentHeroSlide * 100;
  heroTrack.style.transform = `translateX(${offset}%)`;
  resetHeroAutoplay();
}

function nextSlide() {
  currentHeroSlide = (currentHeroSlide + 1) % HERO_SLIDES.length;
  updateHeroCarousel();
}

function prevSlide() {
  currentHeroSlide = (currentHeroSlide - 1 + HERO_SLIDES.length) % HERO_SLIDES.length;
  updateHeroCarousel();
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

function createProductModal() {
  if (document.getElementById('productModal')) return;
  const modal = document.createElement('div');
  modal.id = 'productModal';
  modal.className = 'product-modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.setAttribute('role', 'dialog');
  modal.innerHTML = `
    <div class="product-modal__overlay" id="productModalOverlay"></div>
    <div class="product-modal__content">
      <button class="product-modal__close" id="productModalClose" aria-label="Cerrar"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      <div class="product-modal__body">
        <div class="product-modal__image" id="productModalImage"><img src="" alt="" id="productModalImg"></div>
        <div class="product-modal__details">
          <div class="product-modal__label" id="productModalLabel"></div>
          <h2 class="product-modal__name" id="productModalName"></h2>
          <p class="product-modal__brand" id="productModalBrand"></p>
          <div class="product-modal__specs">
            <div class="spec-item"><span class="spec-label">Categoría</span><span class="spec-value" id="productModalCategory"></span></div>
            <div class="spec-item"><span class="spec-label">Escala</span><span class="spec-value" id="productModalScale"></span></div>
            <div class="spec-item"><span class="spec-label">Estado</span><span class="spec-value" id="productModalStatus"></span></div>
          </div>
          <div class="product-modal__price"><span class="price-label">Precio</span><span class="price-value" id="productModalPrice">L. 0</span></div>
          <div class="product-modal__buttons">
            <button class="product-modal__addBtn" id="productModalAddBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>Agregar al carrito
            </button>
            <button class="product-modal__buyBtn" id="productModalBuyBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>Comprar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const productModalClose = document.getElementById('productModalClose');
  const productModalOverlay = document.getElementById('productModalOverlay');
  const productModalAddBtn = document.getElementById('productModalAddBtn');
  const productModalBuyBtn = document.getElementById('productModalBuyBtn');
  productModalClose.addEventListener('click', closeProductModal);
  productModalOverlay.addEventListener('click', closeProductModal);
  productModalAddBtn.addEventListener('click', () => {
    if (selectedProduct) {
      addToCart(selectedProduct);
      setTimeout(closeProductModal, 600);
    }
  });
  productModalBuyBtn.addEventListener('click', () => {
    if (selectedProduct) {
      buyNowWhatsApp(selectedProduct);
    }
  });
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
    document.getElementById('productModalLabel').style.display = 'block';
  }
  modal.classList.add('active');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeProductModal() {
  const modal = document.getElementById('productModal');
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function buyNowWhatsApp(product) {
  const message = `¡Hola! Me gustaría comprar este producto:\n\n🚗 *${product.nombre}*\n📦 Marca: ${product.marca}\n📏 Escala: ${product.escala}\n💰 Precio: L. ${product.precio.toLocaleString('es-HN')}\n\n¿Cuál es la disponibilidad y forma de pago?`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

function addToCart(product) {
  const existingItem = cart.find(item => item.nombre === product.nombre);
  if (existingItem) {
    existingItem.cantidad++;
  } else {
    cart.push({ ...product, cantidad: 1 });
  }
  localStorage.setItem('carland_cart', JSON.stringify(cart));
  updateCartUI();
  openCart();
}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem('carland_cart', JSON.stringify(cart));
  updateCartUI();
}

function updateQuantity(index, change) {
  cart[index].cantidad += change;
  if (cart[index].cantidad <= 0) {
    removeFromCart(index);
  } else {
    localStorage.setItem('carland_cart', JSON.stringify(cart));
    updateCartUI();
  }
}

function updateCartUI() {
  const itemCount = cart.reduce((sum, item) => sum + item.cantidad, 0);
  cartBadge.textContent = itemCount;
  cartItemsContainer.innerHTML = '';
  if (cart.length === 0) {
    cartEmptyMsg.removeAttribute('hidden');
    return;
  }
  cartEmptyMsg.setAttribute('hidden', '');
  cart.forEach((item, index) => {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <img src="${item.imagen}" alt="${item.nombre}" class="cart-item__image">
      <div class="cart-item__info">
        <div class="cart-item__name">${item.nombre}</div>
        <div class="cart-item__brand">${item.marca}</div>
        <div class="cart-item__price">L. ${item.precio.toLocaleString('es-HN')}</div>
      </div>
      <div class="cart-item__controls">
        <button onclick="updateQuantity(${index}, -1)" aria-label="Disminuir cantidad">−</button>
        <span>${item.cantidad}</span>
        <button onclick="updateQuantity(${index}, 1)" aria-label="Aumentar cantidad">+</button>
      </div>
      <button class="cart-item__remove" onclick="removeFromCart(${index})" aria-label="Eliminar">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    `;
    cartItemsContainer.appendChild(cartItem);
  });
  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  cartSubtotal.textContent = `L. ${subtotal.toLocaleString('es-HN')}`;
  cartTotal.textContent = `L. ${subtotal.toLocaleString('es-HN')}`;
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

function clearCart() {
  if (confirm('¿Estás seguro de que deseas vaciar tu carrito?')) {
    cart = [];
    localStorage.setItem('carland_cart', JSON.stringify(cart));
    updateCartUI();
  }
}

function checkoutCart() {
  if (cart.length === 0) {
    alert('Tu carrito está vacío');
    return;
  }
  let message = '¡Hola! Me gustaría comprar los siguientes productos:\n\n';
  cart.forEach(item => {
    message += `• ${item.nombre} (${item.marca}) x${item.cantidad}\n   Precio: L. ${item.precio.toLocaleString('es-HN')}\n`;
  });
  const total = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  message += `\n💰 Total: L. ${total.toLocaleString('es-HN')}\n\n¿Cuál es la disponibilidad y forma de pago?`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
}

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
    let matchesCategory = false;
    
    if (currentCategory === 'Control Remoto') {
      matchesCategory = product.categoria === 'Control Remoto' || product.nombre.toLowerCase().includes('rc');
    } else {
      matchesCategory = currentCategory === 'Todos' || product.categoria === currentCategory || product.etiqueta === currentCategory;
    }
    
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
      <div class="product__price">L. ${product.precio.toLocaleString('es-HN', { minimumFractionDigits: 0 })}</div>
      <div class="product__footer">
        <button class="product__addBtn" onclick="event.stopPropagation(); addToCart(${JSON.stringify(product).replace(/"/g, '&quot;')})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
          Carrito
        </button>
        <button class="product__buyBtn" onclick="event.stopPropagation(); buyNowWhatsApp(${JSON.stringify(product).replace(/"/g, '&quot;')})">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-4.935 1.195c-1.516.742-2.795 1.788-3.656 3.094-1.786 2.885-.788 6.781 2.097 8.567 1.516.935 3.277 1.429 5.083 1.429 1.393 0 2.777-.29 4.1-.876l.633.161a9.574 9.574 0 001.657-.892c.845-.583 1.598-1.326 2.228-2.2 1.786-2.885.788-6.781-2.097-8.567-2.886-1.786-6.781-.788-8.568 2.097z"/></svg>
          Comprar
        </button>
      </div>
    </div>
  `;
  card.addEventListener('click', () => {
    openProductModal(product);
  });
  return card;
}

function setupEventListeners() {
  cartToggle.addEventListener('click', openCart);
  cartClose.addEventListener('click', closeCart);
  cartOverlay.addEventListener('click', closeCart);
  cartCheckout.addEventListener('click', checkoutCart);
  cartClear.addEventListener('click', clearCart);
  searchInput.addEventListener('input', (e) => {
    currentSearch = e.target.value;
    filterAndRenderProducts();
  });
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
  navWhatsapp.href = `https://wa.me/${WHATSAPP_NUMBER}`;
  const mayoreoBtn = document.getElementById('mayoreoBtn');
  if (mayoreoBtn) {
    mayoreoBtn.onclick = () => {
      const message = '¡Hola! Me gustaría solicitar una cotización de mayoreo. Tengo interés en comprar 3 o más unidades del mismo modelo.';
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`, '_blank');
    };
  }
  navToggle.addEventListener('click', () => {
    navInfoMobile.style.display = navInfoMobile.style.display === 'flex' ? 'none' : 'flex';
  });
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

if (typeof window.PRODUCTOS === 'undefined') {
  window.PRODUCTOS = [];
}

if (Array.isArray(window.PRODUCTOS) && window.PRODUCTOS.length > 0) {
  allProducts = [...window.PRODUCTOS];
  renderedProducts = [...window.PRODUCTOS];
}
