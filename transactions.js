document.addEventListener('DOMContentLoaded', () => {
    const transactionsList = document.getElementById('transactionsList');
    const categoryStats = document.getElementById('categoryStats');
    const totalSpending = document.getElementById('totalSpending');
    const transactionCount = document.getElementById('transactionCount');
    
    const dateFilter = document.getElementById('dateFilter');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortBy = document.getElementById('sortBy');
    const customDateContainer = document.getElementById('customDateContainer');
    const customDateEndContainer = document.getElementById('customDateEndContainer');
    
    const resetFilterBtn = document.getElementById('resetFilterBtn');
    const applyFilterBtn = document.getElementById('applyFilterBtn');
    const backButton = document.getElementById('backButton');
    
    // Set default dates for custom filter
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    startDate.valueAsDate = firstDayOfMonth;
    endDate.valueAsDate = today;
    
    // Initialize with default filter (This Month)
    loadTransactions();
    
    // Event listeners
    dateFilter.addEventListener('change', handleDateFilterChange);
    backButton.addEventListener('click', () => window.close());
    resetFilterBtn.addEventListener('click', resetFilters);
    applyFilterBtn.addEventListener('click', loadTransactions);
    
    /**
     * Handles the date filter change event
     */
    function handleDateFilterChange() {
        if (dateFilter.value === 'custom') {
            customDateContainer.style.display = 'flex';
            customDateEndContainer.style.display = 'flex';
        } else {
            customDateContainer.style.display = 'none';
            customDateEndContainer.style.display = 'none';
        }
    }
    
    /**
     * Resets filters to default values
     */
    function resetFilters() {
        dateFilter.value = 'month';
        categoryFilter.value = 'all';
        sortBy.value = 'date-desc';
        handleDateFilterChange();
        loadTransactions();
    }
    
    /**
     * Loads transactions based on current filter settings
     */
    function loadTransactions() {
        chrome.storage.sync.get(['transactions', 'categories', 'total'], (budget) => {
            const transactions = budget.transactions || [];
            const categories = budget.categories || {};
            const total = budget.total || 0;
            
            // Apply filters
            let filteredTransactions = applyFilters(transactions);
            
            // Update transaction list
            updateTransactionsList(filteredTransactions);
            
            // Update statistics
            updateStatistics(filteredTransactions, categories, total);
        });
    }
    
    /**
     * Applies filters to transactions
     * @param {Array} transactions - The transactions to filter
     * @returns {Array} - Filtered transactions
     */
    function applyFilters(transactions) {
        // Filter by date
        let filteredTransactions = filterByDate(transactions);
        
        // Filter by category
        if (categoryFilter.value !== 'all') {
            filteredTransactions = filteredTransactions.filter(t => 
                t.category === categoryFilter.value);
        }
        
        // Sort transactions
        filteredTransactions = sortTransactions(filteredTransactions);
        
        return filteredTransactions;
    }
    
    /**
     * Filters transactions by date based on selected date filter
     * @param {Array} transactions - The transactions to filter
     * @returns {Array} - Date filtered transactions
     */
    function filterByDate(transactions) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let startDateTime, endDateTime;
        
        switch (dateFilter.value) {
            case 'today':
                startDateTime = today.getTime();
                endDateTime = new Date().getTime();
                break;
                
            case 'week':
                // Start of current week (Sunday)
                startDateTime = new Date(today);
                startDateTime.setDate(today.getDate() - today.getDay());
                startDateTime.setHours(0, 0, 0, 0);
                startDateTime = startDateTime.getTime();
                endDateTime = new Date().getTime();
                break;
                
            case 'month':
                // Start of current month
                startDateTime = new Date(today.getFullYear(), today.getMonth(), 1).getTime();
                endDateTime = new Date().getTime();
                break;
                
            case 'year':
                // Start of current year
                startDateTime = new Date(today.getFullYear(), 0, 1).getTime();
                endDateTime = new Date().getTime();
                break;
                
            case 'custom':
                if (startDate.value && endDate.value) {
                    startDateTime = new Date(startDate.value);
                    startDateTime.setHours(0, 0, 0, 0);
                    startDateTime = startDateTime.getTime();
                    
                    endDateTime = new Date(endDate.value);
                    endDateTime.setHours(23, 59, 59, 999);
                    endDateTime = endDateTime.getTime();
                }
                break;
                
            default:
                // All time
                return transactions;
        }
        
        return transactions.filter(t => {
            const transactionDate = new Date(t.date).getTime();
            return transactionDate >= startDateTime && transactionDate <= endDateTime;
        });
    }
    
    /**
     * Sorts transactions based on selected sort option
     * @param {Array} transactions - The transactions to sort
     * @returns {Array} - Sorted transactions
     */
    function sortTransactions(transactions) {
        switch (sortBy.value) {
            case 'date-asc':
                return [...transactions].sort((a, b) => 
                    new Date(a.date) - new Date(b.date));
                
            case 'amount-desc':
                return [...transactions].sort((a, b) => b.amount - a.amount);
                
            case 'amount-asc':
                return [...transactions].sort((a, b) => a.amount - b.amount);
                
            case 'date-desc':
            default:
                return [...transactions].sort((a, b) => 
                    new Date(b.date) - new Date(a.date));
        }
    }
    
    /**
     * Updates the transactions list in the UI
     * @param {Array} transactions - The transactions to display
     */
    function updateTransactionsList(transactions) {
        transactionsList.innerHTML = '';
        
        if (transactions.length === 0) {
            const noTransactions = document.createElement('div');
            noTransactions.className = 'no-transactions';
            noTransactions.textContent = 'No transactions found matching your filters.';
            transactionsList.appendChild(noTransactions);
            return;
        }
        
        transactions.forEach(transaction => {
            const transactionItem = document.createElement('div');
            transactionItem.className = 'transaction-item';
            
            const date = new Date(transaction.date);
            const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
            
            const dateElement = document.createElement('div');
            dateElement.className = 'transaction-date';
            dateElement.textContent = formattedDate;
            
            const categoryElement = document.createElement('div');
            categoryElement.className = 'transaction-category';
            categoryElement.textContent = transaction.category.charAt(0).toUpperCase() + transaction.category.slice(1);
            
            const amountElement = document.createElement('div');
            amountElement.className = 'transaction-amount';
            amountElement.textContent = `$${transaction.amount.toFixed(2)}`;
            
            transactionItem.appendChild(dateElement);
            transactionItem.appendChild(categoryElement);
            transactionItem.appendChild(amountElement);
            
            transactionsList.appendChild(transactionItem);
        });
    }
    
    /**
     * Updates the statistics section in the UI
     * @param {Array} transactions - The filtered transactions
     * @param {Object} allCategories - All categories from the budget
     * @param {number} totalBudget - Total budget
     */
    function updateStatistics(transactions, allCategories, totalBudget) {
        // Calculate total and count
        const total = transactions.reduce((sum, t) => sum + t.amount, 0);
        
        // Update summary values
        totalSpending.textContent = `$${total.toFixed(2)}`;
        transactionCount.textContent = transactions.length;
        
        // Calculate categories
        const categoryTotals = {};
        transactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });
        
        // Update category stats
        categoryStats.innerHTML = '';
        
        // Get all categories and ensure we show even those with $0 in the selected period
        const allCategoryNames = Object.keys(allCategories);
        
        // If there are no transactions, show empty state
        if (transactions.length === 0) {
            const noStats = document.createElement('div');
            noStats.textContent = 'No data available for the selected period.';
            noStats.style.textAlign = 'center';
            noStats.style.padding = '20px 0';
            noStats.style.color = '#777';
            categoryStats.appendChild(noStats);
            return;
        }
        
        // Sort categories by amount (highest first)
        const sortedCategories = allCategoryNames.sort((a, b) => 
            (categoryTotals[b] || 0) - (categoryTotals[a] || 0));
        
        sortedCategories.forEach(category => {
            const amount = categoryTotals[category] || 0;
            const percentage = total > 0 ? (amount / total) * 100 : 0;
            
            // Skip categories with no transactions unless viewing all time
            if (amount === 0 && dateFilter.value !== 'all') {
                return;
            }
            
            const statItem = document.createElement('div');
            statItem.className = 'category-stat';
            
            // Colorize based on category
            const colorClass = getCategoryColorClass(category);
            
            statItem.innerHTML = `
                <div>
                    <div class="category-name">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
                    <div>${percentage.toFixed(1)}% of total</div>
                    <div class="progress-container">
                        <div class="progress-bar ${colorClass}" style="width: ${percentage}%"></div>
                    </div>
                </div>
                <div class="category-amount">$${amount.toFixed(2)}</div>
            `;
            
            categoryStats.appendChild(statItem);
        });
    }
    
    /**
     * Gets the color class for a category
     * @param {string} category - The category name
     * @returns {string} - CSS class for the color
     */
    function getCategoryColorClass(category) {
        switch (category) {
            case 'food': return 'bg-food';
            case 'transport': return 'bg-transport';
            case 'clothes': return 'bg-clothes';
            case 'miscellaneous': return 'bg-misc';
            default: return 'bg-default';
        }
    }
}); 