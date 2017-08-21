import { Index, HeroItem, Skill, HeroBuild } from 'mehfeh-model';

export enum Cost {
    None,
    Low,
    Medium,
    High
}

export interface SkillCost {
    cost: Cost;
    heroes: string[];
}

export interface SkillCostTable {
    skills: { [key: string]: SkillCost }
}

export class SkillCostBuilder {

    private result: SkillCostTable = {
        skills: {}
    };

    build(index: Index) {
        for(let key of Object.keys(index.heroes)) {
            this.processHero(key, index.heroes[key]);
        }
        return this.result;
    }

    private isFiveStarOnly(hero: HeroItem) {
        let obtainableRanks = Object.keys(hero.levelFortyStats);
        return obtainableRanks.length === 1 && obtainableRanks[0] === '5';
    }

    private getAllSkills(hero: HeroItem) {
        return hero.assistSkills.concat(hero.passiveSkills).concat(hero.specialSkills).concat(hero.weaponSkills)
    }

    private processHero(heroName: string, hero: HeroItem) {
        let isFiveStarOnly = this.isFiveStarOnly(hero);
        for(let skill of this.getAllSkills(hero)) {
            this.processHeroSkill(heroName, isFiveStarOnly, skill);
        }
    }

    private processHeroSkill(heroName: string, isFiveStarOnly: boolean, skill: Skill) {
        let cost = Cost.None;
        if(isFiveStarOnly) {
            cost = Cost.High;
        } else {
            if(skill.startsWith === 0 && skill.unlocked === 0) {
                cost = Cost.Low;
            } else if ((skill.startsWith !== 0 && skill.startsWith < 5) || (skill.unlocked !== 0 && skill.unlocked < 5)) {
                cost = Cost.Low;
            } else {
                cost = Cost.Medium;
            }
        }
        if(!(skill.name in this.result.skills)) {
            this.result.skills[skill.name] = {
                cost: cost,
                heroes: []
            };
        }
        let skillCostItem = this.result.skills[skill.name];
        if(cost < skillCostItem.cost) {
            skillCostItem.cost = cost;
            skillCostItem.heroes = [heroName];
        } else if (cost === skillCostItem.cost) {
            skillCostItem.heroes.push(heroName);
        }
    }

}

export class SimilarNameLookup {

    private shorteningTable: { [ key: string ]: string } = {
        'speed': 'spd',
        'attack': 'atk',
        'defense': 'def',
        'resistance': 'res'
    }
    private lengtheningTable: { [ key: string ]: string } = {
        
    }
    private choices: { [ key: string ]: string } = {

    }

    constructor(choices: string[]) {
        for(let key of Object.keys(this.shorteningTable)) {
            this.lengtheningTable[this.shorteningTable[key]] = key;
        }
        for(let choice of choices) {
            this.choices[choice.toLocaleLowerCase()] = choice;
        }
    }

    private tryAndFind(value: string) {
        if(value in this.choices) {
            return this.choices[value];
        }
        value = value + ' 3';
        if(value in this.choices) {
            return this.choices[value];
        }
        return null;
    }

    private tryAndFindWordUnmodified(value: string) {
        return this.tryAndFind(value.toLocaleLowerCase());
    }

    private tryAndShortenWord(word: string) {
        if(word in this.shorteningTable) {
            return this.shorteningTable[word];
        }
        return word;
    }

    private tryAndLengthenWord(word: string) {
        if(word in this.lengtheningTable) {
            return this.lengtheningTable[word];
        }
        return word;
    }

    private tryAndFindWordShortened(value: string) {
        let modified = value.toLocaleLowerCase().split(' ').map(word => this.tryAndShortenWord(word)).join(' ');
        return this.tryAndFind(modified);
    }

    private tryAndFindWordLengthened(value: string) {
        let modified = value.toLocaleLowerCase().split(' ').map(word => this.tryAndLengthenWord(word)).join(' ');
        return this.tryAndFind(modified);
    }

    private lookupValue(value: string) {
        let result = this.tryAndFindWordUnmodified(value);
        if(result) {
            return result;
        }
        result = this.tryAndFindWordShortened(value);
        if(result) {
            return result;
        }
        result = this.tryAndFindWordLengthened(value);
        if(result) {
            return result;
        }
        console.log('WARN: Could not find choice for ' + value);
        return null;
    }

    lookup(value: string) {
        let result = this.lookupValue(value);
        return result;
    }

}

export class BuildEvaluation {
    cost: Cost;
    offendingSkills: string[];
}

export class BuildEvaluator {

