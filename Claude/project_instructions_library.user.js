// ==UserScript==
// @name         Claude Project Instructions Library
// @namespace    https://github.com/Aareon
// @version      1.1
// @description  Manage and quickly apply different Project Instructions templates in Claude with enhanced selection visuals
// @author       Aareon
// @match        https://claude.ai/*
// @grant        none
// @license      Personal/Educational Only – No Commercial Use
// ==/UserScript==

(function () {
    'use strict';

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

    // Enhanced CSS for the library interface with improved selection visuals
    const libraryCSS = `
        .instructions-library-container {
            margin-bottom: 12px;
            border: 1.5px solid rgba(75, 85, 99, 0.4) !important;
            border-radius: 8px;
            background: transparent;
            overflow: hidden;
            transition: all 0.2s ease;
            position: relative;
            z-index: 1;
            box-shadow:
                0 2px 4px rgba(0, 0, 0, 0.1),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
        }

        .instructions-library-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 12px;
            background: var(--bg-100, rgba(249, 250, 251, 0.5));
            border-bottom: 0.5px solid var(--border-300, rgba(209, 213, 219, 0.3));
            cursor: pointer;
            user-select: none;
            backdrop-filter: blur(8px);
        }

        .instructions-library-header:hover {
            background: var(--bg-200, rgba(243, 244, 246, 0.7));
        }

        .instructions-library-title {
            font-size: 12px;
            font-weight: 600;
            color: var(--text-200, rgb(107, 114, 128));
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .instructions-library-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
            background: var(--bg-000, rgba(255, 255, 255, 0.8));
            backdrop-filter: blur(8px);
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
            border: 1.5px solid rgba(75, 85, 99, 0.4) !important;
            border-radius: 8px;
            padding: 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            background: rgba(31, 41, 55, 0.8) !important;
            backdrop-filter: blur(4px);
            position: relative;
            overflow: hidden;
            display: flex;
            align-items: flex-start;
            gap: 8px;
            color: rgb(209, 213, 219) !important;
            box-shadow:
                0 1px 3px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.05);
        }

        .instruction-template-card:hover {
            background: rgba(55, 65, 81, 0.9) !important;
            border-color: rgba(107, 114, 128, 0.6) !important;
            box-shadow:
                0 2px 8px rgba(0,0,0,0.3),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
            transform: translateY(-1px);
        }

        .instruction-template-card:focus {
            outline: 2px solid var(--accent-main-100, rgb(59, 130, 246));
            outline-offset: 2px;
        }

        .instruction-template-card.selected {
            border-color: rgba(59, 130, 246, 0.6) !important;
            background: rgba(59, 130, 246, 0.1) !important;
            box-shadow:
                0 2px 8px rgba(59, 130, 246, 0.3),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.1),
                0 0 0 1px rgba(59, 130, 246, 0.3);
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
            border-color: var(--border-200, rgb(229, 231, 235));
            background: transparent;
        }

        .template-checkbox-button.unchecked:hover {
            background: var(--bg-000, rgba(255, 255, 255, 0.8));
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }

        .template-checkbox-button.checked {
            background: var(--accent-secondary-000, rgb(59, 130, 246));
            border-color: var(--accent-secondary-200, rgba(59, 130, 246, 0.5));
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .template-checkbox-icon {
            width: 14px;
            height: 14px;
            fill: currentColor;
            transition: all 0.2s ease;
        }

        .template-checkbox-button.unchecked .template-checkbox-icon {
            color: var(--text-always-white, white);
            visibility: hidden;
        }

        .template-checkbox-button.checked .template-checkbox-icon {
            color: var(--text-always-white, white);
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
            color: white;
            font-weight: 700;
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }

        .template-card-preview {
            font-size: 9px;
            color: var(--text-400, rgb(156, 163, 175));
            line-height: 1.3;
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
        }

        .instruction-template-card.selected .template-card-preview {
            color: rgba(255, 255, 255, 0.9);
            text-shadow: 0 1px 2px rgba(0,0,0,0.1);
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
            background: rgba(0, 0, 0, 0.6);
            color: white;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            transition: background 0.2s ease;
        }

        .template-action-btn:hover {
            background: rgba(0, 0, 0, 0.8);
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
            border-top: 1px solid var(--border-300, rgba(209, 213, 219, 0.4));
            background: var(--bg-100, rgba(249, 250, 251, 0.8));
            backdrop-filter: blur(8px);
            margin-top: auto;
            flex-shrink: 0;
        }

        .library-btn {
            font-size: 12px;
            padding: 8px 16px;
            border: 1.5px solid #6b7280 !important;
            border-radius: 6px;
            background: rgba(55, 65, 81, 0.8) !important;
            color: rgb(156, 163, 175) !important;
            cursor: pointer;
            transition: all 0.2s ease;
            backdrop-filter: blur(4px);
            font-weight: 500;
            box-shadow:
                0 1px 3px rgba(0,0,0,0.2),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
        }

        .library-btn:hover {
            background: rgba(75, 85, 99, 0.9) !important;
            border-color: #9ca3af !important;
            box-shadow:
                0 2px 6px rgba(0,0,0,0.3),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
            transform: translateY(-1px);
        }

        .library-btn.primary {
            background: var(--accent-main-100, rgb(59, 130, 246)) !important;
            color: white !important;
            border: 2px solid rgba(37, 99, 235, 0.8) !important;
            box-shadow:
                0 2px 4px rgba(59, 130, 246, 0.3),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
        }

        .library-btn.primary:hover {
            background: var(--accent-main-200, rgb(37, 99, 235)) !important;
            border-color: rgb(29, 78, 216) !important;
            box-shadow:
                0 3px 8px rgba(59, 130, 246, 0.4),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.25);
            transform: translateY(-2px);
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
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        }

        .modal-content {
            background: #1f1e1d !important;
            color: rgb(250, 249, 245) !important;
            border: 2px solid rgba(222, 220, 209, 0.3) !important;
            border-radius: 16px;
            padding: 24px;
            max-width: 768px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow:
                0 20px 25px -5px rgba(0, 0, 0, 0.3),
                0 10px 10px -5px rgba(0, 0, 0, 0.2),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
            animation: zoom 250ms ease-in forwards;
            display: flex;
            flex-direction: column;
            min-height: 0;
            position: relative;
            pointer-events: auto;
            box-sizing: border-box;
        }

        @keyframes zoom {
            from {
                opacity: 0;
                transform: scale(0.95);
            }
            to {
                opacity: 1;
                transform: scale(1);
            }
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
            color: #f9fafb !important;
            line-height: 1.2;
        }

        .modal-subtitle {
            font-size: 14px;
            color: #d1d5db !important;
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
            color: #f3f4f6 !important;
        }

        .form-input {
            width: 100%;
            padding: 12px;
            border: 1.5px solid #6b7280 !important;
            border-radius: 10px;
            font-size: 14px;
            line-height: 1.25;
            transition: all 0.2s ease;
            background: #30302e !important;
            color: #f9fafb !important;
            box-sizing: border-box;
            box-shadow:
                inset 0 1px 3px rgba(0, 0, 0, 0.2),
                0 1px 0 0 rgba(255, 255, 255, 0.05);
        }

        .form-input:hover {
            border-color: #9ca3af !important;
            box-shadow:
                inset 0 1px 3px rgba(0, 0, 0, 0.2),
                0 1px 0 0 rgba(255, 255, 255, 0.1),
                0 0 0 1px rgba(156, 163, 175, 0.3);
        }

        .form-input:focus {
            outline: none;
            border-color: #60a5fa !important;
            box-shadow:
                inset 0 1px 3px rgba(0, 0, 0, 0.2),
                0 1px 0 0 rgba(255, 255, 255, 0.1),
                0 0 0 2px rgba(96, 165, 250, 0.3) !important;
        }

        .form-input::placeholder {
            color: #9ca3af !important;
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
            display: inline-flex;
            align-items: center;
            justify-content: center;
            position: relative;
            flex-shrink: 0;
            cursor: pointer;
            user-select: none;
            font-family: "Styrene", -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 500;
            font-size: 14px;
            height: 36px;
            padding: 8px 16px;
            border-radius: 8px;
            min-width: 80px;
            white-space: nowrap;
            transition: all 0.15s ease;
            border: 1.5px solid #6b7280 !important;
            background: rgba(20, 20, 19, 0.3) !important;
            color: rgb(250, 249, 245) !important;
            overflow: hidden;
            backface-visibility: hidden;
            box-shadow:
                0 1px 3px rgba(0, 0, 0, 0.3),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
        }

        .modal-btn:hover {
            border-color: #9ca3af !important;
            background: rgba(75, 85, 99, 0.4) !important;
            transform: translateY(-1px);
            box-shadow:
                0 2px 6px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.15);
        }

        .modal-btn:active {
            transform: translateY(0);
            box-shadow:
                0 1px 2px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
        }

        .modal-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            pointer-events: none;
        }

        .modal-btn.primary {
            background: #f9fafb !important;
            color: #1f1e1d !important;
            border: 2px solid #e5e7eb !important;
            position: relative;
            overflow: hidden;
            will-change: transform;
            transition: all 150ms cubic-bezier(0.165, 0.85, 0.45, 1);
            box-shadow:
                0 2px 4px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.9);
        }

        .modal-btn.primary:hover {
            transform: translateY(-2px) scale(1.02);
            background: #e5e7eb !important;
            border-color: #d1d5db !important;
            box-shadow:
                0 4px 8px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.9);
        }

        .modal-btn.primary:active {
            transform: translateY(-1px) scale(1.01);
            box-shadow:
                0 2px 4px rgba(0, 0, 0, 0.4),
                inset 0 1px 0 0 rgba(255, 255, 255, 0.9);
        }

        .modal-btn.primary::after {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(at bottom, hsla(0, 0%, 100%, 20%), hsla(0, 0%, 100%, 0%));
            opacity: 0;
            transition: all 200ms ease;
            transform: translateY(8px);
        }

        .modal-btn.primary:hover::after {
            opacity: 1;
            transform: translateY(0);
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .instructions-library-header {
                background: var(--bg-100, rgba(31, 41, 55, 0.5));
                border-color: var(--border-300, rgba(75, 85, 99, 0.3));
            }

            .instructions-library-header:hover {
                background: var(--bg-200, rgba(55, 65, 81, 0.7));
            }

            .instructions-library-title {
                color: var(--text-200, rgb(156, 163, 175));
            }

            .instructions-library-content {
                background: var(--bg-000, rgba(17, 24, 39, 0.8));
            }

            .library-actions {
                background: var(--bg-100, rgba(31, 41, 55, 0.8));
                border-color: var(--border-300, rgba(75, 85, 99, 0.4));
            }
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
        if (document.getElementById('instructions-library-css')) return;

        const style = document.createElement('style');
        style.id = 'instructions-library-css';
        style.textContent = libraryCSS;
        document.head.appendChild(style);
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

        // Create actions
        const actions = document.createElement('div');
        actions.className = 'modal-actions';

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'modal-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.id = 'cancel-btn';

        const saveBtn = document.createElement('button');
        saveBtn.className = 'modal-btn primary';
        saveBtn.textContent = isEdit ? 'Save changes' : 'Save template';
        saveBtn.id = 'save-btn';

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

    // Start when page is ready
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

})();