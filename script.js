const STORAGE_KEYS = {
  products: 'loop_time_products_v2',
  cart: 'loop_time_cart_v2',
  orders: 'loop_time_orders_v2',
  customerName: 'loop_time_customer_name_v1',
};

const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const cartCount = document.getElementById('cartCount');
const cartItemsList = document.getElementById('cartItems');
const cartTotal = document.getElementById('cartTotal');
const ordersList = document.getElementById('ordersList');
const toastContainer = document.getElementById('toastContainer');
const filterButtons = document.querySelectorAll('.filter-btn');

const loginBtn = document.getElementById('loginBtn');
const loginDialog = document.getElementById('loginDialog');
const submitLogin = document.getElementById('submitLogin');

const cartBtn = document.getElementById('cartBtn');
const cartDialog = document.getElementById('cartDialog');
const clearCart = document.getElementById('clearCart');
const closeCart = document.getElementById('closeCart');
const checkout = document.getElementById('checkout');

const checkoutDialog = document.getElementById('checkoutDialog');
const checkoutForm = document.getElementById('checkoutForm');
const closeCheckout = document.getElementById('closeCheckout');

const openAdminAccess = document.getElementById('openAdminAccess');
const adminAccessDialog = document.getElementById('adminAccessDialog');
const unlockAdmin = document.getElementById('unlockAdmin');
const adminPin = document.getElementById('adminPin');
const adminPanelWrapper = document.getElementById('adminPanel');
const adminForm = document.getElementById('adminForm');

const currency = new Intl.NumberFormat('es-DO', {
  style: 'currency',
  currency: 'DOP',
  minimumFractionDigits: 2,
});

const defaultProducts = [
  {
    id: 1,
    name: 'Elegance Rose',
    audience: 'Mujer',
    style: 'Formal',
    price: 7900,
    stock: 6,
    image:
      'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 2,
    name: 'Titan Black',
    audience: 'Hombre',
    style: 'Formal',
    price: 9500,
    stock: 5,
    image:
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 3,
    name: 'Pulse Sport',
    audience: 'Adolescentes',
    style: 'Deportivo',
    price: 6900,
    stock: 8,
    image:
      'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 4,
    name: 'Nova Active',
    audience: 'Unisex',
    style: 'Deportivo',
    price: 8800,
    stock: 4,
    image:
      'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=800&q=80',
  },
];

let products = loadState(STORAGE_KEYS.products, defaultProducts);
let cart = loadState(STORAGE_KEYS.cart, []);
let orders = loadState(STORAGE_KEYS.orders, []);
let adminAuthenticated = false;
let failedAdminAttempts = 0;
let adminLockedUntil = 0;
let activeStyleFilter = 'all';

function loadState(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function saveState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatMoney(value) {
  return currency.format(value);
}

function getProductById(id) {
  return products.find((product) => product.id === id);
}

function getCartQuantityForProduct(productId) {
  const found = cart.find((item) => item.id === productId);
  return found ? found.qty : 0;
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 260);
  }, 2400);
}

function getFilteredProducts() {
  const term = searchInput.value.trim().toLowerCase();

  return products.filter((product) => {
    const matchesTerm =
      product.name.toLowerCase().includes(term) ||
      product.audience.toLowerCase().includes(term) ||
      product.style.toLowerCase().includes(term);

    const matchesStyle = activeStyleFilter === 'all' || product.style.toLowerCase() === activeStyleFilter;

    return matchesTerm && matchesStyle;
  });
}

function renderProducts() {
  const filteredProducts = getFilteredProducts();
  productGrid.innerHTML = '';

  if (!filteredProducts.length) {
    productGrid.innerHTML = '<p>No encontramos relojes con ese criterio.</p>';
    return;
  }

  filteredProducts.forEach((product) => {
    const inCart = getCartQuantityForProduct(product.id);
    const available = Math.max(0, product.stock - inCart);
    const outOfStock = available <= 0;

    const card = document.createElement('article');
    card.className = 'card reveal visible';
    card.innerHTML = `
      <img src="${product.image}" alt="${product.name}" loading="lazy" />
      <h3>${product.name}</h3>
      <p>${product.audience} · ${product.style}</p>
      <p class="stock ${outOfStock ? 'sold-out' : ''}">${outOfStock ? 'Sin stock' : `Stock: ${available}`}</p>
      <p class="price">${formatMoney(product.price)}</p>
      <button class="btn btn-primary" data-id="${product.id}" ${outOfStock ? 'disabled' : ''}>Agregar al carrito</button>
    `;

    const addButton = card.querySelector('button');
    addButton.addEventListener('click', () => {
      addToCart(product.id);
    });

    productGrid.appendChild(card);
  });
}

