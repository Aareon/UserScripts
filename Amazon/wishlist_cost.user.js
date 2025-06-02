// ==UserScript==
// @name         Amazon Wishlist Total Cost Calculator
// @namespace    https://github.com/Aareon
// @version      1.0
// @description  Calculate and display total cost of Amazon wishlist items with coupon detection
// @author       Aareon
// @match        https://www.amazon.com/hz/wishlist/*
// @match        https://amazon.com/hz/wishlist/*
// @grant        none
// @license      Personal/Educational Only – No Commercial Use
// ==/UserScript==

(function () {
    'use strict';

    function calculateWishlistTotal() {
        // Find all items in the wishlist
        const itemWrapper = document.getElementById('item-page-wrapper');
        if (!itemWrapper) return;

        let totalCost = 0;
        let itemCount = 0;
        let discountInfo = [];

        // Find all price elements
        const priceElements = document.querySelectorAll('[id^="itemPrice_"]');

        priceElements.forEach(priceElement => {
            // Extract price from the offscreen text (most reliable)
            const offscreenPrice = priceElement.querySelector('.a-offscreen');
            if (offscreenPrice) {
                const priceText = offscreenPrice.textContent.trim();
                // Remove $ and convert to number
                const price = parseFloat(priceText.replace(/[$,]/g, ''));
                if (!isNaN(price)) {
                    totalCost += price;
                    itemCount++;
                }
            }
        });

        // Look for any discount/coupon information
        const couponSelectors = [
            '.a-coupon',
            '.s-coupon-highlight',
            '[data-coupon]',
            '.wl-coupon-badge-t1',
            '[id^="coupon-badge_"]',
            '.a-icon-addon',
            '[class*="coupon"]',
            '[data-csa-c-element-id*="coupon"]'
        ];

        const couponElements = document.querySelectorAll(couponSelectors.join(', '));
        const processedCoupons = new Set(); // Avoid duplicates

        couponElements.forEach(coupon => {
            const couponText = coupon.textContent.trim();
            if (couponText && !processedCoupons.has(couponText)) {
                // Check if it's a "You pay" coupon badge
                if (couponText.includes('You pay $')) {
                    const match = couponText.match(/You pay \$(\d+\.?\d*)/);
                    if (match) {
                        discountInfo.push(`Coupon price: $${match[1]}`);
                    }
                } else if (isValidCouponText(couponText)) {
                    discountInfo.push(couponText);
                }
                processedCoupons.add(couponText);
            }
        });

        // Also look for percentage discounts and save amounts
        const discountElements = document.querySelectorAll('.a-color-price, .a-color-secondary, [class*="discount"], [class*="save"]');
        discountElements.forEach(element => {
            const text = element.textContent.trim();
            if (isValidDiscountText(text) && !processedCoupons.has(text)) {
                discountInfo.push(text);
                processedCoupons.add(text);
            }
        });

        // Create or update the total display
        displayTotal(totalCost, itemCount, discountInfo);
    }

    function isValidCouponText(text) {
        const lowerText = text.toLowerCase();

        // Filter out vague or unhelpful coupon text
        const excludePatterns = [
            'with coupon',
            'coupon available',
            'see coupon',
            'clip coupon',
            'get coupon',
            'apply coupon'
        ];

        if (excludePatterns.some(pattern => lowerText === pattern)) {
            return false;
        }

        // Include text that has specific discount information
        return (
            text.includes('%') ||
            text.includes('$') ||
            (lowerText.includes('coupon') && text.length > 10) || // Longer coupon descriptions
            text.match(/\d+/) // Contains numbers
        );
    }

    function isValidDiscountText(text) {
        const lowerText = text.toLowerCase();

        // Must contain useful discount information
        return (
            (lowerText.includes('save') && text.match(/\$?\d+/)) ||
            (text.includes('%') && lowerText.includes('off')) ||
            text.match(/save \$\d+/i) ||
            text.match(/\d+% off/i)
        );
    }

    function displayTotal(total, count, discounts) {
        // Find the list header
        const listHeader = document.getElementById('list-header');
        if (!listHeader) return;

        // Remove existing total display if it exists
        const existingTotal = document.getElementById('wishlist-total-display');
        if (existingTotal) {
            existingTotal.remove();
        }

        // Create total display element
        const totalDisplay = document.createElement('div');
        totalDisplay.id = 'wishlist-total-display';
        totalDisplay.style.cssText = `
            background: #f0f2f2;
            border: 1px solid #d5d9d9;
            border-radius: 8px;
            padding: 12px 16px;
            margin: 10px 0;
            font-family: "Amazon Ember", Arial, sans-serif;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        // Create content
        let content = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                <div>
                    <span style="font-size: 16px; font-weight: bold; color: #0F1111;">
                        Total: $${total.toFixed(2)}
                    </span>
                    <span style="font-size: 14px; color: #565959; margin-left: 8px;">
                        (${count} item${count !== 1 ? 's' : ''})
                    </span>
                </div>
        `;

        // Add Prime shipping info if available
        const primeElements = document.querySelectorAll('.a-icon-prime, [aria-label*="prime"]');
        if (primeElements.length > 0) {
            content += `
                <div style="font-size: 12px; color: #007185;">
                    <i style="color: #00A8CC;">★</i> Prime eligible items included
                </div>
            `;
        }

        content += '</div>';

        // Add discount information if any
        if (discounts.length > 0) {
            content += `
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #d5d9d9;">
                    <div style="font-size: 12px; color: #B12704; font-weight: bold;">
                        💰 Available discounts & coupons:
                    </div>
                    <div style="font-size: 11px; color: #565959; margin-top: 4px; line-height: 1.3;">
                        ${discounts.map(discount => `<div style="margin: 2px 0;">• ${discount}</div>`).join('')}
                    </div>
                </div>
            `;
        }

        // Add note about calculations
        content += `
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #d5d9d9; font-size: 11px; color: #565959;">
                💡 Total calculated from current displayed prices. Coupon prices and final costs may vary due to taxes, shipping, eligibility, or price changes.
            </div>
        `;

        totalDisplay.innerHTML = content;

        // Insert after the list info section
        const listInfo = document.getElementById('wl-list-info');
        if (listInfo) {
            listInfo.insertAdjacentElement('afterend', totalDisplay);
        } else {
            // Fallback: insert at the beginning of list header
            listHeader.insertBefore(totalDisplay, listHeader.firstChild);
        }
    }

    function showButtonLoading(button) {
        button.disabled = true;
        button.style.opacity = '0.7';
        button.style.cursor = 'not-allowed';

        // Create spinning animation keyframes
        const style = document.createElement('style');
        style.textContent = `
            @keyframes wishlist-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            .wishlist-loading {
                animation: wishlist-spin 1s linear infinite;
                display: inline-block;
            }
        `;
        if (!document.head.querySelector('style[data-wishlist-animation]')) {
            style.setAttribute('data-wishlist-animation', 'true');
            document.head.appendChild(style);
        }

        button.innerHTML = '<span class="wishlist-loading">⏳</span> Calculating...';
    }

    function hideButtonLoading(button) {
        button.disabled = false;
        button.style.opacity = '1';
        button.style.cursor = 'pointer';
        button.innerHTML = '🔄 Recalculate Total';
    }

    function addRefreshButton() {
        // Add a small refresh button to recalculate
        const listHeader = document.getElementById('list-header');
        if (!listHeader) return;

        // Check if button already exists
        if (document.getElementById('wishlist-refresh-btn')) return;

        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'wishlist-refresh-btn';
        refreshBtn.innerHTML = '🔄 Recalculate Total';
        refreshBtn.style.cssText = `
            background: #ffd814;
            border: 1px solid #fcd200;
            border-radius: 8px;
            padding: 6px 12px;
            font-size: 12px;
            cursor: pointer;
            margin: 5px 0;
            font-family: "Amazon Ember", Arial, sans-serif;
            transition: opacity 0.2s ease;
        `;

        refreshBtn.onclick = async function () {
            showButtonLoading(this);

            // Add a small delay to show the loading animation
            await new Promise(resolve => setTimeout(resolve, 300));

            try {
                calculateWishlistTotal();
            } catch (error) {
                console.error('Error calculating wishlist total:', error);
            }

            // Wait a bit more to ensure the calculation is complete
            await new Promise(resolve => setTimeout(resolve, 500));

            hideButtonLoading(this);
        };

        listHeader.appendChild(refreshBtn);
    }

    // Initialize the script
    function init() {
        // Wait for page to load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        // Small delay to ensure all elements are rendered
        setTimeout(() => {
            calculateWishlistTotal();
            addRefreshButton();
        }, 1000);

        // Watch for changes in the wishlist (when items are added/removed)
        const observer = new MutationObserver((mutations) => {
            let shouldRecalculate = false;
            mutations.forEach((mutation) => {
                // Check if any price elements or items were added/removed
                if (mutation.type === 'childList') {
                    const hasItemChanges = Array.from(mutation.addedNodes)
                        .concat(Array.from(mutation.removedNodes))
                        .some(node =>
                            node.nodeType === 1 &&
                            (node.id && node.id.includes('item_') ||
                                node.querySelector && node.querySelector('[id^="itemPrice_"]'))
                        );
                    if (hasItemChanges) {
                        shouldRecalculate = true;
                    }
                }
            });

            if (shouldRecalculate) {
                setTimeout(calculateWishlistTotal, 500);
            }
        });

        // Start observing
        const itemWrapper = document.getElementById('item-page-wrapper');
        if (itemWrapper) {
            observer.observe(itemWrapper, {
                childList: true,
                subtree: true
            });
        }
    }

    // Start the script
    init();
})();