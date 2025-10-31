import {
  state,
  getBestProductPerVendorForProcess,
  getCapabilityCountForProductInProcess,
} from "./dataStore.js";

export function applyDomainFilter() {
  // Domain filtering logic applied during render
  console.log("Domain filter applied:", state.activeDomain);
}

export function renderVendorSelector() {
  const select = document.getElementById("vendor-select");
  if (!select) return;

  select.innerHTML = `<option value="">No Vendor Selected</option>`;

  state.vendors.forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v.id;
    opt.textContent = v.name;
    select.appendChild(opt);
  });

  console.log("✅ Vendor selector rendered:", state.vendors.length, "vendors");
}

export function renderAllColumns() {
  console.log("🎨 Rendering all columns (Business Process view)...");

  const columns = {
    crm: document.getElementById("source-systems-capabilities-container"),
    erp: document.getElementById("infrastructure-data-capabilities-container"),
    ai: document.getElementById("ai-platform-capabilities-container"),
  };

  Object.values(columns).forEach((el) => el && (el.innerHTML = ""));

  // Filter business processes by active domain
  let processes = state.businessProcesses;
  if (state.activeDomain !== "ALL") {
    processes = processes.filter((bp) => bp.domain === state.activeDomain);
  }

  // Split by domain
  const crmProcesses = processes.filter((bp) => bp.domain === "CRM");
  const erpProcesses = processes.filter((bp) => bp.domain === "ERP");

  renderBusinessProcessGrid(columns.crm, crmProcesses);
  renderBusinessProcessGrid(columns.erp, erpProcesses);

  // AI Layer empty state
  if (columns.ai) {
    columns.ai.innerHTML = `
      <div class="col-span-2 text-center py-12 text-gray-500 text-sm">
        <i class="fa-solid fa-robot text-4xl mb-3 opacity-30"></i>
        <p>AI capabilities coming soon</p>
      </div>
    `;
  }

  console.log("✅ Columns rendered:", {
    crm: crmProcesses.length,
    erp: erpProcesses.length,
  });
}

function renderBusinessProcessGrid(container, processes) {
  if (!container) return;

  if (processes.length === 0) {
    container.innerHTML = `
      <div class="col-span-2 text-center py-12 text-gray-500 text-sm">
        <i class="fa-solid fa-filter text-3xl mb-3 opacity-30"></i>
        <p>No business processes for this domain</p>
      </div>
    `;
    return;
  }

  processes.forEach((bp) => {
    const card = document.createElement("div");
    card.className = [
      "bg-[#0B0F1E] border border-[#262A33] rounded-lg p-4",
      "transition hover:shadow-lg hover:shadow-black/30",
    ].join(" ");

    // Get best products per vendor for this process
    const bestProducts = getBestProductPerVendorForProcess(bp.id);

    card.innerHTML = `
      <div class="mb-3">
        <h3 class="font-semibold text-base">${bp.name}</h3>
        <p class="text-xs text-gray-400 mt-1">${bp.description}</p>
      </div>
      
      <div class="space-y-2">
        ${
          bestProducts.length > 0
            ? renderVendorBadges(bestProducts, bp.id)
            : '<span class="text-xs text-gray-500">No products available</span>'
        }
      </div>
    `;

    container.appendChild(card);
  });
}

function renderVendorBadges(products, businessProcessId) {
  return products
    .map((product) => {
      const vendor = state.vendors.find((v) => v.id === product.vendorId);
      const capCount = getCapabilityCountForProductInProcess(
        product.id,
        businessProcessId
      );

      return `
      <button 
        onclick="window.openBusinessProcessDetail('${
          product.id
        }', '${businessProcessId}')"
        class="w-full flex items-center justify-between px-3 py-2 rounded-md border border-[#2B3140] bg-[#111628] hover:bg-[#1a1f35] transition text-left"
      >
        <div class="flex-1">
          <div class="text-sm font-medium">${vendor?.name || "Unknown"}</div>
          <div class="text-xs text-gray-400">${product.name}</div>
        </div>
        <div class="text-xs text-gray-500">${capCount} cap${
        capCount !== 1 ? "s" : ""
      }</div>
      </button>
    `;
    })
    .join("");
}

function renderCapabilityGrid(container, capabilities) {
  if (!container) return;

  capabilities.forEach((cap) => {
    const card = document.createElement("button");
    card.className = [
      "group text-left w-full bg-[#0B0F1E] border border-[#262A33] rounded-lg p-3 min-h-[90px]",
      "transition transform hover:-translate-y-1 hover:shadow-lg hover:shadow-black/30",
    ].join(" ");
    card.onclick = () => window.openProductCatalogForCapability(cap.id);

    const assignedProduct = resolveAssignedProduct(cap.id);

    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="font-semibold text-base">${cap.name}</div>
          <div class="text-xs text-gray-400 mt-1">${
            cap.valueProposition || ""
          }</div>
        </div>
        ${
          assignedProduct
            ? renderMiniBadge(assignedProduct)
            : '<span class="text-[10px] text-gray-500 ml-2">Unassigned</span>'
        }
      </div>
    `;
    container.appendChild(card);
  });
}

function renderMiniBadge(product) {
  const vendor = state.vendors.find((v) => v.id === product.vendorId);
  return `
    <span class="inline-flex items-center text-[10px] px-2 py-1 rounded-md border border-[#2B3140] bg-[#111628] text-gray-300 ml-2 whitespace-nowrap">
      ${vendor?.name || "Unknown"} • ${product.name}
    </span>
  `;
}

function resolveAssignedProduct(capabilityId) {
  // Check if there's a manual assignment
  if (state.assignments[capabilityId]) {
    return state.products.find((p) => p.id === state.assignments[capabilityId]);
  }

  // If vendor is selected, show matching product
  if (!state.selectedVendorId) return null;

  return (
    state.products.find(
      (p) =>
        p.vendorId === state.selectedVendorId &&
        (p.capabilityIds || []).includes(capabilityId)
    ) || null
  );
}