function addToCart(productId) {
  const product = getProductById(productId);
  if (!product) {
    return;
  }

  const inCart = getCartQuantityForProduct(productId);
  if (inCart >= product.stock) {
    showToast('No hay más unidades disponibles para este producto.');
    return;
  }

  const existing = cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: productId, qty: 1 });
  }

  saveState(STORAGE_KEYS.cart, cart);
  renderCart();
  renderProducts();
  showToast('Producto agregado al carrito.');
}

function changeQty(productId, delta) {
  const item = cart.find((entry) => entry.id === productId);
  const product = getProductById(productId);

  if (!item || !product) {
    return;
  }

  const nextQty = item.qty + delta;
  if (nextQty <= 0) {
    cart = cart.filter((entry) => entry.id !== productId);
  } else if (nextQty <= product.stock) {
    item.qty = nextQty;
  } else {
    showToast('Límite de stock alcanzado.');
    return;
  }

  saveState(STORAGE_KEYS.cart, cart);
  renderCart();
  renderProducts();
}

function renderCart() {
  cartItemsList.innerHTML = '';

  if (!cart.length) {
    cartItemsList.innerHTML = '<li>Tu carrito está vacío.</li>';
  }

  let total = 0;
  let totalItems = 0;

  cart.forEach((item) => {
    const product = getProductById(item.id);
    if (!product) {
      return;
    }

    total += product.price * item.qty;
    totalItems += item.qty;

    const li = document.createElement('li');
    li.innerHTML = `
      <span>${product.name} — ${formatMoney(product.price)} x ${item.qty}</span>
      <div class="qty-controls">
        <button class="remove-item" data-action="minus" data-id="${product.id}">-</button>
        <button class="remove-item" data-action="plus" data-id="${product.id}">+</button>
      </div>
    `;
    cartItemsList.appendChild(li);
  });

  cartCount.textContent = String(totalItems);
  cartTotal.textContent = `Total: ${formatMoney(total)}`;

  cartItemsList.querySelectorAll('.remove-item').forEach((button) => {
    button.addEventListener('click', () => {
      const productId = Number(button.dataset.id);
      const action = button.dataset.action;
      changeQty(productId, action === 'plus' ? 1 : -1);
    });
  });
}

function renderOrders() {
  ordersList.innerHTML = '';

  if (!orders.length) {
    ordersList.innerHTML = '<li>Aún no hay órdenes registradas.</li>';
    return;
  }

  orders.forEach((order, index) => {
    const li = document.createElement('li');
    li.textContent = `Orden #${index + 1}: ${order.items} producto(s) - ${formatMoney(order.total)} · ${order.customer}`;
    ordersList.appendChild(li);
  });
}

function enableRevealAnimation() {
  const sections = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  sections.forEach((section) => observer.observe(section));
}

function restoreCustomerSession() {
  const customer = localStorage.getItem(STORAGE_KEYS.customerName);
  if (customer) {
    loginBtn.textContent = `Hola, ${customer}`;
  }
}

loginBtn.addEventListener('click', () => loginDialog.showModal());
submitLogin.addEventListener('click', () => {
  const email = document.getElementById('email').value.trim();
  if (email) {
    const username = email.split('@')[0];
    loginBtn.textContent = `Hola, ${username}`;
    localStorage.setItem(STORAGE_KEYS.customerName, username);
    showToast('Sesión iniciada correctamente.');
  }
});

searchInput.addEventListener('input', renderProducts);

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    activeStyleFilter = button.dataset.filter;
    renderProducts();
  });
});

