// ==UserScript==
// @name         Claude Artifact Line Numbers
// @namespace    https://github.com/Aareon
// @version      1.2
// @description  Add line numbers to Claude artifacts that hide during generation and return when complete
// @author       Aareon
// @match        https://claude.ai/*
// @require      https://cdn.jsdelivr.net/gh/Aareon/UserScripts@main/Claude/ClaudeStyleCommon.user.js
// @grant        none
// @license      Personal/Educational Only – No Commercial Use
// ==/UserScript==

(function () {
    'use strict';

    // Simple debounce function
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // CSS for line numbers
    const lineNumberCSS = `
        .claude-line-numbers-wrapper {
            position: relative;
            overflow: auto;
            display: flex;
            background: inherit;
            border-radius: inherit;
        }

        .claude-line-numbers-wrapper.generation-active {
            display: none !important;
        }

        .claude-line-numbers {
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

        .claude-line-numbers-content {
            flex: 1;
            min-width: 0;
            overflow: hidden;
        }

        .claude-line-numbers-wrapper .code-block__code {
            margin: 0 !important;
            padding-left: 0.5em !important;
            padding-right: 1em !important;
            padding-top: 1em !important;
            padding-bottom: 1em !important;
        }

        .claude-line-numbers-content code {
            padding: 0 !important;
        }

        /* Hide original code blocks when wrapped */
        .claude-line-numbers-wrapper + .code-block__code {
            display: none !important;
        }
    `;

    // Track generation state
    let isGenerating = false;
    let generationObserver = null;
    let processedCodeBlocks = new Set();

    // Add CSS to page
    function addCSS() {
        if (document.getElementById('claude-line-numbers-css')) return;

        const style = document.createElement('style');
        style.id = 'claude-line-numbers-css';
        style.textContent = lineNumberCSS;
        document.head.appendChild(style);
    }

    // Generate line numbers text
    function generateLineNumbers(text) {
        const lines = text.split('\n');
        const actualLineCount = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;

        const lineNumbers = [];
        for (let i = 1; i <= actualLineCount; i++) {
            lineNumbers.push(i.toString());
        }
        return lineNumbers.join('\n');
    }

    // Detect if Claude is currently generating
    function detectGeneration() {
        // Look for generation indicators
        const generationIndicators = [
            '.text-token-text-secondary', // Thinking indicator
            '[data-testid="stop-button"]', // Stop button visible
            '.animate-pulse', // Pulsing elements during generation
            '.loading-indicator',
            '[aria-label="Stop generating"]'
        ];

        for (const selector of generationIndicators) {
            if (document.querySelector(selector)) {
                return true;
            }
        }

        // Check for streaming text patterns (rapid DOM changes)
        const artifactContainers = document.querySelectorAll('[class*="artifact"], [data-artifact]');
        for (const container of artifactContainers) {
            // Look for span elements being added rapidly (typical of streaming)
            const spans = container.querySelectorAll('span');
            if (spans.length > 0) {
                // Check if spans are being added with partial content
                for (const span of spans) {
                    if (span.textContent === '' || span.textContent.length < 3) {
                        return true; // Likely mid-generation
                    }
                }
            }
        }

        return false;
    }

    // Remove all line number wrappers
    function removeAllLineNumbers() {
        const wrappers = document.querySelectorAll('.claude-line-numbers-wrapper');
        wrappers.forEach(wrapper => {
            const codeContainer = wrapper.querySelector('.code-block__code');
            if (codeContainer && wrapper.parentNode) {
                // Move code container back to original location
                try {
                    wrapper.parentNode.insertBefore(codeContainer, wrapper);
                    wrapper.parentNode.removeChild(wrapper);
                } catch (e) {
                    // Ignore errors during cleanup
                }
            }
        });
        processedCodeBlocks.clear();
    }

    // Add line numbers to a single code block
    function addLineNumbersToCodeBlock(codeBlock) {
        if (!codeBlock || processedCodeBlocks.has(codeBlock)) return;

        const text = codeBlock.textContent || codeBlock.innerText;
        if (!text.includes('\n')) return;

        const parent = codeBlock.parentElement;
        if (!parent) return;

        const codeContainer = codeBlock.closest('.code-block__code') || parent;
        if (!codeContainer || codeContainer.closest('.claude-line-numbers-wrapper')) return;

        try {
            // Create wrapper structure
            const wrapper = document.createElement('div');
            wrapper.className = 'claude-line-numbers-wrapper';

            const lineNumbersEl = document.createElement('div');
            lineNumbersEl.className = 'claude-line-numbers';
            lineNumbersEl.textContent = generateLineNumbers(text);

            const contentWrapper = document.createElement('div');
            contentWrapper.className = 'claude-line-numbers-content';

            // Copy essential styles
            const computedStyle = window.getComputedStyle(codeContainer);
            wrapper.style.fontSize = computedStyle.fontSize;
            wrapper.style.lineHeight = computedStyle.lineHeight;
            wrapper.style.fontFamily = computedStyle.fontFamily;
            wrapper.style.backgroundColor = computedStyle.backgroundColor;
            wrapper.style.borderRadius = computedStyle.borderRadius;

            lineNumbersEl.style.fontSize = computedStyle.fontSize;
            lineNumbersEl.style.lineHeight = computedStyle.lineHeight;

            // Build structure
            wrapper.appendChild(lineNumbersEl);
            wrapper.appendChild(contentWrapper);

            // Insert wrapper and move code container
            const containerParent = codeContainer.parentNode;
            containerParent.insertBefore(wrapper, codeContainer);
            contentWrapper.appendChild(codeContainer);

            processedCodeBlocks.add(codeBlock);

        } catch (error) {
            // Silently fail to avoid disrupting Claude
        }
    }

    // Process all code blocks on page
    function processAllCodeBlocks() {
        if (isGenerating) return; // Don't process during generation

        const codeSelectors = [
            'code.language-python',
            'code.language-javascript',
            'code.language-typescript',
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
            try {
                const codeElements = document.querySelectorAll(selector);
                codeElements.forEach(codeElement => {
                    if (!processedCodeBlocks.has(codeElement)) {
                        addLineNumbersToCodeBlock(codeElement);
                    }
                });
            } catch (error) {
                // Ignore errors
            }
        });
    }

    // Handle generation state changes
    function handleGenerationChange() {
        const wasGenerating = isGenerating;
        isGenerating = detectGeneration();

        if (wasGenerating && !isGenerating) {
            // Generation just stopped - add line numbers back
            setTimeout(() => {
                processAllCodeBlocks();
            }, 1000); // Wait for DOM to stabilize
        } else if (!wasGenerating && isGenerating) {
            // Generation just started - remove line numbers
            removeAllLineNumbers();
        }
    }

    // Debounced generation check
    const debouncedGenerationCheck = debounce(handleGenerationChange, 100);

    // Set up generation monitoring
    function setupGenerationMonitoring() {
        // Monitor for generation state changes
        generationObserver = new MutationObserver((mutations) => {
            let shouldCheck = false;

            for (const mutation of mutations) {
                // Check for generation-related changes
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Look for generation indicators or new spans
                            if (node.matches && (
                                node.matches('span, button, [data-testid*="stop"], [class*="pulse"]') ||
                                node.querySelector('span, button, [data-testid*="stop"], [class*="pulse"]')
                            )) {
                                shouldCheck = true;
                                break;
                            }
                        }
                    }
                }

                if (shouldCheck) break;
            }

            if (shouldCheck) {
                debouncedGenerationCheck();
            }
        });

        generationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Initial setup
    function init() {
        addCSS();

        // Initial generation check
        handleGenerationChange();

        // Setup monitoring
        setupGenerationMonitoring();

        // Initial processing if not generating
        if (!isGenerating) {
            setTimeout(processAllCodeBlocks, 2000);
        }
    }

    // Cleanup on page unload
    function cleanup() {
        if (generationObserver) {
            generationObserver.disconnect();
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

    // Cleanup on unload
    window.addEventListener('beforeunload', cleanup);

    // Periodic check for missed artifacts (only when not generating)
    setInterval(() => {
        if (!isGenerating && document.visibilityState === 'visible') {
            handleGenerationChange();
        }
    }, 3000);

})();