const socket = io();

const productForm = document.getElementById('productForm');
const productsList = document.getElementById('productsList');

// Renderizar lista de productos en el UL
function renderProducts(products) {
    if (!Array.isArray(products) || products.length === 0) {
        productsList.innerHTML = '<li>No hay productos cargados.</li>';
        return;
    }

    productsList.innerHTML = '';

    products.forEach(prod => {
        const li = document.createElement('li');
        li.dataset.id = prod.id;
        li.innerHTML = `
      <strong>${prod.title}</strong> - $${prod.price}
      (Stock: ${prod.stock})
      <button class="btn-delete">Eliminar</button>
    `;
        productsList.appendChild(li);
    });
}

// Al recibir actualización de productos desde el servidor
socket.on('productsUpdated', (products) => {
    renderProducts(products);
});

// Mostrar mensajes usando SweetAlert
socket.on('actionOk', (msg) => {
    Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: msg,
        timer: 1500,
        showConfirmButton: false
    });
});

socket.on('actionError', (msg) => {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: msg
    });
});

// Enviar nuevo producto desde form
productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const formData = new FormData(productForm);
    const product = {
        title: formData.get('title'),
        description: formData.get('description'),
        code: formData.get('code'),
        price: Number(formData.get('price')),
        stock: Number(formData.get('stock')),
        category: formData.get('category'),
        thumbnails: formData.get('thumbnails'),
        status: formData.get('status') === 'on'
    };

    socket.emit('newProduct', product);
    productForm.reset();
});

// Botón Eliminar
productsList.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-delete')) {
        const li = e.target.closest('li');
        const id = li.dataset.id;

        Swal.fire({
            title: '¿Eliminar producto?',
            text: `ID: ${id}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                socket.emit('deleteProduct', id);
            }
        });
    }
});
