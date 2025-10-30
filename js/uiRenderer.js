// js/uiRenderer.js
import { state } from "./dataStore.js";

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

export function applyDomainFilter() {
  // Domain filtering logic applied during render
  console.log("Domain filter applied:", state.activeDomain);
}

export function renderAllColumns() {
  console.log("🎨 Rendering all columns...");

  const columns = {
    crm: document.getElementById("source-systems-capabilities-container"),
    erp: document.getElementById("infrastructure-data-capabilities-container"),
    ai: document.getElementById("ai-platform-capabilities-container"),
  };

  Object.values(columns).forEach((el) => el && (el.innerHTML = ""));

  // Filter capabilities by active domain
  const caps = state.capabilities.filter((c) => {
    if (state.activeDomain === "ALL") return true;
    const bp = state.businessProcesses.find(
      (b) => b.id === c.businessProcessId
    );
    return (
      bp?.domain === state.activeDomain ||
      c.tags?.toUpperCase()?.includes(state.activeDomain)
    );
  });

  console.log("Filtered capabilities:", caps.length);

  // NEW COLUMN DISTRIBUTION LOGIC

  // Column 1: CRM - CRM capabilities AND cross-domain capabilities
  const crmCaps = caps.filter((c) => {
    const bp = state.businessProcesses.find(
      (b) => b.id === c.businessProcessId
    );
    return bp?.domain === "CRM" || c.tags?.includes("crm");
  });

  // Column 2: ERP - ERP capabilities AND cross-domain capabilities
  const erpCaps = caps.filter((c) => {
    const bp = state.businessProcesses.find(
      (b) => b.id === c.businessProcessId
    );
    return bp?.domain === "ERP" || c.tags?.includes("erp");
  });

  // Column 3: AI Layer - Empty for now (future use)
  const aiCaps = [];

  renderCapabilityGrid(columns.crm, crmCaps);
  renderCapabilityGrid(columns.erp, erpCaps);

  // Render empty state for AI column
  if (columns.ai) {
    columns.ai.innerHTML = `
      <div class="col-span-2 text-center py-12 text-gray-500 text-sm">
        <i class="fa-solid fa-robot text-4xl mb-3 opacity-30"></i>
        <p>AI capabilities coming soon</p>
      </div>
    `;
  }

  console.log("✅ Columns rendered:", {
    crm: crmCaps.length,
    erp: erpCaps.length,
    ai: aiCaps.length,
  });
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
