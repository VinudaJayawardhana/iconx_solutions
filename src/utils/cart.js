export const CART_STORAGE_KEY = "iconx_cart";
export const CART_EVENT = "iconx-cart-updated";

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeCart(cartItems) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: cartItems }));
}

export function getCartItems() {
  return readCart();
}

export function getCartCount() {
  return readCart().reduce((total, item) => total + (item.quantity || 1), 0);
}

export function addItemToCart(product) {
  const cartItems = readCart();
  const existingItem = cartItems.find((item) => item.id === product.id);

  if (existingItem) {
    existingItem.quantity = (existingItem.quantity || 1) + 1;
  } else {
    cartItems.push({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      image: product.image || "",
      quantity: 1,
    });
  }

  writeCart(cartItems);
  return cartItems;
}

export function updateCartItemQuantity(id, quantity) {
  const cartItems = readCart()
    .map((item) => (item.id === id ? { ...item, quantity } : item))
    .filter((item) => item.quantity > 0);

  writeCart(cartItems);
  return cartItems;
}

export function removeCartItem(id) {
  const cartItems = readCart().filter((item) => item.id !== id);
  writeCart(cartItems);
  return cartItems;
}

export function clearCart() {
  writeCart([]);
}

export function getCartSubtotal() {
  return readCart().reduce(
    (total, item) => total + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );
}
