const CART_KEY = 'pawmate_cart';

export const getCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getCartCount = () => {
  const cart = getCart();
  return cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
};

export const addToCart = (product) => {
  const cart = getCart();
  const existingIdx = cart.findIndex((i) => i.id === product.id);
  if (existingIdx >= 0) {
    const existing = cart[existingIdx];
    cart[existingIdx] = { ...existing, quantity: (existing.quantity || 1) + 1 };
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  }
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdate'));
  return cart;
};

export const removeFromCart = (id) => {
  const cart = getCart().filter((i) => i.id !== id);
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdate'));
  return cart;
};

export const clearCart = () => {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event('cartUpdate'));
};

export const updateQuantity = (id, quantity) => {
  const cart = getCart().map((i) => {
    if (i.id === id) {
      const q = Math.max(1, quantity || 1);
      return { ...i, quantity: q };
    }
    return i;
  });
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdate'));
  return cart;
};
