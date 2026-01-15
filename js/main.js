/* DOM REFERENCES */
const modeToggleBtn = document.getElementById("mode-toggle-button");
const modeLockIcon = document.getElementById("mode-lock-icon")
const modeText = document.getElementById("mode-text")

const searchInput = document.getElementById("search-input");
const grid = document.getElementById("product-grid");

const barcodeOverlay = document.getElementById("barcode-overlay")
const barcodeLarge = document.getElementById("barcode-large");
const barcodeBackBtn = document.getElementById("barcode-back-button")

const addBtn = document.getElementById("add-btn");
const productOverlay = document.getElementById("product-form-overlay");
const productNameInput = document.getElementById("product-name");
const productBarcodeInput = document.getElementById("product-code");
const trashBtn = document.getElementById("trash-icon");
const saveBtn = document.getElementById("save-product");
const cancelBtn = document.getElementById("cancel-product");

const deletionPrompt = document.getElementById("deletion-prompt");
const deleteProductName = document.getElementById("delete-product-name");
const confirmDeleteBtn = document.getElementById("delete-product");
const cancelDeleteBtn = document.getElementById("cancel-delete-product");

const toast = document.getElementById("toast");
const errorMessage = document.getElementById("error-message");

/* STORAGE API */
const Storage = {
    getProducts: () => JSON.parse(localStorage.getItem("products") || "[]"),
    saveProducts: (productsArray) => localStorage.setItem("products", JSON.stringify(productsArray)),
    clear: () => localStorage.removeItem("products")
};

/* LOAD HELPER FUNCTION */
// load JSON products only once in localStorage 
// (which becomes single source of truth afterwards)
async function loadProducts() {
    const stored = Storage.getProducts();

    if (stored.length > 0) {
        return stored;
    } else {
        const res = await fetch("products.json");
        const baseProducts = await res.json();
        const processed = baseProducts.map(p => ({
            ...p,
            id: crypto.randomUUID(),
            visible: true,
            searchName: p.name.toLowerCase()
        }));
        Storage.saveProducts(processed);
        return processed;
    }
}

/* APP STATE */
let products = [];
let isEditMode = false;
let overlayMode = null;
let editingProductId = null;


// ----------------------------
// Apply edit mode UI
// ----------------------------
// Lock/Unlock SVGs
const LOCKED_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
<path fill="white" d="M5 22h14a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V7A5 5 0 0 0 7 7v2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2zm7-4.5a2 2 0 1 1 2-2 2 2 0 0 1-2 2zM9 9V7a3 3 0 0 1 6 0v2H9z"/></svg>`;

const UNLOCKED_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
<path fill="white" d="M21 11a2 2 0 0 0-2-2h-2V7a5 5 0 0 0-9.331-2.5 1 1 0 0 0 1.731 1A3 3 0 0 1 15 7v2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zm-9 6.5a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"/></svg>`;

// change global UI elements
function applyEditModeUI() {
    addBtn.classList.toggle("hidden", !isEditMode);
    modeText.textContent = isEditMode ? "Terminer" : "Modifier"
    modeLockIcon.innerHTML = isEditMode ? UNLOCKED_SVG : LOCKED_SVG;
}

// event listener
modeToggleBtn.onclick = () => {
    isEditMode = !isEditMode;
    applyEditModeUI();
    searchInput.value = "";
    render(products);
}


/* INITIALIZING FUNCTION */
async function init() {
    products = await loadProducts();
    render(products);
}

/* SORTING ALPHABETICALLY */
function sortProductsByName(list) {
    return [...list].sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
    );
}



/* RENDERING */
function render(list) {
    grid.innerHTML = "";

    const sortedList = sortProductsByName(list);


    for (const product of sortedList) {
        if (!isEditMode && product.visible === false) continue;

        // product-card -> external div
        const productCard = document.createElement("article");
        productCard.className = "product-card";
        productCard.dataset.id = product.id;
        grid.appendChild(productCard);

        // product-name
        const productName = document.createElement("div");
        productName.className = "product-name";
        productName.textContent = product.name;
        productCard.appendChild(productName);

        // product-barcode
        const barcodeWrap = document.createElement("div");
        barcodeWrap.className = "product-barcode";
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        barcodeWrap.appendChild(svg);
        productCard.appendChild(barcodeWrap);

        JsBarcode(svg, product.barcode, {
            format: "CODE128",
            width: 2,
            height: 60,
            displayValue: true
        });

        if (isEditMode) {
            const visibilityBtn = document.createElement("button");
            visibilityBtn.className = "visibility-toggle";
            visibilityBtn.setAttribute("aria-label", "Toggle visibility");

            if (product.visible) {
                visibilityBtn.classList.add("on");
            }

            visibilityBtn.onclick = (e) => {
                e.stopPropagation(); // prevent barcode click
                product.visible = !product.visible;
                Storage.saveProducts(products);
                render(products);
            };

            productCard.appendChild(visibilityBtn);

        }

    }
}

