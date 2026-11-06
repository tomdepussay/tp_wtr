const STATUS_LABELS = {
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const id = new URLSearchParams(location.search).get("id");
const message = document.getElementById("message");

function status(status) {
  document.getElementById("status").textContent =
    STATUS_LABELS[status] ?? status;
}

async function main() {
  if (!id) {
    document.getElementById("search").hidden = false;
    return;
  }

  const res = await fetch(`/orders/${id}`);
  if (!res.ok) {
    message.textContent = "Commande introuvable.";
    return;
  }
  const order = await res.json();

  const productRes = await fetch(`/products/${order.productId}`);
  const product = productRes.ok ? await productRes.json() : null;

  document.getElementById("order-id").textContent = order.id;
  document.getElementById("product").textContent = product
    ? product.name
    : `Produit ${order.productId}`;
  document.getElementById("quantity").textContent = order.quantity;
  document.getElementById("created-at").textContent = new Date(
    order.createdAt,
  ).toLocaleString("fr-FR");
  status(order.status);
  document.getElementById("details").hidden = false;

  const source = new EventSource(`/orders/${id}/stream`);

  source.addEventListener("order-status-changed", (e) => {
    status(JSON.parse(e.data).status);
  });

  source.addEventListener("order-cancelled", (e) => {
    status(JSON.parse(e.data).status);
  });

  source.onerror = () => {
    console.log("Coupure, reconnexion automatique…");
  };

  window.addEventListener("pagehide", () => source.close());
}

main();
