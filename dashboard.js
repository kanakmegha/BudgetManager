document.addEventListener('DOMContentLoaded', function() {
    // Load budget data from storage
    loadBudgetData();
    
    // Set up event listeners
    document.getElementById('resetData').addEventListener('click', resetAllData);
    
    // Log for debugging
    console.log('Dashboard initialized');
});

function loadBudgetData() {
    console.log('Loading budget data...');
    chrome.storage.sync.get(['total', 'limit', 'available', 'categories', 'transactions'], function(budget) {
        console.log('Budget data loaded:', budget);
        updateDashboardUI(budget);
    });
}

function updateDashboardUI(budget) {
    const limit = budget.limit || 0;
    const total = budget.total || 0;
    const available = budget.available || 0;
    const categories = budget.categories || { food: 0, transport: 0, clothes: 0, miscellaneous: 0 };
    const transactions = budget.transactions || [];
    
    // Log for debugging
    console.log('Updating UI with:', { limit, total, available, categories, transactions });
    
    // Update budget summary values
    document.getElementById('limitValue').textContent = formatCurrency(limit);
    document.getElementById('totalValue').textContent = formatCurrency(total);
    document.getElementById('availableValue').textContent = formatCurrency(available);
    
    // Update category values
    document.getElementById('foodValue').textContent = formatCurrency(categories.food || 0);
    document.getElementById('transportValue').textContent = formatCurrency(categories.transport || 0);
    document.getElementById('clothesValue').textContent = formatCurrency(categories.clothes || 0);
    document.getElementById('miscValue').textContent = formatCurrency(categories.miscellaneous || 0);
    
    // Calculate and update progress
    const progressPercentage = limit > 0 ? Math.min(100, Math.round((total / limit) * 100)) : 0;
    document.getElementById('progressValue').textContent = `${progressPercentage}%`;
    
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progressPercentage}%`;
    
    // Set progress bar color based on percentage
    if (progressPercentage < 50) {
        progressBar.style.backgroundColor = 'var(--success-color)';
    } else if (progressPercentage < 75) {
        progressBar.style.backgroundColor = 'var(--warning-color)';
    } else {
        progressBar.style.backgroundColor = 'var(--danger-color)';
    }
    
    // Update transactions table
    updateTransactionsTable(transactions);
}

function updateTransactionsTable(transactions) {
    const emptyState = document.getElementById('emptyState');
    const transactionsTable = document.getElementById('transactionsTable');
    const transactionsBody = document.getElementById('transactionsBody');
    const tableTotal = document.getElementById('tableTotal');
    
    // Clear existing transaction rows
    transactionsBody.innerHTML = '';
    
    console.log('Updating transactions table with', transactions ? transactions.length : 0, 'transactions');
    
    if (transactions && transactions.length > 0) {
        // Hide empty state and show table
        emptyState.style.display = 'none';
        transactionsTable.style.display = 'table';
        
        // Sort transactions by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => {
            return new Date(b.date) - new Date(a.date);
        });
        
        let total = 0;
        
        // Add transaction rows
        sortedTransactions.forEach(transaction => {
            console.log('Processing transaction:', transaction);
            const row = document.createElement('tr');
            
            // Format date
            const date = new Date(transaction.date);
            const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
            
            // Create table cells
            const dateCell = document.createElement('td');
            dateCell.textContent = formattedDate;
            
            const categoryCell = document.createElement('td');
            categoryCell.textContent = capitalizeFirstLetter(transaction.category);
            categoryCell.classList.add(`category-${transaction.category}`);
            
            const amountCell = document.createElement('td');
            amountCell.textContent = formatCurrency(transaction.amount);
            
            // Add cells to row
            row.appendChild(dateCell);
            row.appendChild(categoryCell);
            row.appendChild(amountCell);
            
            // Add row to table body
            transactionsBody.appendChild(row);
            
            // Add to total
            total += parseFloat(transaction.amount);
        });
        
        // Update total
        tableTotal.textContent = formatCurrency(total);
    } else {
        // Show empty state and hide table
        emptyState.style.display = 'flex';
        transactionsTable.style.display = 'none';
    }
}

function resetAllData() {
    if (confirm('Are you sure you want to reset all data? This will clear your budget limit, spending, and all transactions.')) {
        chrome.storage.sync.set({
            total: 0,
            limit: 0,
            available: 0,
            categories: {
                food: 0,
                transport: 0,
                clothes: 0,
                miscellaneous: 0
            },
            transactions: []
        }, function() {
            console.log('All data has been reset');
            loadBudgetData();
        });
    }
}

function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
} 