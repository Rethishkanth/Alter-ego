document.addEventListener('DOMContentLoaded', () => {
    const list = document.getElementById('content-list');

    // Load data from storage
    chrome.storage.local.get(['captions', 'tweets'], (result) => {
        const captions = result.captions || [];
        const tweets = result.tweets || [];

        if (captions.length === 0 && tweets.length === 0) {
            list.innerHTML = '<p>No content captured yet.</p>';
            return;
        }

        list.innerHTML = '';

        if (captions.length > 0) {
            const h2 = document.createElement('h2');
            h2.textContent = 'YouTube Videos';
            list.appendChild(h2);
            captions.forEach(c => {
                const div = document.createElement('div');
                div.className = 'item';

                const title = document.createElement('div');
                title.textContent = `[${c.timestamp}] ${c.title}`;
                div.appendChild(title);

                const link = document.createElement('a');
                link.href = c.url;
                link.target = '_blank';
                link.textContent = 'Open Video';
                link.style.display = 'block';
                link.style.marginTop = '5px';
                link.style.color = '#007bff';
                div.appendChild(link);

                list.appendChild(div);
            });
        }

        if (tweets.length > 0) {
            const h2 = document.createElement('h2');
            h2.textContent = 'Liked/Shared Tweets';
            list.appendChild(h2);
            tweets.forEach(t => {
                const div = document.createElement('div');
                div.className = 'item';
                div.textContent = `[${t.timestamp}] ${t.action}: ${t.text.substring(0, 50)}...`;
                list.appendChild(div);
            });
        }
    });

    // Download functionality
    document.getElementById('download-btn').addEventListener('click', () => {
        chrome.storage.local.get(['captions', 'tweets', 'debug_logs'], (result) => {
            const data = {
                captions: result.captions || [],
                tweets: result.tweets || [],
                debug_logs: result.debug_logs || [],
                exportDate: new Date().toISOString()
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `social-transcription-${new Date().toISOString().slice(0, 10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    });

    // Debug View
    chrome.storage.local.get(['debug_logs'], (result) => {
        const logs = result.debug_logs || [];
        if (logs.length > 0) {
            const list = document.getElementById('content-list');
            const h2 = document.createElement('h2');
            h2.textContent = 'Debug Logs';
            h2.style.color = 'red';
            list.appendChild(h2);
            logs.forEach(l => {
                const div = document.createElement('div');
                div.className = 'item';
                div.style.color = '#aa0000';
                div.textContent = l;
                list.appendChild(div);
            });
        }
    });
});
