// script.js

// --- Global Application State ---
const appState = {
    isLoggedIn: false,
    inventory: [],
    sales: [],
    recoveries: [],
    expenses: [],
    activeTab: 'inventory', // 'inventory', 'billing', 'reports', 'search'
    activeSection: 'daily', // For reports: 'daily', 'recoveries', 'expenses'

    // States for forms and filters
    newItem: { name: '', batch: '', quantity: '', purchasePrice: '', sellingPrice: '', expiryDate: '' },
    newRecovery: { date: new Date().toISOString().split('T')[0], amount: '', source: '', description: '' },
    newExpense: { date: new Date().toISOString().split('T')[0], amount: '', category: '', description: '' },
    searchTerm: '',
    filteredInventory: [], // For billing section search
    billItems: [],
    reportDate: new Date().toISOString().split('T')[0],
    startDate: '',
    endDate: '',
    filteredSales: [], // For search reports
    filteredRecoveries: [], // For search reports
    filteredExpenses: [], // For search reports

    message: '',
    messageType: '',
};

// --- State Management and Local Storage Utilities ---

function setState(newState, render = true) {
    Object.assign(appState, newState);
    if (render) {
        renderApp();
    }
}

function loadStateFromLocalStorage() {
    try {
        appState.inventory = JSON.parse(localStorage.getItem('ghazi_inventory')) || [];
        appState.sales = JSON.parse(localStorage.getItem('ghazi_sales')) || [];
        appState.recoveries = JSON.parse(localStorage.getItem('ghazi_recoveries')) || [];
        appState.expenses = JSON.parse(localStorage.getItem('ghazi_expenses')) || [];
    } catch (error) {
        console.error("Failed to load state from localStorage:", error);
        // Reset to empty arrays if parsing fails
        appState.inventory = [];
        appState.sales = [];
        appState.recoveries = [];
        appState.expenses = [];
    }
}

function saveStateToLocalStorage() {
    localStorage.setItem('ghazi_inventory', JSON.stringify(appState.inventory));
    localStorage.setItem('ghazi_sales', JSON.stringify(appState.sales));
    localStorage.setItem('ghazi_recoveries', JSON.stringify(appState.recoveries));
    localStorage.setItem('ghazi_expenses', JSON.stringify(appState.expenses));
}

// --- UI Message Handling ---

