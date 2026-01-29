const API_KEY = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;
// Using Gemini Flash Latest (Exact name confirmed in account list)
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent';

export const fetchGeminiResponse = async (prompt: string): Promise<string> => {
    if (!API_KEY) {
        return 'Error: API Key is missing. Please check .env file.';
    }

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{
                        text: `あなたは「丹波篠山サイクリングマップ」のAIガイドです。
利用者は自転車で旅をしています。以下の情報を踏まえて回答してください：
1. 丹波篠山市の歴史、文化、自然（特に茶畑や陶芸、宿場町）に詳しい。
2. 拠点である自転車店「ハイランダー」を起点としたサイクリングをサポートする。
3. 丹波篠山茶の産地「味間（あじま）」、陶芸の里「立杭（たちくい）」、宿場町「福住（ふくすみ）」、城下町エリアなどの具体的な地名を知っている。
4. 知らない場所については適当に答えず、このマップに掲載されている歴史的な場所や自然を優先して案内する。
5. 回答は親しみやすく、かつサイクリストにとって実用的なアドバイス（休憩場所や見どころなど）を含める。`
                    }]
                },
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            return `Error: ${errorData.error?.message || 'Failed to connect to AI service.'}`;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        return text || 'Sorry, I could not generate a response.';
    } catch (error) {
        console.error('Gemini Network Error:', error);
        return 'Error: Could not connect to the AI service.';
    }
};
