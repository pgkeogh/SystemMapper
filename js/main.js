// js/main.js
import {
  state,
  ensureBootstrapData,
  getProductsForBusinessProcess,
  getBestProductPerVendorForProcess,
  getCapabilitiesForProductInProcess,
  getCapabilityCountForProductInProcess,
  getVendorProductsForProcess,
  getVendorsForBusinessProcess,
} from "./dataStore.js";
import {
  renderAllColumns,
  renderVendorSelector,
  applyDomainFilter,
} from "./uiRenderer.js";
import {
  openProductCatalogForCapability,
  closeProductCatalog,
  closeEvalPanel,
  openBusinessProcessDetail,
  closeBusinessProcessModal,
  initModals,
  showFullEvaluation,
} from "./modals.js";
import { loadAllCSVsIfPresent } from "./csvHandler.js";
import { initializeDataEditorListeners } from "./dataEditor.js";

window.ui = {}; // debug access

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 App initializing...");

  // Load data (LocalStorage > CSVs > Fallback bootstrap)
  await loadAllCSVsIfPresent();
  ensureBootstrapData();

  console.log("📊 Data loaded:", {
    businessProcesses: state.businessProcesses.length,
    capabilities: state.capabilities.length,
    vendors: state.vendors.length,
    products: state.products.length,
    evaluations: state.productEvaluations.length,
  });

  // Initial rendering
  renderVendorSelector();
  renderAllColumns();

  // Event wiring
  const vendorSelect = document.getElementById("vendor-select");
  vendorSelect?.addEventListener("change", () => {
    state.selectedVendorId = vendorSelect.value || null;
    console.log("Vendor selected:", state.selectedVendorId);
    renderAllColumns();
  });

  const domainFilter = document.getElementById("domain-filter");
  domainFilter?.addEventListener("change", () => {
    state.activeDomain = domainFilter.value;
    console.log("Domain filter:", state.activeDomain);
    applyDomainFilter();
    renderAllColumns();
  });

  document
    .getElementById("manage-data-button")
    ?.addEventListener("click", () => {
      document
        .getElementById("data-editor-container")
        ?.classList.remove("hidden");
    });

  document
    .getElementById("save-close-data-editor")
    ?.addEventListener("click", () => {
      document.getElementById("data-editor-container")?.classList.add("hidden");
    });

  document.getElementById("clear-storage")?.addEventListener("click", () => {
    if (confirm("Clear all local storage and reload?")) {
      localStorage.clear();
      location.reload();
    }
  });

  initModals();

  // Wire up business process modal close buttons
  document
    .getElementById("close-bp-modal")
    ?.addEventListener("click", closeBusinessProcessModal);
  document
    .getElementById("close-bp-modal-button")
    ?.addEventListener("click", closeBusinessProcessModal);
  document
    .getElementById("bp-modal-backdrop")
    ?.addEventListener("click", closeBusinessProcessModal);

  // Expose helpers globally (keep these for onclick handlers in HTML)
  window.openProductCatalogForCapability = openProductCatalogForCapability;
  window.closeProductCatalog = closeProductCatalog;
  window.closeEvalPanel = closeEvalPanel;
  window.openBusinessProcessDetail = openBusinessProcessDetail;
  window.closeBusinessProcessModal = closeBusinessProcessModal;
  window.showFullEvaluation = showFullEvaluation;

  // Namespace everything else under window.ui
  window.ui = {
    state,
    helpers: {
      getProductsForBusinessProcess,
      getBestProductPerVendorForProcess,
      getCapabilitiesForProductInProcess,
      getCapabilityCountForProductInProcess,
      getVendorProductsForProcess,
      getVendorsForBusinessProcess,
    },
  };

  console.log("💡 Access data via: window.ui.state");
  console.log(
    "💡 Access helpers via: window.ui.helpers.getProductsForBusinessProcess(...)"
  );

  initializeDataEditorListeners();

  console.log("✅ App ready");
});