cartBtn.addEventListener('click', () => {
  renderCart();
  cartDialog.showModal();
});

closeCart.addEventListener('click', () => cartDialog.close());

clearCart.addEventListener('click', () => {
  cart = [];
  saveState(STORAGE_KEYS.cart, cart);
  renderCart();
  renderProducts();
  showToast('Carrito vaciado.');
});

checkout.addEventListener('click', () => {
  if (!cart.length) {
    showToast('Tu carrito está vacío.');
    return;
  }

  cartDialog.close();
  checkoutDialog.showModal();
});

closeCheckout.addEventListener('click', () => checkoutDialog.close());

checkoutForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!cart.length) {
    showToast('Tu carrito está vacío.');
    return;
  }

  const customer = document.getElementById('checkoutName').value.trim();
  const phone = document.getElementById('checkoutPhone').value.trim();
  const address = document.getElementById('checkoutAddress').value.trim();
  const payment = document.getElementById('checkoutPayment').value;

  if (!customer || !phone || !address || !payment) {
    showToast('Completa todos los campos de checkout.');
    return;
  }

  let total = 0;
  let totalItems = 0;

  cart.forEach((item) => {
    const product = getProductById(item.id);
    if (!product) {
      return;
    }
    total += product.price * item.qty;
    totalItems += item.qty;
    product.stock = Math.max(0, product.stock - item.qty);
  });

  orders.push({
    items: totalItems,
    total,
    customer,
    date: new Date().toISOString(),
    payment,
  });

  cart = [];
  saveState(STORAGE_KEYS.orders, orders);
  saveState(STORAGE_KEYS.cart, cart);
  saveState(STORAGE_KEYS.products, products);

  renderCart();
  renderOrders();
  renderProducts();
  checkoutForm.reset();
  checkoutDialog.close();
  showToast('¡Compra registrada con éxito!');
});

openAdminAccess.addEventListener('click', () => {
  adminAccessDialog.showModal();
});

unlockAdmin.addEventListener('click', () => {
  const now = Date.now();
  if (now < adminLockedUntil) {
    const seconds = Math.ceil((adminLockedUntil - now) / 1000);
    showToast(`Acceso bloqueado temporalmente. Intenta en ${seconds}s.`);
    return;
  }

  if (adminPin.value.trim() !== '2408') {
    failedAdminAttempts += 1;
    if (failedAdminAttempts >= 3) {
      adminLockedUntil = Date.now() + 30000;
      failedAdminAttempts = 0;
      showToast('Demasiados intentos fallidos. Acceso bloqueado 30s.');
      return;
    }

    showToast('PIN incorrecto.');
    return;
  }

  failedAdminAttempts = 0;
  adminAuthenticated = true;
  adminPanelWrapper.classList.remove('hidden');
  adminAccessDialog.close();
  adminPin.value = '';
  showToast('Acceso admin concedido.');
});

adminForm.addEventListener('submit', (event) => {
  event.preventDefault();

  if (!adminAuthenticated) {
    showToast('Solo administradores pueden agregar productos.');
    return;
  }

  const newProduct = {
    id: Date.now(),
    name: document.getElementById('adminName').value.trim(),
    audience: document.getElementById('adminAudience').value.trim(),
    style: document.getElementById('adminStyle').value.trim(),
    price: Number(document.getElementById('adminPrice').value),
    stock: Number(document.getElementById('adminStock').value),
    image: document.getElementById('adminImage').value.trim(),
  };

  const isInvalid =
    !newProduct.name ||
    !newProduct.audience ||
    !newProduct.style ||
    !newProduct.image ||
    Number.isNaN(newProduct.price) ||
    Number.isNaN(newProduct.stock) ||
    newProduct.price <= 0 ||
    newProduct.stock <= 0;

  if (isInvalid) {
    showToast('Completa correctamente todos los campos del producto.');
    return;
  }

  products.push(newProduct);
  saveState(STORAGE_KEYS.products, products);
  adminForm.reset();
  renderProducts();
  showToast('Producto agregado por admin.');
});

restoreCustomerSession();
renderProducts();
renderCart();
renderOrders();
enableRevealAnimation();
