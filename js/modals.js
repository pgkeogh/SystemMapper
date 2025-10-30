// js/modals.js
import { state } from "./dataStore.js";
import { renderAllColumns } from "./uiRenderer.js";

const modal = () => document.getElementById("product-selection-modal");
const evalPanel = () => document.getElementById("product-eval-panel");

export function initModals() {
  console.log("🔧 Initializing modals...");

  document
    .getElementById("close-product-modal")
    ?.addEventListener("click", closeProductCatalog);
  document
    .getElementById("close-product-modal-button")
    ?.addEventListener("click", closeProductCatalog);
  document
    .getElementById("close-eval-panel")
    ?.addEventListener("click", closeEvalPanel);

  document
    .getElementById("clear-product-selection")
    ?.addEventListener("click", () => {
      const capId = state.ui.activeCapabilityId;
      if (capId && state.assignments[capId]) {
        delete state.assignments[capId];
        console.log("Cleared assignment for:", capId);
        renderAllColumns();
      }
    });

  document
    .getElementById("select-this-product")
    ?.addEventListener("click", () => {
      const chosen = state.ui.activeProductId;
      const capId = state.ui.activeCapabilityId;

      if (chosen && capId) {
        state.assignments[capId] = chosen;
        console.log("✅ Product assigned:", { capId, productId: chosen });

        // Persist to localStorage
        localStorage.setItem("assignments", JSON.stringify(state.assignments));

        closeEvalPanel();
        closeProductCatalog();
        renderAllColumns();
      }
    });

  console.log("✅ Modals initialized");
}

export function openProductCatalogForCapability(capabilityId) {
  console.log("📂 Opening product catalog for:", capabilityId);

  state.ui.activeCapabilityId = capabilityId;

  const cap = state.capabilities.find((c) => c.id === capabilityId);
  document.getElementById("modal-capability-name").textContent =
    cap?.name || "Capability";
  document.getElementById("modal-capability-tags").textContent = cap?.tags
    ? `Tags: ${cap.tags}`
    : "";

  // Vendor filter options
  const vendorFilter = document.getElementById("modal-vendor-filter");
  vendorFilter.innerHTML = `<option value="">All Vendors</option>`;
  state.vendors.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = v.name;
    vendorFilter.appendChild(opt);
  });

  // Search + filter
  const applyList = () => {
    const vendorId = vendorFilter.value || "";
    const q = (
      document.getElementById("modal-search").value || ""
    ).toLowerCase();

    const relevantProducts = state.products.filter(
      (p) =>
        (p.capabilityIds || []).includes(capabilityId) &&
        (vendorId ? p.vendorId === vendorId : true) &&
        (q ? p.name.toLowerCase().includes(q) : true) &&
        (state.activeDomain === "ALL"
          ? true
          : (p.domains || "").toUpperCase().includes(state.activeDomain))
    );

    console.log("Filtered products:", relevantProducts.length);

    const list = document.getElementById("modal-product-list");
    list.innerHTML = "";

    if (relevantProducts.length === 0) {
      list.innerHTML =
        '<div class="col-span-2 text-center text-sm text-gray-400 py-8">No products found</div>';
      return;
    }

    relevantProducts.forEach((p) => {
      const vendor = state.vendors.find((v) => v.id === p.vendorId);
      const card = document.createElement("div");
      card.className =
        "group bg-[#0B0F1E] border border-[#262A33] rounded-lg p-3 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30 transition cursor-pointer";
      card.innerHTML = `
        <div class="flex items-center justify-between mb-2">
          <div class="flex-1">
            <div class="font-semibold">${p.name}</div>
            <div class="text-xs text-gray-400">${vendor?.name || "Unknown"} • ${
        p.productType || "Module"
      }</div>
          </div>
          <button class="px-2 py-1 text-xs rounded-md bg-indigo-600 hover:bg-indigo-500 transition">
            Details
          </button>
        </div>
        <div class="text-xs text-gray-400 line-clamp-2">${
          p.description || "No description available"
        }</div>
      `;
      card.querySelector("button").onclick = (e) => {
        e.stopPropagation();
        openEvalPanel(p.id, capabilityId);
      };
      list.appendChild(card);
    });
  };

  document.getElementById("modal-search").oninput = applyList;
  vendorFilter.onchange = applyList;

  applyList();
  modal().classList.remove("hidden");
}

