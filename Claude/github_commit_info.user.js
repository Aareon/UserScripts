// ==UserScript==
// @name         Claude GitHub Repository Last Commit Info
// @namespace    https://github.com/Aareon
// @version      1.0
// @description  Add last commit date information to GitHub repository thumbnails
// @author       Aareon
// @match        https://claude.ai/*
// @grant        GM_xmlhttpRequest
// @license      Personal/Educational Only – No Commercial Use
// ==/UserScript==

(function () {
    'use strict';

    // Cache for commit data to avoid repeated API calls
    const commitCache = new Map();

    // Rate limiting - GitHub API allows 60 requests per hour for unauthenticated requests
    let requestCount = 0;
    const MAX_REQUESTS_PER_HOUR = 55; // Leave some buffer
    let lastRequestReset = Date.now();

    // CSS for the commit info display
    const commitInfoCSS = `
        .github-last-commit {
            font-size: 8px;
            color: #666;
            line-height: 1.2;
            opacity: 0.8;
            margin: 2px 0 0 0;
            padding: 0;
            display: block;
            word-wrap: break-word;
            hyphens: auto;
        }

        .github-last-commit.loading {
            color: #007185;
        }

        .github-last-commit.error {
            color: #cc0000;
        }

        .github-last-commit-date {
            font-weight: 600;
        }

        .github-last-commit-author {
            font-style: italic;
            margin-left: 3px;
        }

        /* Adjust the thumbnail layout to accommodate commit info */
        [data-testid="file-thumbnail"] .relative.flex.flex-col.gap-1 {
            gap: 1px !important;
        }

        /* Make sure the bottom section has proper spacing */
        [data-testid="file-thumbnail"] .relative.flex.flex-row.items-center.gap-1.justify-between {
            margin-top: auto;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
            .github-last-commit {
                color: #aaa;
            }
            .github-last-commit.loading {
                color: #58a6ff;
            }
            .github-last-commit.error {
                color: #f85149;
            }
        }
    `;

    // Add CSS to page
    function addCSS() {
        if (document.getElementById('github-last-commit-css')) return;

        const style = document.createElement('style');
        style.id = 'github-last-commit-css';
        style.textContent = commitInfoCSS;
        document.head.appendChild(style);
    }

    // Rate limiting check
    function canMakeRequest() {
        const now = Date.now();
        // Reset counter every hour
        if (now - lastRequestReset > 3600000) {
            requestCount = 0;
            lastRequestReset = now;
        }
        return requestCount < MAX_REQUESTS_PER_HOUR;
    }

    // Format relative time (e.g., "2 days ago")
    function getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);

        if (diffSeconds < 60) return 'just now';
        if (diffMinutes < 60) return `${diffMinutes}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffWeeks < 4) return `${diffWeeks}w ago`;
        if (diffMonths < 12) return `${diffMonths}mo ago`;
        return `${diffYears}y ago`;
    }

    // Extract repository info from GitHub URL or text patterns
    function parseGitHubUrl(text) {
        // Clean up the text and look for GitHub repository patterns
        const cleanText = text.replace(/\s+/g, ' ').trim();

        // Pattern for "Owner/Repo" format commonly used in GitHub references
        const ownerRepoPattern = /([a-zA-Z0-9][-a-zA-Z0-9]*[a-zA-Z0-9]?)\/([a-zA-Z0-9][-a-zA-Z0-9_.]*[a-zA-Z0-9])/;
        const match = cleanText.match(ownerRepoPattern);

        if (match) {
            let [, owner, repo] = match;
            // Clean up repo name (remove .git suffix, etc.)
            repo = repo.replace(/\.git$/, '').split(/[?#]/)[0];

            // Validate that this looks like a real GitHub repo (basic heuristics)
            if (owner.length >= 1 && repo.length >= 1 &&
                !owner.includes('.') && !owner.includes(' ') &&
                !repo.includes(' ')) {
                return { owner, repo };
            }
        }

        // Also try full GitHub URL patterns
        const urlPatterns = [
            /github\.com\/([^\/\s]+)\/([^\/\s]+)/i,
            /github\.com\/([^\/\s]+)\/([^\/\s]+)\/blob\/[^\/\s]+\/(.+)/i,
            /github\.com\/([^\/\s]+)\/([^\/\s]+)\/tree\/([^\/\s]+)/i
        ];

        for (const pattern of urlPatterns) {
            const urlMatch = cleanText.match(pattern);
            if (urlMatch) {
                let [, owner, repo] = urlMatch;
                repo = repo.replace(/\.git$/, '').split(/[?#]/)[0];
                return { owner, repo };
            }
        }

        return null;
    }

    // Fetch latest commit info from GitHub API using GM_xmlhttpRequest to bypass CORS
    async function fetchLatestCommit(owner, repo) {
        const cacheKey = `${owner}/${repo}`;

        // Check cache first
        if (commitCache.has(cacheKey)) {
            return commitCache.get(cacheKey);
        }

        // Check rate limiting
        if (!canMakeRequest()) {
            throw new Error('Rate limit reached');
        }

        return new Promise((resolve, reject) => {
            requestCount++;

            // Use GM_xmlhttpRequest to bypass CORS restrictions
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://api.github.com/repos/${owner}/${repo}/commits?per_page=1`,
                headers: {
                    'Accept': 'application/vnd.github+json',
                    'User-Agent': 'GitHub-Last-Commit-UserScript/1.0'
                },
                onload: function(response) {
                    try {
                        if (response.status !== 200) {
                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                        }

                        const commits = JSON.parse(response.responseText);
                        if (!commits || commits.length === 0) {
                            throw new Error('No commits found');
                        }

                        const latestCommit = commits[0];
                        const commitData = {
                            date: latestCommit.commit.author.date,
                            author: latestCommit.commit.author.name,
                            sha: latestCommit.sha.substring(0, 7),
                            message: latestCommit.commit.message.split('\n')[0] // First line only
                        };

                        // Cache the result for 5 minutes
                        commitCache.set(cacheKey, commitData);
                        setTimeout(() => commitCache.delete(cacheKey), 5 * 60 * 1000);

                        resolve(commitData);

                    } catch (error) {
                        console.error(`Error parsing commit data for ${owner}/${repo}:`, error);
                        reject(error);
                    }
                },
                onerror: function(error) {
                    console.error(`Network error fetching commit info for ${owner}/${repo}:`, error);
                    reject(new Error('Network error'));
                },
                ontimeout: function() {
                    console.error(`Timeout fetching commit info for ${owner}/${repo}`);
                    reject(new Error('Request timeout'));
                }
            });
        });
    }

    // Create commit info element
    function createCommitInfoElement(commitData) {
        const element = document.createElement('div');
        element.className = 'github-last-commit';

        const relativeTime = getRelativeTime(commitData.date);
        const authorName = commitData.author.length > 15 ?
            commitData.author.substring(0, 12) + '...' :
            commitData.author;

        element.innerHTML = `
            <span class="github-last-commit-date" title="${new Date(commitData.date).toLocaleString()}">
                ${relativeTime}
            </span>
            <span class="github-last-commit-author" title="by ${commitData.author}">
                by ${authorName}
            </span>
        `;

        return element;
    }

    // Add commit info to a repository thumbnail
    async function addCommitInfoToThumbnail(thumbnail) {
        // Check if already processed
        if (thumbnail.querySelector('.github-last-commit')) {
            return;
        }

        // Find the repository title/name in the thumbnail
        const titleElement = thumbnail.querySelector('h3');
        if (!titleElement) return;

        const titleText = titleElement.textContent;
        console.log('Processing thumbnail with title:', titleText); // Debug log

        const repoInfo = parseGitHubUrl(titleText);

        if (!repoInfo) {
            // Also check for GitHub patterns in other text elements
            const allText = thumbnail.textContent;
            const parsedInfo = parseGitHubUrl(allText);
            if (!parsedInfo) {
                console.log('No GitHub repo pattern found in:', allText); // Debug log
                return;
            }
            Object.assign(repoInfo, parsedInfo);
        }

        console.log('Found repo info:', repoInfo); // Debug log

        // Create loading element
        const loadingElement = document.createElement('div');
        loadingElement.className = 'github-last-commit loading';
        loadingElement.textContent = 'Loading...';

        // Find the best insertion point - after the title and branch info, but before the bottom controls
        const titleContainer = titleElement.closest('.relative.flex.flex-col.gap-1');
        if (titleContainer) {
            // Insert after the existing content but before any bottom controls
            titleContainer.appendChild(loadingElement);
        } else {
            console.log('Could not find title container for:', titleText);
            return;
        }

        try {
            const commitData = await fetchLatestCommit(repoInfo.owner, repoInfo.repo);
            const commitElement = createCommitInfoElement(commitData);

            // Replace loading element with actual commit info
            if (loadingElement.parentNode) {
                loadingElement.parentNode.replaceChild(commitElement, loadingElement);
            }

        } catch (error) {
            console.error('Error fetching commit data:', error);

            // Show error state
            loadingElement.className = 'github-last-commit error';
            loadingElement.textContent = 'Failed to load';

            // Remove error message after a few seconds
            setTimeout(() => {
                if (loadingElement.parentNode) {
                    loadingElement.parentNode.removeChild(loadingElement);
                }
            }, 3000);
        }
    }

    // Find and process GitHub repository thumbnails
    function processRepositoryThumbnails() {
        console.log('Processing repository thumbnails...'); // Debug log

        // Look for file thumbnails that might be GitHub repositories
        const thumbnails = document.querySelectorAll('[data-testid="file-thumbnail"]');
        console.log('Found', thumbnails.length, 'thumbnails'); // Debug log

        thumbnails.forEach((thumbnail, index) => {
            // Look for GitHub-related indicators
            const githubIcon = thumbnail.querySelector('svg path[fill-rule="evenodd"]');
            const titleElement = thumbnail.querySelector('h3');

            if (titleElement) {
                const titleText = titleElement.textContent;
                console.log(`Thumbnail ${index}:`, titleText); // Debug log

                // Check if it looks like a GitHub repository reference
                if (titleText.includes('/') ||
                    thumbnail.textContent.toLowerCase().includes('github')) {

                    console.log('Processing thumbnail:', titleText); // Debug log

                    // Add a small delay to avoid overwhelming the API and spread requests
                    setTimeout(() => {
                        addCommitInfoToThumbnail(thumbnail);
                    }, index * 500); // Stagger requests by 500ms each
                }
            }
        });
    }

    // Initialize the script
    function init() {
        addCSS();
        processRepositoryThumbnails();
    }

    // Set up mutation observer for dynamic content
    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;

            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if added node contains file thumbnails
                            if (node.querySelector &&
                                node.querySelector('[data-testid="file-thumbnail"]')) {
                                shouldProcess = true;
                            }
                        }
                    });
                }
            });

            if (shouldProcess) {
                // Delay processing to ensure DOM is stable
                setTimeout(processRepositoryThumbnails, 500);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Start when page is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(init, 1000);
            setupObserver();
        });
    } else {
        setTimeout(init, 1000);
        setupObserver();
    }

    // Periodic check for new thumbnails (every 10 seconds)
    setInterval(() => {
        if (document.visibilityState === 'visible') {
            processRepositoryThumbnails();
        }
    }, 10000);

})();