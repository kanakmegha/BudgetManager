// Remove all existing context menus and create new ones
chrome.contextMenus.removeAll(() => {
    // Create a parent menu item
    chrome.contextMenus.create({
        id: "budgetManager",
        title: "Add to Budget",
        contexts: ["selection"]
    });
    
    // Create a single menu item to extract amount
    chrome.contextMenus.create({
        id: "extractAmount",
        parentId: "budgetManager",
        title: "Extract Amount",
        contexts: ["selection"]
    });
});

// Extract numeric value from text
function extractNumericValue(text) {
    // Match any number pattern (including decimals)
    const matches = text.match(/(\d+\.\d+|\d+)/);
    return matches ? parseFloat(matches[0]) : null;
}

// Listen for context menu clicks
chrome.contextMenus.onClicked.addListener((clickData) => {
    if (clickData.menuItemId === "extractAmount" && clickData.selectionText) {
        const selectedText = clickData.selectionText.trim();
        const amount = extractNumericValue(selectedText);

        // Check if we were able to extract a valid number
        if (amount !== null) {
            // Store the extracted amount in local storage temporarily
            chrome.storage.local.set({ 'extractedAmount': amount }, () => {
                // Open the popup for category selection and confirmation
                chrome.windows.create({
                    url: 'transaction_confirm.html',
                    type: 'popup',
                    width: 400,
                    height: 300
                });
            });
        } else {
            // Notify the user to select a valid number
            const notifOptions = {
                type: "basic",
                iconUrl: "BudgetManager48.jpg",
                title: "Invalid Selection",
                message: "No valid number found in the selected text. Please select text containing a number."
            };
            chrome.notifications.create("invalidSelectionNotif", notifOptions);
        }
    }
});

// Function to process the transaction
function processTransaction(amount, category) {
    // Get the current budget from storage
    chrome.storage.sync.get(['total', 'limit', 'available', 'categories', 'transactions'], (budget) => {
        const currentTotal = budget.total !== undefined ? parseFloat(budget.total) : 0;
        const currentLimit = budget.limit !== undefined ? parseFloat(budget.limit) : 0;
        let availableAmount = budget.available !== undefined ? 
            parseFloat(budget.available) : currentLimit;
        
        // Initialize categories if not exist
        const categories = budget.categories || {
            food: 0,
            transport: 0,
            clothes: 0,
            miscellaneous: 0
        };
        
        // Initialize transactions array if not exist
        const transactions = budget.transactions || [];

        // Check if there's enough available amount for this transaction
        if (amount > availableAmount) {
            const notifOptions = {
                type: "basic",
                iconUrl: "BudgetManager48.jpg",
                title: "Transaction Denied!",
                message: `This expense of ${amount.toFixed(2)} exceeds your available amount of ${availableAmount.toFixed(2)}.`
            };
            chrome.notifications.create("transactionDeniedNotif", notifOptions);
            return false;
        }

        // Update the total spend and available amount
        const newTotal = currentTotal + amount;
        availableAmount -= amount;
        
        // Update category total
        categories[category] += amount;
        
        // Create transaction record
        const transaction = {
            amount: amount,
            category: category,
            date: new Date().toISOString()
        };
        
        // Add to transactions array
        transactions.push(transaction);

        // Save the updated values to storage
        chrome.storage.sync.set({ 
            total: newTotal,
            available: availableAmount,
            categories: categories,
            transactions: transactions
        }, () => {
            // Update the badge text
            chrome.action.setBadgeText({ text: newTotal.toFixed(0) });

            // Notify the user of the updated spend
            const notifOptions = {
                type: "basic",
                iconUrl: "BudgetManager48.jpg",
                title: `Added to ${category.charAt(0).toUpperCase() + category.slice(1)}`,
                message: `You spent ${amount.toFixed(2)} on ${category}. Available: ${availableAmount.toFixed(2)}.`
            };
            chrome.notifications.create("spendNotif", notifOptions);

            // Check if the limit is reached or exceeded
            if (newTotal >= currentLimit) {
                const limitNotifOptions = {
                    type: "basic",
                    iconUrl: "BudgetManager48.jpg",
                    title: "Limit Reached!",
                    message: `Your total spending (${newTotal.toFixed(2)}) has reached or exceeded your limit (${currentLimit.toFixed(2)})!`
                };
                chrome.notifications.create("limitNotif", limitNotifOptions);
            }
        });
        
        return true;
    });
}

// Listen for messages from the confirmation popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "processTransaction") {
        const result = processTransaction(request.amount, request.category);
        sendResponse({ success: result });
    } else if (request.action === "openPopup") {
        // Open the extension popup programmatically
        chrome.action.openPopup();
        sendResponse({ success: true });
    } else if (request.action === "resetBudget") {
        // Reset the budget
        chrome.storage.sync.set({
            total: 0,
            available: 0,
            categories: {
                food: 0,
                transport: 0,
                clothes: 0,
                miscellaneous: 0
            },
            transactions: []
        }, () => {
            // Update the badge text
            chrome.action.setBadgeText({ text: "0" });
            
            // Send success response
            sendResponse({ success: true });
            
            // Notify the user
            const notifOptions = {
                type: "basic",
                iconUrl: "BudgetManager48.jpg",
                title: "Budget Reset",
                message: "Your budget has been reset successfully."
            };
            chrome.notifications.create("resetNotif", notifOptions);
        });
        
        // Important: return true to indicate we will call sendResponse asynchronously
        return true;
    }
});

// Listen for changes to storage and update the badge text
chrome.storage.onChanged.addListener((changes, storageName) => {
    if (changes.total) {
        const newTotal = parseFloat(changes.total.newValue);
        chrome.action.setBadgeText({ text: newTotal.toFixed(0) });
    }
});

// Initialize 'available' when limit changes, if it doesn't exist
chrome.storage.onChanged.addListener((changes, storageName) => {
    if (changes.limit && !changes.available) {
        chrome.storage.sync.get(['total'], (budget) => {
            const total = budget.total !== undefined ? parseFloat(budget.total) : 0;
            const newLimit = parseFloat(changes.limit.newValue);
            chrome.storage.sync.set({ available: newLimit - total });
        });
    }
});