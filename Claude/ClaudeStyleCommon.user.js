// ==UserScript==
// @name         Claude Style Common Library
// @namespace    https://github.com/Aareon
// @version      1.0
// @description  Common CSS styles and utilities for Claude.ai UserScripts
// @author       Aareon
// @match        https://claude.ai/*
// @grant        none
// @license      Personal/Educational Only – No Commercial Use
// ==/UserScript==

(function () {
    'use strict';

    // Export common styles object to global scope
    window.ClaudeStyles = {
        // Color tokens based on Claude's design system
        colors: {
            // Background colors
            'bg-000': 'rgba(255, 255, 255, 0.8)',
            'bg-100': 'rgba(249, 250, 251, 0.5)',
            'bg-200': 'rgba(243, 244, 246, 0.7)',
            'bg-300': 'rgba(229, 231, 235, 0.8)',
            
            // Dark backgrounds
            'bg-dark-000': 'rgba(17, 24, 39, 0.8)',
            'bg-dark-100': 'rgba(31, 41, 55, 0.5)',
            'bg-dark-200': 'rgba(55, 65, 81, 0.7)',
            'bg-dark-300': 'rgba(75, 85, 99, 0.8)',
            
            // Text colors
            'text-000': 'rgb(17, 24, 39)',
            'text-100': 'rgb(31, 41, 55)',
            'text-200': 'rgb(107, 114, 128)',
            'text-300': 'rgb(156, 163, 175)',
            'text-400': 'rgb(156, 163, 175)',
            'text-always-white': 'white',
            
            // Dark text colors
            'text-dark-000': 'rgb(250, 249, 245)',
            'text-dark-100': 'rgb(243, 244, 246)',
            'text-dark-200': 'rgb(209, 213, 219)',
            'text-dark-300': 'rgb(156, 163, 175)',
            
            // Border colors
            'border-100': 'rgba(229, 231, 235, 0.4)',
            'border-200': 'rgb(229, 231, 235)',
            'border-300': 'rgba(209, 213, 219, 0.3)',
            'border-400': 'rgba(75, 85, 99, 0.4)',
            
            // Accent colors
            'accent-main-100': 'rgb(59, 130, 246)',
            'accent-main-200': 'rgb(37, 99, 235)',
            'accent-secondary-000': 'rgb(59, 130, 246)',
            'accent-secondary-200': 'rgba(59, 130, 246, 0.5)',
            
            // Status colors
            'success': 'rgb(34, 197, 94)',
            'warning': 'rgb(255, 140, 0)',
            'error': 'rgb(239, 68, 68)',
            'info': 'rgb(59, 130, 246)'
        },

        // Common CSS components
        components: {
            // Glass morphism container (adapts to theme)
            glassContainer: `
                background: color-mix(in srgb, canvas 85%, transparent);
                backdrop-filter: blur(8px);
                border: 1.5px solid color-mix(in srgb, canvastext 20%, transparent);
                border-radius: 8px;
                box-shadow:
                    0 2px 4px color-mix(in srgb, canvastext 15%, transparent),
                    inset 0 1px 0 0 color-mix(in srgb, canvas 100%, transparent);
                color: canvastext;
            `,

            // Alternative glass container for contrast
            contrastGlassContainer: `
                background: color-mix(in srgb, canvas 90%, canvastext 5%);
                backdrop-filter: blur(8px);
                border: 1.5px solid color-mix(in srgb, canvastext 25%, transparent);
                border-radius: 8px;
                box-shadow:
                    0 2px 4px color-mix(in srgb, canvastext 20%, transparent),
                    inset 0 1px 0 0 color-mix(in srgb, canvas 100%, transparent);
                color: canvastext;
            `,

            // Button base styles (theme-adaptive)
            buttonBase: `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                user-select: none;
                font-family: "Amazon Ember", "Styrene", -apple-system, BlinkMacSystemFont, sans-serif;
                font-weight: 500;
                border-radius: 6px;
                transition: all 0.2s ease;
                border: 1.5px solid;
                padding: 8px 16px;
                font-size: 12px;
                backdrop-filter: blur(4px);
                box-shadow:
                    0 1px 3px color-mix(in srgb, canvastext 20%, transparent),
                    inset 0 1px 0 0 color-mix(in srgb, canvas 100%, transparent);
            `,

            // Primary button (theme-adaptive)
            buttonPrimary: `
                background: color-mix(in srgb, highlight 100%, transparent);
                color: highlighttext;
                border-color: color-mix(in srgb, highlight 80%, canvastext 20%);
                box-shadow:
                    0 2px 4px color-mix(in srgb, highlight 30%, transparent),
                    inset 0 1px 0 0 color-mix(in srgb, highlighttext 20%, transparent);
            `,

            // Secondary button (theme-adaptive)
            buttonSecondary: `
                background: color-mix(in srgb, canvas 95%, canvastext 5%);
                color: canvastext;
                border-color: color-mix(in srgb, canvastext 30%, transparent);
                box-shadow:
                    0 1px 3px color-mix(in srgb, canvastext 20%, transparent),
                    inset 0 1px 0 0 color-mix(in srgb, canvas 100%, transparent);
            `,

            // Card base (theme-adaptive)
            cardBase: `
                border: 1.5px solid color-mix(in srgb, canvastext 25%, transparent);
                border-radius: 8px;
                background: color-mix(in srgb, canvas 90%, canvastext 5%);
                backdrop-filter: blur(4px);
                box-shadow:
                    0 1px 3px color-mix(in srgb, canvastext 20%, transparent),
                    inset 0 1px 0 0 color-mix(in srgb, canvas 100%, transparent);
                transition: all 0.2s ease;
                color: canvastext;
            `,

            // Form input (theme-adaptive)
            formInput: `
                width: 100%;
                padding: 12px;
                border: 1.5px solid color-mix(in srgb, canvastext 35%, transparent);
                border-radius: 8px;
                font-size: 14px;
                transition: all 0.2s ease;
                background: color-mix(in srgb, canvas 95%, canvastext 3%);
                color: canvastext;
                box-shadow:
                    inset 0 1px 3px color-mix(in srgb, canvastext 20%, transparent),
                    0 1px 0 0 color-mix(in srgb, canvas 100%, transparent);
            `,

            // Badge base
            badgeBase: `
                display: inline-flex;
                align-items: center;
                border-radius: 6px;
                padding: 4px 8px;
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                border: 1px solid;
            `,

            // Modal overlay (theme-adaptive)
            modalOverlay: `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: color-mix(in srgb, canvastext 50%, transparent);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(4px);
                -webkit-backdrop-filter: blur(4px);
            `,

            // Modal content (theme-adaptive)
            modalContent: `
                background: canvas;
                color: canvastext;
                border: 2px solid color-mix(in srgb, canvastext 30%, transparent);
                border-radius: 16px;
                padding: 24px;
                max-width: 768px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                box-shadow:
                    0 20px 25px -5px color-mix(in srgb, canvastext 30%, transparent),
                    0 10px 10px -5px color-mix(in srgb, canvastext 20%, transparent),
                    inset 0 1px 0 0 color-mix(in srgb, canvas 100%, transparent);
                animation: zoom 250ms ease-in forwards;
            `
        },

        // Animation keyframes
        animations: `
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

            @keyframes claude-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .claude-spin {
                animation: claude-spin 1s linear infinite;
                display: inline-block;
            }

            .fade-in {
                animation: fadeIn 0.2s ease-in;
            }

            .slide-up {
                animation: slideUp 0.3s ease-out;
            }
        `,

        // Utility classes
        utilities: `
            /* Text utilities */
            .claude-text-xs { font-size: 10px; }
            .claude-text-sm { font-size: 11px; }
            .claude-text-base { font-size: 12px; }
            .claude-text-lg { font-size: 14px; }
            .claude-text-xl { font-size: 16px; }

            /* Spacing utilities */
            .claude-p-1 { padding: 4px; }
            .claude-p-2 { padding: 8px; }
            .claude-p-3 { padding: 12px; }
            .claude-p-4 { padding: 16px; }
            .claude-m-1 { margin: 4px; }
            .claude-m-2 { margin: 8px; }
            .claude-m-3 { margin: 12px; }
            .claude-m-4 { margin: 16px; }

            /* Flex utilities */
            .claude-flex { display: flex; }
            .claude-flex-col { flex-direction: column; }
            .claude-items-center { align-items: center; }
            .claude-justify-center { justify-content: center; }
            .claude-justify-between { justify-content: space-between; }
            .claude-gap-1 { gap: 4px; }
            .claude-gap-2 { gap: 8px; }
            .claude-gap-3 { gap: 12px; }

            /* Visibility utilities */
            .claude-hidden { display: none; }
            .claude-opacity-50 { opacity: 0.5; }
            .claude-opacity-75 { opacity: 0.75; }

            /* Interaction utilities */
            .claude-pointer { cursor: pointer; }
            .claude-no-select { user-select: none; }
            .claude-no-pointer-events { pointer-events: none; }

            /* Border utilities */
            .claude-rounded { border-radius: 4px; }
            .claude-rounded-md { border-radius: 6px; }
            .claude-rounded-lg { border-radius: 8px; }
            .claude-rounded-xl { border-radius: 12px; }

            /* Shadow utilities */
            .claude-shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
            .claude-shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
            .claude-shadow-md { box-shadow: 0 2px 6px rgba(0,0,0,0.3); }
            .claude-shadow-lg { box-shadow: 0 4px 8px rgba(0,0,0,0.4); }
        `,

        // Language-specific badge colors
        languageBadges: `
            .claude-badge-html {
                background: rgba(228, 77, 38, 0.1);
                color: rgb(228, 77, 38);
                border-color: rgba(228, 77, 38, 0.2);
            }

            .claude-badge-css {
                background: rgba(21, 114, 182, 0.1);
                color: rgb(21, 114, 182);
                border-color: rgba(21, 114, 182, 0.2);
            }

            .claude-badge-js, .claude-badge-javascript {
                background: rgba(247, 223, 30, 0.1);
                color: rgb(181, 160, 0);
                border-color: rgba(247, 223, 30, 0.2);
            }

            .claude-badge-python {
                background: rgba(53, 114, 165, 0.1);
                color: rgb(53, 114, 165);
                border-color: rgba(53, 114, 165, 0.2);
            }

            .claude-badge-typescript, .claude-badge-ts {
                background: rgba(49, 120, 198, 0.1);
                color: rgb(49, 120, 198);
                border-color: rgba(49, 120, 198, 0.2);
            }

            .claude-badge-userscript {
                background: rgba(255, 140, 0, 0.1);
                color: rgb(255, 140, 0);
                border-color: rgba(255, 140, 0, 0.2);
            }

            .claude-badge-react {
                background: rgba(97, 218, 251, 0.1);
                color: rgb(97, 218, 251);
                border-color: rgba(97, 218, 251, 0.2);
            }

            .claude-badge-java {
                background: rgba(237, 117, 42, 0.1);
                color: rgb(237, 117, 42);
                border-color: rgba(237, 117, 42, 0.2);
            }

            .claude-badge-cpp, .claude-badge-c {
                background: rgba(0, 89, 156, 0.1);
                color: rgb(0, 89, 156);
                border-color: rgba(0, 89, 156, 0.2);
            }

            .claude-badge-csharp {
                background: rgba(93, 46, 160, 0.1);
                color: rgb(93, 46, 160);
                border-color: rgba(93, 46, 160, 0.2);
            }

            .claude-badge-php {
                background: rgba(119, 123, 180, 0.1);
                color: rgb(119, 123, 180);
                border-color: rgba(119, 123, 180, 0.2);
            }

            .claude-badge-ruby {
                background: rgba(204, 52, 45, 0.1);
                color: rgb(204, 52, 45);
                border-color: rgba(204, 52, 45, 0.2);
            }

            .claude-badge-go {
                background: rgba(0, 173, 216, 0.1);
                color: rgb(0, 173, 216);
                border-color: rgba(0, 173, 216, 0.2);
            }

            .claude-badge-rust {
                background: rgba(222, 165, 132, 0.1);
                color: rgb(222, 165, 132);
                border-color: rgba(222, 165, 132, 0.2);
            }

            .claude-badge-swift {
                background: rgba(250, 95, 55, 0.1);
                color: rgb(250, 95, 55);
                border-color: rgba(250, 95, 55, 0.2);
            }

            .claude-badge-json {
                background: rgba(41, 128, 185, 0.1);
                color: rgb(41, 128, 185);
                border-color: rgba(41, 128, 185, 0.2);
            }

            .claude-badge-xml {
                background: rgba(155, 89, 182, 0.1);
                color: rgb(155, 89, 182);
                border-color: rgba(155, 89, 182, 0.2);
            }

            .claude-badge-yaml, .claude-badge-yml {
                background: rgba(230, 126, 34, 0.1);
                color: rgb(230, 126, 34);
                border-color: rgba(230, 126, 34, 0.2);
            }

            .claude-badge-sql {
                background: rgba(52, 152, 219, 0.1);
                color: rgb(52, 152, 219);
                border-color: rgba(52, 152, 219, 0.2);
            }

            .claude-badge-bash, .claude-badge-shell {
                background: rgba(46, 204, 113, 0.1);
                color: rgb(46, 204, 113);
                border-color: rgba(46, 204, 113, 0.2);
            }

            .claude-badge-markdown, .claude-badge-md {
                background: rgba(52, 73, 94, 0.1);
                color: rgb(52, 73, 94);
                border-color: rgba(52, 73, 94, 0.2);
            }

            /* Dark mode adjustments for language badges */
            @media (prefers-color-scheme: dark) {
                .claude-badge-html {
                    background: rgba(228, 77, 38, 0.15);
                    color: rgb(255, 120, 90);
                }

                .claude-badge-css {
                    background: rgba(21, 114, 182, 0.15);
                    color: rgb(100, 170, 255);
                }

                .claude-badge-js, .claude-badge-javascript {
                    background: rgba(247, 223, 30, 0.15);
                    color: rgb(255, 235, 80);
                }

                .claude-badge-python {
                    background: rgba(53, 114, 165, 0.15);
                    color: rgb(120, 180, 255);
                }

                .claude-badge-typescript, .claude-badge-ts {
                    background: rgba(49, 120, 198, 0.15);
                    color: rgb(110, 170, 255);
                }

                .claude-badge-userscript {
                    background: rgba(255, 140, 0, 0.15);
                    color: rgb(255, 180, 80);
                }

                .claude-badge-react {
                    background: rgba(97, 218, 251, 0.15);
                    color: rgb(150, 235, 255);
                }
            }
        `,

        // Dark mode support
        darkMode: `
            @media (prefers-color-scheme: dark) {
                .claude-glass-container {
                    background: rgba(31, 41, 55, 0.8);
                    border-color: rgba(75, 85, 99, 0.4);
                }

                .claude-button-secondary {
                    background: rgba(75, 85, 99, 0.8);
                    border-color: #9ca3af;
                    color: rgb(209, 213, 219);
                }

                .claude-form-input {
                    background: #374151;
                    border-color: #6b7280;
                    color: #f9fafb;
                }

                .claude-form-input::placeholder {
                    color: #9ca3af;
                }
            }
        `
    };

    // Utility function to add common styles
    window.ClaudeStyles.addCommonCSS = function(styleId, additionalCSS = '') {
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            ${this.animations}
            ${this.utilities}
            ${this.languageBadges}
            ${this.darkMode}
            ${additionalCSS}
        `;
        document.head.appendChild(style);
    };

    // Utility function to create a component with common styling
    window.ClaudeStyles.createElement = function(tag, className, styles = []) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        
        if (styles.length > 0) {
            const cssText = styles.map(style => this.components[style] || style).join('\n');
            element.style.cssText = cssText;
        }
        
        return element;
    };

    // Utility function to create buttons with common styling
    window.ClaudeStyles.createButton = function(text, type = 'secondary', onClick = null) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = this.components.buttonBase + '\n' + 
            (type === 'primary' ? this.components.buttonPrimary : this.components.buttonSecondary);
        
        // Add hover effects
        button.addEventListener('mouseenter', () => {
            if (type === 'primary') {
                button.style.background = 'rgb(37, 99, 235)';
                button.style.transform = 'translateY(-1px)';
                button.style.boxShadow = '0 3px 8px rgba(59, 130, 246, 0.4), inset 0 1px 0 0 rgba(255, 255, 255, 0.25)';
            } else {
                button.style.background = 'rgba(75, 85, 99, 0.9)';
                button.style.borderColor = '#9ca3af';
                button.style.transform = 'translateY(-1px)';
            }
        });

        button.addEventListener('mouseleave', () => {
            button.style.cssText = this.components.buttonBase + '\n' + 
                (type === 'primary' ? this.components.buttonPrimary : this.components.buttonSecondary);
        });

        if (onClick) button.onclick = onClick;
        
        return button;
    };

    // Utility function to create modals
    window.ClaudeStyles.createModal = function(title, content, actions = []) {
        const overlay = document.createElement('div');
        overlay.style.cssText = this.components.modalOverlay;

        const modal = document.createElement('div');
        modal.style.cssText = this.components.modalContent;
        modal.className = 'fade-in';

        const header = document.createElement('h2');
        header.textContent = title;
        header.style.cssText = `
            font-family: "Styrene Display", -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 20px;
            font-weight: 500;
            color: #f9fafb;
            margin-bottom: 16px;
        `;

        modal.appendChild(header);
        
        if (typeof content === 'string') {
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = content;
            modal.appendChild(contentDiv);
        } else {
            modal.appendChild(content);
        }

        if (actions.length > 0) {
            const actionsDiv = document.createElement('div');
            actionsDiv.style.cssText = `
                display: flex;
                gap: 8px;
                justify-content: flex-end;
                margin-top: 24px;
            `;
            
            actions.forEach(action => {
                actionsDiv.appendChild(action);
            });
            
            modal.appendChild(actionsDiv);
        }

        overlay.appendChild(modal);

        // Close on overlay click
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                document.body.removeChild(overlay);
            }
        };

        return overlay;
    };

    // Utility function to create language badges
    window.ClaudeStyles.createLanguageBadge = function(language, displayName = null) {
        const badge = document.createElement('div');
        badge.style.cssText = this.components.badgeBase;
        badge.className = `claude-badge-${language.toLowerCase()}`;
        badge.textContent = displayName || language.toUpperCase();
        badge.title = `Language: ${displayName || language}`;
        
        return badge;
    };

    // Auto-initialize common styles
    window.ClaudeStyles.addCommonCSS('claude-common-styles');

})();