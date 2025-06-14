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
            background: rgb(29, 29, 28);
        }

        .instructions-library-title {
            font-size: 12px;
            font-weight: 600;
            color: rgb(194, 192, 182);
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .instructions-library-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            background: rgb(28, 32, 37);
            opacity: 0;
            visibility: hidden;
        }

        .instructions-library-content.expanded {
            max-height: 500px;
            opacity: 1;
            visibility: visible;
        }

        .instructions-library-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 12px;
            padding: 16px;
            background: rgb(38, 38, 36);
        }

        .instruction-template-card {
            font-family: "Styrene", -apple-system, BlinkMacSystemFont, sans-serif;
            transition: all 0.2s ease;
            border-radius: 8px;
            border: 0.5px solid rgba(209, 213, 219, 0.25);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            gap: 10px;
            overflow: hidden;
            padding: 8px 10px;
            background: rgb(48, 48, 46);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
            cursor: pointer;
            position: relative;
            align-items: flex-start;
            color: rgb(224, 225, 226);
        }

        .instruction-template-card:hover {
            border-color: rgba(229, 231, 235, 0.5);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05), 0 4px 8px rgba(0, 0, 0, 0.1);
            transform: translateY(-1px);
        }

        .instruction-template-card:focus {
            outline: 2px solid rgb(59, 130, 246);
            outline-offset: 2px;
        }

        .instruction-template-card.selected {
            border-color: rgb(59, 130, 246) !important;
            background: rgba(59, 130, 246, 0.15) !important;
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
            border-color: rgba(209, 213, 219, 0.8);
            background: transparent;
        }

        .template-checkbox-button.unchecked:hover {
            background: rgba(249, 250, 251, 0.8);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
        }

        .template-checkbox-button.checked {
            background: rgb(59, 130, 246);
            border-color: rgba(37, 99, 235, 0.8);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .template-checkbox-icon {
            width: 14px;
            height: 14px;
            fill: currentColor;
            transition: all 0.2s ease;
        }

        .template-checkbox-button.unchecked .template-checkbox-icon {
            color: white;
            visibility: hidden;
        }

        .template-checkbox-button.checked .template-checkbox-icon {
            color: white;
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
            color: inherit;
            font-weight: 600;
        }

        .template-card-preview {
            font-size: 9px;
            color: rgb(194, 192, 182);
            line-height: 1.3;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
        }

        .instruction-template-card.selected .template-card-preview {
            color: rgb(156, 163, 175);
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
            background: rgba(107, 114, 128, 0.6);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            transition: background 0.2s ease;
        }

        .template-action-btn:hover {
            background: rgba(107, 114, 128, 0.8);
        }

        .template-action-btn.edit {
            background: rgba(59, 130, 246, 0.8);
        }

        .template-action-btn.edit:hover {
            background: rgba(59, 130, 246, 1);
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
            margin-top: auto;
            flex-shrink: 0;
            background: rgb(38, 38, 36);
            backdrop-filter: blur(8px);
        }

        .library-btn {
            background: rgba(20, 20, 19, 0);
            border: 1px solid rgba(250, 249, 245, 0.3);
            color: rgb(224, 225, 226);  /* This sets the text color */
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            font-family: inherit;
            font-weight: 500;
            border-radius: 6px;
            transition: all 0.2s ease;
            padding: 8px 16px;
            font-size: 12px;
        }

        .library-btn:hover {
            background: rgb(15, 15, 14, 0);
            transform: translateY(-1px);
            box-shadow:
                0 2px 6px rgba(0, 0, 0, 0.15),
        }

        .library-btn.primary {
            background: rgb(250, 249, 245);
            border-color: rgba(37, 99, 235, 0.8);
            color: rgb(48, 48, 46);
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
        }

        .library-btn.primary:hover {
            background: rgb(230, 230, 225);
            transform: translateY(-2px);
            box-shadow: 0 3px 8px rgba(59, 130, 246, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.25);
            color: rgb(48, 48, 46);
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
            background: rgb(31, 30, 29) !important;
            color: rgb(224, 225, 226) !important;
            border: 2px solid rgba(52, 58, 67, 0.8) !important;
            border-radius: 16px;
            padding: 24px;
            max-width: 768px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow:
                0 20px 25px -5px rgba(0, 0, 0, 0.3),
                0 10px 10px -5px rgba(0, 0, 0, 0.2);
            animation: zoom 250ms ease-in forwards;
            display: flex;
            flex-direction: column;
            min-height: 0;
            position: relative;
            pointer-events: auto;
            box-sizing: border-box;
        }

        .modal-title {
            font-family: "Styrene Display", -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 20px;
            font-weight: 500;
            color: rgb(224, 225, 226) !important;
            line-height: 1.2;
        }

        .modal-subtitle {
            font-size: 14px;
            color: rgb(156, 163, 175) !important;
            line-height: 1.4;
        }

        .form-label {
            display: block;
            font-size: 14px;
            font-weight: 500;
            margin-bottom: 8px;
            color: rgb(224, 225, 226) !important;
        }

        .form-input {
            width: 100%;
            padding: 12px;
            border: 1.5px solid rgba(52, 58, 67, 0.8) !important;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.2s ease;
            background: rgb(38, 38, 36) !important;
            color: rgb(224, 225, 226) !important;
            box-sizing: border-box;
        }

        .form-input:hover {
            border-color: rgba(156, 163, 175, 0.9);
            box-shadow:
                inset 0 1px 3px rgba(0, 0, 0, 0.1),
                0 1px 0 0 rgba(255, 255, 255, 0.8),
                0 0 0 1px rgba(156, 163, 175, 0.3);
        }

        .form-input:focus {
            outline: none;
            border-color: rgb(59, 130, 246);
            box-shadow:
                inset 0 1px 3px rgba(0, 0, 0, 0.1),
                0 1px 0 0 rgba(255, 255, 255, 0.8),
                0 0 0 2px rgba(59, 130, 246, 0.3);
        }

        .form-input::placeholder {
            color: rgb(156, 163, 175);
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
            background: rgb(31, 30, 29);
            border: 1px solid rgba(250, 249, 245, 0.3);
            color: rgb(224, 225, 226);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            font-family: inherit;
            font-weight: 500;
            border-radius: 6px;
            transition: all 0.2s ease;
            padding: 8px 16px;
            font-size: 12px;
            height: 36px;
            min-width: 80px;
            white-space: nowrap;
            overflow: hidden;
            backface-visibility: hidden;
        }

        .modal-btn:hover {
            background: rgba(15, 15, 14, 1);
            transform: translateY(-1px);
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
        }

        .modal-btn:active {
            transform: translateY(0);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .modal-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        .modal-btn.primary {
            background: rgb(250, 249, 245);
            border-color: rgba(37, 99, 235, 0.8);
            color: rgb(48, 48, 46);
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
            will-change: transform;
            transition: all 150ms cubic-bezier(0.165, 0.85, 0.45, 1);
        }

        .modal-btn.primary:hover {
            background: rgb(230, 230, 225);
            transform: translateY(-2px);
            box-shadow: 0 3px 8px rgba(59, 130, 246, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.25);
            color: rgb(48, 48, 46);
        }

        .modal-btn.primary:active {
            transform: translateY(-1px) scale(1.01);
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3), inset 0 1px 0 0 rgba(255, 255, 255, 0.9);
        }

        .modal-btn.primary::after {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(at bottom, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0));
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
        // Check if library already exists
        if (document.getElementById('instructions-library')) return true;

        // Strategy 1: Look for existing project instructions (when instructions are already set)
        const editButton = document.querySelector('button[type="button"] .text-accent-secondary-000');
        if (editButton && editButton.textContent === 'Edit') {
            const instructionsContainer = editButton.closest('button');
            if (instructionsContainer) {
                const parentContainer = instructionsContainer.parentElement;
                if (parentContainer) {
                    const library = createLibraryInterface();
                    parentContainer.insertBefore(library, instructionsContainer);
                    refreshLibraryDisplay();
                    return true;
                }
            }
        }

        // Strategy 2: Look for the project knowledge container when no instructions are set
        // Find the container with "Project knowledge" header
        const projectKnowledgeHeader = Array.from(document.querySelectorAll('h2')).find(h2 =>
            h2.textContent.trim() === 'Project knowledge'
        );

        if (projectKnowledgeHeader) {
            // Navigate up to find the main container with the flex gap-5 class
            let container = projectKnowledgeHeader;
            while (container && !container.classList.contains('gap-5')) {
                container = container.parentElement;
            }

            if (container && container.classList.contains('flex') && container.classList.contains('flex-col')) {
                // This is the .mx-4.flex.flex-col.gap-5 container
                // Insert the library as the first child
                const library = createLibraryInterface();
                container.insertBefore(library, container.firstChild);
                refreshLibraryDisplay();
                return true;
            }
        }

        // Strategy 3: Fallback - look for the mx-4 flex flex-col gap-5 container directly
        const flexContainer = document.querySelector('.mx-4.flex.flex-col.gap-5');
        if (flexContainer) {
            const library = createLibraryInterface();
            flexContainer.insertBefore(library, flexContainer.firstChild);
            refreshLibraryDisplay();
            return true;
        }

        return false;
    }

    // Enhanced mutation observer with better detection
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldCheck = false;
            let hasProjectChange = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check for project instructions area
                            if (node.querySelector &&
                                (node.querySelector('.text-accent-secondary-000') ||
                                    node.querySelector('[class*="project"]') ||
                                    node.querySelector('button[type="button"]') ||
                                    node.textContent.toLowerCase().includes('edit') ||
                                    node.textContent.toLowerCase().includes('instructions'))) {
                                shouldCheck = true;
                            }

                            // Check if this is a project page change
                            if (node.matches &&
                                (node.matches('[class*="project"]') ||
                                    node.matches('[data-testid*="project"]'))) {
                                hasProjectChange = true;
                            }
                        }
                    });
                }

                // Also check for attribute changes that might indicate UI updates
                if (mutation.type === 'attributes' &&
                    mutation.target.matches &&
                    (mutation.target.matches('button') ||
                        mutation.target.matches('[class*="project"]'))) {
                    shouldCheck = true;
                }
            });

            if (shouldCheck || hasProjectChange) {
                // Use different delays based on the type of change
                const delay = hasProjectChange ? 2000 : 500;
                setTimeout(() => {
                    console.log('Observer triggered insertion attempt');
                    insertLibraryInterface();
                }, delay);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'data-testid']
        });

        return observer;
    }

    // Enhanced URL change detection
    let currentUrl = window.location.href;
    function detectUrlChange() {
        const newUrl = window.location.href;
        if (newUrl !== currentUrl) {
            console.log('URL changed from', currentUrl, 'to', newUrl);
            currentUrl = newUrl;

            // Remove existing library if present
            const existingLibrary = document.getElementById('instructions-library');
            if (existingLibrary) {
                existingLibrary.remove();
            }

            // Reset the active flag
            window.claudeInstructionsLibraryActive = false;

            // Try to insert on new page after a delay
            setTimeout(() => {
                insertLibraryInterface();
            }, 1500);
        }
    }

    // Enhanced initialization with multiple retry attempts
    function init() {
        addCSS();

        let attempts = 0;
        const maxAttempts = 5;

        const tryInsert = () => {
            attempts++;
            console.log(`Library insertion attempt ${attempts}/${maxAttempts}`);

            const success = insertLibraryInterface();

            if (!success && attempts < maxAttempts) {
                // Exponential backoff: 1s, 2s, 4s, 8s, 16s
                const delay = Math.pow(2, attempts) * 1000;
                console.log(`Retrying in ${delay}ms...`);
                setTimeout(tryInsert, delay);
            } else if (success) {
                console.log('Library successfully inserted after', attempts, 'attempts');
            } else {
                console.log('Failed to insert library after', maxAttempts, 'attempts');
                // Set up observer anyway in case the page changes
                setupObserver();
            }
        };

        // Start trying immediately
        tryInsert();
    }

    // Start when ClaudeStyles is ready
    waitForClaudeStyles(() => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(init, 1000);
                setupObserver();
            });
        } else {
            setTimeout(init, 1000);
            setupObserver();
        }

        // Enhanced periodic check with URL change detection
        setInterval(() => {
            if (document.visibilityState === 'visible') {
                detectUrlChange();

                if (window.location.href.includes('/project/') &&
                    !document.getElementById('instructions-library')) {
                    console.log('Periodic check: attempting to insert library');
                    insertLibraryInterface();
                }
            }
        }, 3000);
    });

})();