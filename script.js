document.addEventListener('DOMContentLoaded', () => {

    // --- Global Utility: Debounce ---
    function debounce(func, wait = 100, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = () => {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    // --- 1. Navigation Active State ---
    function setActiveNavLink() {
        const currentPage = window.location.pathname.split("/").pop() || 'index.html'; // Get current page (index.html if root)
        const navLinks = document.querySelectorAll('.main-nav a');
        const isHomePage = document.body.classList.contains('page-home');

        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            const linkPage = linkHref.split("/").pop().split("#")[0]; // Get link filename
            const linkAnchor = linkHref.includes('#') ? linkHref.substring(linkHref.indexOf('#')) : null;

            link.classList.remove('active'); // Remove existing active states

            // Specific matching for portfolio page
            if (!isHomePage && currentPage === 'portfolio.html' && linkPage === 'portfolio.html') {
                 link.classList.add('active');
            }
            // Let scroll handler manage active state for home page anchors
        });
         // Special case: If on home page, initially make 'About' potentially active if scrolled? No, handled by scroll.
         // But we might want to highlight the Logo/Home link if we land on index.html without anchor
          if (isHomePage && !window.location.hash) {
               // Optional: Add active state to home/logo link? e.g.,
               // document.querySelector('.nav-logo a')?.classList.add('active'); // Decide if needed
          }
    }
    setActiveNavLink(); // Set active link on initial page load


    // --- 2. Home Page Specific Logic (Scrollspy, Smooth Scroll, Header change) ---
    if (document.body.classList.contains('page-home')) {

        // Smooth Scroll for Home Anchors
        const homeNavLinks = document.querySelectorAll('.main-nav a[href^="#"], .scroll-down a[href^="#"]');
        homeNavLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerOffset = document.querySelector('.main-header')?.offsetHeight || 0;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset - 20; // Extra offset adjustment

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });

                    // Optional: Update URL hash without jump (adds to history)
                    // if (history.pushState) {
                    //     history.pushState(null, null, targetId);
                    // } else {
                    //     window.location.hash = targetId;
                    // }
                    // Manually set active for immediate feedback after click
                     homeNavLinks.forEach(nav => nav.classList.remove('active'));
                     this.classList.add('active');
                }
            });
        });

        // Scroll-based Active Link (Scrollspy) & Header Change
        const sections = document.querySelectorAll('main section[id]');
        const header = document.querySelector('.main-header');
        const homePageAnchorLinks = document.querySelectorAll('.main-nav a[href^="#"]'); // Only anchor links

        const handleScroll = () => {
            let currentSectionId = '';
            const headerHeight = header?.offsetHeight || 0;
            const scrollPosition = window.pageYOffset + headerHeight + 50; // Trigger point adjustment

            sections.forEach(section => {
                if (scrollPosition >= section.offsetTop) {
                    currentSectionId = section.getAttribute('id');
                }
            });

             // Update nav active state for home page anchor links
            homePageAnchorLinks.forEach(link => {
                 link.classList.remove('active');
                 // Compare link's href anchor (#about) with current section ID
                 if (link.getAttribute('href') === `#${currentSectionId}`) {
                     link.classList.add('active');
                 }
            });
             // If at the very top, remove all anchor active states
             if (window.pageYOffset < sections[0].offsetTop - headerHeight - 50 ) {
                   homePageAnchorLinks.forEach(link => link.classList.remove('active'));
             }

            // Header style change
            if (window.scrollY > 50) {
                header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)';
                header.style.backgroundColor = 'rgba(248, 244, 240, 0.98)';
            } else {
                header.style.boxShadow = 'none';
                header.style.backgroundColor = 'rgba(248, 244, 240, 0.9)';
            }
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll(); // Run on load
    }


    // --- 3. Intersection Observer for Reveal Animations (Runs on all pages) ---
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optionally stop observing after first reveal:
                    // observer.unobserve(entry.target);
                } else {
                    // Optionally hide again when scrolling up:
                    // entry.target.classList.remove('visible');
                }
            });
        }, {
            root: null,
            threshold: 0.1, // 10% visible
            rootMargin: '0px 0px -50px 0px' // Trigger slightly earlier
        });

        revealElements.forEach(el => {
            revealObserver.observe(el);
        });
    }


    // --- 4. Portfolio Page Specific Logic (REVISED Width-Based Height Calc & Lightbox) ---
    if (document.body.classList.contains('page-portfolio')) {

        const portfolioGrid = document.getElementById('portfolio-grid');

        // === Configuration ===
        // Factor to apply to the REFERENCE ITEM'S WIDTH to get the height.
        // 1.0 = Square items (Height = Width)
        // 0.75 = Slightly landscape items (Height = 75% of Width)
        // 1.33 = Slightly portrait items (Height = 133% of Width)
        const TARGET_ASPECT_RATIO_FACTOR = 1.0; // Adjust for desired item shape (e.g., 1.0 for square)

        const RESIZE_DEBOUNCE_DELAY = 200;   // Delay for resize adjustments

        // === REVISED Height adjustment function (Based on width) ===
        function adjustPortfolioItemHeight() {
            if (!portfolioGrid) { console.log("Adjust Height: Grid not found."); return; }

            const gridItems = portfolioGrid.querySelectorAll('a.grid-item'); // Target the <a> tags
            if (gridItems.length === 0) { console.log("Adjust Height: No grid items found."); return; }

            // Check grid visibility
            const gridRect = portfolioGrid.getBoundingClientRect();
            if (gridRect.width <= 0) {
                console.log("Adjust Height: Grid has no width, likely hidden. Skipping.");
                return; // Don't calculate if hidden
            }

            console.log("Adjust Height: Setting height based on reference item width...");

            let referenceWidth = 0;
            // Find the first NON-WIDE item to get the standard column width
            const firstNormalItem = portfolioGrid.querySelector('a.grid-item:not(.wide)');

            if (firstNormalItem) {
                referenceWidth = firstNormalItem.offsetWidth; // Get rendered width
                console.log(`Adjust Height: Reference Width = ${referenceWidth}px`);
            } else if (gridItems.length > 0) {
                // Fallback if *only* wide items exist (unlikely)
                referenceWidth = gridItems[0].offsetWidth / 2; // Estimate standard width
                console.log(`Adjust Height: Fallback Reference Width = ${referenceWidth}px`);
            } else {
                console.log("Adjust Height: Cannot determine reference width.");
                return;
            }

            if (referenceWidth > 0) {
                // Calculate target height based on the standard item's width and the desired ratio factor
                const targetHeight = referenceWidth * TARGET_ASPECT_RATIO_FACTOR;
                const finalHeightPx = `${Math.round(targetHeight)}px`;
                console.log(`Adjust Height: Applying target height ${finalHeightPx}`);

                // Apply this SAME height to ALL grid items (<a> tags)
                gridItems.forEach(item => {
                    item.style.height = finalHeightPx;
                    // Ensure img fills the container (CSS should handle this too)
                    const img = item.querySelector('img');
                    if (img) {
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                    }
                });
                console.log("Adjust Height: Heights applied.");

            } else {
                console.log("Adjust Height: Reference width is zero. Cannot apply heights.");
            }
        }

        // --- Load Trigger (using imagesLoaded recommended but optional since height is layout based) ---
        if (portfolioGrid && typeof imagesLoaded === 'function') {
            console.log("Using imagesLoaded to trigger initial height adjustment.");
            imagesLoaded(portfolioGrid, function(instance) {
                console.log("imagesLoaded: Grid ready. Initial height adjustment.");
                adjustPortfolioItemHeight();
            }).on('fail', function() {
                console.error("imagesLoaded reported errors. Attempting adjustment anyway.");
                adjustPortfolioItemHeight();
            });
        } else {
            console.warn("imagesLoaded library not found or grid missing. Using window.onload.");
            window.addEventListener('load', () => {
                console.log("Window loaded. Initial height adjustment.");
                setTimeout(adjustPortfolioItemHeight, 100);
            });
            // Fallback if no load trigger works
            setTimeout(adjustPortfolioItemHeight, 500);
        }

        // --- Resize Trigger ---
        const debouncedAdjustHeight = debounce(adjustPortfolioItemHeight, RESIZE_DEBOUNCE_DELAY);
        window.addEventListener('resize', debouncedAdjustHeight);

        // --- Initialize LightGallery (Keep This) ---
        if (portfolioGrid && typeof lightGallery === 'function') {
            try {
                lightGallery(portfolioGrid, {
                    selector: '.grid-item', // Trigger on the <a> tag
                    thumbnail: true, animateThumb: false, showThumbByDefault: false,
                    download: false, zoom: true, fullscreen: true,
                });
                console.log("LightGallery Initialized.");
            } catch (e) {
                console.error("LightGallery initialization failed:", e);
            }
        } else {
            console.warn("LightGallery function not found or portfolio grid missing.");
        }

    } // End page-portfolio specific logic

}); // End DOMContentLoaded wrapper