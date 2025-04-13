document.addEventListener('DOMContentLoaded', () => {
    const totalSpentElement = document.getElementById('totalSpent');
    const budgetLimitElement = document.getElementById('budgetLimit');
    const availableAmountElement = document.getElementById('availableAmount');
    const progressBar = document.getElementById('progressBar');
    
    const amountInput = document.getElementById('amountInput');
    const categorySelect = document.getElementById('categorySelect');
    const submitBtn = document.getElementById('submitBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const viewHistoryLink = document.getElementById('viewHistoryLink');
    
    // Get the extracted amount from local storage and prefill the input if available
    chrome.storage.local.get(['extractedAmount'], (data) => {
        if (data.extractedAmount) {
            amountInput.value = data.extractedAmount.toFixed(2);
        }
    });
    
    // Load current budget data and update the UI
    function loadBudgetData() {
        chrome.storage.sync.get(['total', 'limit', 'available'], (budget) => {
            const total = budget.total !== undefined ? parseFloat(budget.total) : 0;
            const limit = budget.limit !== undefined ? parseFloat(budget.limit) : 0;
            const available = budget.available !== undefined ? parseFloat(budget.available) : limit - total;
            
            // Update display elements
            totalSpentElement.textContent = `$${total.toFixed(2)}`;
            budgetLimitElement.textContent = `$${limit.toFixed(2)}`;
            availableAmountElement.textContent = `$${available.toFixed(2)}`;
            
            // Update progress bar
            if (limit > 0) {
                const percentage = (total / limit) * 100;
                progressBar.style.width = `${Math.min(percentage, 100)}%`;
                
                // Change color based on percentage
                if (percentage >= 100) {
                    progressBar.style.backgroundColor = "var(--color-danger, #ff4444)";
                } else if (percentage >= 75) {
                    progressBar.style.backgroundColor = "var(--color-warning, #ffbb33)";
                } else {
                    progressBar.style.backgroundColor = "var(--color-success, #00C851)";
                }
            } else {
                progressBar.style.width = "0%";
            }
        });
    }
    
    // Load budget data on page load
    loadBudgetData();
    
    // Handle submit button click
    submitBtn.addEventListener('click', () => {
        const amount = parseFloat(amountInput.value);
        const category = categorySelect.value;
        
        if (isNaN(amount) || amount <= 0) {
            alert('Please enter a valid amount greater than 0.');
            return;
        }
        
        // Send message to the background script to process the transaction
        chrome.runtime.sendMessage(
            { 
                action: "processTransaction", 
                amount: amount, 
                category: category 
            }, 
            (response) => {
                // Clear the stored extracted amount
                chrome.storage.local.remove('extractedAmount');
                
                // Close the window
                window.close();
            }
        );
    });
    
    // Handle cancel button click
    cancelBtn.addEventListener('click', () => {
        // Clear the stored extracted amount
        chrome.storage.local.remove('extractedAmount');
        
        // Close the window
        window.close();
    });
    
    // Handle view history link click
    viewHistoryLink.addEventListener('click', () => {
        // Open the main popup with history view
        chrome.storage.local.set({ 'openHistoryView': true }, () => {
            // Open the extension popup
            chrome.runtime.sendMessage({ action: "openPopup" });
            // Close this window
            window.close();
        });
    });
}); 