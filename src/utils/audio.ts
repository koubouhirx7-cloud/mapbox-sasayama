export const playChime = () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;

        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // "Pohn" sound: High pitch sine wave with quick attack and slow decay
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);

        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);

        // Second "Pohn" (optional, "Pohn Pohn"?)
        // Let's do a single distinct "Pohn" first. User said "Pohn, Pohn like".
        // A single pleasant chime is standard for nav.
        // Maybe a double chime is better?
        // Let's settle on a single clear chime for now, simpler is better.
        // Or actually, repeating it slightly later makes it more noticeable.

        setTimeout(() => {
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);

            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(800, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.5);

            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
            gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 0.5);
        }, 200);

    } catch (e) {
        console.error('Audio play failed', e);
    }
};
