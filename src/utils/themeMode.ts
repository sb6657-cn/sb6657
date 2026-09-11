export type ThemeMode = 'system' | 'light' | 'dark';

export function resolveIsDark(mode: ThemeMode, systemDark: boolean): boolean {
    if (mode === 'system') return systemDark;
    return mode === 'dark';
}

/** 进入跟随系统时必须重读 OS，不能沿用锁定浅/深色期间的过期值。 */
export function systemDarkForApply(mode: ThemeMode, readSystemDark: () => boolean, previousSystemDark: boolean): boolean {
    if (mode === 'system') return readSystemDark();
    return previousSystemDark;
}
