const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const port = Number(process.env.PORT) || 3000;
const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
};

const taskInstructions = {
    insight: 'Give a concise, friendly weather briefing and one useful action for the next few hours.',
    outfit: 'Recommend practical clothing for the current weather and next several hours. Mention rain or sun protection when relevant.',
    chat: 'Answer as a concise, friendly weather coach. For weekday or date questions, use the matching entry in the daily forecast and state its precipitation probability as a chance, not a certainty. If the requested date is not included, say so instead of guessing. If earlier chat conflicts with the supplied forecast, trust the forecast and correct the earlier answer.'
};

function sendJson(response, status, body) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(body));
}

async function handleCoach(request, response) {
    if (!process.env.GEMINI_API_KEY) {
        return sendJson(response, 503, { error: 'Gemini is not configured. Add GEMINI_API_KEY to the server .env file.' });
    }

    let rawBody = '';
    for await (const chunk of request) {
        rawBody += chunk;
        if (rawBody.length > 20_000) return sendJson(response, 413, { error: 'Request is too large.' });
    }

    let body;
    try {
        body = JSON.parse(rawBody);
    } catch {
        return sendJson(response, 400, { error: 'Request body must be valid JSON.' });
    }

    const { task, weather } = body;
    if (!taskInstructions[task] || !weather || typeof weather !== 'object') {
        return sendJson(response, 400, { error: 'A supported task and weather context are required.' });
    }

    const contents = [];

    if (task === 'chat') {
        const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
        for (const item of history) {
            if (['user', 'assistant'].includes(item.role) && typeof item.content === 'string') {
                contents.push({
                    role: item.role === 'assistant' ? 'model' : 'user',
                    parts: [{ text: item.content.slice(0, 1200) }]
                });
            }
        }
        if (typeof body.message !== 'string' || !body.message.trim()) {
            return sendJson(response, 400, { error: 'Enter a question for the Weather Coach.' });
        }
        if (contents.at(-1)?.role !== 'user' || contents.at(-1)?.parts[0]?.text !== body.message.trim()) {
            contents.push({ role: 'user', parts: [{ text: body.message.trim().slice(0, 1200) }] });
        }
    } else {
        contents.push({
            role: 'user',
            parts: [{ text: 'Use the current weather context to provide the requested recommendation.' }]
        });
    }

    try {
        const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': process.env.GEMINI_API_KEY
            },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{ text: `${taskInstructions[task]} Keep the response under 100 words. Never invent forecast details. Weather context (JSON): ${JSON.stringify(weather)}` }]
                },
                contents,
                generationConfig: { temperature: 0.5, maxOutputTokens: 180 }
            })
        });
        const result = await aiResponse.json();
        if (!aiResponse.ok) {
            console.error('Gemini provider request failed:', result.error?.status || aiResponse.status, result.error?.message || 'Unknown provider error');
            if (aiResponse.status === 429) {
                return sendJson(response, 503, { error: 'Gemini API quota or rate limit reached. Check your Google AI Studio project and billing.' });
            }
            if (aiResponse.status === 401 || aiResponse.status === 403) {
                return sendJson(response, 503, { error: 'Gemini rejected the API key or project permissions. Check GEMINI_API_KEY and its API access.' });
            }
            return sendJson(response, 502, { error: 'Gemini could not complete the request. Check the configured model and API access.' });
        }
        const reply = result.candidates?.[0]?.content?.parts
            ?.map((part) => part.text)
            .filter((text) => typeof text === 'string')
            .join('')
            .trim();
        if (!reply) return sendJson(response, 502, { error: 'The AI provider returned an empty response.' });
        return sendJson(response, 200, { reply });
    } catch (error) {
        console.error('AI request failed:', error.message);
        return sendJson(response, 502, { error: 'Could not reach the AI provider.' });
    }
}

const server = http.createServer(async (request, response) => {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);

    if (requestUrl.pathname === '/api/ai/coach' && request.method === 'POST') {
        return handleCoach(request, response);
    }
    if (requestUrl.pathname.startsWith('/api/')) {
        return sendJson(response, 404, { error: 'API endpoint not found.' });
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405);
        return response.end();
    }

    let pathname;
    try {
        pathname = decodeURIComponent(requestUrl.pathname);
    } catch {
        response.writeHead(400);
        return response.end();
    }
    if (pathname.split('/').some((segment) => segment.startsWith('.'))) {
        response.writeHead(404);
        return response.end('Not found');
    }
    const filePath = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!filePath.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403);
        return response.end();
    }

    fs.readFile(filePath, (error, content) => {
        if (error) {
            response.writeHead(error.code === 'ENOENT' ? 404 : 500);
            return response.end('Not found');
        }
        response.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(filePath)] || 'application/octet-stream',
            'Cache-Control': 'no-store'
        });
        response.end(request.method === 'HEAD' ? undefined : content);
    });
});

server.listen(port, '127.0.0.1', () => {
    console.log(`Stratos running at http://localhost:${port}`);
});