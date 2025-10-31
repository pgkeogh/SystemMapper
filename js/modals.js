// js/modals.js
import { renderAllColumns } from "./uiRenderer.js";
import {
  state,
  getCapabilitiesForProductInProcess,
  getVendorProductsForProcess,
  getBusinessProcessEvaluation,
} from "./dataStore.js";

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

// ============================================================================
// BUSINESS PROCESS DETAIL MODAL
// ============================================================================

export function openBusinessProcessDetail(productId, businessProcessId) {
  console.log("📋 Opening business process detail:", {
    productId,
    businessProcessId,
  });

  const product = state.products.find((p) => p.id === productId);
  const vendor = state.vendors.find((v) => v.id === product?.vendorId);
  const businessProcess = state.businessProcesses.find(
    (bp) => bp.id === businessProcessId
  );
  const capabilities = getCapabilitiesForProductInProcess(
    productId,
    businessProcessId
  );
  const businessProcessEval = getBusinessProcessEvaluation(
    vendor?.id,
    businessProcessId
  );

  if (!product || !vendor || !businessProcess) {
    console.error("Missing data:", { product, vendor, businessProcess });
    return;
  }

  // Get all products from this vendor for this process
  const allVendorProducts = getVendorProductsForProcess(
    vendor.id,
    businessProcessId
  );

  // Update modal header
  document.getElementById("bp-modal-title").textContent = businessProcess.name;
  document.getElementById("bp-modal-vendor").textContent = vendor.name;
  document.getElementById("bp-modal-product").textContent = product.name;

  const content = document.getElementById("bp-modal-content");
  content.innerHTML = "";

  // NEW SECTION: Business Process Evaluation (if available)
  if (businessProcessEval) {
    const evalSection = document.createElement("div");
    evalSection.innerHTML = `
      <div class="bg-gradient-to-br from-indigo-600/10 to-purple-600/10 border border-indigo-600/30 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="text-sm font-semibold text-indigo-300">Business Process Evaluation</div>
          <span class="px-2 py-1 text-xs rounded-md ${
            businessProcessEval.overallFit === "excellent"
              ? "bg-green-600/20 text-green-400 border border-green-600/50"
              : businessProcessEval.overallFit === "good"
              ? "bg-blue-600/20 text-blue-400 border border-blue-600/50"
              : "bg-yellow-600/20 text-yellow-400 border border-yellow-600/50"
          }">
            ${businessProcessEval.overallFit.toUpperCase()} FIT
          </span>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <!-- Good For -->
          <div>
            <div class="text-xs font-semibold text-gray-400 mb-2">✅ Good For:</div>
            <ul class="space-y-1">
              ${businessProcessEval.goodFor
                .slice(0, 4)
                .map(
                  (item) => `
                <li class="text-xs text-gray-300 flex items-start gap-2">
                  <i class="fa-solid fa-check text-green-500 text-[10px] mt-0.5"></i>
                  <span>${item}</span>
                </li>
              `
                )
                .join("")}
            </ul>
          </div>
          
          <!-- Not Ideal For -->
          <div>
            <div class="text-xs font-semibold text-gray-400 mb-2">⚠️ Not Ideal For:</div>
            <ul class="space-y-1">
              ${businessProcessEval.notIdealFor
                .slice(0, 4)
                .map(
                  (item) => `
                <li class="text-xs text-gray-300 flex items-start gap-2">
                  <i class="fa-solid fa-xmark text-red-500 text-[10px] mt-0.5"></i>
                  <span>${item}</span>
                </li>
              `
                )
                .join("")}
            </ul>
          </div>
        </div>
        
        <!-- Implementation & Cost -->
        <div class="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-indigo-600/20">
          <div class="text-center">
            <div class="text-xs text-gray-400 mb-1">Complexity</div>
            <div class="text-sm font-semibold text-indigo-300">${
              businessProcessEval.implementationComplexity
            }</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-400 mb-1">Timeline</div>
            <div class="text-sm font-semibold text-indigo-300">${
              businessProcessEval.typicalImplementationTime
            }</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-gray-400 mb-1">TCO</div>
            <div class="text-sm font-semibold text-indigo-300">${
              businessProcessEval.totalCostOfOwnership
            }</div>
          </div>
        </div>
        
        <button 
          onclick="window.showFullEvaluation('${businessProcessEval.id}')"
          class="w-full mt-4 px-3 py-2 text-xs rounded-md bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-600/50 text-indigo-300 transition"
        >
          View Full Evaluation <i class="fa-solid fa-chevron-right ml-1"></i>
        </button>
      </div>
    `;
    content.appendChild(evalSection);
  }

  // Section 1: Product Overview
  const overviewSection = document.createElement("div");
  overviewSection.innerHTML = `
    <div class="bg-[#0B0F1E] border border-[#262A33] rounded-lg p-4">
      <div class="text-sm font-semibold mb-2 text-gray-300">Product Overview</div>
      <div class="text-sm text-gray-400">${
        product.description || "No description available"
      }</div>
      <div class="mt-3 flex flex-wrap gap-2">
        ${
          product.productType
            ? `<span class="px-2 py-1 text-xs rounded-md bg-[#1a1f35] border border-[#2B3140]">${product.productType}</span>`
            : ""
        }
        ${
          product.pricingTier
            ? `<span class="px-2 py-1 text-xs rounded-md bg-[#1a1f35] border border-[#2B3140]">${product.pricingTier}</span>`
            : ""
        }
        ${
          product.marketPosition
            ? `<span class="px-2 py-1 text-xs rounded-md bg-[#1a1f35] border border-[#2B3140]">${product.marketPosition}</span>`
            : ""
        }
      </div>
    </div>
  `;
  content.appendChild(overviewSection);

  // Section 2: Related Products (if vendor has multiple products for this process)
  if (allVendorProducts.length > 1) {
    const productsSection = document.createElement("div");
    productsSection.innerHTML = `
      <div class="bg-[#0B0F1E] border border-[#262A33] rounded-lg p-4">
        <div class="text-sm font-semibold mb-3 text-gray-300">Related ${
          vendor.name
        } Products</div>
        <div class="space-y-2">
          ${allVendorProducts
            .map((p) => {
              const isSelected = p.id === productId;
              return `
              <div class="px-3 py-2 rounded-md ${
                isSelected
                  ? "bg-indigo-600/20 border border-indigo-600/50"
                  : "bg-[#111628] border border-[#262A33]"
              }">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="text-sm font-medium ${
                      isSelected ? "text-indigo-400" : "text-gray-300"
                    }">${p.name}</div>
                    <div class="text-xs text-gray-400">${
                      p.productType || "module"
                    }</div>
                  </div>
                  ${
                    isSelected
                      ? '<span class="text-xs text-indigo-400">Current</span>'
                      : ""
                  }
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
    content.appendChild(productsSection);
  }

  // Section 3: Capabilities Supported
  const capsSection = document.createElement("div");
  capsSection.innerHTML = `
    <div class="bg-[#0B0F1E] border border-[#262A33] rounded-lg p-4">
      <div class="text-sm font-semibold mb-3 text-gray-300">Capabilities Supported (${
        capabilities.length
      })</div>
      <div class="space-y-2">
        ${
          capabilities.length > 0
            ? capabilities
                .map(
                  (cap) => `
          <div class="px-3 py-2 rounded-md bg-[#111628] border border-[#262A33]">
            <div class="text-sm font-medium text-gray-300">${cap.name}</div>
            <div class="text-xs text-gray-400 mt-1">${
              cap.valueProposition || cap.description || ""
            }</div>
          </div>
        `
                )
                .join("")
            : '<div class="text-sm text-gray-500">No capabilities mapped</div>'
        }
      </div>
    </div>
  `;
  content.appendChild(capsSection);

  // Section 4: Product Features (if available)
  if (product.features) {
    const featuresSection = document.createElement("div");
    const featuresList = product.features.split("|").filter((f) => f.trim());
    featuresSection.innerHTML = `
      <div class="bg-[#0B0F1E] border border-[#262A33] rounded-lg p-4">
        <div class="text-sm font-semibold mb-3 text-gray-300">Key Features</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${featuresList
            .map(
              (feature) => `
            <div class="flex items-start gap-2 text-sm text-gray-400">
              <i class="fa-solid fa-check text-green-500 text-xs mt-1"></i>
              <span>${feature.trim()}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
    `;
    content.appendChild(featuresSection);
  }

  // Show modal with animation
  const modal = document.getElementById("business-process-modal");
  modal.classList.remove("hidden");

  // Smooth fade-in
  setTimeout(() => {
    modal.style.opacity = "1";
  }, 10);
}

export function closeBusinessProcessModal() {
  const modal = document.getElementById("business-process-modal");

  // Smooth fade-out
  modal.style.opacity = "0";

  setTimeout(() => {
    modal.classList.add("hidden");
  }, 200);
}

// NEW FUNCTION: Show full evaluation in expanded view
export function showFullEvaluation(evaluationId) {
  const evaluation = state.businessProcessEvaluations.find(
    (e) => e.id === evaluationId
  );
  if (!evaluation) return;

  const vendor = state.vendors.find((v) => v.id === evaluation.vendorId);
  const bp = state.businessProcesses.find(
    (b) => b.id === evaluation.businessProcessId
  );

  // Create a full-screen evaluation modal
  const fullEvalModal = document.createElement("div");
  fullEvalModal.id = "full-evaluation-modal";
  fullEvalModal.className =
    "fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4";
  fullEvalModal.innerHTML = `
    <div class="bg-[#0F1220] border border-[#262A33] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
      <div class="sticky top-0 bg-[#0F1220] border-b border-[#262A33] px-5 py-4 flex items-center justify-between z-10">
        <div>
          <h3 class="font-semibold text-lg">${vendor?.name} - ${bp?.name}</h3>
          <div class="text-xs text-gray-400 mt-1">Comprehensive Business Process Evaluation</div>
        </div>
        <button onclick="document.getElementById('full-evaluation-modal').remove()" class="text-gray-400 hover:text-gray-200">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>
      
      <div class="p-6 space-y-6">
        <!-- Overall Fit -->
        <div>
          <div class="text-sm font-semibold mb-2">Overall Fit</div>
          <span class="px-3 py-1 text-sm rounded-md ${
            evaluation.overallFit === "excellent"
              ? "bg-green-600/20 text-green-400 border border-green-600/50"
              : evaluation.overallFit === "good"
              ? "bg-blue-600/20 text-blue-400 border border-blue-600/50"
              : "bg-yellow-600/20 text-yellow-400 border border-yellow-600/50"
          }">
            ${evaluation.overallFit.toUpperCase()}
          </span>
        </div>
        
        <!-- Key Products -->
        <div>
          <div class="text-sm font-semibold mb-2">Key Products</div>
          <div class="flex flex-wrap gap-2">
            ${evaluation.keyProducts
              .map(
                (p) =>
                  `<span class="px-2 py-1 text-xs rounded-md bg-[#1a1f35] border border-[#2B3140]">${p}</span>`
              )
              .join("")}
          </div>
        </div>
        
        <!-- Strengths -->
        <div>
          <div class="text-sm font-semibold mb-3 text-green-400">Strengths</div>
          <ul class="space-y-2">
            ${evaluation.strengths
              .map(
                (s) => `
              <li class="text-sm text-gray-300 flex items-start gap-2">
                <i class="fa-solid fa-plus text-green-500 text-xs mt-1"></i>
                <span>${s}</span>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
        
        <!-- Weaknesses -->
        <div>
          <div class="text-sm font-semibold mb-3 text-red-400">Weaknesses</div>
          <ul class="space-y-2">
            ${evaluation.weaknesses
              .map(
                (w) => `
              <li class="text-sm text-gray-300 flex items-start gap-2">
                <i class="fa-solid fa-minus text-red-500 text-xs mt-1"></i>
                <span>${w}</span>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
        
        <!-- Best Use Cases -->
        <div>
          <div class="text-sm font-semibold mb-3">Best Use Cases</div>
          <ul class="space-y-2">
            ${evaluation.bestUseCases
              .map(
                (uc) => `
              <li class="text-sm text-gray-300 flex items-start gap-2">
                <i class="fa-solid fa-star text-yellow-500 text-xs mt-1"></i>
                <span>${uc}</span>
              </li>
            `
              )
              .join("")}
          </ul>
        </div>
        
        <!-- Implementation Details -->
        <div class="grid grid-cols-3 gap-4 p-4 bg-[#0B0F1E] border border-[#262A33] rounded-lg">
          <div>
            <div class="text-xs text-gray-400 mb-1">Implementation Complexity</div>
            <div class="text-sm font-semibold">${
              evaluation.implementationComplexity
            }</div>
          </div>
          <div>
            <div class="text-xs text-gray-400 mb-1">Typical Timeline</div>
            <div class="text-sm font-semibold">${
              evaluation.typicalImplementationTime
            }</div>
          </div>
          <div>
            <div class="text-xs text-gray-400 mb-1">Total Cost of Ownership</div>
            <div class="text-sm font-semibold">${
              evaluation.totalCostOfOwnership
            }</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(fullEvalModal);
}
