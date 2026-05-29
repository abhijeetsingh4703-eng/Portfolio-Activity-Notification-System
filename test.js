const http = require('http');

function postJSON(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'localhost',
            port: 3010,
            path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        const req = http.request(options, (res) => {
            let raw = '';
            res.on('data', chunk => raw += chunk);
            res.on('end', () => {
                console.log(`  Status: ${res.statusCode}`);
                console.log(`  Body:   ${raw}`);
                resolve(raw);
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function run() {
    console.log('\n=== 1. Setting notification preferences ===');
    await postJSON('/api/notification/preferences', {
        userId: 'user123',
        email: 'test@example.com',
        notifyOnBuy: true,
        notifyOnSell: false,
        minAmount: 100
    });

    console.log('\n=== 2. Creating portfolio transaction ===');
    await postJSON('/api/portfolio/transactions', {
        userId: 'user123',
        assetSymbol: 'AAPL',
        amount: 150,
        transactionType: 'BUY'
    });

    console.log('\n=== Done! Check docker-compose logs for the notification event. ===');
}

run().catch(console.error);
