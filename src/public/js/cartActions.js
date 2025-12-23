(function () {
  async function ensureCart() {
    let cid = localStorage.getItem('cartId');
    if (cid) return cid;
    const r = await fetch('/api/carts', { method: 'POST' });
    const cart = await r.json();
    cid = cart._id;
    localStorage.setItem('cartId', cid);
    return cid;
  }

  async function addToCart(pid, quantity) {
    const cid = await ensureCart();
    const r = await fetch(`/api/carts/${cid}/products/${pid}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quantity: quantity || 1 }),
    });
    if (!r.ok) throw new Error('No se pudo agregar al carrito');
    return cid;
  }

  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-add-to-cart]');
    if (!btn) return;
    e.preventDefault();
    try {
      const pid = btn.getAttribute('data-pid');
      const qty = Number(btn.getAttribute('data-qty')) || 1;
      const cid = await addToCart(pid, qty);
      alert(`Agregado al carrito. Cart ID: ${cid}`);
    } catch (err) {
      alert(err.message || 'Error');
    }
  });
})();
