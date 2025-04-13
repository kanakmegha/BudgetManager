document.addEventListener('DOMContentLoaded', function () {
    // Load all budget data from storage
    chrome.storage.sync.get(['total', 'limit', 'available', 'categories', 'transactions'], function (budget) {
        // Display total with 2 decimal places
        const total = budget.total !== undefined ? parseFloat(budget.total) : 0;
        const totalElement = document.getElementById('total');
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
        
        // Display limit with 2 decimal places
        const limit = budget.limit !== undefined ? parseFloat(budget.limit) : 0;
        const limitDisplayElement = document.getElementById('limitDisplay');
        if (limitDisplayElement) {
            limitDisplayElement.textContent = limit.toFixed(2);
        }
        
        // Set the input value for limit
        const limitInputElement = document.querySelector('input#limit');
        if (limitInputElement && budget.limit !== undefined) {
            limitInputElement.value = parseFloat(budget.limit).toFixed(2);
        }
        
        // Calculate and display available amount
        let availableAmount;
        if (budget.available !== undefined) {
            availableAmount = parseFloat(budget.available);
        } else {
            availableAmount = limit - total;
            // Save the calculated available amount to storage
            chrome.storage.sync.set({ available: availableAmount });
        }
        
        const availableDisplay = document.getElementById('availableDisplay');
        if (availableDisplay) {
            availableDisplay.textContent = availableAmount.toFixed(2);
            
            // Set appropriate class based on available amount
            if (availableAmount <= 0) {
                availableDisplay.className = 'stat-value currency';
                availableDisplay.classList.add('total-spent'); // Use red for negative values
            } else {
                availableDisplay.className = 'stat-value currency';
                availableDisplay.classList.add('amount-available');
            }
        }
        
        // Update the progress bar
        updateProgressBar(total, limit);
    });

    // Function to update progress bar
    function updateProgressBar(total, limit) {
        const progressBar = document.getElementById('budgetProgress');
        if (!progressBar || limit <= 0) return;
        
        const percentage = (total / limit) * 100;
        progressBar.style.width = Math.min(percentage, 100) + '%';
        
        // Add danger class if over 90% of budget
        if (percentage >= 90) {
            progressBar.classList.add('danger');
        } else {
            progressBar.classList.remove('danger');
        }
    }
    
    // Handle Enter key press in limit input
    const limitInput = document.getElementById('limit');
    if (limitInput) {
        limitInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                document.getElementById('saveLimit').click();
            }
        });
    }

    // Handle "Save Limit" button click
    const saveLimitButton = document.getElementById('saveLimit');
    if (saveLimitButton) {
        saveLimitButton.addEventListener('click', function (e) {
            const limitInput = document.querySelector('input#limit');
            if (!limitInput) return;
            
            const limit = limitInput.value.trim();

            if (limit && !isNaN(limit) && parseFloat(limit) > 0) {
                const limitValue = parseFloat(limit);
                
                // Get current total to calculate the new available amount
                chrome.storage.sync.get(['total'], function(budget) {
                    const total = budget.total !== undefined ? parseFloat(budget.total) : 0;
                    const newAvailable = limitValue - total;
                    
                    // Set the limit and also update the available amount
                    chrome.storage.sync.set({ 
                        limit: limitValue,
                        available: newAvailable
                    }, function () {
                        // Update the limit display with highlight animation
                        const limitDisplayElement = document.getElementById('limitDisplay');
                        if (limitDisplayElement) {
                            limitDisplayElement.textContent = limitValue.toFixed(2);
                            highlightElement(limitDisplayElement);
                        }
                        
                        // Update available display
                        const availableDisplay = document.getElementById('availableDisplay');
                        if (availableDisplay) {
                            availableDisplay.textContent = newAvailable.toFixed(2);
                            highlightElement(availableDisplay);
                            
                            // Update available element class based on value
                            if (newAvailable <= 0) {
                                availableDisplay.className = 'stat-value currency';
                                availableDisplay.classList.add('total-spent');
                            } else {
                                availableDisplay.className = 'stat-value currency';
                                availableDisplay.classList.add('amount-available');
                            }
                        }
                        
                        // Update progress bar
                        updateProgressBar(total, limitValue);
                        
                        // Show success animation on the button
                        saveLimitButton.textContent = "Saved!";
                        saveLimitButton.classList.add('btn-success');
                        setTimeout(() => {
                            saveLimitButton.textContent = "Save Limit";
                            saveLimitButton.classList.remove('btn-success');
                        }, 1500);
                    });
                });
            } else {
                // Visual feedback for invalid input
                limitInput.classList.add('error');
                setTimeout(() => {
                    limitInput.classList.remove('error');
                }, 800);
                alert('Please enter a valid limit amount.');
            }
        });
    }

    // Handle "Reset Total" button click
    const resetTotalButton = document.getElementById('resetTotal');
    if (resetTotalButton) {
        resetTotalButton.addEventListener('click', function (e) {
            if (confirm('Are you sure you want to reset your budget data? This will:\n\n- Reset your total spending to zero\n- Clear all category spending\n- Delete all transaction history\n- Set available amount to your full limit')) {
                // Get the current limit to restore the available amount
                chrome.storage.sync.get(['limit'], function(budget) {
                    const limit = budget.limit !== undefined ? parseFloat(budget.limit) : 0;
                    
                    // Reset categories
                    const resetCategories = {
                        food: 0,
                        transport: 0,
                        clothes: 0,
                        miscellaneous: 0
                    };
                    
                    // Reset the total to 0, set available to the full limit, and clear transaction history
                    chrome.storage.sync.set({ 
                        total: 0,
                        available: limit,
                        categories: resetCategories,
                        transactions: []
                    }, function () {
                        // Update the total display
                        const totalElement = document.getElementById('total');
                        if (totalElement) {
                            totalElement.textContent = '0.00';
                            highlightElement(totalElement);
                        }
                        
                        // Update available display
                        const availableDisplay = document.getElementById('availableDisplay');
                        if (availableDisplay) {
                            availableDisplay.textContent = limit.toFixed(2);
                            highlightElement(availableDisplay);
                            availableDisplay.className = 'stat-value currency';
                            availableDisplay.classList.add('amount-available');
                        }
                        
                        // Update progress bar
                        updateProgressBar(0, limit);
                        
                        // Show reset animation
                        resetTotalButton.textContent = "Reset Complete!";
                        setTimeout(() => {
                            resetTotalButton.textContent = "Reset Spending";
                        }, 1500);
                    });
                });
            }
        });
    }

    // Handle "View Dashboard" button click
    const viewDashboardButton = document.getElementById('viewDashboard');
    if (viewDashboardButton) {
        viewDashboardButton.addEventListener('click', function () {
            // Open the dashboard page in a new window
            chrome.windows.create({
                url: 'dashboard.html',
                type: 'popup',
                width: 1200,
                height: 800
            });
        });
    }
    
    // Function to highlight element when value changes
    function highlightElement(element) {
        element.classList.add('highlight');
        setTimeout(() => {
            element.classList.remove('highlight');
        }, 1500);
    }
});