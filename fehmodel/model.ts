export interface Skill {
    name: string;
    unlocked: number;
    startsWith: number;
}

export interface HeroItem {
    weaponSkills: Skill[];
    specialSkills: Skill[];
    assistSkills: Skill[];
    passiveSkills: Skill[];
    levelFortyStats: {
        [key: number]: {
            hp: number,
            attack: number,
            speed: number,
            defense: number,
            resistance: number
        }
    };
}

export interface HeroListItem {
    name: string;
    url: string;
}

export interface HeroBuild {
    name: string;
    weaponSkills: string[];
    supportSkills: string[];
    specialSkills: string[];
    aSkills: string[];
    bSkills: string[];
    cSkills: string[];
    sSkills: string[];
    tags: string[];
}

export interface Index {
    heroList: HeroListItem[];
    heroes: { [ key: string ]: HeroItem };
    heroBuilds: { [ key: string ]: HeroBuild[] };
}
