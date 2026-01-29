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
利用者は自転車で丹波篠山を旅しています。以下のルールを守って回答してください：
1. 質問に対し、丹波篠山市のおすすめスポットを【必ず3つ程度】具体的に案内してください。
2. 各スポットの紹介には、利用者が場所を確認するための【Googleマップ検索リンク】を必ず含めてください。
   (例: [Googleマップで見る](https://www.google.com/maps/search/?api=1&query=地点名))
3. 丹波篠山の歴史（1200年の歴史、茶の里）、文化（丹波焼、城下町）、自然をテーマにしたアドバイスを優先してください。
4. 拠点である自転車店「ハイランダー」を起点としたサイクリスト目線での実用的な情報（坂の有無、休憩場所など）を意識してください。
5. 架空の場所を教えないでください。正確な場所がわからない場合は「Googleマップを確認してください」と案内してください。`
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
