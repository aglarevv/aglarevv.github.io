function createTOC() {
    var tocElement = document.createElement('div');
    tocElement.className = 'toc';
    var contentContainer = document.getElementById('content');
    
    const headings = contentContainer.querySelectorAll('h1, h2, h3, h4, h5, h6');
    
    if (headings.length === 0) {
        return;  // 如果没有标题元素，则不创建TOC
    }
    
    tocElement.insertAdjacentHTML('afterbegin', '<div class="toc-title">文章目录</div>');
    
    headings.forEach(heading => {
        if (!heading.id) {
            heading.id = heading.textContent.trim().replace(/\s+/g, '-').toLowerCase();
        }
        const link = document.createElement('a');
        link.href = '#' + heading.id;
        link.textContent = heading.textContent;
        link.className = 'toc-link';
        link.style.paddingLeft = `${(parseInt(heading.tagName.charAt(1)) - 1) * 10}px`;
        tocElement.appendChild(link);
    });
    
    tocElement.insertAdjacentHTML('beforeend', '<a class="toc-end" onclick="window.scrollTo({top:0,behavior: \'smooth\'});">Top</a>');
    contentContainer.prepend(tocElement);
}

document.addEventListener("DOMContentLoaded", function() {
    createTOC();
    var css = `
     :root {
            --toc-bg: #fff;
            --toc-border: #e1e4e8;
            --toc-text: #24292e;
            --toc-hover: #f6f8fa;
        }

        @media (prefers-color-scheme: dark) {
            :root {
                --toc-bg: #2d333b;
                --toc-border: #444c56;
                --toc-text: #adbac7;
                --toc-hover: #373e47;
            }
        }

        .toc {
            position: fixed;
            bottom: 60px;
            right: 20px;
            width: 250px;
            max-height: 70vh;
            background-color: var(--toc-bg);
            border: 1px solid var(--toc-border);
            border-radius: 6px;
            padding: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow-y: auto;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transform: translateY(20px) scale(0.9);
            transition: opacity 0.3s ease, transform 0.3s ease, visibility 0.3s;
        }
       
        .toc a {
            display: block;
            color: var(--toc-text);
            text-decoration: none;
            padding: 5px 0;
            font-size: 14px;
            line-height: 1.5;
            border-bottom: 1px solid var(--toc-border);
            transition: background-color 0.2s ease, padding-left 0.2s ease;
        }
        .toc a:last-child {
            border-bottom: none;
        }
        .toc a:hover {
            background-color: var(--toc-hover);
            padding-left: 5px;
        }
       
    `;

    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    window.onscroll = function() {
        const backToTopButton = document.querySelector('.toc-end');
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            backToTopButton.style="visibility: visible;"
        } else {
            backToTopButton.style="visibility: hidden;"
        }
    };

    console.log("\n %c GmeekTOC Plugins https://github.com/Meekdai/Gmeek \n","padding:5px 0;background:#C333D0;color:#fff");
});