function displayMessage(msg, type, duration = 3000, targetElement = null) {
    if (!targetElement) {
        const globalMessageElement = document.getElementById('app-global-message-area');
        if (globalMessageElement) {
             targetElement = globalMessageElement;
        } else {
            console.warn("Global message area not found. Message will not be displayed:", msg);
            return;
        }
    }

    targetElement.textContent = msg;
    targetElement.className = `text-center py-2 rounded-md mb-4 ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;

    if (msg) {
        setTimeout(() => {
            if (targetElement) {
                targetElement.textContent = '';
                targetElement.className = '';
            }
            setState({ message: '', messageType: '' }, false); // Clear global state if it was set
        }, duration);
    }
}

// --- Component Rendering Functions ---

function renderLoginPage(parentEl) {
    parentEl.className = "bg-gray-100 p-8 rounded-lg shadow-xl w-96 border border-gray-300 flex flex-col justify-center items-center h-full"; // Centered login
    parentEl.innerHTML = `
        <h2 class="text-3xl font-bold text-center mb-8 text-gray-800">Ghazi Store Login</h2>
        <div class="w-full">
            <label htmlFor="password" class="block text-gray-700 text-sm font-semibold mb-2">
                Password:
            </label>
            <input
                type="password"
                id="password"
                class="desktop-input w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none"
                value=""
            />
        </div>
        <p id="login-error" class="text-red-500 text-sm mt-4 mb-6"></p>
        <button
            id="login-button"
            class="desktop-btn w-full font-bold py-2 px-4 rounded-md focus:outline-none"
        >
            Login
        </button>
        <p class="text-center text-gray-500 text-xs mt-8">
            &copy; 2025 Ghazi Veterinary and Medical Store. All rights reserved.
        </p>
    `;

    const passwordInput = parentEl.querySelector('#password');
    const loginButton = parentEl.querySelector('#login-button');
    const loginError = parentEl.querySelector('#login-error');

    const handleLogin = () => {
        if (passwordInput.value === 'Ghazi786') {
            setState({ isLoggedIn: true, activeTab: 'inventory' }); // Redirect to inventory after login
        } else {
            loginError.textContent = 'Incorrect password. Please try again.';
        }
    };

    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
}

function renderMainDesktopApp(parentEl) {
    parentEl.className = "flex flex-col w-full h-full bg-gray-100 desktop-app-container"; // Updated class for desktop look
    parentEl.innerHTML = `
        <div class="flex items-center justify-between p-4 bg-gray-200 border-b border-gray-300 shadow-sm">
            <div class="flex items-center">
                <span class="text-xl font-bold text-gray-800">Ghazi Store - Materials Detail</span>
            </div>
            </div>

        <div class="flex items-center p-3 bg-gray-100 border-b border-gray-200 shadow-inner">
            <nav class="flex space-x-3">
                <button id="nav-inventory" class="desktop-btn px-5 py-2 rounded flex flex-col items-center">
                    <img src="https://img.icons8.com/ios-filled/24/ffffff/box.png" alt="Inventory" class="mb-1"/>
                    Inventory
                </button>
                <button id="nav-billing" class="desktop-btn px-5 py-2 rounded flex flex-col items-center">
                    <img src="https://img.icons8.com/ios-filled/24/ffffff/bill.png" alt="Billing" class="mb-1"/>
                    Billing
                </button>
                <button id="nav-daily-reports" class="desktop-btn px-5 py-2 rounded flex flex-col items-center">
                    <img src="https://img.icons8.com/ios-filled/24/ffffff/bar-chart.png" alt="Reports" class="mb-1"/>
                    Daily Reports
                </button>
                <button id="nav-search-records" class="desktop-btn px-5 py-2 rounded flex flex-col items-center">
                    <img src="https://img.icons8.com/ios-filled/24/ffffff/search.png" alt="Search" class="mb-1"/>
                    Search Records
                </button>
            </nav>
            <div class="flex-grow"></div>
            <button id="logout-button" class="desktop-btn red px-5 py-2 rounded">Logout</button>
        </div>

        <div class="flex flex-1 overflow-hidden bg-gray-50">
            <div class="w-48 bg-gray-200 border-r border-gray-300 p-4 flex flex-col space-y-2 shadow-inner-right">
                 <button id="sidebar-inventory" class="desktop-nav-btn py-2 px-3 rounded text-left ${appState.activeTab === 'inventory' ? 'active' : ''}">Inventory</button>
                 <button id="sidebar-billing" class="desktop-nav-btn py-2 px-3 rounded text-left ${appState.activeTab === 'billing' ? 'active' : ''}">Billing</button>
                 <button id="sidebar-reports" class="desktop-nav-btn py-2 px-3 rounded text-left ${appState.activeTab === 'reports' ? 'active' : ''}">Daily Reports</button>
                 <button id="sidebar-search" class="desktop-nav-btn py-2 px-3 rounded text-left ${appState.activeTab === 'search' ? 'active' : ''}">Search Records</button>
                 </div>

            <div id="main-content-area" class="flex-1 p-6 overflow-auto bg-white">
                <p id="app-global-message-area" class="text-center py-2 rounded-md mb-4"></p>
                </div>
        </div>
    `;

    const mainContentArea = parentEl.querySelector('#main-content-area');
    const logoutButton = parentEl.querySelector('#logout-button');

    // Attach event listeners for main navigation buttons (top bar)
    parentEl.querySelector('#nav-inventory').addEventListener('click', () => setState({ activeTab: 'inventory' }));
    parentEl.querySelector('#nav-billing').addEventListener('click', () => setState({ activeTab: 'billing' }));
    parentEl.querySelector('#nav-daily-reports').addEventListener('click', () => setState({ activeTab: 'reports' }));
    parentEl.querySelector('#nav-search-records').addEventListener('click', () => setState({ activeTab: 'search' }));

    // Attach event listeners for sidebar navigation
    parentEl.querySelector('#sidebar-inventory').addEventListener('click', () => setState({ activeTab: 'inventory' }));
    parentEl.querySelector('#sidebar-billing').addEventListener('click', () => setState({ activeTab: 'billing' }));
    parentEl.querySelector('#sidebar-reports').addEventListener('click', () => setState({ activeTab: 'reports' }));
    parentEl.querySelector('#sidebar-search').addEventListener('click', () => setState({ activeTab: 'search' }));


    logoutButton.addEventListener('click', () => {
        setState({ isLoggedIn: false, activeTab: 'inventory' }); // Reset tab on logout
    });

    // Render content based on activeTab
    switch (appState.activeTab) {
        case 'inventory':
            renderInventoryManager(mainContentArea);
            break;
        case 'billing':
            renderBillingSection(mainContentArea);
            break;
        case 'reports':
            renderFinancialReports(mainContentArea);
            break;
        case 'search':
            renderSearchReports(mainContentArea);
            break;
        default:
            mainContentArea.innerHTML = '<h2 class="text-2xl font-bold text-gray-700">Welcome to Ghazi Veterinary and Medical Store!</h2>';
            break;
    }
}

function renderInventoryManager(parentEl) {
    parentEl.innerHTML = `
        <div class="flex h-full border border-gray-300 rounded-md overflow-hidden bg-gray-50 shadow-md">
            <div class="w-2/5 p-6 border-r border-gray-300 bg-gray-100 overflow-y-auto">
                <h3 class="text-xl font-semibold mb-6 text-gray-800">Material Details</h3>
                <div class="space-y-4">
                    <div>
                        <label for="itemName" class="block text-gray-700 text-sm font-semibold mb-1">Name:</label>
                        <input type="text" id="itemName" name="name" value="${appState.newItem.name}"
                            class="desktop-input w-full p-2 rounded-sm" />
                    </div>
                    <div>
                        <label for="itemBatch" class="block text-gray-700 text-sm font-semibold mb-1">Batch Number:</label>
                        <input type="text" id="itemBatch" name="batch" value="${appState.newItem.batch}"
                            class="desktop-input w-full p-2 rounded-sm" />
                    </div>
                    <div>
                        <label for="itemQuantity" class="block text-gray-700 text-sm font-semibold mb-1">Quantity:</label>
                        <input type="number" id="itemQuantity" name="quantity" value="${appState.newItem.quantity}"
                            class="desktop-input w-full p-2 rounded-sm" />
                    </div>
                    <div>
                        <label for="itemPurchasePrice" class="block text-gray-700 text-sm font-semibold mb-1">Purchase Price (per unit):</label>
                        <input type="number" id="itemPurchasePrice" name="purchasePrice" value="${appState.newItem.purchasePrice}"
                            class="desktop-input w-full p-2 rounded-sm" />
                    </div>
                    <div>
                        <label for="itemSellingPrice" class="block text-gray-700 text-sm font-semibold mb-1">Selling Price (per unit):</label>
                        <input type="number" id="itemSellingPrice" name="sellingPrice" value="${appState.newItem.sellingPrice}"
                            class="desktop-input w-full p-2 rounded-sm" />
                    </div>
                    <div>
                        <label for="itemExpiryDate" class="block text-gray-700 text-sm font-semibold mb-1">Expiry Date (Compulsory):</label>
                        <input type="date" id="itemExpiryDate" name="expiryDate" value="${appState.newItem.expiryDate}"
                            class="desktop-input w-full p-2 rounded-sm" />
                    </div>
                </div>
                <p id="inventory-message-area" class="text-center py-2 rounded-md mt-6"></p>
                <div class="flex space-x-2 mt-6">
                    <button id="addItemButton" class="desktop-btn flex-1 font-bold py-2 px-4 rounded-md">Add Item</button>
                    <button id="refreshInventoryButton" class="desktop-btn flex-1 bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-md" style="background: linear-gradient(to bottom, #d1d5db 0%, #9ca3af 100%); border-color: #6b7280; color: #333; text-shadow: none;">Refresh</button>
                </div>
            </div>

            <div class="flex-1 p-6 bg-white overflow-y-auto">
                <h3 class="text-xl font-semibold mb-6 text-gray-800">Existing Materials</h3>
                <div class="mb-4">
                    <input
                        type="text"
                        id="inventorySearchInput"
                        placeholder="Type here to filter..."
                        class="desktop-input w-full p-2 rounded-sm"
                        value=""
                    />
                </div>
                <div class="overflow-x-auto rounded-md border border-gray-300 shadow-sm">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="desktop-table-header">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Medicine Name</th>
                                <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Batch</th>
                                <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Quantity</th>
                                <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Selling Price</th>
                                <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Expiry Date</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body" class="bg-white divide-y divide-gray-200">
                            </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const itemNameInput = parentEl.querySelector('#itemName');
    const itemBatchInput = parentEl.querySelector('#itemBatch');
    const itemQuantityInput = parentEl.querySelector('#itemQuantity');
    const itemPurchasePriceInput = parentEl.querySelector('#itemPurchasePrice');
    const itemSellingPriceInput = parentEl.querySelector('#itemSellingPrice');
    const itemExpiryDateInput = parentEl.querySelector('#itemExpiryDate');
    const addItemButton = parentEl.querySelector('#addItemButton');
    const refreshInventoryButton = parentEl.querySelector('#refreshInventoryButton');
    const inventoryMessageArea = parentEl.querySelector('#inventory-message-area');
    const inventoryTableBody = parentEl.querySelector('#inventory-table-body');
    const inventorySearchInput = parentEl.querySelector('#inventorySearchInput');

    const updateNewItemState = (field, value) => {
        appState.newItem[field] = value;
    };

    itemNameInput.addEventListener('input', (e) => updateNewItemState('name', e.target.value));
    itemBatchInput.addEventListener('input', (e) => updateNewItemState('batch', e.target.value));
    itemQuantityInput.addEventListener('input', (e) => updateNewItemState('quantity', e.target.value));
    itemPurchasePriceInput.addEventListener('input', (e) => updateNewItemState('purchasePrice', e.target.value));
    itemSellingPriceInput.addEventListener('input', (e) => updateNewItemState('sellingPrice', e.target.value));
    itemExpiryDateInput.addEventListener('input', (e) => updateNewItemState('expiryDate', e.target.value));

    const handleAddItem = () => {
        const { name, batch, quantity, purchasePrice, sellingPrice, expiryDate } = appState.newItem;

        if (!name || !batch || !quantity || !purchasePrice || !sellingPrice || !expiryDate) {
            displayMessage('Please fill in all fields.', 'error', 3000, inventoryMessageArea);
            return;
        }
        if (isNaN(quantity) || isNaN(purchasePrice) || isNaN(sellingPrice) || parseFloat(quantity) <= 0) {
            displayMessage('Quantity, Purchase Price, and Selling Price must be valid positive numbers.', 'error', 3000, inventoryMessageArea);
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);

        if (expiry < today) {
            displayMessage('Expiry Date must be today or a future date.', 'error', 3000, inventoryMessageArea);
            return;
        }

        const id = Date.now();
        const newItem = { ...appState.newItem, id, quantity: parseFloat(quantity) };
        setState({ inventory: [...appState.inventory, newItem], newItem: { name: '', batch: '', quantity: '', purchasePrice: '', sellingPrice: '', expiryDate: '' } });
        displayMessage('Item added successfully!', 'success', 3000, inventoryMessageArea);
    };

    addItemButton.addEventListener('click', handleAddItem);
    refreshInventoryButton.addEventListener('click', () => setState({ searchTerm: '' })); // Simply re-render inventory

    const renderInventoryTable = () => {
        const currentFilteredInventory = appState.inventory.filter(item =>
            item.name.toLowerCase().includes(appState.searchTerm.toLowerCase()) ||
            item.batch.toLowerCase().includes(appState.searchTerm.toLowerCase())
        );

        if (currentFilteredInventory.length === 0) {
            inventoryTableBody.innerHTML = `<tr><td colSpan="5" class="px-4 py-3 whitespace-nowrap text-center text-gray-500">No items in inventory.</td></tr>`;
        } else {
            inventoryTableBody.innerHTML = currentFilteredInventory.map(item => `
                <tr class="desktop-table-row">
                    <td class="px-4 py-2 whitespace-nowrap">${item.name}</td>
                    <td class="px-4 py-2 whitespace-nowrap">${item.batch}</td>
                    <td class="px-4 py-2 whitespace-nowrap">${item.quantity}</td>
                    <td class="px-4 py-2 whitespace-nowrap">PKR ${parseFloat(item.sellingPrice).toFixed(2)}</td>
                    <td class="px-4 py-2 whitespace-nowrap">${item.expiryDate}</td>
                </tr>
            `).join('');
        }
    };

    inventorySearchInput.addEventListener('input', (e) => {
        appState.searchTerm = e.target.value;
        renderInventoryTable(); // Re-render table on search input
    });

    renderInventoryTable(); // Initial render of inventory table
}