export function closeProductCatalog() {
  console.log("📂 Closing product catalog");
  modal().classList.add("hidden");
}

export function openEvalPanel(productId, capabilityId) {
  console.log("📋 Opening evaluation panel:", { productId, capabilityId });

  state.ui.activeProductId = productId;
  state.ui.activeCapabilityId = capabilityId;

  const product = state.products.find((p) => p.id === productId);
  const vendor = state.vendors.find((v) => v.id === product?.vendorId);

  document.getElementById("eval-product-name").textContent =
    product?.name || "Unknown Product";
  document.getElementById("eval-product-meta").textContent = `${
    vendor?.name || "Unknown"
  } • ${product?.productType || "Module"}`;

  const content = document.getElementById("eval-content");
  content.innerHTML = "";

  const evals = state.productEvaluations.filter(
    (e) => e.productId === productId && e.capabilityId === capabilityId
  );

  if (!evals.length) {
    content.innerHTML = `
      <div class="text-center py-8">
        <i class="fa-solid fa-circle-info text-4xl text-gray-600 mb-3"></i>
        <p class="text-sm text-gray-400">No evaluation data available for this product and capability.</p>
      </div>
    `;
  } else {
    const e = evals[0];

    if (e.goodFor?.length)
      content.appendChild(
        sectionList("✅ Good For", e.goodFor, "text-green-400")
      );
    if (e.notIdealFor?.length)
      content.appendChild(
        sectionList("❌ Not Ideal For", e.notIdealFor, "text-red-400")
      );
    if (e.bestUseCases?.length)
      content.appendChild(
        sectionList("🎯 Best Use Cases", e.bestUseCases, "text-blue-400")
      );
    if (e.specialFeatures?.length)
      content.appendChild(
        sectionList("🤖 Special Features", e.specialFeatures, "text-purple-400")
      );
    if (e.competitiveAdvantages?.length)
      content.appendChild(
        sectionList(
          "💪 Competitive Advantages",
          e.competitiveAdvantages,
          "text-emerald-400"
        )
      );
    if (e.competitiveDisadvantages?.length)
      content.appendChild(
        sectionList(
          "⚠️ Competitive Disadvantages",
          e.competitiveDisadvantages,
          "text-orange-400"
        )
      );

    const metaSection = document.createElement("div");
    metaSection.className = "space-y-2 pt-4 border-t border-[#262A33]";
    metaSection.innerHTML = `
      ${kv("Implementation Complexity", e.implementationComplexity)}
      ${kv("Typical Implementation Time", e.typicalImplementationTime)}
      ${kv("Confidence Level", e.confidence)}
    `;
    content.appendChild(metaSection);
  }

  evalPanel().classList.remove("translate-x-full");
}

export function closeEvalPanel() {
  console.log("📋 Closing evaluation panel");
  evalPanel().classList.add("translate-x-full");
}

function sectionList(title, items, iconColor = "text-gray-400") {
  const wrap = document.createElement("div");
  wrap.innerHTML = `
    <div class="text-sm font-semibold mb-2 ${iconColor}">${title}</div>
    <ul class="space-y-1 text-sm text-gray-300 pl-4"></ul>
  `;
  const ul = wrap.querySelector("ul");
  (items || []).forEach((x) => {
    const li = document.createElement("li");
    li.innerHTML = `<i class="fa-solid fa-circle text-[6px] mr-2 align-middle ${iconColor}"></i>${x}`;
    ul.appendChild(li);
  });
  return wrap;
}

function kv(label, value) {
  return `<div class="text-sm"><span class="text-gray-400">${label}:</span> <span class="text-gray-200 capitalize">${
    value || "-"
  }</span></div>`;
}