    private skillsLookupTable: SimilarNameLookup;

    constructor(private skillsCostTable: SkillCostTable, private build: HeroBuild, private hero: HeroItem) {
        this.skillsLookupTable = new SimilarNameLookup(Object.keys(skillsCostTable.skills));
    }

    private getAllHeroSkills(hero: HeroItem) {
        return hero.assistSkills.concat(hero.passiveSkills).concat(hero.specialSkills).concat(hero.weaponSkills)
    }

    private getAllBuildSkills(build: HeroBuild) {
        return [build.aSkills, build.bSkills, build.cSkills, build.specialSkills, build.supportSkills, build.weaponSkills];
    }

    private heroHasSkill(choice: string) {
        return this.getAllHeroSkills(this.hero).some(skill => skill.name === choice);
    }

    private determineCostForSkill(choice: string) {
        if(choice.toUpperCase() === 'FLEXIBLE' || choice.toUpperCase() === 'POSITIONING SKILL') {
            return Cost.None;
        }
        let correctedChoice = this.skillsLookupTable.lookup(choice);
        if(correctedChoice === null) {
            return Cost.None;
        }
        if(this.heroHasSkill(correctedChoice)) {
            return Cost.None;
        } else {
            return this.skillsCostTable.skills[correctedChoice].cost;
        }
    }

    private evaluateBuildSkills(evaluation: BuildEvaluation, skillChoices: string[]) {
        if(skillChoices.length === 0) {
            throw Error('No choices for skill!');
        }
        let cost = this.determineCostForSkill(skillChoices[0]);

        if(cost > evaluation.cost) {
            evaluation.cost = cost;
            evaluation.offendingSkills = [];
        }

        if(cost >= evaluation.cost) {
            evaluation.offendingSkills.push(skillChoices[0]);
        }
    }

    evaluate() {
        let result: BuildEvaluation = { cost: Cost.None, offendingSkills: [] };
        for(let skill of this.getAllBuildSkills(this.build)) {
            this.evaluateBuildSkills(result, skill);
        }
        return result;
    }

}

export interface Problem {
    severity: string;
    description: string;
}

export class BuildInvestmentIncorrectDetector {

    private hasTag(build: HeroBuild, tagName: string) {
        let lowercase = tagName.toLocaleLowerCase();
        return build.tags.some(tagName => tagName.toLocaleLowerCase() === lowercase);
    }

    private getBuildStatedCost(build: HeroBuild) {
        if(this.hasTag(build, 'low investment')) {
            return Cost.Low;
        } else if (this.hasTag(build, 'medium investment')) {
            return Cost.Medium;
        } else if (this.hasTag(build, 'high investment')) {
            return Cost.High;
        }
        return Cost.None;
    }

    private costToStr(cost: number) {
        if(cost === 1) {
            return 'LOW';
        } else if (cost === 2) {
            return 'MEDIUM';
        } else {
            return 'HIGH';
        }
    }
    
    analyze(index: Index): Problem[] {
        let result: Problem[] = [];
        let skillsCostTable = new SkillCostBuilder().build(index);
        for(let heroName of Object.keys(index.heroBuilds)) {
            let hero = index.heroes[heroName];
            for(let build of index.heroBuilds[heroName]) {
                let problem = this.analyzeBuild(heroName, hero, build, skillsCostTable);
                if(problem) {
                    result.push(problem);
                }
            }
        }
        return result;
    }

    analyzeBuild(heroName: string, hero: HeroItem, build: HeroBuild, skillsCostTable: SkillCostTable) {
        let evaluation = new BuildEvaluator(skillsCostTable, build, hero).evaluate();
        let statedCost = this.getBuildStatedCost(build);

        if(evaluation.cost === Cost.None) {
            return { severity: 'WARN', description: 'The build (' +  build.name + ') for ' + heroName + ' does not have any skill inheritance'};
        }

        if(statedCost === Cost.None) {
            return { severity: 'WARN', description: 'The build (' + build.name + ') for ' + heroName + ' does not have an investment cost tag and it should be ' + this.costToStr(evaluation.cost) + ' because of the skills: ' + JSON.stringify(evaluation.offendingSkills)};
        }

        if(evaluation.cost !== statedCost) {
            return { severity: 'ERROR', description: 'The build (' + build.name + ') for ' + heroName + ' has an incorrect investment cost.  It is marked [' + this.costToStr(statedCost) + '] and should be [' + this.costToStr(evaluation.cost) + '] because of the skills: ' + JSON.stringify(evaluation.offendingSkills)};
        }

        return null;
    }

}
