const API_KEY = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;
// Using the stable 1.5 Flash model name
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const fetchGeminiResponse = async (prompt: string): Promise<string> => {
    if (!API_KEY) {
        console.error('Gemini API Error: VITE_GOOGLE_GENAI_API_KEY is missing in env variables.');
        return 'エラー：AIのAPIキーが見つかりません。設定を確認してください。';
    }

    console.log('Gemini Request: sending to 1.5-flash...');

    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{
                        text: `あなたは「丹波篠山サイクリングマップ」のAIガイド「サトヤマAI」です。
利用者は【兵庫県丹波篠山市】を自転車で旅しています。

【最重要ルール】
1. 丹波篠山市（および隣接する丹波市・三田市の一部）以外の場所は、絶対に案内しないでください。
2. 提案するスポットは、提供された周辺スポットリスト（名称、種別）を最優先し、【実在する店舗名・施設名】を正確に答えてください。
3. 特に、丹波篠山独自の「歴史的な並び（城下町、宿場町）」や「古民家カフェ」、「寺社仏閣」の情報を重視して案内してください。
4. 具体的におすすめスポットを【必ず3つ】案内してください。
5. 各スポットには必ず【Googleマップ検索リンク】を付けてください。
   形式: [スポット名](https://www.google.com/maps/search/?api=1&query=地点名+丹波篠山)
6. 文章は短く簡潔に、箇条書きを活用してください。
7. 架空の場所や、遠く離れた場所を教えることは厳禁です。提供されたリストにある場合は、そこから選ぶのが最も安全です。`
                    }]
                },
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Details:', JSON.stringify(errorData, null, 2));

            if (response.status === 429) {
                return '【AI混雑中】現在、無料枠のリクエスト制限（1分間に15回まで）に達しました。数分待ってから再度お試しください。';
            }

            if (response.status === 403) {
                return '【認証エラー】APIキーが無効、または制限されている可能性があります。Google AI Studioの設定を確認してください。';
            }

            return `エラーが発生しました (${response.status}: ${errorData.error?.message || 'Unknown'})`;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        return text || 'Sorry, I could not generate a response.';
    } catch (error) {
        console.error('Gemini Network Error:', error);
        return 'Error: Could not connect to the AI service.';
    }
};
