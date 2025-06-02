// ==UserScript==
// @name         Claude Artifact Line Numbers
// @namespace    https://github.com/Aareon
// @version      1.0
// @description  Add line numbers to code blocks in Claude artifacts
// @author       Aareon
// @match        https://claude.ai/*
// @grant        none
// @license      Personal/Educational Only – No Commercial Use
// ==/UserScript==

(function () {
    'use strict';

    // CSS for line numbers
    const lineNumberCSS = `
        .line-numbers-wrapper {
            position: relative;
            overflow: auto;
            display: flex;
            background: inherit;
            border-radius: inherit;
        }

        .line-numbers {
            width: 50px;
            background: rgba(0, 0, 0, 0.1);
            border-right: 1px solid rgba(255, 255, 255, 0.2);
            font-family: "Fira Code", "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace;
            font-size: inherit;
            line-height: inherit;
            color: rgba(171, 178, 191, 0.6);
            user-select: none;
            pointer-events: none;
            white-space: pre;
            text-align: right;
            flex-shrink: 0;
            box-sizing: border-box;
            padding: 1em 0.5em 1em 0.25em;
        }

        .line-numbers-content {
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }

        /* Reset padding on the code container to prevent double padding */
        .line-numbers-wrapper .code-block__code {
            margin: 0 !important;
            padding-left: 0.5em !important;
            padding-right: 1em !important;
            padding-top: 1em !important;
            padding-bottom: 1em !important;
        }

        .line-numbers-content code {
            padding: 0 !important;
        }
    `;

    // Add CSS to page
    function addCSS() {
        if (document.getElementById('claude-line-numbers-css')) return;

        const style = document.createElement('style');
        style.id = 'claude-line-numbers-css';
        style.textContent = lineNumberCSS;
        document.head.appendChild(style);
    }

    // Generate line numbers for a code block
    function generateLineNumbers(codeElement) {
        const text = codeElement.textContent || codeElement.innerText;
        const lines = text.split('\n');
        const lineCount = lines.length;

        // Handle empty last line
        const actualLineCount = lines[lineCount - 1] === '' ? lineCount - 1 : lineCount;

        const lineNumbers = [];
        for (let i = 1; i <= actualLineCount; i++) {
            lineNumbers.push(i.toString());
        }

        return lineNumbers.join('\n');
    }

    // Add line numbers to a code block
    function addLineNumbers(codeBlock) {
        // Skip if already processed
        if (codeBlock.closest('.line-numbers-wrapper')) return;

        // Skip if it's not a multi-line code block
        const text = codeBlock.textContent || codeBlock.innerText;
        if (!text.includes('\n')) return;

        const parent = codeBlock.parentElement;
        if (!parent) return;

        // Find the code container (could be the parent with .code-block__code class)
        const codeContainer = codeBlock.closest('.code-block__code') || parent;

        // Create wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'line-numbers-wrapper';

        // Create line numbers element
        const lineNumbersEl = document.createElement('div');
        lineNumbersEl.className = 'line-numbers';
        lineNumbersEl.textContent = generateLineNumbers(codeBlock);

        // Create content wrapper
        const contentWrapper = document.createElement('div');
        contentWrapper.className = 'line-numbers-content';

        // Copy styles from code container to wrapper and line numbers
        const computedStyle = window.getComputedStyle(codeContainer);

        // Copy important styles to ensure alignment
        const stylesToCopy = [
            'fontSize', 'lineHeight', 'fontFamily', 'padding',
            'backgroundColor', 'borderRadius', 'textShadow'
        ];

        stylesToCopy.forEach(prop => {
            if (computedStyle[prop] && computedStyle[prop] !== 'normal') {
                wrapper.style[prop] = computedStyle[prop];
                lineNumbersEl.style[prop] = computedStyle[prop];
            }
        });

        // Ensure line numbers have the same exact line height
        lineNumbersEl.style.lineHeight = computedStyle.lineHeight;
        lineNumbersEl.style.fontSize = computedStyle.fontSize;

        // Insert wrapper before the code container
        codeContainer.parentElement.insertBefore(wrapper, codeContainer);

        // Move code container into content wrapper
        contentWrapper.appendChild(codeContainer);

        // Add elements to wrapper
        wrapper.appendChild(lineNumbersEl);
        wrapper.appendChild(contentWrapper);
    }

    // Process all code blocks on the page
    function processCodeBlocks() {
        // Look for code elements that are likely to be in artifacts
        const codeSelectors = [
            'code.language-python',
            'code.language-javascript',
            'code.language-java',
            'code.language-cpp',
            'code.language-c',
            'code.language-html',
            'code.language-css',
            'code.language-json',
            'code.language-xml',
            'code.language-sql',
            'code.language-bash',
            'code.language-shell',
            'code[class*="language-"]',
            'pre code',
            '.code-block__code code'
        ];

        codeSelectors.forEach(selector => {
            const codeElements = document.querySelectorAll(selector);
            codeElements.forEach(addLineNumbers);
        });
    }

    // Initialize
    function init() {
        addCSS();
        processCodeBlocks();
    }

    // Set up mutation observer to handle dynamically added content
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if added node contains code blocks
                            if (node.querySelector('code') || node.tagName === 'CODE') {
                                shouldProcess = true;
                            }
                        }
                    });
                }
            });

            if (shouldProcess) {
                // Delay processing to ensure DOM is stable
                setTimeout(processCodeBlocks, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 1000); // Give Claude time to load
            setupObserver();
        });
    } else {
        setTimeout(init, 1000);
        setupObserver();
    }

    // Also run periodically to catch any missed code blocks
    setInterval(processCodeBlocks, 3000);

})();