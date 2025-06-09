// ==UserScript==
// @name         Proton Filter Optimizer
// @namespace    https://github.com/Aareon
// @version      1.3
// @description  Analyze and optimize Proton Mail filters with duplicate and disabled filter deletion
// @author       Aareon
// @match        https://mail.proton.me/*
// @match        https://account.proton.me/*
// @grant        none
// @license      Personal/Educational Only – No Commercial Use
// ==/UserScript==

(function() {
    'use strict';

    // Wait for page to load
    function waitForFiltersPage() {
        const observer = new MutationObserver((mutations, obs) => {
            // Check if we're on the filters page and filters are loaded
            const filterRows = document.querySelectorAll('td[role="cell"] div[title*=" - "]');
            if (filterRows.length > 0 && window.location.href.includes('filter')) {
                obs.disconnect();
                initializeOptimizer();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        // Also check immediately in case filters are already loaded
        setTimeout(() => {
            const filterRows = document.querySelectorAll('td[role="cell"] div[title*=" - "]');
            if (filterRows.length > 0 && window.location.href.includes('filter')) {
                initializeOptimizer();
            }
        }, 2000);
    }

    function initializeOptimizer() {
        // Prevent multiple initializations
        if (document.getElementById('filter-optimizer-panel')) {
            return;
        }

        const filters = analyzeFilters();
        createOptimizerPanel(filters);
    }

    function analyzeFilters() {
        const filterRows = document.querySelectorAll('td[role="cell"] div[title*=" - "]');
        const filters = [];
        const emailCount = {};
        const folderCount = {};
        const duplicates = [];

        filterRows.forEach((row, index) => {
            const titleText = row.getAttribute('title');
            if (titleText && titleText.includes(' - ')) {
                const parts = titleText.split(' - ');
                const email = parts[0].trim();
                const folder = parts[1].trim();

                // Extract filter ID from the checkbox input
                const checkbox = row.closest('tr').querySelector('input[type="checkbox"][id*="item-"]');
                const filterId = checkbox ? checkbox.id.replace('item-', '') : null;

                const filter = {
                    index: index,
                    email: email,
                    folder: folder,
                    filterId: filterId,
                    element: row.closest('tr'),
                    isEnabled: checkbox?.checked || false
                };

                filters.push(filter);

                // Count occurrences
                emailCount[email] = (emailCount[email] || 0) + 1;
                folderCount[folder] = (folderCount[folder] || 0) + 1;

                // Check for exact duplicates
                const duplicateKey = `${email}|||${folder}`;
                const existing = filters.find(f => f !== filter && `${f.email}|||${f.folder}` === duplicateKey);
                if (existing) {
                    duplicates.push({ original: existing, duplicate: filter });
                }
            }
        });

        return {
            all: filters,
            emailCount: emailCount,
            folderCount: folderCount,
            duplicates: duplicates,
            disabled: filters.filter(f => !f.isEnabled),
            byFolder: groupBy(filters, 'folder'),
            byEmail: groupBy(filters, 'email')
        };
    }

    function groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    }

    function getTheme() {
        // Check system preference
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

        // Check if Proton is using dark theme by looking at body classes or CSS variables
        const bodyClasses = document.body.className;
        const isDarkProton = bodyClasses.includes('dark') ||
                           bodyClasses.includes('theme-dark') ||
                           getComputedStyle(document.body).backgroundColor === 'rgb(33, 33, 33)' ||
                           getComputedStyle(document.documentElement).getPropertyValue('--background-norm').includes('33');

        return isDarkProton || prefersDark;
    }

    function getThemeColors(isDark) {
        if (isDark) {
            return {
                background: '#1a1a1a',
                surface: '#2d2d2d',
                surfaceVariant: '#3a3a3a',
                text: '#e0e0e0',
                textSecondary: '#b0b0b0',
                textMuted: '#808080',
                border: '#404040',
                accent: '#6d4aff',
                success: '#4caf50',
                warning: '#ff9800',
                error: '#f44336',
                disabled: '#555555'
            };
        } else {
            return {
                background: '#ffffff',
                surface: '#f8f9ff',
                surfaceVariant: '#f0f0f0',
                text: '#333333',
                textSecondary: '#555555',
                textMuted: '#666666',
                border: '#e0e0e0',
                accent: '#6d4aff',
                success: '#28a745',
                warning: '#ffc107',
                error: '#dc3545',
                disabled: '#6c757d'
            };
        }
    }

    function createOptimizerPanel(filters) {
        const isDark = getTheme();
        const colors = getThemeColors(isDark);

        const panel = document.createElement('div');
        panel.id = 'filter-optimizer-panel';
        panel.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 400px;
            max-height: 80vh;
            background: ${colors.background};
            border: 2px solid ${colors.accent};
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,${isDark ? '0.3' : '0.15'});
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            color: ${colors.text};
        `;

        const header = createHeader(colors);
        const content = createContent(filters, colors);

        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
    }

    function createHeader(colors) {
        const header = document.createElement('div');
        header.style.cssText = `
            background: ${colors.accent};
            color: white;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Filter Optimizer';
        title.style.margin = '0';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            border-radius: 4px;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'none';
        closeBtn.onclick = () => document.getElementById('filter-optimizer-panel').remove();

        header.appendChild(title);
        header.appendChild(closeBtn);
        return header;
    }

    function createContent(filters, colors) {
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 20px;
            max-height: calc(80vh - 60px);
            overflow-y: auto;
            background: ${colors.background};
        `;

        // Summary stats
        const stats = document.createElement('div');
        stats.style.cssText = `
            background: ${colors.surface};
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
            border: 1px solid ${colors.border};
        `;
        stats.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: ${colors.accent};">Summary</h4>
            <div style="color: ${colors.text}; margin: 5px 0;"><strong>Total Filters:</strong> ${filters.all.length}</div>
            <div style="color: ${colors.text}; margin: 5px 0;"><strong>Disabled Filters:</strong> ${filters.disabled.length}</div>
            <div style="color: ${colors.text}; margin: 5px 0;"><strong>Exact Duplicates:</strong> ${filters.duplicates.length}</div>
            <div style="color: ${colors.text}; margin: 5px 0;"><strong>Unique Emails:</strong> ${Object.keys(filters.emailCount).length}</div>
            <div style="color: ${colors.text}; margin: 5px 0;"><strong>Target Folders:</strong> ${Object.keys(filters.folderCount).length}</div>
        `;

        // Issues section
        const issues = document.createElement('div');
        issues.innerHTML = `<h4 style="color: ${colors.accent}; margin-bottom: 10px;">Optimization Opportunities</h4>`;

        // Exact duplicates
        if (filters.duplicates.length > 0) {
            const duplicateSection = createIssueSection('Exact Duplicates',
                filters.duplicates.map(d => `${d.duplicate.email} → ${d.duplicate.folder}`),
                'These filters are identical and can be merged.',
                colors
            );
            issues.appendChild(duplicateSection);
        }

        // Disabled filters
        if (filters.disabled.length > 0) {
            const disabledSection = createIssueSection('Disabled Filters',
                filters.disabled.map(f => `${f.email} → ${f.folder}`),
                'Consider removing these unused filters.',
                colors
            );
            issues.appendChild(disabledSection);
        }

        // Multiple filters per email
        const multiplePerEmail = Object.entries(filters.emailCount)
            .filter(([email, count]) => count > 1)
            .slice(0, 10); // Show top 10

        if (multiplePerEmail.length > 0) {
            const multiSection = createIssueSection('Emails with Multiple Filters',
                multiplePerEmail.map(([email, count]) => `${email} (${count} filters)`),
                'Consider consolidating these into single filters with multiple conditions.',
                colors
            );
            issues.appendChild(multiSection);
        }

        // Popular folders
        const popularFolders = Object.entries(filters.folderCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 8); // Show top 8

        if (popularFolders.length > 0) {
            const folderSection = createIssueSection('Most Used Folders',
                popularFolders.map(([folder, count]) => `${folder} (${count} filters)`),
                'Your most active filter destinations.',
                colors
            );
            issues.appendChild(folderSection);
        }

        // Action buttons
        const actions = document.createElement('div');
        actions.style.cssText = 'margin-top: 20px; text-align: center;';

        const highlightBtn = document.createElement('button');
        highlightBtn.textContent = 'Highlight Issues';
        highlightBtn.style.cssText = `
            background: ${colors.accent};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
            transition: all 0.2s ease;
        `;
        highlightBtn.onmouseover = () => highlightBtn.style.opacity = '0.8';
        highlightBtn.onmouseout = () => highlightBtn.style.opacity = '1';
        highlightBtn.onclick = () => highlightProblematicFilters(filters);

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = `Delete ${filters.duplicates.length} Duplicates`;
        deleteBtn.style.cssText = `
            background: ${filters.duplicates.length > 0 ? colors.error : colors.disabled};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: ${filters.duplicates.length > 0 ? 'pointer' : 'not-allowed'};
            margin: 5px;
            font-size: 14px;
            transition: all 0.2s ease;
        `;
        if (filters.duplicates.length > 0) {
            deleteBtn.onmouseover = () => deleteBtn.style.opacity = '0.8';
            deleteBtn.onmouseout = () => deleteBtn.style.opacity = '1';
        }
        deleteBtn.disabled = filters.duplicates.length === 0;
        deleteBtn.onclick = () => deleteDuplicateFilters(filters);

        // NEW: Delete disabled filters button
        const deleteDisabledBtn = document.createElement('button');
        deleteDisabledBtn.textContent = `Delete ${filters.disabled.length} Disabled`;
        deleteDisabledBtn.style.cssText = `
            background: ${filters.disabled.length > 0 ? colors.warning : colors.disabled};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: ${filters.disabled.length > 0 ? 'pointer' : 'not-allowed'};
            margin: 5px;
            font-size: 14px;
            transition: all 0.2s ease;
        `;
        if (filters.disabled.length > 0) {
            deleteDisabledBtn.onmouseover = () => deleteDisabledBtn.style.opacity = '0.8';
            deleteDisabledBtn.onmouseout = () => deleteDisabledBtn.style.opacity = '1';
        }
        deleteDisabledBtn.disabled = filters.disabled.length === 0;
        deleteDisabledBtn.onclick = () => deleteDisabledFilters(filters);

        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export Analysis';
        exportBtn.style.cssText = `
            background: ${colors.success};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
            transition: all 0.2s ease;
        `;
        exportBtn.onmouseover = () => exportBtn.style.opacity = '0.8';
        exportBtn.onmouseout = () => exportBtn.style.opacity = '1';
        exportBtn.onclick = () => exportAnalysis(filters);

        actions.appendChild(highlightBtn);
        actions.appendChild(deleteBtn);
        actions.appendChild(deleteDisabledBtn); // Add the new button
        actions.appendChild(exportBtn);

        content.appendChild(stats);
        content.appendChild(issues);
        content.appendChild(actions);
        return content;
    }

    function createIssueSection(title, items, description, colors) {
        const section = document.createElement('div');
        section.style.cssText = 'margin-bottom: 15px;';

        const header = document.createElement('div');
        header.style.cssText = `font-weight: bold; margin-bottom: 5px; color: ${colors.text};`;
        header.textContent = `${title} (${items.length})`;

        const desc = document.createElement('div');
        desc.style.cssText = `font-size: 12px; color: ${colors.textMuted}; margin-bottom: 8px;`;
        desc.textContent = description;

        const list = document.createElement('div');
        list.style.cssText = `
            max-height: 120px;
            overflow-y: auto;
            background: ${colors.surfaceVariant};
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            border: 1px solid ${colors.border};
        `;

        items.slice(0, 10).forEach(item => {
            const div = document.createElement('div');
            div.style.cssText = `padding: 2px 0; border-bottom: 1px solid ${colors.border}; color: ${colors.textSecondary};`;
            div.textContent = item;
            list.appendChild(div);
        });

        if (items.length > 10) {
            const more = document.createElement('div');
            more.style.cssText = `padding: 5px 0; font-style: italic; color: ${colors.textMuted};`;
            more.textContent = `... and ${items.length - 10} more`;
            list.appendChild(more);
        }

        section.appendChild(header);
        section.appendChild(desc);
        section.appendChild(list);
        return section;
    }

    function highlightProblematicFilters(filters) {
        const isDark = getTheme();

        // Remove existing highlights
        document.querySelectorAll('.filter-highlight').forEach(el => {
            el.classList.remove('filter-highlight');
            el.style.background = '';
        });

        // Color schemes for highlighting
        const highlightColors = isDark ? {
            duplicate: '#4a1e1e', // Dark red
            disabled: '#4a3b1e'   // Dark yellow
        } : {
            duplicate: '#ffebee', // Light red
            disabled: '#fff3cd'   // Light yellow
        };

        // Highlight duplicates
        filters.duplicates.forEach(dup => {
            if (dup.duplicate.element) {
                dup.duplicate.element.style.background = highlightColors.duplicate;
                dup.duplicate.element.classList.add('filter-highlight');
            }
        });

        // Highlight disabled
        filters.disabled.forEach(filter => {
            if (filter.element) {
                filter.element.style.background = highlightColors.disabled;
                filter.element.classList.add('filter-highlight');
            }
        });

        // Show notification
        showNotification('Problematic filters have been highlighted!');
    }

    // NEW: Function to delete disabled filters
    async function deleteDisabledFilters(filters) {
        if (filters.disabled.length === 0) {
            showNotification('No disabled filters found to delete.');
            return;
        }

        const confirmDelete = confirm(
            `Are you sure you want to delete ${filters.disabled.length} disabled filters?\n\n` +
            'This action cannot be undone. This will permanently remove all filters that are currently disabled.'
        );

        if (!confirmDelete) return;

        showNotification('Analyzing authentication methods...', 8000);

        // Debug current state
        debugCurrentRequests();
        await tryManualAPICall();

        // Try to get proper authentication
        const authFromStorage = getAuthFromStorage();
        const altAuth = tryAlternativeAuth();

        let authHeaders;

        if (authFromStorage) {
            console.log('Using auth from storage. UID:', authFromStorage.uid);

            authHeaders = {
                'Accept': 'application/vnd.protonmail.v1+json',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'x-pm-appversion': authFromStorage.appVersion,
                'x-pm-uid': authFromStorage.uid,
                'Origin': window.location.origin,
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'DNT': '1',
                'Sec-GPC': '1',
                'Priority': 'u=0',
                'TE': 'trailers'
            };

            console.log('Using cookie-based authentication...');

        } else {
            showNotification(
                'Authentication Error!\n\n' +
                'Unable to extract authentication data from session.\n' +
                'Check browser console for detailed analysis.',
                10000
            );
            return;
        }

        showNotification('Deleting disabled filters... Please wait.', 10000);

        let deletedCount = 0;
        let failedCount = 0;

        // Process disabled filters one by one to avoid overwhelming the server
        for (const disabledFilter of filters.disabled) {
            const filterId = disabledFilter.filterId;

            if (!filterId) {
                console.warn('No filter ID found for disabled filter:', disabledFilter);
                failedCount++;
                continue;
            }

            try {
                const apiUrl = window.location.hostname === 'mail.proton.me'
                    ? `https://mail.proton.me/api/mail/v4/filters/${filterId}`
                    : `https://account.proton.me/api/mail/v4/filters/${filterId}`;

                console.log(`Attempting to delete disabled filter ${filterId} at ${apiUrl}: ${disabledFilter.email} → ${disabledFilter.folder}`);

                const response = await fetch(apiUrl, {
                    method: 'DELETE',
                    headers: authHeaders,
                    credentials: 'include'  // This is crucial - includes cookies
                });

                console.log(`Response for ${filterId}:`, response.status, response.statusText);

                if (response.ok) {
                    const result = await response.json();
                    console.log(`API response for ${filterId}:`, result);

                    if (result.Code === 1000) {
                        deletedCount++;
                        // Remove the row from the UI
                        if (disabledFilter.element) {
                            disabledFilter.element.style.opacity = '0.3';
                            disabledFilter.element.style.textDecoration = 'line-through';
                        }
                        console.log(`Successfully deleted disabled filter: ${disabledFilter.email} → ${disabledFilter.folder}`);
                    } else {
                        console.error('API returned error code:', result.Code, result);
                        failedCount++;
                    }
                } else {
                    const errorText = await response.text();
                    console.error('Failed to delete disabled filter:', response.status, response.statusText, errorText);
                    failedCount++;

                    // If we get authentication errors, stop and show helpful message
                    if (response.status === 401 || response.status === 403) {
                        showNotification('Authentication failed!\n\nPlease refresh the page and try again.\nYou may need to log out and log back in.', 8000);
                        return;
                    }
                }

                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error('Error deleting disabled filter:', error);
                failedCount++;
            }
        }

        // Show completion message
        let message = `Disabled filter deletion complete!\n\nDeleted: ${deletedCount}`;
        if (failedCount > 0) {
            message += `\nFailed: ${failedCount}`;
        }
        message += '\n\nPage will refresh in 3 seconds to update the filter list.';

        showNotification(message, 5000);

        // Refresh the page after a delay to show updated filter list
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }

    async function deleteDuplicateFilters(filters) {
        if (filters.duplicates.length === 0) {
            showNotification('No duplicate filters found to delete.');
            return;
        }

        const confirmDelete = confirm(
            `Are you sure you want to delete ${filters.duplicates.length} duplicate filters?\n\n` +
            'This action cannot be undone. The script will keep the first occurrence of each duplicate and remove the rest.'
        );

        if (!confirmDelete) return;

        showNotification('Analyzing authentication methods...', 8000);

        // Debug current state
        debugCurrentRequests();
        await tryManualAPICall();

        // Try to get proper authentication
        const authFromStorage = getAuthFromStorage();
        const altAuth = tryAlternativeAuth();

        let authHeaders;

        if (authFromStorage) {
            console.log('Using auth from storage. UID:', authFromStorage.uid);

            authHeaders = {
                'Accept': 'application/vnd.protonmail.v1+json',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br, zstd',
                'x-pm-appversion': authFromStorage.appVersion,
                'x-pm-uid': authFromStorage.uid,
                'Origin': window.location.origin,
                'Connection': 'keep-alive',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'DNT': '1',
                'Sec-GPC': '1',
                'Priority': 'u=0',
                'TE': 'trailers'
            };

            // The key insight: we need to rely on cookies for auth, not headers
            console.log('Using cookie-based authentication...');

        } else {
            showNotification(
                'Authentication Error!\n\n' +
                'Unable to extract authentication data from session.\n' +
                'Check browser console for detailed analysis.',
                10000
            );
            return;
        }

        showNotification('Deleting duplicate filters... Please wait.', 10000);

        let deletedCount = 0;
        let failedCount = 0;

        // Process duplicates one by one to avoid overwhelming the server
        for (const duplicate of filters.duplicates) {
            const filterId = duplicate.duplicate.filterId;

            if (!filterId) {
                console.warn('No filter ID found for duplicate:', duplicate.duplicate);
                failedCount++;
                continue;
            }

            try {
                const apiUrl = window.location.hostname === 'mail.proton.me'
                    ? `https://mail.proton.me/api/mail/v4/filters/${filterId}`
                    : `https://account.proton.me/api/mail/v4/filters/${filterId}`;

                console.log(`Attempting to delete filter ${filterId} at ${apiUrl}: ${duplicate.duplicate.email} → ${duplicate.duplicate.folder}`);

                const response = await fetch(apiUrl, {
                    method: 'DELETE',
                    headers: authHeaders,
                    credentials: 'include'  // This is crucial - includes cookies
                });

                console.log(`Response for ${filterId}:`, response.status, response.statusText);

                if (response.ok) {
                    const result = await response.json();
                    console.log(`API response for ${filterId}:`, result);

                    if (result.Code === 1000) {
                        deletedCount++;
                        // Remove the row from the UI
                        if (duplicate.duplicate.element) {
                            duplicate.duplicate.element.style.opacity = '0.3';
                            duplicate.duplicate.element.style.textDecoration = 'line-through';
                        }
                        console.log(`Successfully deleted filter: ${duplicate.duplicate.email} → ${duplicate.duplicate.folder}`);
                    } else {
                        console.error('API returned error code:', result.Code, result);
                        failedCount++;
                    }
                } else {
                    const errorText = await response.text();
                    console.error('Failed to delete filter:', response.status, response.statusText, errorText);
                    failedCount++;

                    // If we get authentication errors, stop and show helpful message
                    if (response.status === 401 || response.status === 403) {
                        showNotification('Authentication failed!\n\nPlease refresh the page and try again.\nYou may need to log out and log back in.', 8000);
                        return;
                    }
                }

                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error) {
                console.error('Error deleting filter:', error);
                failedCount++;
            }
        }

        // Show completion message
        let message = `Deletion complete!\n\nDeleted: ${deletedCount}`;
        if (failedCount > 0) {
            message += `\nFailed: ${failedCount}`;
        }
        message += '\n\nPage will refresh in 3 seconds to update the filter list.';

        showNotification(message, 5000);

        // Refresh the page after a delay to show updated filter list
        setTimeout(() => {
            window.location.reload();
        }, 3000);
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    function debugCurrentRequests() {
        console.log('=== DEBUGGING CURRENT AUTHENTICATION ===');

        // Check what requests are currently happening
        if (window.performance && window.performance.getEntriesByType) {
            const requests = window.performance.getEntriesByType('resource');
            const recentRequests = requests.filter(r =>
                r.name.includes('proton') &&
                Date.now() - r.startTime < 30000 // Last 30 seconds
            );

            console.log('Recent Proton requests:', recentRequests.map(r => ({
                url: r.name,
                method: r.initiatorType,
                time: new Date(r.startTime).toISOString()
            })));
        }

        // Check what's in the ps-0 data more thoroughly
        try {
            const ps0 = localStorage.getItem('ps-0');
            if (ps0) {
                const data = JSON.parse(ps0);
                console.log('Complete ps-0 structure:', Object.keys(data));

                // Look for any token-like fields
                for (const [key, value] of Object.entries(data)) {
                    if (typeof value === 'string' && value.length > 20 &&
                        (key.toLowerCase().includes('token') ||
                         key.toLowerCase().includes('auth') ||
                         key.toLowerCase().includes('key') ||
                         value.startsWith('Bearer ') ||
                         /^[A-Za-z0-9+/]+=*$/.test(value))) {
                        console.log(`Potential token field: ${key} = ${value.substring(0, 50)}...`);
                    }
                }
            }
        } catch (e) {
            console.log('Error parsing ps-0:', e);
        }

        // Check for any global variables that might contain auth
        const globalVars = ['__REDUX_STATE__', '__INITIAL_STATE__', 'window.proton', 'window.pmcrypto'];
        for (const varName of globalVars) {
            try {
                const value = eval(varName);
                if (value) {
                    console.log(`Found global variable: ${varName}`, typeof value);
                }
            } catch (e) {
                // Variable doesn't exist
            }
        }

        console.log('=== END DEBUG ===');
    }

    async function tryManualAPICall() {
        console.log('Attempting manual API call to understand auth...');

        // Try to make a simple GET request to see what auth is needed
        try {
            const response = await fetch('/api/core/v4/events/latest', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Accept': 'application/vnd.protonmail.v1+json'
                }
            });

            console.log('Manual API call result:', response.status, response.statusText);

            if (response.status === 401) {
                console.log('401 - Need authentication');
                const errorData = await response.json();
                console.log('Auth error details:', errorData);
            } else if (response.ok) {
                console.log('Request succeeded - authentication might be cookie-based');
            }

        } catch (error) {
            console.log('Manual API call failed:', error);
        }
    }

    function getAuthFromStorage() {
        try {
            console.log('Checking localStorage for auth data...');

            // Method 1: Check 'ps-0' which contains the correct UID
            const ps0 = localStorage.getItem('ps-0');
            if (ps0) {
                console.log('Found ps-0:', ps0.substring(0, 100) + '...');
                try {
                    const parsed = JSON.parse(ps0);
                    console.log('ps-0 fields:', Object.keys(parsed));

                    // The UID field contains the correct session UID
                    if (parsed && parsed.UID) {
                        console.log('Found correct UID in ps-0:', parsed.UID);

                        // Look for session cookies that should match this UID
                        const authCookieName = `AUTH-${parsed.UID}`;
                        const authCookieValue = getCookie(authCookieName);

                        console.log('Looking for cookie:', authCookieName);
                        console.log('Cookie value found:', !!authCookieValue);

                        if (authCookieValue) {
                            return {
                                uid: parsed.UID,
                                authCookie: authCookieValue,
                                appVersion: 'web-account@5.0.253.1'
                            };
                        } else {
                            // Try without the AUTH cookie but with the UID
                            console.log('No AUTH cookie found, trying with UID only');
                            return {
                                uid: parsed.UID,
                                appVersion: 'web-account@5.0.253.1'
                            };
                        }
                    }

                    // Fallback to UserID if UID not found
                    if (parsed && parsed.UserID) {
                        console.log('Using UserID as fallback:', parsed.UserID);
                        return {
                            uid: parsed.UserID,
                            appVersion: 'web-account@5.0.253.1'
                        };
                    }
                } catch (e) {
                    console.log('Failed to parse ps-0:', e);
                }
            }

            console.log('No suitable auth data found in localStorage');
            return null;

        } catch (error) {
            console.log('Error checking storage:', error);
            return null;
        }
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            const cookieValue = parts.pop().split(';').shift();
            console.log(`Cookie ${name}:`, cookieValue ? 'found' : 'not found');
            return cookieValue;
        }
        return null;
    }

    function tryAlternativeAuth() {
        // Based on the HAR file, let's try to reconstruct the session
        console.log('Trying alternative authentication methods...');

        // Check all available cookies
        const allCookies = document.cookie.split(';').reduce((acc, cookie) => {
            const [name, value] = cookie.trim().split('=');
            acc[name] = value;
            return acc;
        }, {});

        console.log('All available cookies:', Object.keys(allCookies));

        // Look for any Session-Id cookie
        const sessionId = allCookies['Session-Id'];
        if (sessionId) {
            console.log('Found Session-Id cookie:', sessionId);
            return { sessionId, hasSessionCookie: true };
        }

        return null;
    }

    function getUidFromCookies() {
        console.log('Current domain:', window.location.hostname);
        console.log('Current URL:', window.location.href);
        console.log('All cookies:', document.cookie);

        // Method 1: Look for any AUTH- cookie
        const cookies = document.cookie.split(';');
        let authCookie = null;

        for (let cookie of cookies) {
            const trimmed = cookie.trim();
            if (trimmed.startsWith('AUTH-')) {
                const parts = trimmed.split('=');
                const cookieName = parts[0];
                const cookieValue = parts[1];
                const uid = cookieName.replace('AUTH-', '');

                console.log('Found AUTH cookie:', { cookieName, uid, hasValue: !!cookieValue });

                if (uid && uid.length > 10 && cookieValue) { // Basic validation
                    authCookie = uid;
                    break;
                }
            }
        }

        // Method 2: Try different cookie formats
        if (!authCookie) {
            const allCookieNames = cookies.map(c => c.trim().split('=')[0]);
            console.log('All cookie names:', allCookieNames);

            // Look for Session-Id or other auth-related cookies
            const sessionCookie = getCookie('Session-Id');
            if (sessionCookie) {
                console.log('Found Session-Id cookie:', sessionCookie);
                // Session-Id might be used differently
            }
        }

        console.log('Final UID from cookies:', authCookie);
        return authCookie;
    }

    async function getAuthHeaders() {
        // First try cookies
        const uid = getUidFromCookies();

        if (uid) {
            console.log('Using UID from cookies:', uid);
            return {
                'Accept': 'application/vnd.protonmail.v1+json',
                'Accept-Language': 'en-US,en;q=0.5',
                'x-pm-appversion': 'web-account@5.0.253.1',
                'x-pm-uid': uid,
                'Origin': window.location.origin,
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            };
        }

        // If no UID from cookies, try other methods
        console.log('No UID from cookies, trying alternative methods...');

        const authFromStorage = getAuthFromStorage();
        if (authFromStorage) {
            console.log('Using auth from storage:', authFromStorage.uid);
            const headers = {
                'Accept': 'application/vnd.protonmail.v1+json',
                'Accept-Language': 'en-US,en;q=0.5',
                'x-pm-appversion': authFromStorage.appVersion,
                'x-pm-uid': authFromStorage.uid,
                'Origin': window.location.origin,
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            };

            // Add access token if available
            if (authFromStorage.accessToken) {
                headers['Authorization'] = `Bearer ${authFromStorage.accessToken}`;
                console.log('Added Authorization header with access token');
            }

            return headers;
        }

        // Try to get auth from network requests
        const authFromRequests = await getAuthFromRequests();
        if (authFromRequests) {
            console.log('Using auth from requests:', authFromRequests.uid);
            const headers = {
                'Accept': 'application/vnd.protonmail.v1+json',
                'Accept-Language': 'en-US,en;q=0.5',
                'x-pm-appversion': authFromRequests.appVersion,
                'x-pm-uid': authFromRequests.uid,
                'Origin': window.location.origin,
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin'
            };

            if (authFromRequests.accessToken) {
                headers['Authorization'] = `Bearer ${authFromRequests.accessToken}`;
            }

            return headers;
        }

        console.error('No authentication method worked. Available data:', {
            cookies: document.cookie.split(';').map(c => c.trim().split('=')[0]),
            domain: window.location.hostname,
            localStorage: Object.keys(localStorage),
            sessionStorage: Object.keys(sessionStorage)
        });

        return null;
    }

    function exportAnalysis(filters) {
        const analysis = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFilters: filters.all.length,
                disabledFilters: filters.disabled.length,
                exactDuplicates: filters.duplicates.length,
                uniqueEmails: Object.keys(filters.emailCount).length,
                targetFolders: Object.keys(filters.folderCount).length
            },
            duplicates: filters.duplicates.map(d => ({
                email: d.duplicate.email,
                folder: d.duplicate.folder,
                filterId: d.duplicate.filterId
            })),
            disabled: filters.disabled.map(f => ({
                email: f.email,
                folder: f.folder,
                filterId: f.filterId
            })),
            emailFrequency: filters.emailCount,
            folderFrequency: filters.folderCount,
            allFilters: filters.all.map(f => ({
                email: f.email,
                folder: f.folder,
                enabled: f.isEnabled,
                filterId: f.filterId
            }))
        };

        const blob = new Blob([JSON.stringify(analysis, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proton-filter-analysis-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('Analysis exported successfully!');
    }

    function showNotification(message, duration = 3000) {
        // Remove any existing notifications
        const existing = document.getElementById('filter-optimizer-notification');
        if (existing) {
            existing.remove();
        }

        const isDark = getTheme();
        const colors = getThemeColors(isDark);

        const notification = document.createElement('div');
        notification.id = 'filter-optimizer-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${colors.success};
            color: white;
            padding: 15px 25px;
            border-radius: 6px;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0,0,0,${isDark ? '0.3' : '0.15'});
            max-width: 400px;
            text-align: center;
            white-space: pre-line;
            border: 1px solid ${colors.border};
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        if (duration > 0) {
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, duration);
        }
    }

    // Initialize when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForFiltersPage);
    } else {
        waitForFiltersPage();
    }

})();
