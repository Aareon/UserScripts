// ==UserScript==
// @name         Claude Project Instructions Library
// @namespace    https://github.com/Aareon
// @version      1.2
// @description  Manage and quickly apply different Project Instructions templates in Claude with enhanced selection visuals
// @author       Aareon
// @match        https://claude.ai/*
// @require      https://cdn.jsdelivr.net/gh/Aareon/UserScripts@main/Claude/ClaudeStyleCommon.user.js
// @grant        none
// @license      Personal/Educational Only – No Commercial Use
// ==/UserScript==

(function () {
    'use strict';

    // Wait for ClaudeStyles to be available
    function waitForClaudeStyles(callback) {
        if (window.ClaudeStyles) {
            callback();
        } else {
            setTimeout(() => waitForClaudeStyles(callback), 100);
        }
    }

    // Storage key for saved instructions
    const STORAGE_KEY = 'claude_instructions_library';

    // Default instruction template
    const DEFAULT_TEMPLATES = {
        'Development Assistant': {
            name: 'Development Assistant',
            instructions: `Only output the relevant code, ideally the full method. Avoid full scripts unless necessary.

Use separate artifacts for each file. Edit existing artifacts when possible to save tokens.

Check the web for up-to-docs. Don't rely on old knowledge.

Don't change the title of scripts, or names of interfaces. Avoid things like \`Enhanced\` or \`Optimized\` in names.

# Commands
\`/commit\`: generate a git commit message that succinctly describes changes and output it in a markdown code block. Do not include the \`git\` command, only output the plaintext message.`
        }
    };

    // Behavior-specific CSS (not shared with other scripts)
    const specificCSS = `
        .instructions-library-container {
            ${window.ClaudeStyles.components.mainContainer}
            margin-bottom: 12px;
            overflow: hidden;
            transition: all 0.2s ease;
            position: relative;
            z-index: 1;
        }

        .instructions-library-header {
            ${window.ClaudeStyles.components.containerHeader}
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            cursor: pointer;
            user-select: none;
            transition: background 0.2s ease;
        }

        .instructions-library-header:hover {
            background: light-dark(rgba(229, 231, 235, 0.8), rgba(75, 85, 99, 0.8));
        }

        .instructions-library-title {
            font-size: 12px;
            font-weight: 600;
            color: light-dark(rgb(107, 114, 128), rgb(156, 163, 175));
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .instructions-library-content {
            ${window.ClaudeStyles.components.containerContent}
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }

        .instructions-library-content.expanded {
            max-height: 500px;
        }

        .instructions-library-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 12px;
            padding: 16px;
        }

        .instruction-template-card {
            ${window.ClaudeStyles.components.cardBase}
            padding: 12px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: flex-start;
            gap: 8px;
        }

        .instruction-template-card:hover {
            background: light-dark(rgba(229, 231, 235, 0.8), rgba(75, 85, 99, 0.8));
            transform: translateY(-1px);
            box-shadow:
                0 2px 8px light-dark(rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.3)),
                inset 0 1px 0 0 light-dark(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.05));
        }

        .instruction-template-card:focus {
            outline: 2px solid light-dark(rgb(59, 130, 246), rgb(59, 130, 246));
            outline-offset: 2px;
        }

        .instruction-template-card.selected {
            border-color: light-dark(rgba(59, 130, 246, 0.6), rgba(59, 130, 246, 0.6)) !important;
            background: light-dark(rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.15)) !important;
            box-shadow:
                0 2px 8px light-dark(rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.4)),
                inset 0 1px 0 0 light-dark(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.1)),
                0 0 0 1px light-dark(rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.4));
        }

        .template-checkbox {
            padding: 8px;
            margin: -8px;
            display: flex;
            align-items: center;
            flex-shrink: 0;
        }

        .template-checkbox-button {
            border-radius: 4px;
            padding: 0.5px;
            border: 0.5px solid;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            width: 20px;
            height: 20px;
        }

        .template-checkbox-button.unchecked {
            border-color: light-dark(rgba(209, 213, 219, 0.8), rgba(107, 114, 128, 0.8));
            background: transparent;
        }

        .template-checkbox-button.unchecked:hover {
            background: light-dark(rgba(249, 250, 251, 0.8), rgba(55, 65, 81, 0.8));
            box-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2));
        }

        .template-checkbox-button.checked {
            background: light-dark(rgb(59, 130, 246), rgb(59, 130, 246));
            border-color: light-dark(rgba(37, 99, 235, 0.8), rgba(59, 130, 246, 0.8));
            box-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.3));
        }

        .template-checkbox-icon {
            width: 14px;
            height: 14px;
            fill: currentColor;
            transition: all 0.2s ease;
        }

        .template-checkbox-button.unchecked .template-checkbox-icon {
            color: highlighttext;
            visibility: hidden;
        }

        .template-checkbox-button.checked .template-checkbox-icon {
            color: highlighttext;
            visibility: visible;
        }

        .template-content {
            flex: 1;
            min-width: 0;
            position: relative;
        }

        .template-card-name {
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 4px;
            color: inherit;
        }

        .instruction-template-card.selected .template-card-name {
            color: light-dark(rgb(17, 24, 39), rgb(243, 244, 246));
            font-weight: 700;
            text-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2));
        }

        .template-card-preview {
            font-size: 9px;
            color: light-dark(rgb(107, 114, 128), rgb(156, 163, 175));
            line-height: 1.3;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
        }

        .instruction-template-card.selected .template-card-preview {
            color: light-dark(rgb(55, 65, 81), rgb(209, 213, 219));
            text-shadow: 0 1px 2px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2));
        }

        .template-actions {
            position: absolute;
            top: 4px;
            right: 4px;
            display: flex;
            gap: 4px;
            opacity: 0;
            transition: opacity 0.2s ease;
        }

        .instruction-template-card:hover .template-actions {
            opacity: 1;
        }

        .template-action-btn {
            width: 20px;
            height: 20px;
            border-radius: 4px;
            border: none;
            background: color-mix(in srgb, canvastext 60%, transparent);
            color: canvas;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            transition: background 0.2s ease;
        }

        .template-action-btn:hover {
            background: color-mix(in srgb, canvastext 80%, transparent);
        }

        .template-action-btn.edit {
            background: color-mix(in srgb, highlight 80%, transparent);
        }

        .template-action-btn.edit:hover {
            background: color-mix(in srgb, highlight 100%, transparent);
        }

        .template-action-btn.delete {
            background: rgba(220, 38, 38, 0.8);
        }

        .template-action-btn.delete:hover {
            background: rgba(220, 38, 38, 1);
        }

        .library-actions {
            display: flex;
            gap: 8px;
            padding: 16px 12px;
            border-top: 1px solid color-mix(in srgb, canvastext 30%, transparent);
            background: color-mix(in srgb, canvas 90%, canvastext 5%);
            backdrop-filter: blur(8px);
            margin-top: auto;
            flex-shrink: 0;
        }

        .library-btn {
            ${window.ClaudeStyles.components.buttonBase}
            ${window.ClaudeStyles.components.buttonSecondary}
        }

        .library-btn:hover {
            background: color-mix(in srgb, canvas 75%, canvastext 15%);
            border-color: color-mix(in srgb, canvastext 50%, transparent);
            transform: translateY(-1px);
            box-shadow:
                0 2px 6px color-mix(in srgb, canvastext 30%, transparent),
                inset 0 1px 0 0 color-mix(in srgb, canvas 100%, transparent);
        }

        .library-btn.primary {
            ${window.ClaudeStyles.components.buttonPrimary}
        }

        .library-btn.primary:hover {
            background: color-mix(in srgb, highlight 85%, canvastext 5%);
            transform: translateY(-2px);
            box-shadow:
                0 3px 8px color-mix(in srgb, highlight 40%, transparent),
                inset 0 1px 0 0 color-mix(in srgb, highlighttext 25%, transparent);
        }

        .library-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .chevron-icon {
            transition: transform 0.3s ease;
            width: 12px;
            height: 12px;
        }

        .chevron-icon.expanded {
            transform: rotate(180deg);
        }

        .modal-overlay {
            ${window.ClaudeStyles.components.modalOverlay}
        }

        .modal-content {
            ${window.ClaudeStyles.components.modalContent}
            display: flex;
            flex-direction: column;
            min-height: 0;
            position: relative;
            pointer-events: auto;
            box-sizing: border-box;
        }

        .modal-header {
            display: flex;
            flex-direction: column;
            gap: 4px;
            margin-bottom: 24px;
        }

        .modal-title {
            font-family: "Styrene Display", -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 20px;
            font-weight: 500;
            color: canvastext;
            line-height: 1.2;
        }

        .modal-subtitle {
            font-size: 14px;
            color: color-mix(in srgb, canvastext 80%, transparent);
            line-height: 1.4;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            color: canvastext;
        }

        .form-input {
            ${window.ClaudeStyles.components.formInput}
            box-sizing: border-box;
        }

        .form-input:hover {
            border-color: light-dark(rgba(156, 163, 175, 0.9), rgba(156, 163, 175, 0.9));
            box-shadow:
                inset 0 1px 3px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2)),
                0 1px 0 0 light-dark(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.05)),
                0 0 0 1px light-dark(rgba(156, 163, 175, 0.3), rgba(156, 163, 175, 0.3));
        }

        .form-input:focus {
            outline: none;
            border-color: light-dark(rgb(59, 130, 246), rgb(59, 130, 246));
            box-shadow:
                inset 0 1px 3px light-dark(rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0.2)),
                0 1px 0 0 light-dark(rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.05)),
                0 0 0 2px light-dark(rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.3));
        }

        .form-input::placeholder {
            color: light-dark(rgb(156, 163, 175), rgb(107, 114, 128));
        }

        .form-textarea {
            min-height: 160px;
            resize: vertical;
            font-family: inherit;
            white-space: pre-wrap;
            overflow-wrap: break-word;
        }

        .modal-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
            margin-top: 24px;
            flex-shrink: 0;
        }

        .modal-btn {
            ${window.ClaudeStyles.components.buttonBase}
            ${window.ClaudeStyles.components.buttonSecondary}
            height: 36px;
            min-width: 80px;
            white-space: nowrap;
            overflow: hidden;
            backface-visibility: hidden;
        }

        .modal-btn:hover {
            background: color-mix(in srgb, canvas 70%, canvastext 20%);
            border-color: color-mix(in srgb, canvastext 50%, transparent);
            transform: translateY(-1px);
            box-shadow:
                0 2px 6px color-mix(in srgb, canvastext 40%, transparent),
                inset 0 1px 0 0 color-mix(in srgb, canvas 100%, transparent);
        }

        .modal-btn:active {
            transform: translateY(0);
            box-shadow:
                0 1px 2px color-mix(in srgb, canvastext 40%, transparent),
                inset 0 1px 0 0 color-mix(in srgb, canvas 100%, transparent);
        }

        .modal-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        .modal-btn.primary {
            ${window.ClaudeStyles.components.buttonPrimary}
            position: relative;
            overflow: hidden;
            will-change: transform;
            transition: all 150ms cubic-bezier(0.165, 0.85, 0.45, 1);
        }

        .modal-btn.primary:hover {
            transform: translateY(-2px) scale(1.02);
            background: color-mix(in srgb, highlight 85%, canvastext 5%);
            box-shadow:
                0 4px 8px color-mix(in srgb, highlight 50%, transparent),
                inset 0 1px 0 0 color-mix(in srgb, highlighttext 90%, transparent);
        }

        .modal-btn.primary:active {
            transform: translateY(-1px) scale(1.01);
            box-shadow:
                0 2px 4px color-mix(in srgb, highlight 40%, transparent),
                inset 0 1px 0 0 color-mix(in srgb, highlighttext 90%, transparent);
        }

        .modal-btn.primary::after {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(at bottom, light-dark(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.2)), light-dark(rgba(255, 255, 255, 0), rgba(255, 255, 255, 0)));
            opacity: 0;
            transition: all 200ms ease;
            transform: translateY(8px);
        }

        .modal-btn.primary:hover::after {
            opacity: 1;
            transform: translateY(0);
        }
    `;

    // LocalStorage implementation
    function saveInstructions(instructions) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(instructions));
        } catch (error) {
            console.error('Failed to save instructions to localStorage:', error);
        }
    }

    function loadInstructions() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load instructions from localStorage:', error);
        }

        // Return default templates if no stored data or error
        return { ...DEFAULT_TEMPLATES };
    }

    // Add CSS to page
    function addCSS() {
        window.ClaudeStyles.addCommonCSS('instructions-library-css', specificCSS);
    }

    // Extract current project details from URL and cookies
    function getCurrentProjectInfo() {
        const url = window.location.href;
        const match = url.match(/\/project\/([^\/]+)/);
        if (!match) return null;

        const projectId = match[1];

        // Try to get org ID from URL first
        let orgId = null;
        const orgMatch = url.match(/organizations\/([^\/]+)/);
        if (orgMatch) {
            orgId = orgMatch[1];
        } else {
            // Fallback: get from cookies (lastActiveOrg)
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === 'lastActiveOrg') {
                    orgId = decodeURIComponent(value);
                    break;
                }
            }
        }

        return { projectId, orgId };
    }

    // Update project instructions via API
    async function updateProjectInstructions(instructions) {
        const projectInfo = getCurrentProjectInfo();
        if (!projectInfo) {
            console.error('Could not determine project ID');
            return false;
        }

        try {
            // First, update the project
            const updateResponse = await fetch(`https://claude.ai/api/organizations/${projectInfo.orgId}/projects/${projectInfo.projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'anthropic-client-platform': 'web_claude_ai',
                },
                body: JSON.stringify({
                    prompt_template: instructions
                })
            });

            if (!updateResponse.ok) {
                throw new Error(`Update failed: ${updateResponse.status}`);
            }

            // Then, fetch to refresh the state
            const refreshResponse = await fetch(`https://claude.ai/api/organizations/${projectInfo.orgId}/projects/${projectInfo.projectId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'anthropic-client-platform': 'web_claude_ai',
                }
            });

            if (!refreshResponse.ok) {
                throw new Error(`Refresh failed: ${refreshResponse.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error updating project instructions:', error);
            return false;
        }
    }

    // Get current instructions from the edit button
    function getCurrentInstructions() {
        const editButton = document.querySelector('button[type="button"] .flex-1.truncate.text-xs');
        return editButton ? editButton.textContent.trim() : '';
    }

    // Create modal for adding/editing templates
    function createTemplateModal(template = null) {
        const isEdit = template !== null;

        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        // Create header
        const header = document.createElement('div');
        header.className = 'modal-header';

        const title = document.createElement('h2');
        title.className = 'modal-title';
        title.textContent = isEdit ? 'Edit template' : 'Add new template';

        const subtitle = document.createElement('p');
        subtitle.className = 'modal-subtitle';
        subtitle.textContent = 'Configure your project instructions template for quick reuse.';

        header.appendChild(title);
        header.appendChild(subtitle);

        // Create name field
        const nameGroup = document.createElement('div');
        nameGroup.className = 'form-group';

        const nameLabel = document.createElement('label');
        nameLabel.className = 'form-label';
        nameLabel.textContent = 'Template Name';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'form-input';
        nameInput.id = 'template-name';
        nameInput.value = template ? template.name : '';
        nameInput.placeholder = 'Enter template name';

        nameGroup.appendChild(nameLabel);
        nameGroup.appendChild(nameInput);

        // Create instructions field
        const instructionsGroup = document.createElement('div');
        instructionsGroup.className = 'form-group';

        const instructionsLabel = document.createElement('label');
        instructionsLabel.className = 'form-label';
        instructionsLabel.textContent = 'Instructions';

        const instructionsTextarea = document.createElement('textarea');
        instructionsTextarea.className = 'form-input form-textarea';
        instructionsTextarea.id = 'template-instructions';
        instructionsTextarea.placeholder = 'Enter project instructions...';
        instructionsTextarea.value = template ? template.instructions : '';

        instructionsGroup.appendChild(instructionsLabel);
        instructionsGroup.appendChild(instructionsTextarea);

        // Create actions using ClaudeStyles
        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        const cancelBtn = window.ClaudeStyles.createButton('Cancel', 'secondary');
        cancelBtn.className += ' modal-btn';

        const saveBtn = window.ClaudeStyles.createButton(isEdit ? 'Save changes' : 'Save template', 'primary');
        saveBtn.className += ' modal-btn primary';

        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);

        // Assemble modal
        modalContent.appendChild(header);
        modalContent.appendChild(nameGroup);
        modalContent.appendChild(instructionsGroup);
        modalContent.appendChild(actions);
        overlay.appendChild(modalContent);

        // Event handlers
        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
        };

        saveBtn.onclick = () => {
            const name = nameInput.value.trim();
            const instructions = instructionsTextarea.value.trim();

            if (!name || !instructions) {
                alert('Please fill in all fields');
                return;
            }

            // Load current instructions, update, and save
            const currentInstructions = loadInstructions();

            // If editing and name changed, remove old entry
            if (isEdit && template && template.name !== name) {
                delete currentInstructions[template.name];
            }

            currentInstructions[name] = { name, instructions };
            saveInstructions(currentInstructions);

            // Refresh library display
            refreshLibraryDisplay();

            // Close modal
            document.body.removeChild(overlay);
        };

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };

        document.body.appendChild(overlay);
    }

    // Create the instructions library interface
    function createLibraryInterface() {
        const container = document.createElement('div');
        container.className = 'instructions-library-container';
        container.id = 'instructions-library';

        container.innerHTML = `
            <div class="instructions-library-header" id="library-header">
                <div class="instructions-library-title">
                    📝 Instructions Library
                    <svg class="chevron-icon" id="chevron-icon" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>
            <div class="instructions-library-content" id="library-content">
                <div class="instructions-library-grid" id="templates-grid">
                    <!-- Templates will be inserted here -->
                </div>
                <div class="library-actions">
                    <button class="library-btn" id="add-template-btn">+ Add Template</button>
                    <button class="library-btn" id="save-current-btn">Save Current</button>
                    <button class="library-btn primary" id="apply-btn" disabled>Apply Selected</button>
                </div>
            </div>
        `;

        // Event handlers
        const header = container.querySelector('#library-header');
        const content = container.querySelector('#library-content');
        const chevron = container.querySelector('#chevron-icon');

        header.onclick = () => {
            const isExpanded = content.classList.contains('expanded');
            content.classList.toggle('expanded');
            chevron.classList.toggle('expanded');
        };

        container.querySelector('#add-template-btn').onclick = () => {
            createTemplateModal();
        };

        container.querySelector('#save-current-btn').onclick = () => {
            const currentInstructions = getCurrentInstructions();
            if (!currentInstructions) {
                alert('No current instructions found');
                return;
            }

            const name = prompt('Enter a name for this template:');
            if (!name) return;

            const instructions = loadInstructions();
            instructions[name] = {
                name: name.trim(),
                instructions: currentInstructions
            };
            saveInstructions(instructions);
            refreshLibraryDisplay();
        };

        container.querySelector('#apply-btn').onclick = async () => {
            const selected = container.querySelector('.instruction-template-card.selected');
            if (!selected) return;

            const templateName = selected.dataset.templateName;
            const instructions = loadInstructions();
            const template = instructions[templateName];

            if (!template) return;

            const applyBtn = container.querySelector('#apply-btn');
            const originalText = applyBtn.textContent;
            applyBtn.textContent = 'Applying...';
            applyBtn.disabled = true;

            const success = await updateProjectInstructions(template.instructions);

            if (success) {
                applyBtn.textContent = 'Applied ✓';
                setTimeout(() => {
                    // Trigger a page reload to refresh the interface
                    window.location.reload();
                }, 1000);
            } else {
                applyBtn.textContent = 'Failed';
                alert('Failed to apply instructions. Please try again.');
                setTimeout(() => {
                    applyBtn.textContent = originalText;
                    applyBtn.disabled = false;
                }, 2000);
            }
        };

        return container;
    }

    // Refresh the templates display
    function refreshLibraryDisplay() {
        const grid = document.querySelector('#templates-grid');
        const applyBtn = document.querySelector('#apply-btn');

        if (!grid) return;

        grid.innerHTML = '';

        const templates = loadInstructions();

        Object.values(templates).forEach(template => {
            const card = document.createElement('div');
            card.className = 'instruction-template-card';
            card.dataset.templateName = template.name;
            card.tabIndex = 0; // Make focusable for accessibility

            card.innerHTML = `
                <div class="template-checkbox">
                    <button class="template-checkbox-button unchecked">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 256 256" class="template-checkbox-icon">
                            <path d="M232.49,80.49l-128,128a12,12,0,0,1-17,0l-56-56a12,12,0,1,1,17-17L96,183,215.51,63.51a12,12,0,0,1,17,17Z"></path>
                        </svg>
                    </button>
                </div>
                <div class="template-content">
                    <div class="template-card-name">${template.name}</div>
                    <div class="template-card-preview">${template.instructions}</div>
                    <div class="template-actions">
                        <button class="template-action-btn edit" title="Edit template">✏️</button>
                        <button class="template-action-btn delete" title="Delete template">🗑️</button>
                    </div>
                </div>
            `;

            const selectCard = () => {
                // Remove selection from other cards
                grid.querySelectorAll('.instruction-template-card').forEach(c => {
                    c.classList.remove('selected');
                    const checkbox = c.querySelector('.template-checkbox-button');
                    if (checkbox) {
                        checkbox.className = 'template-checkbox-button unchecked';
                    }
                });

                // Select this card
                card.classList.add('selected');
                const checkbox = card.querySelector('.template-checkbox-button');
                if (checkbox) {
                    checkbox.className = 'template-checkbox-button checked';
                }

                // Enable apply button
                if (applyBtn) {
                    applyBtn.disabled = false;
                }
            };

            // Main card click (avoid action buttons)
            card.onclick = (e) => {
                if (e.target.closest('.template-action-btn')) {
                    return; // Don't select if clicking action buttons
                }
                selectCard();
            };

            // Keyboard support
            card.onkeydown = (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    selectCard();
                }
            };

            // Edit button handler
            const editBtn = card.querySelector('.template-action-btn.edit');
            editBtn.onclick = (e) => {
                e.stopPropagation();
                createTemplateModal(template);
            };

            // Delete button handler
            const deleteBtn = card.querySelector('.template-action-btn.delete');
            deleteBtn.onclick = (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${template.name}"?`)) {
                    const instructions = loadInstructions();
                    delete instructions[template.name];
                    saveInstructions(instructions);
                    refreshLibraryDisplay();
                }
            };

            grid.appendChild(card);
        });
    }

    // Find the project instructions area and insert the library
    function insertLibraryInterface() {
        // Look for the project instructions edit button
        const editButton = document.querySelector('button[type="button"] .text-accent-secondary-000');

        if (!editButton || editButton.textContent !== 'Edit') return false;

        const instructionsContainer = editButton.closest('button');
        if (!instructionsContainer) return false;

        const parentContainer = instructionsContainer.parentElement;
        if (!parentContainer) return false;

        // Check if library already exists
        if (document.getElementById('instructions-library')) return true;

        const library = createLibraryInterface();
        parentContainer.insertBefore(library, instructionsContainer);

        // Populate with templates
        refreshLibraryDisplay();

        return true;
    }

    // Set up mutation observer for dynamic content
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if project instructions area was added
                            if (node.querySelector &&
                                node.querySelector('.text-accent-secondary-000')) {
                                shouldCheck = true;
                            }
                        }
                    });
                }
            });

            if (shouldCheck) {
                setTimeout(insertLibraryInterface, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initialize the script
    function init() {
        addCSS();

        // Try to insert immediately
        if (!insertLibraryInterface()) {
            // If not found, set up observer
            setupObserver();
        }
    }

    // Start when ClaudeStyles is ready
    waitForClaudeStyles(() => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(init, 1000);
            });
        } else {
            setTimeout(init, 1000);
        }

        // Periodic check for new project pages
        setInterval(() => {
            if (document.visibilityState === 'visible' &&
                window.location.href.includes('/project/')) {
                insertLibraryInterface();
            }
        }, 3000);
    });

})();