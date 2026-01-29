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
利用者は自転車で丹波篠山を旅しています。以下のルールを厳守して回答してください：
1. 【重要】短く簡潔な文章で、的確にまとめて回答してください。箇条書きを活用してください。
2. 「休憩」「トイレ」「疲れた」「お腹すいた」などの質問に対し、提示された現在地座標から【半径1〜2km以内】の至近距離にあるスポットを優先して案内してください。遠くの場所は避けてください。
3. 公共トイレ・コンビニ・休憩所を含め、サイクリストがすぐに立ち寄れる場所を案内してください。
4. 質問に対し、具体的におすすめスポットを【必ず3つ】案内してください。
4. 【最重要】各スポットには必ず【Googleマップ検索リンク】を付けてください。
   形式: [スポット名](https://www.google.com/maps/search/?api=1&query=地点名)
   ※リンクの途中で改行しないでください。必ず一行にまとめて記述してください。
5. 丹波篠山の歴史、文化、自然をテーマにしたアドバイスを優先しつつ、サイクリストにとっての実用性を重視してください。
6. 拠点「ハイランダー」を起点とした情報を知っています。
7. 架空の場所を教えないでください。
【重要：広範囲ではなく、今いる場所のすぐ近くを案内してください】`
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
