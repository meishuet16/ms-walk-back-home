export const emptyTendencies = () => ({
    acceptance: 0,
    avoidance: 0,
    closeness: 0,
    distance: 0,
    honesty: 0,
    concealment: 0,
    companionship: 0,
    intervention: 0
});
export function applyChoice(tendencies, choice) {
    const next = { ...tendencies };
    for (const [key, value] of Object.entries(choice.effects)) {
        next[key] += value ?? 0;
    }
    return next;
}
