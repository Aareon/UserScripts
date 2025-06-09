// ==UserScript==
// @name         Proton Filter to Sieve Converter
// @namespace    https://github.com/Aareon
// @version      1.0
// @description  Convert multiple Proton Mail filters pointing to the same folder into optimized sieve scripts
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
                initializeSieveConverter();
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
                initializeSieveConverter();
            }
        }, 2000);
    }

    function initializeSieveConverter() {
        // Prevent multiple initializations
        if (document.getElementById('sieve-converter-panel')) {
            return;
        }

        const filters = analyzeFilters();
        createSieveConverterPanel(filters);
    }

    function analyzeFilters() {
        const filterRows = document.querySelectorAll('td[role="cell"] div[title*=" - "]');
        const filters = [];
        const folderGroups = {};

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

                // Group by folder
                if (!folderGroups[folder]) {
                    folderGroups[folder] = [];
                }
                folderGroups[folder].push(filter);
            }
        });

        // Find folders with multiple filters (candidates for consolidation)
        const consolidationCandidates = Object.entries(folderGroups)
            .filter(([folder, filterList]) => filterList.length > 1)
            .map(([folder, filterList]) => ({
                folder: folder,
                filters: filterList,
                count: filterList.length
            }))
            .sort((a, b) => b.count - a.count);

        return {
            all: filters,
            folderGroups: folderGroups,
            consolidationCandidates: consolidationCandidates
        };
    }

    function getTheme() {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
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
                info: '#2196f3'
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
                info: '#17a2b8'
            };
        }
    }

    function createSieveConverterPanel(filters) {
        const isDark = getTheme();
        const colors = getThemeColors(isDark);

        const panel = document.createElement('div');
        panel.id = 'sieve-converter-panel';

        // Smart positioning to avoid overlap with other filter scripts
        const position = getSmartPosition();

        panel.style.cssText = `
            position: fixed;
            top: ${position.top}px;
            left: ${position.left}px;
            width: 500px;
            max-height: 85vh;
            background: ${colors.background};
            border: 2px solid ${colors.accent};
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,${isDark ? '0.3' : '0.15'});
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            overflow: hidden;
            color: ${colors.text};
            cursor: move;
            user-select: none;
        `;

        const header = createHeader(colors, panel);
        const content = createContent(filters, colors);

        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);

        // Make the panel draggable
        makeDraggable(panel, header);
    }

    function getSmartPosition() {
        // Check if the filter optimizer panel exists
        const optimizerPanel = document.getElementById('filter-optimizer-panel');

        if (optimizerPanel) {
            const rect = optimizerPanel.getBoundingClientRect();
            // Position to the left of the optimizer panel
            return {
                top: Math.max(20, rect.top),
                left: Math.max(20, rect.left - 520) // 500px width + 20px gap
            };
        }

        // Default position if no other panel exists
        return {
            top: 20,
            left: window.innerWidth - 520 // 500px width + 20px margin
        };
    }

    function makeDraggable(panel, dragHandle) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        dragHandle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            // Only drag if clicking on the header, not buttons
            if (e.target.tagName === 'BUTTON') return;

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === dragHandle || dragHandle.contains(e.target)) {
                isDragging = true;
                panel.style.cursor = 'grabbing';
                dragHandle.style.cursor = 'grabbing';
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                // Constrain to viewport
                const maxX = window.innerWidth - panel.offsetWidth;
                const maxY = window.innerHeight - panel.offsetHeight;

                currentX = Math.max(0, Math.min(currentX, maxX));
                currentY = Math.max(0, Math.min(currentY, maxY));

                panel.style.left = currentX + 'px';
                panel.style.top = currentY + 'px';
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;

            isDragging = false;
            panel.style.cursor = 'move';
            dragHandle.style.cursor = 'move';
        }

        // Set initial offsets based on current position
        const rect = panel.getBoundingClientRect();
        xOffset = rect.left;
        yOffset = rect.top;
    }

    function createHeader(colors, panel) {
        const header = document.createElement('div');
        header.style.cssText = `
            background: ${colors.accent};
            color: white;
            padding: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
            user-select: none;
        `;

        const titleContainer = document.createElement('div');
        titleContainer.style.cssText = 'display: flex; align-items: center; gap: 10px;';

        const dragIcon = document.createElement('span');
        dragIcon.innerHTML = '⋮⋮';
        dragIcon.style.cssText = `
            font-size: 16px;
            opacity: 0.7;
            cursor: move;
            line-height: 1;
            letter-spacing: -2px;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Sieve Filter Converter';
        title.style.margin = '0';

        titleContainer.appendChild(dragIcon);
        titleContainer.appendChild(title);

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
            user-select: none;
        `;
        closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255,255,255,0.2)';
        closeBtn.onmouseout = () => closeBtn.style.background = 'none';
        closeBtn.onclick = () => document.getElementById('sieve-converter-panel').remove();

        header.appendChild(titleContainer);
        header.appendChild(closeBtn);
        return header;
    }

    function createContent(filters, colors) {
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 20px;
            max-height: calc(85vh - 60px);
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

        const consolidatableFilters = filters.consolidationCandidates.reduce((sum, group) => sum + group.count, 0);
        const potentialSaves = filters.consolidationCandidates.length;

        stats.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: ${colors.accent};">Consolidation Analysis</h4>
            <div style="color: ${colors.text}; margin: 5px 0;"><strong>Total Filters:</strong> ${filters.all.length}</div>
            <div style="color: ${colors.text}; margin: 5px 0;"><strong>Folders with Multiple Filters:</strong> ${filters.consolidationCandidates.length}</div>
            <div style="color: ${colors.text}; margin: 5px 0;"><strong>Filters that can be Consolidated:</strong> ${consolidatableFilters}</div>
            <div style="color: ${colors.success}; margin: 5px 0;"><strong>Potential Filter Reduction:</strong> ${consolidatableFilters - potentialSaves} filters</div>
        `;

        // Consolidation candidates
        const candidatesSection = document.createElement('div');
        candidatesSection.innerHTML = `<h4 style="color: ${colors.accent}; margin-bottom: 15px;">Consolidation Opportunities</h4>`;

        if (filters.consolidationCandidates.length === 0) {
            const noConsolidation = document.createElement('div');
            noConsolidation.style.cssText = `
                background: ${colors.surfaceVariant};
                padding: 15px;
                border-radius: 6px;
                text-align: center;
                color: ${colors.textMuted};
                font-style: italic;
            `;
            noConsolidation.textContent = 'No consolidation opportunities found. All folders have only one filter.';
            candidatesSection.appendChild(noConsolidation);
        } else {
            filters.consolidationCandidates.forEach((candidate, index) => {
                const candidateDiv = createCandidateSection(candidate, colors, index);
                candidatesSection.appendChild(candidateDiv);
            });
        }

        // Action buttons
        const actions = document.createElement('div');
        actions.style.cssText = 'margin-top: 20px; text-align: center;';

        const generateAllBtn = document.createElement('button');
        generateAllBtn.textContent = 'Generate All Sieve Scripts';
        generateAllBtn.style.cssText = `
            background: ${colors.accent};
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
            transition: all 0.2s ease;
        `;
        generateAllBtn.onmouseover = () => generateAllBtn.style.opacity = '0.8';
        generateAllBtn.onmouseout = () => generateAllBtn.style.opacity = '1';
        generateAllBtn.onclick = () => generateAllSieveScripts(filters);

        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export Conversion Report';
        exportBtn.style.cssText = `
            background: ${colors.success};
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
            transition: all 0.2s ease;
        `;
        exportBtn.onmouseover = () => exportBtn.style.opacity = '0.8';
        exportBtn.onmouseout = () => exportBtn.style.opacity = '1';
        exportBtn.onclick = () => exportConversionReport(filters);

        actions.appendChild(generateAllBtn);
        actions.appendChild(exportBtn);

        content.appendChild(stats);
        content.appendChild(candidatesSection);
        content.appendChild(actions);
        return content;
    }

    function createCandidateSection(candidate, colors, index) {
        const section = document.createElement('div');
        section.style.cssText = `
            background: ${colors.surfaceVariant};
            border: 1px solid ${colors.border};
            border-radius: 6px;
            margin-bottom: 15px;
            overflow: hidden;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            background: ${colors.surface};
            padding: 12px;
            border-bottom: 1px solid ${colors.border};
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;

        const title = document.createElement('div');
        title.style.cssText = `font-weight: bold; color: ${colors.text};`;
        title.textContent = `${candidate.folder} (${candidate.count} filters)`;

        const previewBtn = document.createElement('button');
        previewBtn.textContent = 'Preview Sieve';
        previewBtn.style.cssText = `
            background: ${colors.info};
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        previewBtn.onclick = () => showSievePreview(candidate, colors);

        header.appendChild(title);
        header.appendChild(previewBtn);

        const filterList = document.createElement('div');
        filterList.style.cssText = `
            padding: 12px;
            max-height: 150px;
            overflow-y: auto;
        `;

        candidate.filters.forEach(filter => {
            const filterDiv = document.createElement('div');
            filterDiv.style.cssText = `
                padding: 4px 0;
                color: ${colors.textSecondary};
                font-size: 13px;
                border-bottom: 1px solid ${colors.border};
            `;
            filterDiv.innerHTML = `
                <span style="color: ${filter.isEnabled ? colors.success : colors.error};">●</span>
                <strong>${filter.email}</strong>
                ${filter.isEnabled ? '' : '<em style="color: ' + colors.textMuted + ';">(disabled)</em>'}
            `;
            filterList.appendChild(filterDiv);
        });

        section.appendChild(header);
        section.appendChild(filterList);
        return section;
    }

    function generateSieveScript(candidate) {
        const enabledFilters = candidate.filters.filter(f => f.isEnabled);

        if (enabledFilters.length === 0) {
            return `# No enabled filters found for folder: ${candidate.folder}`;
        }

        let sieve = `# Consolidated sieve filter for folder: ${candidate.folder}\n`;
        sieve += `# Generated from ${candidate.count} individual filters\n`;
        sieve += `# Date: ${new Date().toISOString()}\n\n`;
        sieve += `require ["fileinto"];\n\n`;

        if (enabledFilters.length === 1) {
            // Single filter
            const filter = enabledFilters[0];
            sieve += `if address :contains "from" "${filter.email}" {\n`;
            sieve += `    fileinto "${candidate.folder}";\n`;
            sieve += `    stop;\n`;
            sieve += `}\n`;
        } else {
            // Multiple filters - use anyof for OR logic
            sieve += `if anyof (\n`;
            enabledFilters.forEach((filter, index) => {
                const isLast = index === enabledFilters.length - 1;
                sieve += `    address :contains "from" "${filter.email}"${isLast ? '' : ','}\n`;
            });
            sieve += `) {\n`;
            sieve += `    fileinto "${candidate.folder}";\n`;
            sieve += `    stop;\n`;
            sieve += `}\n`;
        }

        // Add comments about disabled filters if any
        const disabledFilters = candidate.filters.filter(f => !f.isEnabled);
        if (disabledFilters.length > 0) {
            sieve += `\n# Disabled filters (not included in script):\n`;
            disabledFilters.forEach(filter => {
                sieve += `# - ${filter.email}\n`;
            });
        }

        return sieve;
    }

    function showSievePreview(candidate, colors) {
        // Remove existing preview
        const existing = document.getElementById('sieve-preview-modal');
        if (existing) {
            existing.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'sieve-preview-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10001;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: ${colors.background};
            border: 2px solid ${colors.accent};
            border-radius: 8px;
            width: 90%;
            max-width: 600px;
            max-height: 80%;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;

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
        title.textContent = `Sieve Preview: ${candidate.folder}`;
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
        closeBtn.onclick = () => modal.remove();

        header.appendChild(title);
        header.appendChild(closeBtn);

        const body = document.createElement('div');
        body.style.cssText = `
            padding: 20px;
            max-height: calc(80vh - 100px);
            overflow-y: auto;
        `;

        const sieveScript = generateSieveScript(candidate);

        const codeBlock = document.createElement('pre');
        codeBlock.style.cssText = `
            background: ${colors.surfaceVariant};
            border: 1px solid ${colors.border};
            border-radius: 4px;
            padding: 15px;
            font-family: 'Courier New', monospace;
            font-size: 13px;
            overflow-x: auto;
            color: ${colors.text};
            white-space: pre-wrap;
            margin: 0;
        `;
        codeBlock.textContent = sieveScript;

        const actions = document.createElement('div');
        actions.style.cssText = `
            margin-top: 15px;
            text-align: center;
        `;

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy to Clipboard';
        copyBtn.style.cssText = `
            background: ${colors.success};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
        `;
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(sieveScript).then(() => {
                showNotification('Sieve script copied to clipboard!');
            });
        };

        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = 'Download';
        downloadBtn.style.cssText = `
            background: ${colors.info};
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
            font-size: 14px;
        `;
        downloadBtn.onclick = () => {
            const blob = new Blob([sieveScript], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sieve-${candidate.folder.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        };

        actions.appendChild(copyBtn);
        actions.appendChild(downloadBtn);

        body.appendChild(codeBlock);
        body.appendChild(actions);

        content.appendChild(header);
        content.appendChild(body);
        modal.appendChild(content);
        document.body.appendChild(modal);

        // Close on outside click
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        };
    }

    function generateAllSieveScripts(filters) {
        if (filters.consolidationCandidates.length === 0) {
            showNotification('No consolidation opportunities found!');
            return;
        }

        let allScripts = '';
        allScripts += `# Proton Mail Filter Consolidation - Sieve Scripts\n`;
        allScripts += `# Generated on: ${new Date().toISOString()}\n`;
        allScripts += `# Total folders consolidated: ${filters.consolidationCandidates.length}\n`;
        allScripts += `# Original filters: ${filters.consolidationCandidates.reduce((sum, c) => sum + c.count, 0)}\n`;
        allScripts += `# Consolidated filters: ${filters.consolidationCandidates.length}\n\n`;
        allScripts += `require ["fileinto"];\n\n`;

        filters.consolidationCandidates.forEach((candidate, index) => {
            allScripts += `# ===============================================\n`;
            allScripts += `# Filter ${index + 1} of ${filters.consolidationCandidates.length}\n`;
            allScripts += `# ===============================================\n\n`;
            // Don't add require statement again since it's already at the top
            const scriptContent = generateSieveScript(candidate);
            // Remove the require statement from individual scripts in the combined output
            const cleanedScript = scriptContent.replace(/require \["fileinto"\];\n\n/, '');
            allScripts += cleanedScript;
            allScripts += `\n\n`;
        });

        // Create download
        const blob = new Blob([allScripts], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proton-consolidated-sieve-filters-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification(`Generated ${filters.consolidationCandidates.length} consolidated sieve scripts!`);
    }

    function exportConversionReport(filters) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalFilters: filters.all.length,
                consolidationOpportunities: filters.consolidationCandidates.length,
                totalConsolidatableFilters: filters.consolidationCandidates.reduce((sum, c) => sum + c.count, 0),
                potentialReduction: filters.consolidationCandidates.reduce((sum, c) => sum + c.count, 0) - filters.consolidationCandidates.length
            },
            consolidationCandidates: filters.consolidationCandidates.map(candidate => ({
                folder: candidate.folder,
                originalFilterCount: candidate.count,
                enabledFilters: candidate.filters.filter(f => f.isEnabled).length,
                disabledFilters: candidate.filters.filter(f => !f.isEnabled).length,
                emails: candidate.filters.map(f => ({
                    email: f.email,
                    enabled: f.isEnabled,
                    filterId: f.filterId
                })),
                sieveScript: generateSieveScript(candidate)
            })),
            allFilters: filters.all.map(f => ({
                email: f.email,
                folder: f.folder,
                enabled: f.isEnabled,
                filterId: f.filterId
            }))
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `proton-sieve-conversion-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('Conversion report exported successfully!');
    }

    function showNotification(message, duration = 3000) {
        // Remove any existing notifications
        const existing = document.getElementById('sieve-converter-notification');
        if (existing) {
            existing.remove();
        }

        const isDark = getTheme();
        const colors = getThemeColors(isDark);

        const notification = document.createElement('div');
        notification.id = 'sieve-converter-notification';
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: ${colors.success};
            color: white;
            padding: 15px 25px;
            border-radius: 6px;
            z-index: 10002;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
            text-align: center;
            white-space: pre-line;
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
