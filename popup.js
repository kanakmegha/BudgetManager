document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const limitInput = document.getElementById('limit');
    const totalSpan = document.getElementById('total');
    const availableSpan = document.getElementById('available');
    const progressBar = document.getElementById('progressBar');
    const progressPercentage = document.getElementById('progressPercentage');
    const spentOfLimit = document.getElementById('spentOfLimit');
    const setLimitBtn = document.getElementById('setLimitBtn');
    const resetBtn = document.getElementById('resetBtn');
    const dashboardLink = document.getElementById('dashboardLink');
    const transactionsLink = document.getElementById('transactionsLink');
    
    // Get budget data from storage
    function getBudgetData() {
        chrome.storage.sync.get(['total', 'limit', 'available'], function(budget) {
            const total = budget.total || 0;
            const limit = budget.limit || 0;
            const available = budget.available || 0;
            
            // Update UI
            updateUI(total, limit, available);
            
            // Set input value
            limitInput.value = limit;
        });
    }
    
    // Update the UI with budget data
    function updateUI(total, limit, available) {
        // Format values
        totalSpan.textContent = formatCurrency(total);
        availableSpan.textContent = formatCurrency(available);
        
        // Calculate percentage and update progress bar
        const percentage = limit > 0 ? (total / limit) * 100 : 0;
        progressBar.style.width = `${Math.min(percentage, 100)}%`;
        
        // Update progress text
        progressPercentage.textContent = `${Math.round(percentage)}%`;
        spentOfLimit.textContent = `${formatCurrency(total)} / ${formatCurrency(limit)}`;
        
        // Set progress bar color based on usage
        if (percentage >= 90) {
            progressBar.style.backgroundColor = 'var(--danger-color)';
        } else if (percentage >= 70) {
            progressBar.style.backgroundColor = 'var(--warning-color)';
        } else {
            progressBar.style.backgroundColor = 'var(--success-color)';
        }
    }
    
    // Format currency
    function formatCurrency(amount) {
        return '$' + parseFloat(amount).toFixed(2);
    }
    
    // Set budget limit
    setLimitBtn.addEventListener('click', function() {
        const limitValue = parseFloat(limitInput.value);
        
        if (isNaN(limitValue) || limitValue <= 0) {
            alert('Please enter a valid limit greater than zero.');
            return;
        }
        
        chrome.storage.sync.get(['total'], function(budget) {
            const total = budget.total || 0;
            const available = limitValue - total;
            
            chrome.storage.sync.set({
                'limit': limitValue,
                'available': available
            }, function() {
                updateUI(total, limitValue, available);
            });
        });
    });
    
    // Reset budget
    resetBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset your budget? This will clear all transactions.')) {
            chrome.storage.sync.set({
                'total': 0,
                'available': parseFloat(limitInput.value) || 0,
                'transactions': []
            }, function() {
                getBudgetData();
            });
            
            // Reset category totals
            chrome.storage.sync.get(['categories'], function(data) {
                const categories = data.categories || {};
                
                // Reset all category totals to 0
                Object.keys(categories).forEach(key => {
                    categories[key] = 0;
                });
                
                chrome.storage.sync.set({ 'categories': categories });
            });
        }
    });
    
    // Function to open dashboard page
    function openDashboardPage() {
        // Check if we're in a popup context
        if (chrome.extension) {
            // First try using windows API
            chrome.windows.create({
                url: chrome.runtime.getURL('dashboard.html'),
                type: 'popup',
                width: 800,
                height: 600
            }, function(window) {
                if (chrome.runtime.lastError) {
                    // Fallback to tabs if windows fails
                    chrome.tabs.create({ url: 'dashboard.html' });
                }
            });
        } else {
            // Direct navigation as fallback
            window.open('dashboard.html', '_blank');
        }
    }
    
    // Open dashboard - using chrome.runtime.openOptionsPage for extension pages
    dashboardLink.addEventListener('click', function(e) {
        e.preventDefault();
        openDashboardPage();
    });
    
    // Transactions link - also opens dashboard
    if (transactionsLink) {
        transactionsLink.addEventListener('click', function(e) {
            e.preventDefault();
            openDashboardPage();
        });
    }
    
    // Initialize
    getBudgetData();
});