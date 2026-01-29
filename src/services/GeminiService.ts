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
                        text: `あなたは「丹波篠山サイクリングマップ」のAIガイド「サトヤマAI」です。
利用者は【兵庫県丹波篠山市】を自転車で旅しています。

【最重要ルール】
1. 丹波篠山市（および隣接する丹波市・三田市の一部）以外の場所は、絶対に案内しないでください。
2. 提案するスポットは、Googleマップの最新情報を活用しつつ、【必ず実在する店舗名・施設名】を正確に答えてください。
3. 地図中心の座標（北緯/東経）を基準に、そこから【半径1〜2km以内】の至近距離にあるスポットを優先してください。
4. 具体的におすすめスポットを【必ず3つ】案内してください。
5. 各スポットには必ず【Googleマップ検索リンク】を付けてください。
   形式: [スポット名](https://www.google.com/maps/search/?api=1&query=地点名+丹波篠山)
   ※地点名には「丹波篠山」を付け加えて検索の精度を高めてください。
6. 文章は短く簡潔に、箇条書きを活用してください。
7. 架空の場所や、遠く離れた他県の場所を教えることは、利用者にとって非常に危険であり絶対に禁止です。`
                    }]
                },
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);

            // クォータ制限（回数制限）エラーのハンドリング
            if (response.status === 429) {
                return '【AI混雑中】現在、AIへのリクエストが集中しています。無料枠の制限（1分間に15回まで）に達した可能性があります。数分待ってから再度お試しください。';
            }

            return `エラーが発生しました。しばらく経ってから再度お試しください。 (${errorData.error?.message || 'Connection Error'})`;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        return text || 'Sorry, I could not generate a response.';
    } catch (error) {
        console.error('Gemini Network Error:', error);
        return 'Error: Could not connect to the AI service.';
    }
};
