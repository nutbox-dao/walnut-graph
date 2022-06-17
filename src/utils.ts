export function formatOddString(s: string): string {
    return s.length % 2 === 0 ? s : '0' + s;
}