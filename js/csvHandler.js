// js/csvHandler.js
import { state } from "./dataStore.js";

export async function loadAllCSVsIfPresent() {
  const forceCSV = new URLSearchParams(location.search).get("source") === "csv";

  if (!forceCSV) {
    console.log(
      "📦 Using bootstrap data (add ?source=csv to load from CSV files)"
    );
    return;
  }

  console.log("📂 Loading data from CSV files...");

  try {
    // Load all CSV files in parallel
    const [
      businessProcesses,
      capabilities,
      vendors,
      products,
      evaluations,
      businessProcessEvaluations,
    ] = await Promise.all([
      loadCSV("/data/business_processes.csv", parseBusinessProcesses),
      loadCSV("/data/capabilities.csv", parseCapabilities),
      loadCSV("/data/vendors.csv", parseVendors),
      loadCSV("/data/platform_products.csv", parseProducts),
      loadCSV("/data/product_evaluations.csv", parseEvaluations),
      loadCSV(
        "/data/business_process_evaluations.csv",
        parseBusinessProcessEvaluations
      ),
    ]);

    // Merge into state
    if (businessProcesses) state.businessProcesses = businessProcesses;
    if (capabilities) state.capabilities = capabilities;
    if (vendors) state.vendors = vendors;
    if (products) state.products = products;
    if (evaluations) state.productEvaluations = evaluations;
    if (businessProcessEvaluations)
      state.businessProcessEvaluations = businessProcessEvaluations;

    console.log("✅ CSV data loaded successfully:", {
      businessProcesses: state.businessProcesses.length,
      capabilities: state.capabilities.length,
      vendors: state.vendors.length,
      products: state.products.length,
      evaluations: state.productEvaluations.length,
      businessProcessEvaluations: state.businessProcessEvaluations.length,
    });
  } catch (err) {
    console.error("❌ CSV load failed, using bootstrap data", err);
  }
}

// Generic CSV loader using PapaParse
async function loadCSV(url, parser) {
  return new Promise((resolve, reject) => {
    console.log(`  Loading ${url}...`);

    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn(`  ⚠️ Parsing warnings for ${url}:`, results.errors);
        }
        console.log(`  ✅ Loaded ${url}: ${results.data.length} rows`);
        resolve(parser(results.data));
      },
      error: (error) => {
        console.error(`  ❌ Failed to load ${url}:`, error);
        reject(error);
      },
    });
  });
}

// Parsers for each CSV type

function parseBusinessProcesses(rows) {
  return rows
    .map((r) => ({
      id: r.id?.trim(),
      name: r.name?.trim(),
      description: r.description?.trim() || "",
      order: parseInt(r.order) || 0,
      domain: r.domain?.trim(),
    }))
    .filter((r) => r.id); // Remove rows without ID
}

function parseCapabilities(rows) {
  return rows
    .map((r) => ({
      id: r.id?.trim(),
      name: r.name?.trim(),
      businessProcessId: r.businessProcessId?.trim(),
      description: r.description?.trim() || "",
      valueProposition: r.valueProposition?.trim() || "",
      processTypes: r.processTypes?.trim() || "",
      color: r.color?.trim() || "blue",
      order: parseInt(r.order) || 0,
      tags: r.tags?.trim() || "",
    }))
    .filter((r) => r.id);
}

function parseVendors(rows) {
  return rows
    .map((r) => ({
      id: r.id?.trim(),
      name: r.name?.trim(),
      brandColor: r.brandColor?.trim() || "#000000",
      marketPosition: r.marketPosition?.trim() || "",
      bestFor: r.bestFor?.trim() || "",
      website: r.website?.trim() || "",
      targetCompanySize: r.targetCompanySize?.trim() || "",
      overallStrengths: r.overallStrengths?.trim() || "",
      overallWeaknesses: r.overallWeaknesses?.trim() || "",
      domains: r.domains?.trim() || "",
    }))
    .filter((r) => r.id);
}

function parseProducts(rows) {
  return rows
    .map((r) => ({
      id: r.id?.trim(),
      name: r.name?.trim(),
      vendorId: r.vendorId?.trim(),
      description: r.description?.trim() || "",
      productType: r.productType?.trim() || "module",
      capabilityIds: r.capabilityIds?.trim()
        ? r.capabilityIds.split(",").map((id) => id.trim())
        : [],
      features: r.features?.trim() || "",
      pricingTier: r.pricingTier?.trim() || "",
      marketPosition: r.marketPosition?.trim() || "",
      performanceMetrics: r.performanceMetrics?.trim() || "",
      deploymentModels: r.deploymentModels?.trim() || "",
      integrations: r.integrations?.trim() || "",
      domains: r.domains?.trim() || "",
    }))
    .filter((r) => r.id);
}

function parseEvaluations(rows) {
  return rows
    .map((r) => ({
      id: r.id?.trim(),
      productId: r.productId?.trim(),
      capabilityId: r.capabilityId?.trim(),
      goodFor: r.goodFor?.trim()
        ? r.goodFor.split("|").map((s) => s.trim())
        : [],
      notIdealFor: r.notIdealFor?.trim()
        ? r.notIdealFor.split("|").map((s) => s.trim())
        : [],
      bestUseCases: r.bestUseCases?.trim()
        ? r.bestUseCases.split("|").map((s) => s.trim())
        : [],
      specialFeatures: r.specialFeatures?.trim()
        ? r.specialFeatures.split("|").map((s) => s.trim())
        : [],
      competitiveAdvantages: r.competitiveAdvantages?.trim()
        ? r.competitiveAdvantages.split("|").map((s) => s.trim())
        : [],
      competitiveDisadvantages: r.competitiveDisadvantages?.trim()
        ? r.competitiveDisadvantages.split("|").map((s) => s.trim())
        : [],
      implementationComplexity: r.implementationComplexity?.trim() || "",
      typicalImplementationTime: r.typicalImplementationTime?.trim() || "",
      confidence: r.confidence?.trim() || "",
    }))
    .filter((r) => r.id);
}
function parseBusinessProcessEvaluations(rows) {
  return rows
    .map((r) => ({
      id: r.id?.trim(),
      vendorId: r.vendorId?.trim(),
      businessProcessId: r.businessProcessId?.trim(),
      overallFit: r.overallFit?.trim() || "",
      keyProducts: r.keyProducts?.trim()
        ? r.keyProducts.split("|").map((s) => s.trim())
        : [],
      goodFor: r.goodFor?.trim()
        ? r.goodFor.split("|").map((s) => s.trim())
        : [],
      notIdealFor: r.notIdealFor?.trim()
        ? r.notIdealFor.split("|").map((s) => s.trim())
        : [],
      bestUseCases: r.bestUseCases?.trim()
        ? r.bestUseCases.split("|").map((s) => s.trim())
        : [],
      strengths: r.strengths?.trim()
        ? r.strengths.split("|").map((s) => s.trim())
        : [],
      weaknesses: r.weaknesses?.trim()
        ? r.weaknesses.split("|").map((s) => s.trim())
        : [],
      implementationComplexity: r.implementationComplexity?.trim() || "",
      typicalImplementationTime: r.typicalImplementationTime?.trim() || "",
      totalCostOfOwnership: r.totalCostOfOwnership?.trim() || "",
      confidence: r.confidence?.trim() || "",
    }))
    .filter((r) => r.id);
}