/* BARCODE OVERLAY */
function showBarcode(id) {
    const product = products.find(p => p.id === id);
    if (!product) return; // safeguard

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    barcodeLarge.appendChild(svg);

    JsBarcode(svg, product.barcode, {
        format: "CODE128",
        width: 2,
        height: 200
    })

    // show overlay
    barcodeOverlay.style.display = "flex";

}

function hideBarcode() {
    barcodeLarge.innerHTML = "";
    barcodeOverlay.style.display = "none";
}

/* EDIT OVERLAY */
function openEditOverlay(id) {
    overlayMode = "edit";
    editingProductId = id;
    const product = products.find(p => p.id === id);
    if (!product) return;

    // show overlay
    productOverlay.style.display = "flex";
    trashBtn.style.display = "block"
    productNameInput.value = product.name;
    productBarcodeInput.value = product.barcode;
}

function promptForDeletion(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    deletionPrompt.style.display = "flex";
    deleteProductName.textContent = product.name;
}

function closeDeletionPrompt() {
    deletionPrompt.style.display = "none";
}

function closeProductOverlay() {
    overlayMode = null;
    editingProductId = null;
    productOverlay.style.display = "none";
    trashBtn.style.display = "none";
    productNameInput.value = "";
    productBarcodeInput.value = "";
    clearInputErrors();
}


/* ADD OVERLAY */
function openAddOverlay() {
    // show overlay
    overlayMode = "add";
    productOverlay.style.display = "flex";
    trashBtn.style.display = "none";
}


/* EVENT LISTENER FOR OVERLAYS */
grid.addEventListener("click", e => {
    const card = e.target.closest(".product-card");
    if (!card) return;

    const id = card.dataset.id;
    if (isEditMode) {
        openEditOverlay(id);
    } else {
        showBarcode(id);
    }
});

trashBtn.addEventListener(
    "click",
    () => {
        if (editingProductId) {
            productOverlay.style.display = "none";
            promptForDeletion(editingProductId);
        }
    }
);

confirmDeleteBtn.addEventListener(
    "click",
    () => {
        if (editingProductId) {
            deleteProduct(editingProductId);
            closeDeletionPrompt();
            closeProductOverlay();
        }
    }
);

cancelDeleteBtn.addEventListener(
    "click",
    () => {
        closeDeletionPrompt();
        productOverlay.style.display = "flex";
    }
)

saveBtn.addEventListener("click", () => {
    clearInputErrors();
    
    const name = productNameInput.value.trim();
    const barcode = productBarcodeInput.value.trim();
    
    // Validation - ONLY show toasts for errors
    if (!name) {
        productNameInput.classList.add("error");
        productNameInput.focus();
        showToast("Le nom du produit est requis");
        return;
    }
    
    if (!barcode) {
        productBarcodeInput.classList.add("error");
        productBarcodeInput.focus();
        showToast("Le code-barres est requis");
        return;
    }
    
    // Check for duplicate barcode when adding
    if (overlayMode === "add" && products.some(p => p.barcode === barcode)) {
        productBarcodeInput.classList.add("error");
        productBarcodeInput.focus();
        showToast("Ce code-barres existe déjà!");
        return;
    }

    // Success - NO toast, just do the action
    if (overlayMode === "edit") {
        editProduct(editingProductId, name, barcode);
    }

    if (overlayMode === "add") {
        addProduct(name, barcode);
    }

    closeProductOverlay();
});

addBtn.addEventListener("click", e => openAddOverlay());

barcodeBackBtn.addEventListener("click", e => hideBarcode());


cancelBtn.addEventListener("click", e => closeProductOverlay());


productNameInput.addEventListener("focus", () => {
    productNameInput.classList.remove("error");
});

productBarcodeInput.addEventListener("focus", () => {
    productBarcodeInput.classList.remove("error");
});


/* SEARCH */
searchInput.addEventListener("input", () => {
    const query = searchInput.value.toLowerCase();
    if (query === "") {
        render(products);
    } else {
        render(products.filter(p => p.searchName.includes(query)));
    }
});

/* HELPER FUNCTIONS */
function addProduct(name, barcode) {
    const newProduct = {
        name,
        barcode,
        id: crypto.randomUUID(),
        visible: true,
        searchName: name.toLowerCase()
    };
    products.push(newProduct);
    Storage.saveProducts(products);
    render(products);
}

function editProduct(id, name, barcode) { // Remove = false
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return;

    // Always update both since we're always passing both from saveBtn
    products[index].name = name;
    products[index].searchName = name.toLowerCase();
    products[index].barcode = barcode;

    Storage.saveProducts(products);
    render(products);
}

function deleteProduct(id) {
    products = products.filter(p => p.id !== id);
    Storage.saveProducts(products);
    render(products);
}

/* CLEAR INPUT ERRORS */
function clearInputErrors() {
    productNameInput.classList.remove("error");
    productBarcodeInput.classList.remove("error");
}

function showToast(message) {
    errorMessage.textContent = message;
    toast.classList.remove("hidden");
    
    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 10);
    
    // Hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.classList.add("hidden"), 300);
    }, 3000);
}


/* LAUNCH */
init();

/* service worker */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/pertes-farm/sw.js");
}


