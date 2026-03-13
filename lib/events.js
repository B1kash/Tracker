// Custom event utility to trigger cross-component updates

export function triggerGamificationUpdate() {
    if (typeof window !== 'undefined') {
        const event = new Event('gamification_updated');
        window.dispatchEvent(event);
    }
}