function renderBillingSection(parentEl) {
    parentEl.innerHTML = `
        <div class="flex h-full border border-gray-300 rounded-md overflow-hidden bg-gray-50 shadow-md">
            <div class="w-2/5 p-6 border-r border-gray-300 bg-gray-100 overflow-y-auto">
                <h3 class="text-xl font-semibold mb-6 text-gray-800">Add Medicine to Bill</h3>
                <div class="mb-4">
                    <label for="billingSearchTerm" class="block text-gray-700 text-sm font-semibold mb-1">Search Medicine:</label>
                    <input
                        type="text"
                        id="billingSearchTerm"
                        placeholder="Type medicine name or batch..."
                        class="desktop-input w-full p-2 rounded-sm mb-4"
                        value="${appState.searchTerm}"
                    />
                </div>
                <div id="filteredInventoryResults" class="max-h-64 overflow-y-auto border border-gray-300 rounded-sm shadow-inner">
                    </div>
                 <p id="billing-message-area" class="text-center py-2 rounded-md mt-6"></p>
                <div class="flex justify-between items-center bg-gray-200 p-4 rounded-md border border-gray-300 mt-6 shadow-sm">
                    <h3 class="text-lg font-bold text-gray-800">Grand Total: PKR <span id="grandTotalDisplay">0.00</span></h3>
                    <button id="processSaleButton"
                        class="desktop-btn font-bold py-2 px-6 rounded-md">
                        Process Sale
                    </button>
                </div>
            </div>

            <div class="flex-1 p-6 bg-white overflow-y-auto">
                <h3 class="text-xl font-semibold mb-6 text-gray-800">Current Bill Items</h3>
                <div class="overflow-x-auto rounded-md border border-gray-300 shadow-sm">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="desktop-table-header">
                            <tr>
                                <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Medicine</th>
                                <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Batch</th>
                                <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Unit Price</th>
                                <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Quantity</th>
                                <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Total</th>
                                <th class="px-4 py-2"></th>
                            </tr>
                        </thead>
                        <tbody id="billItemsTableBody" class="bg-white divide-y divide-gray-200">
                            </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    const billingSearchTermInput = parentEl.querySelector('#billingSearchTerm');
    const filteredInventoryResultsDiv = parentEl.querySelector('#filteredInventoryResults');
    const billItemsTableBody = parentEl.querySelector('#billItemsTableBody');
    const grandTotalDisplay = parentEl.querySelector('#grandTotalDisplay');
    const processSaleButton = parentEl.querySelector('#processSaleButton');
    const billingMessageArea = parentEl.querySelector('#billing-message-area');

    const updateFilteredInventory = () => {
        if (appState.searchTerm.length > 2) {
            appState.filteredInventory = appState.inventory.filter(item =>
                item.name.toLowerCase().includes(appState.searchTerm.toLowerCase()) ||
                item.batch.toLowerCase().includes(appState.searchTerm.toLowerCase())
            );
        } else {
            appState.filteredInventory = [];
        }
        renderFilteredInventoryTable();
    };

    const renderFilteredInventoryTable = () => {
        if (appState.filteredInventory.length === 0) {
            filteredInventoryResultsDiv.innerHTML = `<table class="min-w-full divide-y divide-gray-200"><tbody><tr><td colSpan="5" class="px-4 py-2 whitespace-nowrap text-center text-gray-500">No matching items.</td></tr></tbody></table>`;
        } else {
            filteredInventoryResultsDiv.innerHTML = `
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="desktop-table-header">
                        <tr>
                            <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Name</th>
                            <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Batch</th>
                            <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Price</th>
                            <th class="px-4 py-2 text-left text-xs uppercase tracking-wider">Stock</th>
                            <th class="px-4 py-2"></th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${appState.filteredInventory.map(item => `
                            <tr class="desktop-table-row">
                                <td class="px-4 py-2 whitespace-nowrap">${item.name}</td>
                                <td class="px-4 py-2 whitespace-nowrap">${item.batch}</td>
                                <td class="px-4 py-2 whitespace-nowrap">PKR ${parseFloat(item.sellingPrice).toFixed(2)}</td>
                                <td class="px-4 py-2 whitespace-nowrap">${item.quantity}</td>
                                <td class="px-4 py-2 whitespace-nowrap text-right">
                                    <button data-item-id="${item.id}" class="add-to-bill-btn desktop-btn text-sm py-1 px-3 rounded-md" style="background: linear-gradient(to bottom, #34D399 0%, #10B981 100%); border-color: #067252;">
                                        Add
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            // Attach event listeners to newly rendered "Add" buttons
            filteredInventoryResultsDiv.querySelectorAll('.add-to-bill-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    const itemId = parseInt(e.target.dataset.itemId);
                    const itemToAdd = appState.inventory.find(invItem => invItem.id === itemId);
                    handleAddToBill(itemToAdd);
                });
            });
        }
    };

    const handleAddToBill = (item) => {
        const existingItemIndex = appState.billItems.findIndex(bi => bi.id === item.id);
        let updatedBillItems;

        if (existingItemIndex > -1) {
            updatedBillItems = [...appState.billItems];
            updatedBillItems[existingItemIndex].soldQuantity += 1;
            updatedBillItems[existingItemIndex].total = updatedBillItems[existingItemIndex].soldQuantity * updatedBillItems[existingItemIndex].unitPrice;
        } else {
            updatedBillItems = [
                ...appState.billItems,
                {
                    id: item.id,
                    name: item.name,
                    batch: item.batch,
                    expiryDate: item.expiryDate,
                    unitPrice: parseFloat(item.sellingPrice),
                    soldQuantity: 1,
                    total: parseFloat(item.sellingPrice)
                }
            ];
        }
        setState({ billItems: updatedBillItems, searchTerm: '' });
    };

    const handleBillItemQuantityChange = (id, newQuantity) => {
        const updatedBillItems = appState.billItems.map(item =>
            item.id === id
                ? { ...item, soldQuantity: parseInt(newQuantity), total: parseInt(newQuantity) * item.unitPrice }
                : item
        );
        setState({ billItems: updatedBillItems });
    };

    const handleRemoveBillItem = (id) => {
        const updatedBillItems = appState.billItems.filter(item => item.id !== id);
        setState({ billItems: updatedBillItems });
    };

    const handleProcessSale = () => {
        if (appState.billItems.length === 0) {
            displayMessage('Please add items to the bill before processing.', 'error', 3000, billingMessageArea);
            return;
        }

        const newInventory = JSON.parse(JSON.stringify(appState.inventory)); // Deep copy to avoid direct mutation
        const soldItemsForRecord = [];
        let isValidSale = true;

        for (const billItem of appState.billItems) {
            const inventoryItem = newInventory.find(item => item.id === billItem.id);

            if (!inventoryItem || inventoryItem.quantity < billItem.soldQuantity) {
                displayMessage(`Not enough stock for ${billItem.name} (Batch: ${billItem.batch}). Available: ${inventoryItem ? inventoryItem.quantity : 0}, Requested: ${billItem.soldQuantity}`, 'error', 5000, billingMessageArea);
                isValidSale = false;
                break;
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const expiry = new Date(inventoryItem.expiryDate);
            expiry.setHours(0, 0, 0, 0);

            if (expiry < today) {
                displayMessage(`Cannot sell expired medicine: ${billItem.name} (Batch: ${billItem.batch}). Expired on: ${inventoryItem.expiryDate}`, 'error', 5000, billingMessageArea);
                isValidSale = false;
                break;
            }
        }

        if (!isValidSale) {
            return;
        }

        for (const billItem of appState.billItems) {
            const inventoryItem = newInventory.find(item => item.id === billItem.id);
            if (inventoryItem) { // Ensure item still exists after potential stock issues
                inventoryItem.quantity -= billItem.soldQuantity;
                soldItemsForRecord.push({
                    itemId: billItem.id,
                    name: billItem.name,
                    batch: billItem.batch,
                    quantity: billItem.soldQuantity,
                    unitPrice: billItem.unitPrice,
                    total: billItem.total
                });
            }
        }

        const grandTotal = appState.billItems.reduce((sum, item) => sum + item.total, 0);
        const newSale = {
            id: Date.now(),
            date: new Date().toISOString().split('T')[0], //YYYY-MM-DD
            items: soldItemsForRecord,
            grandTotal: grandTotal.toFixed(2)
        };

        setState({
            inventory: newInventory,
            sales: [...appState.sales, newSale],
            billItems: []
        });
        displayMessage('Sale processed successfully!', 'success', 3000, billingMessageArea);
    };

    billingSearchTermInput.addEventListener('input', (e) => {
        appState.searchTerm = e.target.value;
        updateFilteredInventory();
    });
    processSaleButton.addEventListener('click', handleProcessSale);

    updateFilteredInventory(); // Call initially to set up event listeners

    function renderBillItemsTable() {
        const grandTotal = appState.billItems.reduce((sum, item) => sum + item.total, 0);
        grandTotalDisplay.textContent = grandTotal.toFixed(2);

        if (appState.billItems.length === 0) {
            billItemsTableBody.innerHTML = `<tr><td colSpan="6" class="px-6 py-4 whitespace-nowrap text-center text-gray-500">No items in current bill.</td></tr>`;
        } else {
            billItemsTableBody.innerHTML = appState.billItems.map(item => `
                <tr class="desktop-table-row">
                    <td class="px-6 py-4 whitespace-nowrap">${item.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap">${item.batch}</td>
                    <td class="px-6 py-4 whitespace-nowrap">PKR ${item.unitPrice.toFixed(2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <input
                            type="number"
                            min="1"
                            value="${item.soldQuantity}"
                            data-item-id="${item.id}"
                            class="bill-quantity-input desktop-input w-20 p-1 rounded-sm text-center"
                        />
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">PKR ${item.total.toFixed(2)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right">
                        <button data-item-id="${item.id}" class="remove-bill-item-btn desktop-btn red text-sm py-1 px-3 rounded-md">
                            Remove
                        </button>
                    </td>
                </tr>
            `).join('');

            billItemsTableBody.querySelectorAll('.bill-quantity-input').forEach(input => {
                input.addEventListener('change', (e) => {
                    handleBillItemQuantityChange(parseInt(e.target.dataset.itemId), parseInt(e.target.value));
                });
            });

            billItemsTableBody.querySelectorAll('.remove-bill-item-btn').forEach(button => {
                button.addEventListener('click', (e) => {
                    handleRemoveBillItem(parseInt(e.target.dataset.itemId));
                });
            });
        }
    }
    renderBillItemsTable(); // Initial render of bill items table
}


function renderFinancialReports(parentEl) {
    parentEl.innerHTML = `
        <div class="bg-gray-50 p-6 rounded-md shadow-md border border-gray-300">
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Financial Reports</h2>

            <div class="mb-6 flex border-b border-gray-300">
                <button id="tab-daily"
                    class="py-2 px-6 font-semibold desktop-btn rounded-t-md border-b-0
                    ${appState.activeSection === 'daily' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                    style="${appState.activeSection === 'daily' ? 'background: linear-gradient(to bottom, #4A5568 0%, #2D3748 100%); border-color: #2D3748; color: #fff;' : ''}"
                    >
                    Daily Report
                </button>
                <button id="tab-recoveries"
                    class="py-2 px-6 font-semibold desktop-btn rounded-t-md border-b-0
                    ${appState.activeSection === 'recoveries' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                    style="${appState.activeSection === 'recoveries' ? 'background: linear-gradient(to bottom, #4A5568 0%, #2D3748 100%); border-color: #2D3748; color: #fff;' : ''}"
                    >
                    Add Recoveries
                </button>
                <button id="tab-expenses"
                    class="py-2 px-6 font-semibold desktop-btn rounded-t-md border-b-0
                    ${appState.activeSection === 'expenses' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}"
                    style="${appState.activeSection === 'expenses' ? 'background: linear-gradient(to bottom, #4A5568 0%, #2D3748 100%); border-color: #2D3748; color: #fff;' : ''}"
                    >
                    Add Expenses
                </button>
            </div>

            <p id="reports-message-area" class="text-center py-2 rounded-md mb-4"></p>

            <div id="reports-content" class="p-4 border border-gray-300 rounded-b-md bg-white shadow-inner">
                </div>
        </div>
    `;

    const reportsContentDiv = parentEl.querySelector('#reports-content');
    const reportsMessageArea = parentEl.querySelector('#reports-message-area');

    parentEl.querySelector('#tab-daily').addEventListener('click', () => setState({ activeSection: 'daily' }));
    parentEl.querySelector('#tab-recoveries').addEventListener('click', () => setState({ activeSection: 'recoveries' }));
    parentEl.querySelector('#tab-expenses').addEventListener('click', () => setState({ activeSection: 'expenses' }));

    // Re-display any lingering messages (from global state or previous renders)
    if (appState.message) {
        displayMessage(appState.message, appState.messageType, 3000, reportsMessageArea);
    }

    switch (appState.activeSection) {
        case 'daily':
            renderDailyReport(reportsContentDiv, reportsMessageArea);
            break;
        case 'recoveries':
            renderAddRecoveries(reportsContentDiv, reportsMessageArea);
            break;
        case 'expenses':
            renderAddExpenses(reportsContentDiv, reportsMessageArea);
            break;
        default:
            renderDailyReport(reportsContentDiv, reportsMessageArea); // Default to daily
            break;
    }
}

function renderDailyReport(parentEl, messageArea) {
    const dailySales = appState.sales.filter(sale => sale.date === appState.reportDate);
    const dailyRecoveries = appState.recoveries.filter(rec => rec.date === appState.reportDate);
    const dailyExpenses = appState.expenses.filter(exp => exp.date === appState.reportDate);

    const totalDailySales = dailySales.reduce((sum, sale) => sum + parseFloat(sale.grandTotal), 0);
    const totalDailyRecoveries = dailyRecoveries.reduce((sum, rec) => sum + rec.amount, 0);
    const totalDailyExpenses = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    // Changed: Recoveries now decrease net profit
    const dailyNet = (totalDailySales - totalDailyRecoveries - totalDailyExpenses).toFixed(2);

    parentEl.innerHTML = `
        <div class="p-4 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
            <h3 class="text-xl font-semibold mb-4 text-gray-800">Daily Report Summary</h3>
            <div class="mb-4">
                <label for="reportDate" class="block text-gray-700 text-sm font-semibold mb-1">Select Date:</label>
                <input type="date" id="reportDateInput" value="${appState.reportDate}"
                    class="desktop-input p-2 rounded-sm" />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                    <p class="text-gray-600">Total Sales:</p>
                    <p class="text-2xl font-bold text-green-600">PKR ${totalDailySales.toFixed(2)}</p>
                </div>
                <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                    <p class="text-gray-600">Total Recoveries:</p>
                    <p class="text-2xl font-bold text-red-600">PKR ${totalDailyRecoveries.toFixed(2)}</p>
                </div>
                <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200">
                    <p class="text-gray-600">Total Expenses:</p>
                    <p class="text-2xl font-bold text-red-600">PKR ${totalDailyExpenses.toFixed(2)}</p>
                </div>
            </div>
            <div class="bg-white p-4 rounded-md shadow-sm border border-gray-200 text-center">
                <p class="text-gray-600">Daily Net:</p>
                <p class="text-3xl font-bold ${dailyNet < 0 ? 'text-red-700' : 'text-green-700'}">PKR ${dailyNet}</p>
            </div>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-800">Sales for ${appState.reportDate}</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300 shadow-sm mb-4">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="desktop-table-header">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Bill ID</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Items Sold</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${dailySales.length === 0 ? `<tr><td colSpan="3" class="px-6 py-4 text-center text-gray-500">No sales for this date.</td></tr>` :
                           dailySales.map(sale => `
                                <tr class="desktop-table-row">
                                    <td class="px-6 py-4 whitespace-nowrap">${sale.id}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        ${sale.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${sale.grandTotal}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-800">Recoveries for ${appState.reportDate}</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300 shadow-sm mb-4">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="desktop-table-header">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Source</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Amount</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${dailyRecoveries.length === 0 ? `<tr><td colSpan="3" class="px-6 py-4 text-center text-gray-500">No recoveries for this date.</td></tr>` :
                           dailyRecoveries.map(rec => `
                                <tr class="desktop-table-row">
                                    <td class="px-6 py-4 whitespace-nowrap">${rec.source}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${rec.amount.toFixed(2)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${rec.description}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-800">Expenses for ${appState.reportDate}</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300 shadow-sm">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="desktop-table-header">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Category</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Amount</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${dailyExpenses.length === 0 ? `<tr><td colSpan="3" class="px-6 py-4 text-center text-gray-500">No expenses for this date.</td></tr>` :
                           dailyExpenses.map(exp => `
                                <tr class="desktop-table-row">
                                    <td class="px-6 py-4 whitespace-nowrap">${exp.category}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${exp.amount.toFixed(2)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${exp.description}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>
        </div>
    `;

    parentEl.querySelector('#reportDateInput').addEventListener('change', (e) => {
        setState({ reportDate: e.target.value });
    });
}

function renderAddRecoveries(parentEl, messageArea) {
    parentEl.innerHTML = `
        <div class="p-6 border border-gray-200 rounded-md bg-gray-50 shadow-sm">
            <h3 class="text-xl font-semibold mb-6 text-gray-800">Add New Recovery</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label for="recDate" class="block text-gray-700 text-sm font-semibold mb-1">Date:</label>
                    <input type="date" id="recDate" name="date" value="${appState.newRecovery.date}"
                        class="desktop-input w-full p-2 rounded-sm" />
                </div>
                <div>
                    <label for="recAmount" class="block text-gray-700 text-sm font-semibold mb-1">Amount:</label>
                    <input type="number" id="recAmount" name="amount" value="${appState.newRecovery.amount}"
                        class="desktop-input w-full p-2 rounded-sm" />
                </div>
                <div class="md:col-span-2">
                    <label for="recSource" class="block text-gray-700 text-sm font-semibold mb-1">Source/Company:</label>
                    <input type="text" id="recSource" name="source" value="${appState.newRecovery.source}"
                        class="desktop-input w-full p-2 rounded-sm" />
                </div>
                <div class="md:col-span-2">
                    <label for="recDescription" class="block text-gray-700 text-sm font-semibold mb-1">Description (Optional):</label>
                    <textarea id="recDescription" name="description"
                        class="desktop-input w-full p-2 rounded-sm">${appState.newRecovery.description}</textarea>
                </div>
            </div>
            <button id="addRecoveryButton"
                class="desktop-btn w-full font-bold py-2 px-4 rounded-md">
                Add Recovery
            </button>
        </div>
    `;

    const recDateInput = parentEl.querySelector('#recDate');
    const recAmountInput = parentEl.querySelector('#recAmount');
    const recSourceInput = parentEl.querySelector('#recSource');
    const recDescriptionInput = parentEl.querySelector('#recDescription');
    const addRecoveryButton = parentEl.querySelector('#addRecoveryButton');

    recDateInput.addEventListener('input', (e) => { appState.newRecovery.date = e.target.value; });
    recAmountInput.addEventListener('input', (e) => { appState.newRecovery.amount = e.target.value; });
    recSourceInput.addEventListener('input', (e) => { appState.newRecovery.source = e.target.value; });
    recDescriptionInput.addEventListener('input', (e) => { appState.newRecovery.description = e.target.value; });

    addRecoveryButton.addEventListener('click', () => {
        const { date, amount, source, description } = appState.newRecovery;
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0 || !source) {
            displayMessage('Please enter a valid amount and source for recovery.', 'error', 3000, messageArea);
            return;
        }
        const newRec = { id: Date.now(), date, amount: parseFloat(amount), source, description };
        setState({ recoveries: [...appState.recoveries, newRec], newRecovery: { date: new Date().toISOString().split('T')[0], amount: '', source: '', description: '' } });
        displayMessage('Recovery added successfully!', 'success', 3000, messageArea);
    });
}

function renderAddExpenses(parentEl, messageArea) {
    parentEl.innerHTML = `
        <div class="p-6 border border-red-200 rounded-md bg-red-50 shadow-sm">
            <h3 class="text-xl font-semibold mb-6 text-red-800">Add New Expense</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <label for="expDate" class="block text-gray-700 text-sm font-semibold mb-1">Date:</label>
                    <input type="date" id="expDate" name="date" value="${appState.newExpense.date}"
                        class="desktop-input w-full p-2 rounded-sm" />
                </div>
                <div>
                    <label for="expAmount" class="block text-gray-700 text-sm font-semibold mb-1">Amount:</label>
                    <input type="number" id="expAmount" name="amount" value="${appState.newExpense.amount}"
                        class="desktop-input w-full p-2 rounded-sm" />
                </div>
                <div class="md:col-span-2">
                    <label for="expCategory" class="block text-gray-700 text-sm font-semibold mb-1">Category:</label>
                    <input type="text" id="expCategory" name="category" value="${appState.newExpense.category}"
                        class="desktop-input w-full p-2 rounded-sm" />
                </div>
                <div class="md:col-span-2">
                    <label for="expDescription" class="block text-gray-700 text-sm font-semibold mb-1">Description (Optional):</label>
                    <textarea id="expDescription" name="description"
                        class="desktop-input w-full p-2 rounded-sm">${appState.newExpense.description}</textarea>
                </div>
            </div>
            <button id="addExpenseButton"
                class="desktop-btn w-full red font-bold py-2 px-4 rounded-md">
                Add Expense
            </button>
        </div>
    `;

    const expDateInput = parentEl.querySelector('#expDate');
    const expAmountInput = parentEl.querySelector('#expAmount');
    const expCategoryInput = parentEl.querySelector('#expCategory');
    const expDescriptionInput = parentEl.querySelector('#expDescription');
    const addExpenseButton = parentEl.querySelector('#addExpenseButton');

    expDateInput.addEventListener('input', (e) => { appState.newExpense.date = e.target.value; });
    expAmountInput.addEventListener('input', (e) => { appState.newExpense.amount = e.target.value; });
    expCategoryInput.addEventListener('input', (e) => { appState.newExpense.category = e.target.value; });
    expDescriptionInput.addEventListener('input', (e) => { appState.newExpense.description = e.target.value; });

    addExpenseButton.addEventListener('click', () => {
        const { date, amount, category, description } = appState.newExpense;
        if (!amount || isNaN(amount) || parseFloat(amount) <= 0 || !category) {
            displayMessage('Please enter a valid amount and category for expense.', 'error', 3000, messageArea);
            return;
        }
        const newExp = { id: Date.now(), date, amount: parseFloat(amount), category, description };
        setState({ expenses: [...appState.expenses, newExp], newExpense: { date: new Date().toISOString().split('T')[0], amount: '', category: '', description: '' } });
        displayMessage('Expense added successfully!', 'success', 3000, messageArea);
    });
}

function renderSearchReports(parentEl) {
    parentEl.innerHTML = `
        <div class="bg-gray-50 p-6 rounded-md shadow-md border border-gray-300">
            <h2 class="text-2xl font-bold mb-6 text-gray-800">Search Previous Records</h2>

            <div class="mb-6 p-4 border border-orange-200 rounded-md bg-orange-50 shadow-sm">
                <h3 class="text-xl font-semibold mb-4 text-orange-800">Select Date Range</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label for="startDate" class="block text-gray-700 text-sm font-semibold mb-1">From Date:</label>
                        <input type="date" id="startDateInput" value="${appState.startDate}"
                            class="desktop-input w-full p-2 rounded-sm" />
                    </div>
                    <div>
                        <label for="endDate" class="block text-gray-700 text-sm font-semibold mb-1">To Date:</label>
                        <input type="date" id="endDateInput" value="${appState.endDate}"
                            class="desktop-input w-full p-2 rounded-sm" />
                    </div>
                </div>
                <p id="search-message-area" class="text-red-500 text-center mb-4"></p>
                <button id="searchButton"
                    class="desktop-btn w-full font-bold py-2 px-4 rounded-md">
                    Search
                </button>
            </div>

            <div id="searchResultsDisplay" class="mt-8">
                </div>
        </div>
    `;

    const startDateInput = parentEl.querySelector('#startDateInput');
    const endDateInput = parentEl.querySelector('#endDateInput');
    const searchButton = parentEl.querySelector('#searchButton');
    const searchMessageArea = parentEl.querySelector('#search-message-area');
    const searchResultsDisplay = parentEl.querySelector('#searchResultsDisplay');

    startDateInput.addEventListener('change', (e) => { appState.startDate = e.target.value; });
    endDateInput.addEventListener('change', (e) => { appState.endDate = e.target.value; });

    const handleSearch = () => {
        if (!appState.startDate || !appState.endDate) {
            searchMessageArea.textContent = 'Please select both start and end dates for the search.';
            return;
        }
        if (new Date(appState.startDate) > new Date(appState.endDate)) {
            searchMessageArea.textContent = 'Start date cannot be after end date.';
            return;
        }

        const start = new Date(appState.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(appState.endDate);
        end.setHours(23, 59, 59, 999);

        appState.filteredSales = appState.sales.filter(sale => {
            const saleDate = new Date(sale.date);
            saleDate.setHours(0, 0, 0, 0);
            return saleDate >= start && saleDate <= end;
        });

        appState.filteredRecoveries = appState.recoveries.filter(rec => {
            const recDate = new Date(rec.date);
            recDate.setHours(0, 0, 0, 0);
            return recDate >= start && recDate <= end;
        });

        appState.filteredExpenses = appState.expenses.filter(exp => {
            const expDate = new Date(exp.date);
            expDate.setHours(0, 0, 0, 0);
            return expDate >= start && expDate <= end;
        });
        searchMessageArea.textContent = ''; // Clear message on successful search

        renderSearchResults(searchResultsDisplay);
    };

    searchButton.addEventListener('click', handleSearch);

    // Initial render of search results (if any dates are set)
    if (appState.startDate && appState.endDate) {
        handleSearch(); // Re-run search if dates were already in state
    }

    function renderSearchResults(parentEl) {
        if (!appState.startDate || !appState.endDate) {
            parentEl.innerHTML = ''; // Clear results if dates are not set
            return;
        }
        parentEl.innerHTML = `
            <h3 class="text-xl font-semibold mb-4 text-gray-800">Results for ${appState.startDate} to ${appState.endDate}</h3>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-700">Sales Records</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300 shadow-sm mb-6">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="desktop-table-header">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Bill ID</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Items</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Total</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${appState.filteredSales.length === 0 ? `<tr><td colSpan="4" class="px-6 py-4 text-center text-gray-500">No sales found for this period.</td></tr>` :
                           appState.filteredSales.map(sale => `
                                <tr class="desktop-table-row">
                                    <td class="px-6 py-4 whitespace-nowrap">${sale.date}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${sale.id}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">
                                        ${sale.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${sale.grandTotal}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-700">Recovery Records</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300 shadow-sm mb-6">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="desktop-table-header">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Source</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Amount</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${appState.filteredRecoveries.length === 0 ? `<tr><td colSpan="4" class="px-6 py-4 text-center text-gray-500">No recoveries found for this period.</td></tr>` :
                           appState.filteredRecoveries.map(rec => `
                                <tr class="desktop-table-row">
                                    <td class="px-6 py-4 whitespace-nowrap">${rec.date}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${rec.source}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${rec.amount.toFixed(2)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${rec.description}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>

            <h4 class="text-lg font-semibold mt-6 mb-3 text-gray-700">Expense Records</h4>
            <div class="overflow-x-auto rounded-md border border-gray-300 shadow-sm">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead class="desktop-table-header">
                        <tr>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Date</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Category</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Amount</th>
                            <th class="px-6 py-3 text-left text-xs uppercase tracking-wider">Description</th>
                        </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                        ${appState.filteredExpenses.length === 0 ? `<tr><td colSpan="4" class="px-6 py-4 text-center text-gray-500">No expenses found for this period.</td></tr>` :
                           appState.filteredExpenses.map(exp => `
                                <tr class="desktop-table-row">
                                    <td class="px-6 py-4 whitespace-nowrap">${exp.date}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${exp.category}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">PKR ${exp.amount.toFixed(2)}</td>
                                    <td class="px-6 py-4 whitespace-nowrap">${exp.description}</td>
                                </tr>
                           `).join('')
                        }
                    </tbody>
                </table>
            </div>
        `;
    }
}


// --- Main Application Render Function ---
function renderApp() {
    const appRoot = document.getElementById('app-root');

    if (appState.isLoggedIn) {
        renderMainDesktopApp(appRoot);
    } else {
        renderLoginPage(appRoot);
    }
    saveStateToLocalStorage(); // Save state after every render
}

// --- Initial Application Load ---
document.addEventListener('DOMContentLoaded', () => {
    loadStateFromLocalStorage();
    renderApp();
});