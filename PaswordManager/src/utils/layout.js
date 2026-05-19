/**
 * Layout Loader - Modular approach to inject Header and Footer
 */
document.addEventListener('DOMContentLoaded', () => {
    // Determine the root path to handle different directory depths
    const getRootPath = () => {
        const depth = window.location.pathname.split('/').filter(p => p).length;
        // Adjust if we're in a subdirectory
        let path = '';
        if (window.location.pathname.includes('/components/feature/')) path = '../../';
        else if (window.location.pathname.includes('/components/')) path = '../';
        else path = './';
        return path;
    };

    const rootPath = getRootPath();

    const loadComponent = (id, file) => {
        const placeholder = document.getElementById(id);
        if (!placeholder) return Promise.resolve();

        return fetch(rootPath + file)
            .then(response => response.text())
            .then(html => {
                placeholder.innerHTML = html;

                // Fix links in the injected HTML to be relative to current page
                if (id === 'header-placeholder') {
                    const navLinks = placeholder.querySelectorAll('a');
                    navLinks.forEach(link => {
                        const href = link.getAttribute('href');
                        if (href && !href.startsWith('http') && !href.startsWith('#')) {
                            if (href.startsWith('/')) {
                                link.href = rootPath + href.substring(1);
                            }
                        }
                    });

                    const images = placeholder.querySelectorAll('img');
                    images.forEach(image => {
                        const src = image.getAttribute('src');
                        if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('/')) {
                            image.src = rootPath + src;
                        }
                    });
                }
            })
            .catch(err => {
                console.error(`Failed to load ${file}:`, err);
            });
    };

    // Load both components
    Promise.all([
        loadComponent('header-placeholder', 'components/common/header.html'),
        loadComponent('footer-placeholder', 'components/common/footer.html')
    ]).catch(err => console.error('Error loading layout components:', err));
});
